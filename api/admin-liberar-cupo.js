const { requireAdminPassword } = require('../lib/adminAuth');
const { liberarCupo, getTutoresConAsignados } = require('../lib/tutoresAdmin');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdminPassword(req, res)) return;

  const tutorId = req.body?.id;
  if (!tutorId) {
    return res.status(400).json({ error: 'Falta el id del tutor' });
  }

  try {
    const result = await liberarCupo(tutorId);
    if (!result.ok) {
      return res.status(400).json(result);
    }
    const tutoresConAsignados = await getTutoresConAsignados();
    res.json({ ok: true, tutor: result.tutor, tutoresConAsignados });
  } catch (err) {
    console.error('Error en /api/admin-liberar-cupo:', err);
    res.status(500).json({ error: 'Error al liberar cupo', details: err.message });
  }
};
