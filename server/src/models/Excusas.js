const mongoose = require('mongoose');

const excusasSchema = new mongoose.Schema({
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
  docenteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  fechaInicio: {
    type: Date,
    required: true
  },
  fechaFin: {
    type: Date,
    required: true
  },
  motivo: {
    type: String,
    required: true,
    trim: true
  },
  soporteDocumental: {
    type: String
  },
  sinSoporte: {
    type: Boolean,
    default: false
  },
  estado: {
    type: String,
    enum: ['pendiente', 'aprobada', 'rechazada'],
    default: 'pendiente'
  },
  aprobadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  aprobadoEn: {
    type: Date
  },
  observaciones: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

excusasSchema.virtual('diasAusente').get(function () {
  if (!this.fechaInicio || !this.fechaFin) return 0;
  return Math.max(0, Math.ceil((this.fechaFin - this.fechaInicio) / (1000 * 60 * 60 * 24)) + 1);
});

excusasSchema.set('toJSON', { virtuals: true });
excusasSchema.set('toObject', { virtuals: true });

excusasSchema.index({ institucionId: 1, anioAcademicoId: 1, docenteId: 1 });
excusasSchema.index({ institucionId: 1, estado: 1 });

module.exports = mongoose.model('Excusas', excusasSchema);