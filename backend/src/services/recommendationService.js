import { encodeUserFromPurchases } from './embeddingService.js';

export class RecommendationService {
  constructor(repository,vectors,neural=null) {this.repo=repository;this.vectors=vectors;this.neural=neural;}
  async rebuild() {
    await this.vectors.indexProducts(this.repo.listProducts());
    for(const user of this.repo.listUsers()) await this.vectors.indexUser(user.id,this.repo.listPurchases(user.id));
  }
  async refreshUser(id) {await this.vectors.indexUser(id,this.repo.listPurchases(id));}
  async recommend(userId,limit=5,mode='vector') {
    const user=this.repo.findUser(userId);
    if(!user)return null;
    if(!['hybrid','vector','neural'].includes(mode)){const e=new Error('mode deve ser hybrid, vector ou neural');e.status=400;throw e;}
    const purchases=this.repo.listPurchases(userId);
    const excluded=new Set(purchases.map(p=>p.id));
    const all=this.repo.listProducts().filter(p=>!excluded.has(p.id));
    if(!purchases.length) return {user,mode:'popularidade',note:'Cold start: sem compras, fallback por popularidade.',recommendations:this.repo.popularProducts(limit).map(p=>({...p,score:null}))};
    const embedding=encodeUserFromPurchases(purchases);
    const matches=await this.vectors.nearestProducts(embedding,this.repo.listProducts().length);
    const byId=new Map(all.map(p=>[p.id,p]));
    const retrieved=matches.filter(m=>byId.has(m.id));
    const candidates=(mode==='neural'?all:retrieved.map(m=>byId.get(m.id)));
    const distanceById=new Map(retrieved.map(m=>[m.id,m.distance]));
    const neuralScores=mode==='vector'?null:await this.neural?.score(user,candidates,purchases);
    if(mode!=='vector'&&!neuralScores){const e=new Error('Rede neural não treinada. Execute POST /api/model/train ou escolha mode=vector.');e.status=503;throw e;}
    const recommendations=candidates.map((p,i)=>{
      const similarity=distanceById.has(p.id)?Math.max(0,Math.min(1,1-distanceById.get(p.id))):null;
      const neuralScore=neuralScores?.[i]??null;
      const score=mode==='vector'?similarity:mode==='neural'?neuralScore:neuralScore;
      return {...p,score,similarity,neuralScore};
    }).sort((a,b)=>(b.score??-1)-(a.score??-1)).slice(0,limit);
    return {user,mode,note:mode==='vector'?'Score = similaridade; não é probabilidade.':mode==='neural'?'Score = saída sigmoid treinada; não é probabilidade calibrada.':'ChromaDB recupera candidatos; TensorFlow.js os ranqueia. Saída sigmoid não calibrada.',recommendations};
  }
}
