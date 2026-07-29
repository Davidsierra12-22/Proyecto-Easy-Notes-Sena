const mongoose = require('mongoose');

const institucionSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  nit: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  direccion: {
    type: String,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  logo: {
    type: String
  },
  dane: {
    type: String,
    trim: true
  },
  icfes: {
    type: String,
    trim: true
  },
  configuracion: {
    notaMinima: {
      type: Number,
      default: 3.0
    },
    notaMaxima: {
      type: Number,
      default: 5.0
    },
    numeroPeriodos: {
      type: Number,
      default: 4
    },
    pierdeAnoPor: {
      type: String,
      enum: ['areas', 'materias'],
      default: 'areas'
    },
    numPerdidas: {
      type: Number,
      default: 3
    },
    aproximaPromedio: {
      type: Boolean,
      default: true
    },
    niveles: [{
      orden: Number,
      codigo: String,
      valor: String,
      rangoMin: Number,
      rangoMax: Number
    }]
  },
  tipo: {
    type: String,
    enum: ['publico', 'privado'],
    default: 'privado'
  },
  nucleoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DireccionNucleo'
  },
  rectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  secretariaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  certificadoEncabezado: {
    type: String
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo'],
    default: 'activo'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Institucion', institucionSchema);