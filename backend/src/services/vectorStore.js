import { ChromaClient } from 'chromadb';
import { encodeProduct, encodeUserFromPurchases } from './embeddingService.js';

export class VectorStore {
  constructor(url) {
    this.client = new ChromaClient({ path: url });
    this.products = null;
    this.profiles = null;
  }

  async connect() {
    this.products = await this.client.getOrCreateCollection({
      name: 'ecommerce_products_v1', metadata: { 'hnsw:space': 'cosine' }
    });
    this.profiles = await this.client.getOrCreateCollection({
      name: 'ecommerce_user_profiles_v1', metadata: { 'hnsw:space': 'cosine' }
    });
  }

  async indexProducts(products) {
    if (!products.length) return;
    await this.products.upsert({
      ids: products.map(p => String(p.id)),
      embeddings: products.map(encodeProduct),
      documents: products.map(p => `${p.name}. Categoria ${p.category}. Cor ${p.color}. Preço ${p.price}.`),
      metadatas: products.map(p => ({ productId: p.id, category: p.category, color: p.color }))
    });
  }

  async indexUser(userId, purchases) {
    const embedding = encodeUserFromPurchases(purchases);
    if (!embedding) {
      await this.profiles.delete({ ids: [String(userId)] });
      return null;
    }
    await this.profiles.upsert({
      ids: [String(userId)], embeddings: [embedding],
      documents: [`Perfil de compra do usuário ${userId}`],
      metadatas: [{ userId, purchaseCount: purchases.length }]
    });
    return embedding;
  }

  async nearestProducts(vector, count) {
    if (!count) return [];
    const result = await this.products.query({
      queryEmbeddings: [vector], nResults: count,
      include: ['distances','metadatas']
    });
    return (result.ids?.[0] || []).map((id,index) => ({
      id: Number(id), distance: result.distances?.[0]?.[index] ?? 1
    }));
  }
}
