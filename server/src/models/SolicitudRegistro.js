const mongoose = require('mongoose');

const solicitudRegistroSchema = new mongoose.Schema({
  nucleoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DireccionNucleo',
    required: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  nit: {
    type: String,
    required: true,
    trim: true
  },
  municipio: {
    type: String,
    trim: true
  },
  direccion: {
    type: String,
    trim: true
  },
  contacto: {
    nombre: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    telefono: {
      type: String,
      trim: true
    }
  },
  estado: {
    type: String,
    enum: ['pendiente', 'aprobada', 'rechazada'],
    default: 'pendiente'
  },
  procesadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  observaciones: {
    type: String
  }
}, {
  timestamps: true
});

solicitudRegistroSchema.index({ nucleoId: 1, estado: 1 });

module.exports = mongoose.model('SolicitudRegistro', solicitudRegistroSchema);