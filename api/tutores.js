const { getTutoresDisponibles } = require('../lib/tutoresDb');

module.exports = async (_req, res) => {
  try {
    const tutores = await getTutoresDisponibles();
    res.json(tutores);
  } catch (err) {
    console.error('Error en /api/tutores:', err);
    res.status(500).json({ error: 'Error al obtener tutores', details: err.message });
  }
};
