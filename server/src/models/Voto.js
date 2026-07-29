const mongoose = require('mongoose');

const votoSchema = new mongoose.Schema({
  eventoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EventoElectoral',
    required: true
  },
  estudianteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  candidatoId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  cargo: {
    type: String,
    required: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

votoSchema.index({ eventoId: 1, estudianteId: 1, cargo: 1 }, { unique: true });
votoSchema.index({ eventoId: 1, candidatoId: 1 });

module.exports = mongoose.model('Voto', votoSchema);