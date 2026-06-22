function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || 'mentoriaustral';
}

function getAdminPasswordFromRequest(req) {
  return (
    req.headers['x-admin-password'] ||
    req.body?.password ||
    req.query.password ||
    ''
  );
}

function requireAdminPassword(req, res) {
  const provided = getAdminPasswordFromRequest(req);
  if (provided !== getAdminPassword()) {
    res.status(401).json({ error: 'Contraseña incorrecta' });
    return false;
  }
  return true;
}

module.exports = { getAdminPassword, requireAdminPassword };
