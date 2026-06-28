/** Acepta @austral.edu.ar y subdominios (@ing.austral.edu.ar, etc.). */
function isCorreoInstitucional(email) {
  if (!email || typeof email !== 'string') return false;
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  const domain = parts[1];
  return domain === 'austral.edu.ar' || domain.endsWith('.austral.edu.ar');
}

module.exports = { isCorreoInstitucional };
