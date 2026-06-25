/**
 * Prueba aislada de SMTP Microsoft 365 (sin tocar la app).
 *
 * Uso en PowerShell:
 *   $env:SMTP_USER="tu-cuenta@ing.austral.edu.ar"
 *   $env:SMTP_PASS="tu-clave"
 *   $env:SMTP_TO="destino@ejemplo.com"   # opcional; por defecto envía a SMTP_USER
 *   node scripts/test-microsoft-smtp.js
 */

const nodemailer = require('nodemailer');

const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const to = process.env.SMTP_TO || user;

if (!user || !pass) {
  console.error('Faltan credenciales.');
  console.error('Definí SMTP_USER y SMTP_PASS antes de ejecutar el script.');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: { user, pass },
});

function explainError(err) {
  const msg = (err && err.message ? err.message : String(err)).toLowerCase();

  if (msg.includes('smtpclientauthentication is disabled')) {
    return 'SMTP AUTH está deshabilitado para esta cuenta/tenant. Necesitás habilitación de sistemas.';
  }
  if (msg.includes('authentication unsuccessful') || msg.includes('invalid login') || msg.includes('535')) {
    return 'Usuario/clave rechazados. Puede ser contraseña incorrecta, MFA activo (necesitás app password) o política del tenant.';
  }
  if (msg.includes('basic authentication is disabled')) {
    return 'Microsoft bloqueó autenticación básica. Necesitás app password o Graph API con habilitación de sistemas.';
  }
  if (msg.includes('self signed certificate') || msg.includes('certificate')) {
    return 'Problema de certificado TLS en la conexión SMTP.';
  }

  return 'Revisá el mensaje completo abajo; si es de autenticación, probablemente necesites sistemas.';
}

async function main() {
  console.log('Probando SMTP Microsoft 365...');
  console.log('Cuenta:', user);
  console.log('Servidor: smtp.office365.com:587');

  try {
    console.log('\n1/2 Verificando conexión y autenticación...');
    await transporter.verify();
    console.log('OK: autenticación SMTP exitosa.');
  } catch (err) {
    console.error('\nFALLÓ la autenticación SMTP.');
    console.error('Diagnóstico:', explainError(err));
    console.error('Detalle:', err.message || err);
    process.exit(1);
  }

  try {
    console.log('\n2/2 Enviando correo de prueba...');
    const info = await transporter.sendMail({
      from: user,
      to,
      subject: 'Prueba SMTP Mentorías FI Austral',
      text: 'Correo de prueba enviado por scripts/test-microsoft-smtp.js',
    });
    console.log('OK: correo enviado.');
    console.log('Message ID:', info.messageId);
    console.log('Destino:', to);
  } catch (err) {
    console.error('\nLa autenticación funcionó, pero falló el envío.');
    console.error('Diagnóstico:', explainError(err));
    console.error('Detalle:', err.message || err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
