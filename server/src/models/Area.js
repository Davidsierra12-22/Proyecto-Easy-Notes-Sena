const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema({
  institucionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institucion',
    required: true
  },
  sedeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sede',
    default: null
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
  porcentaje: {
    type: Number,
    default: 0
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

areaSchema.index({ institucionId: 1, sedeId: 1, nombre: 1 }, { unique: true });
areaSchema.index({ institucionId: 1, orden: 1 });

module.exports = mongoose.model('Area', areaSchema);