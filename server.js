const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const credentials = require('./credentials.json');

const SPREADSHEET_ID = '1LREjud109bwtC3nOSM2lUpb6eWXoSqHrFL5YyHr4fec';
const RANGE = 'A2:P'; // Ahora hasta la columna N

const app = express();
app.use(cors());
app.use(express.json());

const HEADERS = [
    'Nombre', 'Apellido', 'DNI', 'Sexo', 'Edad', 'Graduación', 'Carrera', 'Celular', 'Mail', 'Lugar', 'Situación laboral', 'Empresa', 'Cargo', 'Linkedin', 'Cantidad de asesorados', 'Foto'
  ];

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
      return obj;
    })
    .filter(tutor => Number(tutor['Cantidad de asesorados']) > 0);
  console.log('Tutores con cupo:', tutores.length);
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
    // 1. Leer tutores
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
    // 2. Buscar el índice del tutor
    const idx = rows.findIndex(row =>
      row[0] === tutor.Nombre && row[1] === tutor.Apellido
    );
    if (idx === -1) {
      return res.status(404).json({ error: 'Tutor no encontrado' });
    }
    const cupo = Number(rows[idx][14]); // Columna O (índice 14)
    if (cupo <= 0) {
      return res.status(400).json({ error: 'El tutor no tiene cupo disponible' });
    }
    // 3. Descontar el cupo
    const nuevaCantidad = cupo - 1;
    const cell = `O${idx + 2}`; // +2 porque empieza en la fila 2
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: cell,
      valueInputOption: 'RAW',
      requestBody: { values: [[nuevaCantidad]] },
    });
    // 4. Registrar la selección en la hoja 'Selecciones'
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