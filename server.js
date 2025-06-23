const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const credentials = require('./credentials.json');
const nodemailer = require('nodemailer');

const SPREADSHEET_ID = '1LREjud109bwtC3nOSM2lUpb6eWXoSqHrFL5YyHr4fec';
const RANGE = 'A2:Q'; // Ahora hasta la columna Q para incluir Cupo máximo

const app = express();
app.use(cors());
app.use(express.json());

const HEADERS = [
    'Nombre', 'Apellido', 'DNI', 'Sexo', 'Edad', 'Graduación', 'Carrera', 'Celular', 'Mail', 'Lugar', 'Situación laboral', 'Empresa', 'Cargo', 'Linkedin', 'Cantidad de asesorados', 'Foto', 'Cupo'
  ];

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'graduadosfi@ing.austral.edu.ar',
    pass: 'qhnajgwlralldzhm'
  }
});

async function getTutores() {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  });
  const rows = res.data.values || [];
  console.log('Filas leídas de la hoja:', rows.length);
  if (rows.length > 0) {
    console.log('Primera fila:', rows[0]);
  }
  // Mapear filas a objetos, ocultando el DNI
  const tutores = rows
    .map(row => {
      const obj = {};
      HEADERS.forEach((key, i) => {
        if (key !== 'DNI') obj[key] = row[i] || '';
      });
      
      // Calcular cupo disponible
      const cupoMaximo = parseInt(obj['Cupo']) || 0;
      const asesoradosActuales = parseInt(obj['Cantidad de asesorados']) || 0;
      const cupoDisponible = Math.max(0, cupoMaximo - asesoradosActuales);
      
      // Agregar el cupo disponible al objeto
      obj['Cupo disponible'] = cupoDisponible;
      
      return obj;
    })
    .filter(tutor => tutor['Cupo disponible'] > 0); // Solo mostrar tutores con cupo disponible
  console.log('Tutores con cupo disponible:', tutores.length);
  return tutores;
}

app.get('/tutores', async (req, res) => {
  try {
    console.log('Solicitud GET /tutores recibida');
    const tutores = await getTutores();
    res.json(tutores);
  } catch (err) {
    console.error('Error en /tutores:', err);
    res.status(500).json({ error: 'Error al obtener tutores', details: err.message });
  }
});

/**
 * Verifica si un alumno ya tiene una solicitud previa
 */
async function verificarSolicitudPrevia(alumno) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Leer la hoja de selecciones
    const seleccionesRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Selecciones!A2:J', // Desde la fila 2 para omitir headers
    });
    
    const selecciones = seleccionesRes.data.values || [];
    
    // Verificar si ya existe una solicitud con el mismo DNI, correo o celular
    const solicitudExistente = selecciones.find(seleccion => {
      const correoSeleccion = seleccion[5] || ''; // Columna F
      const celularSeleccion = seleccion[6] || ''; // Columna G
      
      return (
        correoSeleccion.toLowerCase() === alumno.correo.toLowerCase() ||
        celularSeleccion === alumno.celular
      );
    });
    
    return solicitudExistente;
  } catch (err) {
    console.error('Error al verificar solicitud previa:', err);
    throw err;
  }
}

async function enviarCorreoSeleccion(tutor, alumno) {
  let linkedinAlumno = '';
  if (alumno.linkedin && alumno.linkedin.trim() !== '') {
    linkedinAlumno = `- LinkedIn: ${alumno.linkedin}\n`;
  }
  const mailOptions = {
    from: 'Graduados FI Austral <graduadosfi@ing.austral.edu.ar>',
    to: `${tutor.Mail}, ${alumno.correo}`,
    subject: '¡Conexión realizada! Mentoría FI Austral',
    text: `¡Hola! Se ha realizado una conexión alumno - graduado del Programa de Mentorías de alumnos.\n\nDatos del Alumno:\n- Nombre: ${alumno.nombre}\n- Apellido: ${alumno.apellido}\n- Carrera: ${alumno.carrera}\n- Año en la carrera: ${alumno.anioCarrera}\n- Celular: ${alumno.celular}\n${linkedinAlumno}\nDatos del Graduado:\n- Nombre: ${tutor.Nombre}\n- Apellido: ${tutor.Apellido}\n- Carrera: ${tutor.Carrera}\n\nLos animamos a ponerse en contacto para coordinar su primer encuentro.\nSaludos cordiales!\nDepartamento de Graduados de la Facultad de Ingeniería\nUniversidad Austral`
  };
  await transporter.sendMail(mailOptions);
}

