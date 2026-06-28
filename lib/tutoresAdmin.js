const { getPool } = require('../db/pool');

async function getTutoresConAsignados() {
  const pool = getPool();
  const res = await pool.query(
    `SELECT id, nombre, apellido, cupo_maximo, cantidad_asesorados
     FROM tutores
     WHERE activo = true AND cantidad_asesorados > 0
     ORDER BY apellido, nombre`
  );
  return res.rows.map((row) => ({
    id: row.id,
    nombre: row.nombre,
    apellido: row.apellido,
    cupo: row.cupo_maximo,
    asignados: row.cantidad_asesorados,
  }));
}

async function liberarCupo(tutorId) {
  const pool = getPool();
  const res = await pool.query(
    `UPDATE tutores
     SET cantidad_asesorados = cantidad_asesorados - 1, updated_at = now()
     WHERE id = $1 AND cantidad_asesorados > 0
     RETURNING id, nombre, apellido, cupo_maximo, cantidad_asesorados`,
    [tutorId]
  );
  if (res.rows.length === 0) {
    return { ok: false, error: 'Tutor no encontrado o sin asignaciones' };
  }
  const row = res.rows[0];
  return {
    ok: true,
    tutor: {
      id: row.id,
      nombre: row.nombre,
      apellido: row.apellido,
      cupo: row.cupo_maximo,
      asignados: row.cantidad_asesorados,
    },
  };
}

async function liberarTodosCupos() {
  const pool = getPool();
  const res = await pool.query(
    `UPDATE tutores
     SET cantidad_asesorados = 0, updated_at = now()
     WHERE cantidad_asesorados > 0`
  );
  return { ok: true, resetCount: res.rowCount || 0 };
}

module.exports = {
  getTutoresConAsignados,
  liberarCupo,
  liberarTodosCupos,
};
