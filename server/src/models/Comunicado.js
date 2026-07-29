const mongoose = require('mongoose');

const destinatarioSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  leido: {
    type: Boolean,
    default: false
  },
  leidoEn: {
    type: Date
  }
}, { _id: false });

const comunicadoSchema = new mongoose.Schema({
  institucionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institucion',
    required: true
  },
  remitenteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  asunto: {
    type: String,
    required: true,
    trim: true
  },
  mensaje: {
    type: String,
    required: true
  },
  prioridad: {
    type: String,
    enum: ['baja', 'normal', 'alta'],
    default: 'normal'
  },
  destinatarios: [destinatarioSchema],
  adjuntos: [{
    nombre: String,
    url: String
  }],
  estado: {
    type: String,
    enum: ['activo', 'archivado'],
    default: 'activo'
  }
}, {
  timestamps: true
});

comunicadoSchema.index({ institucionId: 1, createdAt: -1 });
comunicadoSchema.index({ 'destinatarios.usuarioId': 1, estado: 1 });

module.exports = mongoose.model('Comunicado', comunicadoSchema);