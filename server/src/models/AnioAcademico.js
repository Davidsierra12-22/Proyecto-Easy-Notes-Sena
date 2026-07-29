const mongoose = require('mongoose');
const { ESTADOS_ANIO, ESTADOS_PERIODO } = require('../config/constants');

const CICLOS = ['normal', 'semestre1', 'semestre2'];

const periodoSchema = new mongoose.Schema({
  numero: {
    type: Number,
    required: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  ciclo: {
    type: String,
    enum: CICLOS,
    default: 'normal'
  },
  inicio: {
    type: Date,
    default: null
  },
  fin: {
    type: Date,
    default: null
  },
  estado: {
    type: String,
    enum: Object.values(ESTADOS_PERIODO),
    default: 'abierto'
  },
  recuperacion: {
    inicio: Date,
    fin: Date
  }
}, { _id: true });

const anioAcademicoSchema = new mongoose.Schema({
  institucionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institucion',
    required: true
  },
  anio: {
    type: Number,
    required: true
  },
  estado: {
    type: String,
    enum: Object.values(ESTADOS_ANIO),
    default: 'prematricula'
  },
  cronograma: {
    prematricula: {
      inicio: Date,
      fin: Date,
      estado: {
        type: String,
        enum: ['abierta', 'cerrada'],
        default: 'cerrada'
      }
    },
    periodos: [periodoSchema],
    habilitaciones: {
      inicio: Date,
      fin: Date
    }
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
    }
  }
}, {
  timestamps: true
});

anioAcademicoSchema.index({ institucionId: 1, anio: 1 }, { unique: true });
anioAcademicoSchema.index({ institucionId: 1, estado: 1 });

module.exports = mongoose.model('AnioAcademico', anioAcademicoSchema);