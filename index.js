const fs = require('fs');
const { google } = require('googleapis');

// Cargar credenciales
const credentials = require('./credentials.json');

// ID de la hoja de cálculo (puedes reemplazarlo por el tuyo)
const SPREADSHEET_ID = '1LREjud109bwtC3nOSM2lUpb6eWXoSqHrFL5YyHr4fec';
const RANGE = 'A2:N'; // Asumiendo que los datos empiezan en la fila 2 y van hasta la columna N

async function main() {
  // Autenticación
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // Leer los datos
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  });

  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log('No se encontraron tutores.');
    return;
  }

  // Mostrar tutores
  rows.forEach((row, i) => {
    console.log(`Tutor ${i + 1}:`, row);
  });
}

main().catch(console.error); 