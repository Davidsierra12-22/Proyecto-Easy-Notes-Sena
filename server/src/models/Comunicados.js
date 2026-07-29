const mongoose = require('mongoose');

const destinatarioSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  rol: {
    type: String,
    enum: ['estudiante', 'docente', 'acudiente', 'admin', 'rector', 'coordinador']
  },
  grupoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grupo'
  }
});

const lecturaSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  fechaLectura: {
    type: Date,
    default: Date.now
  }
});

const comunicadosSchema = new mongoose.Schema({
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
  destinatarios: [destinatarioSchema],
  asunto: {
    type: String,
    required: true,
    trim: true
  },
  mensaje: {
    type: String,
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  prioridad: {
    type: String,
    enum: ['normal', 'urgente'],
    default: 'normal'
  },
  leido: [lecturaSchema],
  estado: {
    type: String,
    enum: ['borrador', 'enviado', 'archivado'],
    default: 'enviado'
  }
}, {
  timestamps: true
});

comunicadosSchema.index({ institucionId: 1, createdAt: -1 });
comunicadosSchema.index({ destinatarios: 1 });

module.exports = mongoose.model('Comunicados', comunicadosSchema);