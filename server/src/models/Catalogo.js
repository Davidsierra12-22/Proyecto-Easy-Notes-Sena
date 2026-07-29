const mongoose = require('mongoose');

const catalogoSchema = new mongoose.Schema({
  institucionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institucion',
    required: true
  },
  tipo: {
    type: String,
    enum: ['tipoDocumento', 'rol', 'genero', 'otro'],
    required: true
  },
  codigo: {
    type: String,
    required: true,
    trim: true
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
  activo: {
    type: Boolean,
    default: true
  },
  orden: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

catalogoSchema.index({ institucionId: 1, tipo: 1, codigo: 1 }, { unique: true });

module.exports = mongoose.model('Catalogo', catalogoSchema);