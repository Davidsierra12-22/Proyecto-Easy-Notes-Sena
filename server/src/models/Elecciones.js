const mongoose = require('mongoose');

const candidatoSchema = new mongoose.Schema({
  estudianteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  propuesta: {
    type: String,
    trim: true
  },
  foto: {
    type: String
  }
});

const votoSchema = new mongoose.Schema({
  estudianteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  candidatoId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

const permisoGrupoSchema = new mongoose.Schema({
  grupoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grupo',
    required: true
  },
  habilitado: {
    type: Boolean,
    default: true
  }
});

const eleccionesSchema = new mongoose.Schema({
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
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  fecha: {
    type: Date,
    required: true
  },
  estado: {
    type: String,
    enum: ['borrador', 'activa', 'cerrada', 'cancelada'],
    default: 'borrador'
  },
  candidatos: [candidatoSchema],
  votos: [votoSchema],
  permisos: [permisoGrupoSchema],
  resultados: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

eleccionesSchema.index({ institucionId: 1, anioAcademicoId: 1 });
eleccionesSchema.index({ institucionId: 1, estado: 1 });

module.exports = mongoose.model('Elecciones', eleccionesSchema);