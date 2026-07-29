const mongoose = require('mongoose');

const candidatoSchema = new mongoose.Schema({
  estudianteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  cargo: {
    type: String,
    required: true,
    trim: true
  },
  numero: {
    type: Number
  },
  foto: {
    type: String
  },
  propuesta: {
    type: String,
    trim: true
  }
}, { _id: true });

const eventoSchema = new mongoose.Schema({
  institucionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institucion',
    required: true
  },
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  fechaInicio: {
    type: Date,
    required: true
  },
  fechaFin: {
    type: Date,
    required: true
  },
  estado: {
    type: String,
    enum: ['programado', 'en_curso', 'finalizado'],
    default: 'programado'
  },
  cargosDisponibles: [{
    type: String,
    trim: true
  }],
  candidatos: [candidatoSchema],
  resultadosPublicos: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

eventoSchema.index({ institucionId: 1, estado: 1 });
eventoSchema.index({ institucionId: 1, fechaInicio: -1 });

module.exports = mongoose.model('EventoElectoral', eventoSchema);