const { Pool, neonConfig } = require('@neondatabase/serverless');

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    if (typeof WebSocket === 'undefined') {
      // Necesario en Node (local y Vercel serverless).
      neonConfig.webSocketConstructor = require('ws');
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

module.exports = { getPool };
