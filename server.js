const app = require('./app');
const { bootstrapCarreras } = app;

const PORT = process.env.PORT || 3001;

bootstrapCarreras().finally(() => {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
  });
});
