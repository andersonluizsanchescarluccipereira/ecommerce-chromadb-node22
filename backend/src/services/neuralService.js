import { Worker } from 'node:worker_threads';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { neuralFeatures } from './neuralFeatures.js';

function executeWorker(data) {
  return new Promise((resolve,reject)=>{
    const worker=new Worker(new URL('./neuralWorker.js',import.meta.url),{workerData:data});
    let settled=false;
    worker.once('message',msg=>{settled=true;msg.ok?resolve(msg):reject(new Error(msg.error));});
    worker.once('error',err=>{if(!settled){settled=true;reject(err);}});
    worker.once('exit',code=>{if(!settled){settled=true;reject(new Error(`Worker terminou com código ${code}`));}});
  });
}
export function buildTrainingDataset(repo) {
  const products=repo.listProducts(), users=repo.listUsers();
  const xs=[],ys=[];
  // Positivos: compras observadas; negativos: pares sem compra (hipótese didática).
  // Não comprar NÃO equivale necessariamente a não gostar. Dados pequenos causam overfitting.
  for(const user of users) {
    const purchases=repo.listPurchases(user.id);
    const bought=new Set(purchases.map(p=>p.id));
    for(const product of products) {
      // Para evitar vazamento do próprio item positivo, removemos o item alvo do perfil.
      const context=purchases.filter(p=>p.id!==product.id);
      xs.push(neuralFeatures(user,product,context));
      ys.push([bought.has(product.id)?1:0]);
    }
  }
  return {xs,ys};
}
export class NeuralService {
  constructor(repo,modelPath) {this.repo=repo;this.modelPath=modelPath;this.model=null;this.training=false;}
  async load() {
    try {const data=JSON.parse(await readFile(this.modelPath,'utf8'));
      if(data.version===1 && Array.isArray(data.weights))this.model=data;
    } catch(err) {if(err.code!=='ENOENT')console.warn('Modelo salvo inválido:',err.message);}
  }
  status() {return {trained:!!this.model,training:this.training,architecture:[128,64,32,1],epochs:this.model?.epochs??0,examples:this.model?.examples??0,history:this.model?.history??[]};}
  async train(epochs=100) {
    if(this.training) {const e=new Error('Treinamento já em andamento');e.status=409;throw e;}
    if(!Number.isInteger(epochs)||epochs<1||epochs>300){const e=new Error('epochs deve estar entre 1 e 300');e.status=400;throw e;}
    this.training=true;
    try {
      const dataset=buildTrainingDataset(this.repo);
      const result=await executeWorker({action:'train',...dataset,epochs});
      const next={version:1,epochs,examples:result.examples,history:result.history,weights:result.weights,trainedAt:new Date().toISOString()};
      await mkdir(path.dirname(this.modelPath),{recursive:true});
      await writeFile(this.modelPath,JSON.stringify(next));
      this.model=next;
      return this.status();
    } finally {this.training=false;}
  }
  async score(user,products,purchases) {
    if(!this.model) return null;
    const xs=products.map(product=>neuralFeatures(user,product,purchases));
    const result=await executeWorker({action:'predict',weights:this.model.weights,xs});
    return result.scores;
  }
}
