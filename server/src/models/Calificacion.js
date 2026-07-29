const mongoose = require('mongoose');

const indicadoresCalificacionSchema = new mongoose.Schema({
  indicadorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Indicador',
    required: true
  },
  nota: {
    type: Number,
    min: 0,
    max: 5
  }
});

const actividadesCalificacionSchema = new mongoose.Schema({
  actividadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Actividad',
    required: true
  },
  nota: {
    type: Number,
    min: 0,
    max: 5
  }
});

const calificacionSchema = new mongoose.Schema({
  institucionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institucion',
    required: true
  },
  anioAcademicoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AnioAcademico',
    required: true
  },
  estudianteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  asignaturaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asignatura',
    required: true
  },
  grupoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grupo',
    required: true
  },
  periodo: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  nota: {
    type: Number,
    min: 0,
    max: 5
  },
  recuperacion: {
    type: Number,
    min: 0,
    max: 5
  },
  habilitacion: {
    type: Number,
    min: 0,
    max: 5
  },
  indicadores: [indicadoresCalificacionSchema],
  actividades: [actividadesCalificacionSchema],
  observacion: {
    type: String,
    trim: true
  },
  docenteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  fechaCalificacion: {
    type: Date,
    default: Date.now
  },
  estado: {
    type: String,
    enum: ['activo', 'cerrado', 'recuperado', 'habilitado'],
    default: 'activo'
  }
}, {
  timestamps: true
});

calificacionSchema.index({ institucionId: 1, anioAcademicoId: 1, estudianteId: 1, asignaturaId: 1, periodo: 1 }, { unique: true });
calificacionSchema.index({ institucionId: 1, anioAcademicoId: 1, grupoId: 1, periodo: 1 });
calificacionSchema.index({ institucionId: 1, anioAcademicoId: 1, docenteId: 1 });

module.exports = mongoose.model('Calificacion', calificacionSchema);