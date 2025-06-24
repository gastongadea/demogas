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
   - Crea un archivo `.env` en la raíz del proyecto
   - Agrega la variable `GOOGLE_CREDENTIALS` con el contenido completo del JSON de credenciales
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
├── package.json           # Dependencias del backend
├── .gitignore            # Archivos a ignorar
├── README.md             # Este archivo
└── frontend/             # Aplicación React
    ├── src/
    │   └── App.js        # Componente principal
    ├── package.json      # Dependencias del frontend
    └── public/
```

**Nota**: Las credenciales de Google Sheets se manejan a través de variables de entorno por seguridad.

## Variables de entorno

### Desarrollo local
Crea un archivo `.env` en la raíz del proyecto:

```env
SPREADSHEET_ID=tu_id_de_google_sheets
PORT=3001
```

### Despliegue en Railway

Para desplegar en Railway, necesitas configurar las siguientes variables de entorno:

1. **GOOGLE_CREDENTIALS**: El contenido completo del archivo JSON de credenciales de Google Sheets API
   - Ve a Google Cloud Console
   - Crea un Service Account
   - Descarga el archivo JSON de credenciales
   - Copia todo el contenido del archivo JSON
   - Pégalo como valor de la variable `GOOGLE_CREDENTIALS` en Railway

2. **PORT**: Puerto del servidor (Railway lo configura automáticamente)

### Cómo configurar las variables en Railway:

1. Ve a tu proyecto en Railway
2. Haz clic en la pestaña "Variables"
3. Agrega la variable `GOOGLE_CREDENTIALS` con el contenido completo del JSON de credenciales
4. Guarda los cambios

**Importante**: El archivo `credentials.json` ya no es necesario. Las credenciales se manejan a través de variables de entorno por seguridad.

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