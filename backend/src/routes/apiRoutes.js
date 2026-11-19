import { Router } from 'express';
import { catalogController } from '../controllers/catalogController.js';

export function apiRoutes(repo, recommendation, vectors, neural) {
  const router=Router(), c=catalogController(repo,recommendation);
  router.get('/users',c.users);
  router.get('/users/:id',c.user);
  router.get('/products',c.products);
  router.get('/users/:id/recommendations',c.recommend);
  router.post('/users/:id/purchases',c.buy);
  router.delete('/users/:id/purchases/:productId',c.remove);
  router.get('/model/status', (_req,res)=>res.json(neural.status()));
  router.post('/model/train', async (req,res)=>{
    const epochs=req.body?.epochs??100;
    const result=await neural.train(epochs);
    res.json(result);
  });
  router.get('/health', async (_req,res) => {
    let chroma=false;
    try { await vectors.products.count(); chroma=true; } catch { /* report as degraded */ }
    res.status(chroma?200:503).json({ status: chroma?'ok':'degraded', sqlite:'ok', chroma, neural:neural.status().trained });
  });
  return router;
}
