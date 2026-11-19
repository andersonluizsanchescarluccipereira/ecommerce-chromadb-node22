import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/models/database.js';
import { CatalogRepository } from '../src/repositories/catalogRepository.js';
import { RecommendationService } from '../src/services/recommendationService.js';

function setup() {
  const db=openDatabase(':memory:');
  const repo=new CatalogRepository(db);
  let requestedVector;
  const vectors={
    nearestProducts:async (vector)=>{
      requestedVector=vector;
      return [{id:1,distance:0.0},{id:2,distance:0.05},{id:3,distance:0.12},{id:4,distance:0.9}];
    },
    indexUser:async()=>{},indexProducts:async()=>{}
  };
  return {db,repo,service:new RecommendationService(repo,vectors),getVector:()=>requestedVector};
}

test('dados iniciais possuem usuários, produtos e compras',()=>{
  const {db,repo}=setup();
  assert.equal(repo.listUsers().length,6);
  assert.equal(repo.listProducts().length,10);
  assert.equal(repo.listPurchases(1).length,2);
  db.close();
});
test('não recomenda produtos que a pessoa já comprou', async()=>{
  const {db,service,getVector}=setup();
  const answer=await service.recommend(1,4);
  assert.equal(answer.mode,'vector');
  assert.ok(!answer.recommendations.some(p=>[1,2].includes(p.id)));
  assert.equal(answer.recommendations[0].id,3);
  assert.equal(getVector().length,13);
  db.close();
});
test('usuário sem compras usa popularidade sem consultar o Chroma',async()=>{
  const {db,service}=setup();
  const answer=await service.recommend(99,3);
  assert.equal(answer.mode,'popularidade');
  assert.equal(answer.recommendations.length,3);
  assert.equal(answer.recommendations[0].score,null);
  db.close();
});
test('compra duplicada é impedida pelo repositório',()=>{
  const {db,repo}=setup();
  assert.equal(repo.addPurchase(1,1),false);
  assert.equal(repo.addPurchase(99,3),true);
  assert.equal(repo.addPurchase(99,3),false);
  assert.equal(repo.removePurchase(99,3),true);
  db.close();
});
