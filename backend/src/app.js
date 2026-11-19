import express from 'express';
import cors from 'cors';
import { apiRoutes } from './routes/apiRoutes.js';

export function createApp(repo, recommendations, vectors, neural, config) {
  const app=express();
  app.disable('x-powered-by');
  app.use(cors({ origin: config.allowedOrigin.split(',').map(x=>x.trim()), methods:['GET','POST','DELETE'], allowedHeaders:['Content-Type'] }));
  app.use(express.json({ limit:'16kb' }));
  app.use('/api',apiRoutes(repo,recommendations,vectors,neural));
  app.use((_req,res)=>res.status(404).json({ error:'Rota não encontrada' }));
  app.use((err,_req,res,_next)=>{
    const status=err.status|| (err.type==='entity.parse.failed'?400:500);
    if (status>=500) console.error(err);
    res.status(status).json({ error:status>=500?'Erro interno no servidor':err.message });
  });
  return app;
}
