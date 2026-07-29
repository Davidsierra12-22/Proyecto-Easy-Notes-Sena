const mongoose = require('mongoose');

const direccionNucleoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  codigo: {
    type: String,
    trim: true
  },
  municipio: {
    type: String,
    trim: true
  },
  departamento: {
    type: String,
    trim: true
  },
  responsableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  contacto: {
    nombre: String,
    email: String,
    telefono: String
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo'],
    default: 'activo'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DireccionNucleo', direccionNucleoSchema);