/**
 * POST /seleccionar-tutor
 * Body: {
 *   tutor: { Nombre, Apellido },
 *   alumno: { nombre, apellido, anioCarrera, correo, celular, linkedin, carrera }
 * }
 */
app.post('/seleccionar-tutor', async (req, res) => {
  const { tutor, alumno } = req.body;
  if (!tutor || !alumno) {
    return res.status(400).json({ error: 'Faltan datos de tutor o alumno' });
  }
  try {
    // 1. Verificar si el alumno ya tiene una solicitud previa
    const solicitudPrevia = await verificarSolicitudPrevia(alumno);
    if (solicitudPrevia) {
      return res.status(400).json({ 
        error: 'Ya tienes una solicitud de tutor registrada. No puedes solicitar otro tutor.',
        solicitudPrevia: {
          fecha: solicitudPrevia[0],
          tutor: `${solicitudPrevia[8]} ${solicitudPrevia[9]}`
        }
      });
    }

    // 2. Leer tutores
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const tutoresRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });
    const rows = tutoresRes.data.values || [];
    // 3. Buscar el índice del tutor
    const idx = rows.findIndex(row =>
      row[0] === tutor.Nombre && row[1] === tutor.Apellido
    );
    if (idx === -1) {
      return res.status(404).json({ error: 'Tutor no encontrado' });
    }
    
    // Verificar cupo disponible
    const cupoMaximo = parseInt(rows[idx][16]) || 0; // Columna Q (índice 16) - Cupo máximo
    const asesoradosActuales = parseInt(rows[idx][14]) || 0; // Columna O (índice 14) - Cantidad de asesorados
    const cupoDisponible = Math.max(0, cupoMaximo - asesoradosActuales);
    
    if (cupoDisponible <= 0) {
      return res.status(400).json({ error: 'El tutor no tiene cupo disponible' });
    }
    
    // 4. Incrementar la cantidad de asesorados (no modificar el cupo máximo)
    const nuevaCantidadAsesorados = asesoradosActuales + 1;
    const cellAsesorados = `O${idx + 2}`; // +2 porque empieza en la fila 2
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: cellAsesorados,
      valueInputOption: 'RAW',
      requestBody: { values: [[nuevaCantidadAsesorados]] },
    });
    // 5. Registrar la selección en la hoja 'Selecciones'
    const fecha = new Date().toLocaleString('es-AR');
    const filaSeleccion = [
      fecha,
      alumno.nombre,
      alumno.apellido,
      alumno.anioCarrera,
      alumno.carrera,
      alumno.correo,
      alumno.celular,
      alumno.linkedin,
      tutor.Nombre,
      tutor.Apellido
    ];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Selecciones!A1',
      valueInputOption: 'RAW',
      requestBody: { values: [filaSeleccion] },
    });

    // Buscar datos completos del tutor para el correo
    const tutorCompleto = {
      ...tutor,
      Mail: rows[idx][8] || '',
      Celular: rows[idx][7] || '',
      Carrera: rows[idx][6] || '',
      Linkedin: rows[idx][13] || ''
    };
    try {
      await enviarCorreoSeleccion(tutorCompleto, alumno);
    } catch (err) {
      console.error('Error enviando correo:', err);
      // No cortamos el flujo si falla el correo
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