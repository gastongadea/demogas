require('dotenv').config();
const { syncTutoresFromSheet } = require('../lib/tutoresSync');

const args = process.argv.slice(2);
const overwriteAsesorados = args.includes('--overwrite-asesorados');
const keepMissingActive = args.includes('--keep-missing-active');

async function main() {
  console.log('Sincronizando tutores: Google Sheets → Neon...');
  console.log('Opciones:', {
    overwriteAsesorados,
    deactivateMissing: !keepMissingActive,
  });

  const stats = await syncTutoresFromSheet({
    overwriteAsesorados,
    deactivateMissing: !keepMissingActive,
  });

  console.log('Sync completado:');
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((err) => {
  console.error('Error en sync:', err.message);
  process.exit(1);
});
