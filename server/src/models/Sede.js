const mongoose = require('mongoose');

const sedeSchema = new mongoose.Schema({
  institucionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institucion',
    required: true
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
  direccion: {
    type: String,
    trim: true
  },
  telefono: {
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

sedeSchema.index({ institucionId: 1, nombre: 1 }, { unique: true });

module.exports = mongoose.model('Sede', sedeSchema);