import { config } from './config/env.js';
import { openDatabase } from './models/database.js';
import { CatalogRepository } from './repositories/catalogRepository.js';
import { VectorStore } from './services/vectorStore.js';
import { RecommendationService } from './services/recommendationService.js';
import { createApp } from './app.js';
import { NeuralService } from './services/neuralService.js';
import path from 'node:path';

const db=openDatabase(config.dbPath);
const repo=new CatalogRepository(db);
const vectors=new VectorStore(config.chromaUrl);
const neural=new NeuralService(repo,path.join(path.dirname(config.dbPath),'neural-model.json'));
await neural.load();
if(!neural.status().trained) {
  console.log('Treinando modelo TensorFlow.js inicial (100 épocas)...');
  try {await neural.train(100);} catch(err) {console.warn('Treinamento inicial falhou:',err.message);}
}
const recommender=new RecommendationService(repo,vectors,neural);

// No Compose, o backend pode iniciar antes do Chroma. Repetir conexão em vez de falhar imediatamente.
let connected=false;
for (let attempt=1; attempt<=30; attempt++) {
  try {
    await vectors.connect();
    await recommender.rebuild();
    connected=true;
    break;
  } catch (error) {
    console.warn(`Chroma indisponível (${attempt}/30): ${error.message}`);
    if (attempt<30) await new Promise(resolve=>setTimeout(resolve,1500));
  }
}
if (!connected) {
  db.close();
  console.error('Não foi possível inicializar o ChromaDB. Confira CHROMA_URL.');
  process.exit(1);
}

const server=createApp(repo,recommender,vectors,neural,config).listen(config.port,config.host,()=>{
  console.log(`API iniciada em http://${config.host}:${config.port}/api`);
});
function close() { server.close(()=>{ db.close(); process.exit(0); }); }
process.on('SIGTERM',close);
process.on('SIGINT',close);
