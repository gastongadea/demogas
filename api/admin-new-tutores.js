const { requireAdminPassword } = require('../lib/adminAuth');
const { syncCarrerasFromSheet } = require('../lib/carrerasSync');
const { previewNewTutoresFromSheet } = require('../lib/tutoresSync');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdminPassword(req, res)) return;

  try {
    const carreras = await syncCarrerasFromSheet();
    const preview = await previewNewTutoresFromSheet();
    res.json({ ok: true, ...preview, carreras });
  } catch (err) {
    console.error('Error en /api/admin-new-tutores:', err);
    res.status(500).json({ error: 'Error al leer la planilla', details: err.message });
  }
};
