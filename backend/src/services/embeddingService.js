// Embeddings *estruturados e determinísticos* (não embeddings semânticos de LLM).
// Cada produto/usuário usa o mesmo espaço vetorial: 4 categorias + 8 cores + 1 preço = 13 posições.
// Usamos sqrt dos pesos porque no produto interno/cosseno a contribuição é quadrática.
export const CATEGORIES = ['eletrônicos','vestuário','calçados','acessórios'];
export const COLORS = ['preto','prata','azul','branco','vermelho','bege','cinza','marrom'];
export const VECTOR_DIMENSION = CATEGORIES.length + COLORS.length + 1;

export function normalizeVector(input) {
  const length = Math.hypot(...input);
  return length === 0 ? input.map(() => 0) : input.map(x => x / length);
}

export function encodeProduct(product) {
  const categoryIndex = CATEGORIES.indexOf(product.category);
  const colorIndex = COLORS.indexOf(product.color);
  if (categoryIndex < 0 || colorIndex < 0 || !Number.isFinite(product.price) || product.price < 0) {
    throw new Error(`Produto ${product.id} tem característica inválida`);
  }
  const v = new Array(VECTOR_DIMENSION).fill(0);
  v[categoryIndex] = Math.sqrt(0.55);
  v[CATEGORIES.length + colorIndex] = Math.sqrt(0.30);
  v[v.length-1] = Math.sqrt(0.15) * Math.min(product.price / 200, 1);
  return normalizeVector(v);
}

export function encodeUserFromPurchases(purchasedProducts) {
  if (purchasedProducts.length === 0) return null;
  const average = new Array(VECTOR_DIMENSION).fill(0);
  for (const product of purchasedProducts) {
    const p = encodeProduct(product);
    for (let i=0; i < average.length; i++) average[i] += p[i] / purchasedProducts.length;
  }
  return normalizeVector(average);
}
