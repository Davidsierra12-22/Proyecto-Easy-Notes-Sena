const mongoose = require('mongoose');

const conceptosContablesSchema = new mongoose.Schema({
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
  descripcion: {
    type: String,
    trim: true
  },
  tipo: {
    type: String,
    enum: ['obligatorio', 'opcional'],
    required: true
  },
  periodicidad: {
    type: String,
    enum: ['mensual', 'bimestral', 'trimestral', 'semestral', 'anual', 'unico'],
    default: 'mensual'
  },
  valor: {
    type: Number,
    default: 0
  },
  esPorcentual: {
    type: Boolean,
    default: false
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo'],
    default: 'activo'
  }
}, {
  timestamps: true
});

conceptosContablesSchema.index({ institucionId: 1, tipo: 1 });

module.exports = mongoose.model('ConceptosContables', conceptosContablesSchema);