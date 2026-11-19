import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { productsSeed, usersSeed, purchasesSeed } from '../data/seed.js';

export function openDatabase(filename) {
  if (filename !== ':memory:') mkdirSync(path.dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY, name TEXT NOT NULL, age INTEGER NOT NULL CHECK (age BETWEEN 1 AND 120)
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL,
      color TEXT NOT NULL, price REAL NOT NULL CHECK (price >= 0)
    );
    CREATE TABLE IF NOT EXISTS purchases (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      purchased_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, product_id)
    );
  `);
  const count = db.prepare('SELECT COUNT(*) AS amount FROM users').get().amount;
  if (count === 0) {
    // Idempotente: apenas a primeira inicialização sem usuários faz seed.
    const addUser = db.prepare('INSERT INTO users (id,name,age) VALUES (?,?,?)');
    const addProduct = db.prepare('INSERT OR IGNORE INTO products (id,name,category,color,price) VALUES (?,?,?,?,?)');
    const addPurchase = db.prepare('INSERT OR IGNORE INTO purchases (user_id,product_id) VALUES (?,?)');
    db.exec('BEGIN');
    try {
      for (const p of productsSeed) addProduct.run(p.id, p.name, p.category, p.color, p.price);
      for (const u of usersSeed) addUser.run(u.id, u.name, u.age);
      for (const [uid, pid] of purchasesSeed) addPurchase.run(uid, pid);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      db.close();
      throw error;
    }
  }
  return db;
}
