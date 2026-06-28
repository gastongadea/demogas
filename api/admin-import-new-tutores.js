const { requireAdminPassword } = require('../lib/adminAuth');
const { syncCarrerasFromSheet } = require('../lib/carrerasSync');
const { importNewTutoresFromSheet } = require('../lib/tutoresSync');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdminPassword(req, res)) return;

  try {
    const stats = await importNewTutoresFromSheet();
    const carreras = await syncCarrerasFromSheet();
    res.json({ ok: true, ...stats, carreras });
  } catch (err) {
    console.error('Error en /api/admin-import-new-tutores:', err);
    res.status(500).json({ error: 'Error al importar tutores', details: err.message });
  }
};
