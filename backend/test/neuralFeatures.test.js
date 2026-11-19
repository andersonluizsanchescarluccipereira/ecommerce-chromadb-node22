import test from 'node:test';
import assert from 'node:assert/strict';
import { neuralFeatures, INPUT_DIMENSION } from '../src/services/neuralFeatures.js';
import { openDatabase } from '../src/models/database.js';
import { CatalogRepository } from '../src/repositories/catalogRepository.js';
import { buildTrainingDataset } from '../src/services/neuralService.js';

test('rede recebe 27 características e evita vazamento do produto alvo',()=>{
 const db=openDatabase(':memory:');
 try {const repo=new CatalogRepository(db),u=repo.findUser(1),p=repo.findProduct(1);
 const xs=neuralFeatures(u,p,repo.listPurchases(1).filter(x=>x.id!==p.id));
 assert.equal(INPUT_DIMENSION,27);assert.equal(xs.length,27);
 assert.ok(xs.every(Number.isFinite));}
 finally{db.close();}
});
test('dataset gera rótulos binários para pares cliente-produto',()=>{
 const db=openDatabase(':memory:');
 try {const repo=new CatalogRepository(db),{xs,ys}=buildTrainingDataset(repo);
 assert.equal(xs.length,repo.listUsers().length*repo.listProducts().length);
 assert.equal(xs.length,ys.length);
 assert.ok(ys.some(y=>y[0]===1));assert.ok(ys.some(y=>y[0]===0));}
 finally{db.close();}
});
