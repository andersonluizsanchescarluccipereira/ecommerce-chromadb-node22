export class CatalogRepository {
  constructor(db) { this.db = db; }

  listProducts() {
    return this.db.prepare('SELECT id,name,category,color,price FROM products ORDER BY id').all();
  }

  findProduct(id) {
    return this.db.prepare('SELECT id,name,category,color,price FROM products WHERE id=?').get(id) ?? null;
  }

  listUsers() {
    return this.db.prepare('SELECT id,name,age FROM users ORDER BY CASE WHEN id=99 THEN 0 ELSE 1 END,id').all();
  }

  findUser(id) {
    return this.db.prepare('SELECT id,name,age FROM users WHERE id=?').get(id) ?? null;
  }

  listPurchases(userId) {
    return this.db.prepare(`
      SELECT p.id,p.name,p.category,p.color,p.price
      FROM purchases pu JOIN products p ON pu.product_id=p.id
      WHERE pu.user_id=? ORDER BY pu.purchased_at DESC,p.id ASC
    `).all(userId);
  }

  addPurchase(userId, productId) {
    return this.db.prepare('INSERT OR IGNORE INTO purchases (user_id,product_id) VALUES (?,?)').run(userId,productId).changes === 1;
  }

  removePurchase(userId, productId) {
    return this.db.prepare('DELETE FROM purchases WHERE user_id=? AND product_id=?').run(userId,productId).changes === 1;
  }

  popularProducts(limit, excludeIds = []) {
    const items = this.db.prepare(`
      SELECT p.id,p.name,p.category,p.color,p.price,COUNT(pu.product_id) AS purchase_count
      FROM products p LEFT JOIN purchases pu ON p.id=pu.product_id
      GROUP BY p.id ORDER BY purchase_count DESC,p.id ASC
    `).all();
    return items.filter(p => !excludeIds.includes(p.id)).slice(0,limit);
  }
}
