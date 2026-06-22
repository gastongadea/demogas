const { google } = require('googleapis');

const DEFAULT_SPREADSHEET_ID = '1LREjud109bwtC3nOSM2lUpb6eWXoSqHrFL5YyHr4fec';
const TUTORES_SHEET = process.env.TUTORES_SHEET || 'Graduados';
const TUTORES_RANGE = `${TUTORES_SHEET}!A2:Q`;
const SELECCIONES_SHEET = process.env.SELECCIONES_SHEET || 'Selecciones';
const SELECCIONES_APPEND_RANGE = `${SELECCIONES_SHEET}!A1`;

const HEADERS = [
  'Nombre', 'Apellido', 'DNI', 'Sexo', 'Edad', 'Graduación', 'Carrera', 'Celular', 'Mail',
  'Lugar', 'Situación laboral', 'Empresa', 'Cargo', 'Linkedin', 'Cantidad de asesorados', 'Foto', 'Cupo',
];

function getCredentials() {
  const credentialsJson = process.env.GOOGLE_CREDENTIALS;
  if (!credentialsJson) {
    throw new Error('GOOGLE_CREDENTIALS environment variable is not set');
  }
  return JSON.parse(credentialsJson);
}

function getSpreadsheetId() {
  return process.env.SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID;
}

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

function rowToObject(row) {
  const obj = {};
  HEADERS.forEach((key, i) => {
    obj[key] = row[i] || '';
  });
  return obj;
}

async function fetchTutorRowsFromSheet() {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: TUTORES_RANGE,
  });
  return res.data.values || [];
}

/**
 * Agrega una fila en la hoja Selecciones (mismo formato que usaba la app antes).
 * Columnas: fecha, nombre, apellido, anioCarrera, carrera, correo, celular, linkedin, tutorNombre, tutorApellido
 */
async function appendSeleccionToSheet({ fecha, alumno, tutorNombre, tutorApellido }) {
  const sheets = await getSheetsClient();
  const fila = [
    fecha,
    alumno.nombre,
    alumno.apellido,
    alumno.anioCarrera,
    alumno.carrera,
    alumno.correo,
    alumno.celular,
    alumno.linkedin || '',
    tutorNombre,
    tutorApellido,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: SELECCIONES_APPEND_RANGE,
    valueInputOption: 'RAW',
    requestBody: { values: [fila] },
  });
}

module.exports = {
  HEADERS,
  TUTORES_SHEET,
  TUTORES_RANGE,
  SELECCIONES_SHEET,
  fetchTutorRowsFromSheet,
  appendSeleccionToSheet,
  rowToObject,
};
