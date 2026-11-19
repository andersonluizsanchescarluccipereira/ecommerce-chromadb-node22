// Vetor de ENTRADA DA REDE, diferente do embedding do ChromaDB.
// 13 atributos do produto + idade normalizada + 13 atributos do perfil = 27 entradas.
import { encodeProduct, encodeUserFromPurchases, VECTOR_DIMENSION } from './embeddingService.js';
export const INPUT_DIMENSION = VECTOR_DIMENSION * 2 + 1;
export function neuralFeatures(user, product, purchases = []) {
  const profile = encodeUserFromPurchases(purchases) || new Array(VECTOR_DIMENSION).fill(0);
  return [...encodeProduct(product), Math.max(0,Math.min(1,(user.age - 18)/62)), ...profile];
}
