import path from 'node:path';

export const config = {
  port: Number(process.env.PORT || 3001),
  host: process.env.HOST || '127.0.0.1',
  chromaUrl: process.env.CHROMA_URL || 'http://127.0.0.1:8000',
  dbPath: process.env.DB_PATH || path.resolve('data', 'ecommerce.sqlite'),
  allowedOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
