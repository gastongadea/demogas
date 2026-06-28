const { getCarreras } = require('../lib/carrerasDb');

module.exports = async (_req, res) => {
  try {
    const carreras = await getCarreras();
    res.json(carreras);
  } catch (err) {
    console.error('Error en /api/carreras:', err);
    res.status(500).json({ error: 'Error al obtener carreras', details: err.message });
  }
};
