/**
 * Extrae el fileId de un link de Google Drive (o si pegaron solo el id).
 */
function extractGoogleDriveFileId(input) {
  if (!input || typeof input !== 'string') return null;
  const s = input.trim();
  if (!s) return null;

  const fromPath = s.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fromPath) return fromPath[1];

  if (/drive\.google\.com|docs\.google\.com/.test(s)) {
    const fromQuery = s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (fromQuery) return fromQuery[1];
  }

  if (/^[a-zA-Z0-9_-]{25,}$/.test(s) && !s.includes('://')) return s;

  return null;
}

/** URL estable para usar en <img src> (archivo compartido “Cualquiera con el enlace”). */
function normalizeDrivePhotoUrl(raw) {
  const id = extractGoogleDriveFileId(raw);
  if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w128`;
  return typeof raw === 'string' ? raw.trim() : '';
}

module.exports = { extractGoogleDriveFileId, normalizeDrivePhotoUrl };
