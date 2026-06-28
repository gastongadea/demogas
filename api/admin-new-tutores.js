const { requireAdminPassword } = require('../lib/adminAuth');
const { loadAdminPreview } = require('../lib/adminPreview');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdminPassword(req, res)) return;

  try {
    const data = await loadAdminPreview();
    res.json(data);
  } catch (err) {
    console.error('Error en /api/admin-new-tutores:', err);
    res.status(500).json({ error: 'Error al leer la planilla', details: err.message });
  }
};
