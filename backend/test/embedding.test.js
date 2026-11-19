import test from 'node:test';
import assert from 'node:assert/strict';
import { productsSeed } from '../src/data/seed.js';
import { encodeProduct, encodeUserFromPurchases, VECTOR_DIMENSION } from '../src/services/embeddingService.js';

test('representa produto em vetor de dimensão fixa e normalizado',()=>{
  const vector=encodeProduct(productsSeed[0]);
  assert.equal(vector.length,VECTOR_DIMENSION);
  assert.ok(Math.abs(Math.hypot(...vector)-1)<1e-10);
});
test('produto de categoria inválida é rejeitado',()=>{
  assert.throws(()=>encodeProduct({...productsSeed[0],category:'desconhecida'}),/inválida/);
});
test('cold start não inventa vetor de compras',()=>{
  assert.equal(encodeUserFromPurchases([]),null);
});
test('perfil com 2 compras permanece normalizado',()=>{
  const vector=encodeUserFromPurchases([productsSeed[0],productsSeed[1]]);
  assert.ok(Math.abs(Math.hypot(...vector)-1)<1e-10);
});
