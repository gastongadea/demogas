require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { syncTutoresFromSheet, previewNewTutoresFromSheet, importNewTutoresFromSheet } = require('./lib/tutoresSync');
const { getTutoresDisponibles, seleccionarTutor } = require('./lib/tutoresDb');
const { requireAdminPassword } = require('./lib/adminAuth');
const { appendSeleccionToSheet } = require('./lib/sheets');

const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'graduadosfi@ing.austral.edu.ar',
    pass: process.env.GMAIL_PASS,
  },
});

function requireSyncToken(req, res) {
  const expected = process.env.ADMIN_SYNC_TOKEN;
  if (!expected) {
    res.status(503).json({
      error: 'Sync no configurado',
      details: 'Definí ADMIN_SYNC_TOKEN en las variables de entorno',
    });
    return false;
  }
  const token = req.headers['x-sync-token'] || req.query.token;
  if (token !== expected) {
    res.status(401).json({ error: 'No autorizado' });
    return false;
  }
  return true;
}

async function enviarCorreoSeleccion(tutor, alumno) {
  if (!process.env.GMAIL_PASS) {
    console.warn('GMAIL_PASS no configurado; se omite el envío de correo.');
    return;
  }

  let linkedinAlumno = '';
  if (alumno.linkedin && alumno.linkedin.trim() !== '') {
    linkedinAlumno = `- LinkedIn: ${alumno.linkedin}\n`;
  }

  const esAlumna = alumno.sexo === 'Mujer';
  const esGraduada = tutor.Sexo === 'Mujer';

  const textoAlumno = esAlumna ? 'ALUMNA' : 'ALUMNO';
  const textoGraduado = esGraduada ? 'GRADUADA' : 'GRADUADO';

  const mentorEmail = (tutor.Mail || '').split('|')[0].trim();

  const mailOptions = {
    from: 'Graduados FI Austral <graduadosfi@ing.austral.edu.ar>',
    to: `${mentorEmail}, ${alumno.correo}`,
    bcc: 'gaston.gadea@ing.austral.edu.ar',
    subject: '¡Conexión realizada! Mentoría FI Austral',
    text: `¡Hola! Se ha realizado una conexión alumno - graduado del Programa de Mentorías de alumnos.\n\n${textoAlumno}: ${alumno.nombre} ${alumno.apellido}\n- Carrera: ${alumno.carrera}\n- Año: ${alumno.anioCarrera}º\n- Celular: ${alumno.celular}\n${linkedinAlumno}\n\n${textoGraduado}: ${tutor.Nombre} ${tutor.Apellido}\n- Título: ${tutor.Carrera}\n- Contacto: ${tutor.Mail}\n\nLos animamos a ponerse en contacto para coordinar su primer encuentro.\n\nSaludos cordiales!\n\nDepartamento de Graduados de la Facultad de Ingeniería\nUniversidad Austral`,
  };
  await transporter.sendMail(mailOptions);
}

app.get('/', (req, res) => {
  res.type('html').send(`<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>API mentorías</title></head>
<body>
  <p>Backend en marcha. Este servidor no sirve una página en <code>/</code>; usá los endpoints:</p>
  <ul>
    <li><a href="/tutores"><code>GET /tutores</code></a> — lista de mentores (JSON, desde Neon)</li>
    <li><code>POST /seleccionar-tutor</code> — cuerpo JSON (desde el front)</li>
    <li><code>POST /admin/sync-tutores</code> — sincroniza tutores desde Google Sheets (requiere token)</li>
  </ul>
</body>
</html>`);
});

app.get('/tutores', async (req, res) => {
  try {
    console.log('Solicitud GET /tutores recibida');
    const tutores = await getTutoresDisponibles();
    console.log('Tutores con cupo disponible:', tutores.length);
    res.json(tutores);
  } catch (err) {
    console.error('Error en /tutores:', err);
    res.status(500).json({ error: 'Error al obtener tutores', details: err.message });
  }
});

/**
 * POST /admin/sync-tutores
 * Headers: x-sync-token: <ADMIN_SYNC_TOKEN>
 * Body opcional: { "overwriteAsesorados": false, "deactivateMissing": true }
 */
app.post('/admin/sync-tutores', async (req, res) => {
  if (!requireSyncToken(req, res)) return;

  try {
    const overwriteAsesorados = req.body?.overwriteAsesorados === true;
    const deactivateMissing = req.body?.deactivateMissing !== false;
    const stats = await syncTutoresFromSheet({ overwriteAsesorados, deactivateMissing });
    res.json({ ok: true, ...stats });
  } catch (err) {
    console.error('Error en /admin/sync-tutores:', err);
    res.status(500).json({ error: 'Error al sincronizar tutores', details: err.message });
  }
});

/** GET /admin/new-tutores — filas nuevas en hoja Graduados que no están en Neon */
app.get('/admin/new-tutores', async (req, res) => {
  if (!requireAdminPassword(req, res)) return;

  try {
    const preview = await previewNewTutoresFromSheet();
    res.json({ ok: true, ...preview });
  } catch (err) {
    console.error('Error en /admin/new-tutores:', err);
    res.status(500).json({ error: 'Error al leer la planilla', details: err.message });
  }
});

/** POST /admin/import-new-tutores — inserta en Neon solo tutores nuevos de la planilla */
app.post('/admin/import-new-tutores', async (req, res) => {
  if (!requireAdminPassword(req, res)) return;

  try {
    const stats = await importNewTutoresFromSheet();
    res.json({ ok: true, ...stats });
  } catch (err) {
    console.error('Error en /admin/import-new-tutores:', err);
    res.status(500).json({ error: 'Error al importar tutores', details: err.message });
  }
});

/**
 * POST /seleccionar-tutor
 * Body: {
 *   tutor: { Nombre, Apellido },
 *   alumno: { nombre, apellido, anioCarrera, correo, celular, linkedin, carrera, sexo }
 * }
 */
app.post('/seleccionar-tutor', async (req, res) => {
  const { tutor, alumno } = req.body;
  if (!tutor || !alumno) {
    return res.status(400).json({ error: 'Faltan datos de tutor o alumno' });
  }

  try {
    const result = await seleccionarTutor(tutor, alumno);

    if (!result.ok) {
      const status = result.status || 400;
      return res.status(status).json({
        error: result.error,
        ...(result.solicitudPrevia ? { solicitudPrevia: result.solicitudPrevia } : {}),
      });
    }

    try {
      await appendSeleccionToSheet({
        fecha: result.fecha,
        alumno,
        tutorNombre: tutor.Nombre,
        tutorApellido: tutor.Apellido,
      });
    } catch (err) {
      console.error('Error al registrar selección en Google Sheets:', err);
      // La selección ya quedó en Neon; no revertimos por fallo en la planilla.
    }

    try {
      await enviarCorreoSeleccion(result.tutor, alumno);
    } catch (err) {
      console.error('Error enviando correo:', err);
    }

    res.json({ ok: true, mensaje: 'Selección registrada y cupo descontado' });
  } catch (err) {
    console.error('Error en /seleccionar-tutor:', err);
    res.status(500).json({ error: 'Error al seleccionar tutor', details: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
