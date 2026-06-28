const { requireAdminPassword } = require('../lib/adminAuth');
const { liberarTodosCupos, getTutoresConAsignados } = require('../lib/tutoresAdmin');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdminPassword(req, res)) return;

  try {
    const result = await liberarTodosCupos();
    const tutoresConAsignados = await getTutoresConAsignados();
    res.json({ ok: true, resetCount: result.resetCount, tutoresConAsignados });
  } catch (err) {
    console.error('Error en /api/admin-liberar-todos:', err);
    res.status(500).json({ error: 'Error al liberar cupos', details: err.message });
  }
};
