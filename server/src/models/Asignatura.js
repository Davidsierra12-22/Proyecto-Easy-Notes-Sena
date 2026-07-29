const mongoose = require('mongoose');

const asignaturaSchema = new mongoose.Schema({
  institucionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institucion',
    required: true
  },
  areaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area'
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  abreviatura: {
    type: String,
    trim: true
  },
  intensidadHoraria: {
    type: Number,
    default: 4
  },
  orden: {
    type: Number,
    default: 0
  },
  tag: {
    type: String,
    trim: true
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo'],
    default: 'activo'
  }
}, {
  timestamps: true
});

asignaturaSchema.index({ institucionId: 1, areaId: 1, nombre: 1 }, { unique: true });
asignaturaSchema.index({ institucionId: 1, orden: 1 });

module.exports = mongoose.model('Asignatura', asignaturaSchema);