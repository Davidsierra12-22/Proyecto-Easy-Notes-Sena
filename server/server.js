require('dotenv').config();
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`[OK] MongoDB Conectado: ${mongoose.connection.host}`);
    console.log(`[INFO] Base de datos: ${mongoose.connection.name}`);

    // Mostrar modelos disponibles
    console.log('\nModelos registrados:');
    mongoose.models = {};
    const modelFiles = ['Actividad', 'AnioAcademico', 'Area', 'Asignatura', 'Bitacora',
      'Calificacion', 'CargaAcademica', 'Catalogo', 'Comunicados', 'Comunicado',
      'ConceptosContables', 'DireccionNucleo', 'Elecciones', 'EventoElectoral',
      'Excusas', 'Grupo', 'Indicador', 'Institucion', 'Matricula', 'Observador',
      'Pagos', 'Prematricula', 'Sede', 'SolicitudRegistro', 'Usuario', 'Voto'];

    modelFiles.forEach(name => console.log(`   - ${name}`));

    const stats = await mongoose.connection.db.stats();
    console.log(`\n[INFO] Estadisticas:`);
    console.log(`   Documentos: ${stats.objects}`);
    console.log(`   Tamano: ${(stats.dataSize / 1024).toFixed(1)} KB`);

    console.log(`\n[OK] Servidor listo en puerto ${PORT}`);
  } catch (error) {
    console.error('[ERROR] Error:', error.message);
    process.exit(1);
  }
};

startServer();
