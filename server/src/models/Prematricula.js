const mongoose = require('mongoose');

const prematriculaSchema = new mongoose.Schema({
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
  estudiante: {
    nombres: {
      type: String,
      required: true
    },
    apellidos: {
      type: String,
      required: true
    },
    tipoDocumento: {
      type: String,
      enum: ['RC', 'TI', 'CC', 'CE', 'PAS'],
      required: true
    },
    documento: {
      type: String,
      required: true
    },
    fechaNacimiento: {
      type: Date
    },
    genero: {
      type: String,
      enum: ['M', 'F', 'O']
    },
    lugarNacimiento: {
      type: String
    },
    direccion: {
      type: String
    },
    telefono: {
      type: String
    }
  },
  acudiente: {
    nombres: {
      type: String,
      required: true
    },
    apellidos: {
      type: String,
      required: true
    },
    tipoDocumento: {
      type: String
    },
    documento: {
      type: String
    },
    parentesco: {
      type: String
    },
    email: {
      type: String,
      trim: true
    },
    telefono: {
      type: String
    }
  },
  gradoSolicitado: {
    type: Number,
    required: true
  },
  grupoSolicitado: {
    type: String,
    trim: true
  },
  documentosAdjuntos: [{
    tipo: String,
    url: String
  }],
  estado: {
    type: String,
    enum: ['pendiente', 'aprobada', 'rechazada', 'matriculada'],
    default: 'pendiente'
  },
  observaciones: {
    type: String
  },
  fechaRegistro: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

prematriculaSchema.index({ institucionId: 1, anioAcademicoId: 1, documento: 1 });
prematriculaSchema.index({ institucionId: 1, estado: 1 });

module.exports = mongoose.model('Prematricula', prematriculaSchema);