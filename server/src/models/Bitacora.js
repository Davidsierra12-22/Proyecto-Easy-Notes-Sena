const mongoose = require('mongoose');

const bitacoraSchema = new mongoose.Schema({
  institucionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institucion',
    required: true
  },
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  accion: {
    type: String,
    required: true,
    trim: true
  },
  coleccion: {
    type: String,
    trim: true
  },
  registroId: {
    type: mongoose.Schema.Types.ObjectId
  },
  detalle: {
    type: String
  },
  cambios: {
    type: mongoose.Schema.Types.Mixed
  },
  direccionIp: {
    type: String
  },
  metodo: {
    type: String
  },
  ruta: {
    type: String
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

bitacoraSchema.index({ institucionId: 1, createdAt: -1 });
bitacoraSchema.index({ usuarioId: 1, createdAt: -1 });
bitacoraSchema.index({ accion: 1, createdAt: -1 });

module.exports = mongoose.model('Bitacora', bitacoraSchema);