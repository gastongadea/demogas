# Sistema de Selección de Graduados-Mentores

Aplicación web para que los estudiantes puedan seleccionar tutores (graduados-mentores) para sus proyectos finales.

## Características

- Lista de tutores con filtros por carrera, sexo y año de graduación
- Fotos de perfil clickeables que llevan a LinkedIn
- Formulario para que los alumnos completen sus datos
- Sistema de cupos que se descuenta automáticamente
- Registro de selecciones en Google Sheets

## Tecnologías

- **Frontend**: React.js
- **Backend**: Node.js + Express
- **Base de datos**: Google Sheets
- **Autenticación**: Google Sheets API

## Instalación

### Prerrequisitos

- Node.js (versión 14 o superior)
- Cuenta de Google Cloud Platform
- Credenciales de Google Sheets API

### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd demogas
   ```

2. **Instalar dependencias del backend**
   ```bash
   npm install
   ```

3. **Instalar dependencias del frontend**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Configurar credenciales de Google Sheets**
   - Coloca tu archivo `credentials.json` en la raíz del proyecto
   - Comparte tu hoja de Google Sheets con el email del service account

5. **Ejecutar el backend**
   ```bash
   node server.js
   ```

6. **Ejecutar el frontend**
   ```bash
   cd frontend
   npm start
   ```

## Estructura del proyecto

```
demogas/
├── server.js              # Backend (Node.js + Express)
├── credentials.json       # Credenciales de Google Sheets (no subir a Git)
├── package.json           # Dependencias del backend
├── .gitignore            # Archivos a ignorar
├── README.md             # Este archivo
└── frontend/             # Aplicación React
    ├── src/
    │   └── App.js        # Componente principal
    ├── package.json      # Dependencias del frontend
    └── public/
```

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
SPREADSHEET_ID=tu_id_de_google_sheets
PORT=3001
```

## Despliegue

### Frontend (Vercel)
1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. El frontend se desplegará automáticamente

### Backend (Railway/Render)
1. Conecta tu repositorio a Railway o Render
2. Configura las variables de entorno
3. El backend se desplegará automáticamente

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. 