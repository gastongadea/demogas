const { getPool } = require('../db/pool');
const { fetchCarrerasFromSheet } = require('./sheets');

const ENSURE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS carreras (
  id SERIAL PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('mentor', 'alumno')),
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  UNIQUE (tipo, nombre)
);
CREATE INDEX IF NOT EXISTS carreras_tipo_orden_idx ON carreras (tipo, orden);
`;

async function replaceCarrerasForTipo(client, tipo, nombres) {
  await client.query('DELETE FROM carreras WHERE tipo = $1', [tipo]);
  for (let i = 0; i < nombres.length; i += 1) {
    await client.query(
      'INSERT INTO carreras (tipo, nombre, orden) VALUES ($1, $2, $3)',
      [tipo, nombres[i], i + 1]
    );
  }
}

/** Sincroniza carreras desde hoja Carreras (col. A → mentor, col. B → alumno). */
async function syncCarrerasFromSheet() {
  const { mentores, alumnos } = await fetchCarrerasFromSheet();
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(ENSURE_TABLE_SQL);
    await client.query('BEGIN');
    await replaceCarrerasForTipo(client, 'mentor', mentores);
    await replaceCarrerasForTipo(client, 'alumno', alumnos);
    await client.query('COMMIT');

    return {
      mentores: mentores.length,
      alumnos: alumnos.length,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { syncCarrerasFromSheet };
