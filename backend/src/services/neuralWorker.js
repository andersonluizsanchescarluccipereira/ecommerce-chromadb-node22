import { parentPort, workerData } from 'node:worker_threads';
import * as tf from '@tensorflow/tfjs';
import { INPUT_DIMENSION } from './neuralFeatures.js';

function createModel() {
  const model=tf.sequential();
  model.add(tf.layers.dense({inputShape:[INPUT_DIMENSION],units:128,activation:'relu'}));
  model.add(tf.layers.dense({units:64,activation:'relu'}));
  model.add(tf.layers.dense({units:32,activation:'relu'}));
  model.add(tf.layers.dense({units:1,activation:'sigmoid'}));
  model.compile({optimizer:tf.train.adam(0.003),loss:'binaryCrossentropy',metrics:['accuracy']});
  return model;
}
function exportWeights(model) {
  return model.getWeights().map(t=>({shape:t.shape,values:Array.from(t.dataSync())}));
}
function importWeights(model,weights) {
  const tensors=weights.map(w=>tf.tensor(w.values,w.shape));
  model.setWeights(tensors);
  tensors.forEach(t=>t.dispose());
}
async function run() {
  const model=createModel();
  try {
    if(workerData.action==='train') {
      const {xs,ys,epochs}=workerData;
      if(!xs.length) throw new Error('Nenhum exemplo de treinamento');
      const x=tf.tensor2d(xs,[xs.length,INPUT_DIMENSION]);
      const y=tf.tensor2d(ys,[ys.length,1]);
      const history=[];
      try {
        await model.fit(x,y,{epochs,batchSize:Math.min(16,xs.length),shuffle:true,verbose:0,
          callbacks:{onEpochEnd:async(epoch,logs)=>{
            history.push({epoch:epoch+1,loss:Number(logs.loss.toFixed(6)),accuracy:Number((logs.acc??logs.accuracy??0).toFixed(4))});
          }}});
        parentPort.postMessage({ok:true,weights:exportWeights(model),history,examples:xs.length});
      } finally {x.dispose();y.dispose();}
    } else if(workerData.action==='predict') {
      importWeights(model,workerData.weights);
      const xs=workerData.xs;
      if(!xs.length) {parentPort.postMessage({ok:true,scores:[]});return;}
      const input=tf.tensor2d(xs,[xs.length,INPUT_DIMENSION]);
      const prediction=model.predict(input);
      try {parentPort.postMessage({ok:true,scores:Array.from(await prediction.data())});}
      finally {input.dispose();prediction.dispose();}
    } else throw new Error('Ação desconhecida');
  } finally {model.dispose();}
}
run().catch(error=>parentPort.postMessage({ok:false,error:error.message}));
