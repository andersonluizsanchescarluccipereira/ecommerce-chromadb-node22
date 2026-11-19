import { config } from './config/env.js';
import { openDatabase } from './models/database.js';
import { CatalogRepository } from './repositories/catalogRepository.js';
import { VectorStore } from './services/vectorStore.js';
import { RecommendationService } from './services/recommendationService.js';
import { createApp } from './app.js';

const db=openDatabase(config.dbPath);
const repo=new CatalogRepository(db);
const vectors=new VectorStore(config.chromaUrl);
const recommender=new RecommendationService(repo,vectors);

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

const server=createApp(repo,recommender,vectors,config).listen(config.port,config.host,()=>{
  console.log(`API iniciada em http://${config.host}:${config.port}/api`);
});
function close() { server.close(()=>{ db.close(); process.exit(0); }); }
process.on('SIGTERM',close);
process.on('SIGINT',close);
