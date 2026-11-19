import { encodeUserFromPurchases } from './embeddingService.js';

export class RecommendationService {
  constructor(repository, vectors) { this.repo = repository; this.vectors = vectors; }

  async rebuild() {
    await this.vectors.indexProducts(this.repo.listProducts());
    for (const user of this.repo.listUsers()) {
      await this.vectors.indexUser(user.id, this.repo.listPurchases(user.id));
    }
  }

  async refreshUser(id) {
    await this.vectors.indexUser(id, this.repo.listPurchases(id));
  }

  async recommend(userId, limit = 5) {
    const user = this.repo.findUser(userId);
    if (!user) return null;
    const bought = this.repo.listPurchases(userId);
    const excluded = new Set(bought.map(p => p.id));
    const candidates = this.repo.listProducts();
    if (!bought.length) {
      return {
        user, mode: 'popularidade', note: 'Usuário sem histórico: ordenação por popularidade, não por IA personalizada.',
        recommendations: this.repo.popularProducts(limit).map(p => ({ ...p, score: null }))
      };
    }
    const embedding = encodeUserFromPurchases(bought);
    // Consulta vetorial sobre todos os produtos; em catálogos grandes usar nResults com margem
    // e filtros de estoque/permissão. Perfil é recalculado a partir do banco transacional.
    const matches = await this.vectors.nearestProducts(embedding, candidates.length);
    const byId = new Map(candidates.map(p => [p.id, p]));
    return {
      user, mode: 'similaridade-vetorial',
      note: 'Score é similaridade cosseno aproximada, não probabilidade de compra.',
      recommendations: matches.filter(m => !excluded.has(m.id) && byId.has(m.id))
        .slice(0,limit)
        .map(m => ({ ...byId.get(m.id), score: Math.max(0,Math.min(1, 1-m.distance)) }))
    };
  }
}
