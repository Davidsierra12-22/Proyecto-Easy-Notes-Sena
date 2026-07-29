const mongoose = require('mongoose');

const seguimientoSchema = new mongoose.Schema({
  fecha: {
    type: Date,
    default: Date.now
  },
  observacion: {
    type: String,
    required: true
  },
  responsable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  }
});

const observadorSchema = new mongoose.Schema({
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
  tipo: {
    type: String,
    enum: ['disciplinario', 'academico', 'convivencia'],
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  descripcion: {
    type: String,
    required: true
  },
  compromiso: {
    type: String
  },
  docenteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  coordinadorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  seguimiento: [seguimientoSchema],
  estado: {
    type: String,
    enum: ['abierto', 'cerrado', 'seguimiento'],
    default: 'abierto'
  },
  categoria: {
    type: String,
    enum: ['positiva', 'negativa', 'neutra'],
    default: 'neutra'
  },
  gravedad: {
    type: String,
    enum: ['baja', 'media', 'alta'],
    default: 'baja'
  }
}, {
  timestamps: true
});

observadorSchema.index({ institucionId: 1, estudianteId: 1, createdAt: -1 });
observadorSchema.index({ institucionId: 1, tipo: 1 });

module.exports = mongoose.model('Observador', observadorSchema);