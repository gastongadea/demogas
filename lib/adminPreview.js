const { syncCarrerasFromSheet } = require('./carrerasSync');
const { previewNewTutoresFromSheet, syncCuposFromSheet } = require('./tutoresSync');
const { getTutoresConAsignados } = require('./tutoresAdmin');

async function loadAdminPreview() {
  const carreras = await syncCarrerasFromSheet();
  const cupos = await syncCuposFromSheet();
  const preview = await previewNewTutoresFromSheet();
  const tutoresConAsignados = await getTutoresConAsignados();
  return {
    ok: true,
    ...preview,
    carreras,
    cuposUpdated: cupos.cuposUpdated,
    tutoresConAsignados,
  };
}

module.exports = { loadAdminPreview };
