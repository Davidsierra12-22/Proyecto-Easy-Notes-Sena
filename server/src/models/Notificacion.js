const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
  institucionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institucion'
  },
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  mensaje: {
    type: String,
    required: true,
    trim: true
  },
  tipo: {
    type: String,
    enum: ['sistema', 'calificacion', 'matricula', 'pago', 'comunicado', 'alerta'],
    default: 'sistema'
  },
  enlace: {
    type: String,
    trim: true
  },
  leida: {
    type: Boolean,
    default: false
  },
  fechaLectura: {
    type: Date
  }
}, {
  timestamps: true
});

notificacionSchema.index({ usuarioId: 1, leida: 1, createdAt: -1 });
notificacionSchema.index({ usuarioId: 1, createdAt: -1 });

module.exports = mongoose.model('Notificacion', notificacionSchema);
