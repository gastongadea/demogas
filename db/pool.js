const { neon, neonConfig, Pool } = require('@neondatabase/serverless');

function getConnectionString() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return connectionString;
}

let httpSql;

function getHttpSql() {
  if (!httpSql) {
    // HTTP fetch: recomendado en Vercel serverless (evita WebSockets colgados).
    httpSql = neon(getConnectionString(), { fullResults: true });
  }
  return httpSql;
}

function getPool() {
  return {
    query: (text, params = []) => getHttpSql().query(text, params),
    connect: async () => {
      if (typeof WebSocket === 'undefined') {
        neonConfig.webSocketConstructor = require('ws');
      }
      const wsPool = new Pool({ connectionString: getConnectionString() });
      const client = await wsPool.connect();
      const originalRelease = client.release.bind(client);
      client.release = () => {
        originalRelease();
        wsPool.end().catch(() => {});
      };
      return client;
    },
  };
}

module.exports = { getPool };
