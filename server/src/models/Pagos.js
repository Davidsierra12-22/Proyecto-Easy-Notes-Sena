const mongoose = require('mongoose');

const pagosSchema = new mongoose.Schema({
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
  conceptoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConceptosContables',
    required: true
  },
  valor: {
    type: Number,
    required: true
  },
  descuento: {
    type: Number,
    default: 0
  },
  recargo: {
    type: Number,
    default: 0
  },
  valorFinal: {
    type: Number,
    required: true
  },
  fechaPago: {
    type: Date
  },
  fechaVencimiento: {
    type: Date,
    required: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'pagado', 'vencido', 'anulado'],
    default: 'pendiente'
  },
  metodoPago: {
    type: String,
    enum: ['efectivo', 'transferencia', 'consignacion', 'tarjeta', 'otro']
  },
  referencia: {
    type: String,
    trim: true
  },
  observaciones: {
    type: String
  },
  recibidoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  }
}, {
  timestamps: true
});

pagosSchema.index({ institucionId: 1, anioAcademicoId: 1, estado: 1 });
pagosSchema.index({ institucionId: 1, estudianteId: 1 });

module.exports = mongoose.model('Pagos', pagosSchema);