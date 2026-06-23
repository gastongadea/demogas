const { getPool } = require('../db/pool');

const CARRERAS_FALLBACK = {
  mentores: [
    'Ing. Industrial',
    'Ing. Informática',
    'Ing. Biomédica',
    'Lic. Ciencias de Datos',
  ],
  alumnos: [
    'Ing. Industrial',
    'Ing. Informática',
    'Ing. Biomédica',
    'Lic. Ciencias de Datos',
  ],
};

async function getCarreras() {
  const pool = getPool();
  let res;
  try {
    res = await pool.query(
      `SELECT tipo, nombre
       FROM carreras
       ORDER BY tipo, orden, nombre`
    );
  } catch (err) {
    if (err.code === '42P01') {
      return { mentores: [], alumnos: [] };
    }
    throw err;
  }

  const mentores = [];
  const alumnos = [];

  for (const row of res.rows) {
    if (row.tipo === 'mentor') mentores.push(row.nombre);
    if (row.tipo === 'alumno') alumnos.push(row.nombre);
  }

  return {
    mentores,
    alumnos,
  };
}

module.exports = { getCarreras, CARRERAS_FALLBACK };
