const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, ESTADOS_USUARIO, TIPOS_DOCUMENTO, GENEROS } = require('../config/constants');

const usuarioSchema = new mongoose.Schema({
  tipoDocumento: {
    type: String,
    enum: TIPOS_DOCUMENTO,
    required: true
  },
  documento: {
    type: String,
    required: true,
    trim: true
  },
  nombres: {
    type: String,
    required: true,
    trim: true
  },
  apellidos: {
    type: String,
    required: true,
    trim: true
  },
  nombreCompleto: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  telefono: {
    type: String,
    trim: true
  },
  celular: {
    type: String,
    trim: true
  },
  estrato: {
    type: Number,
    min: 0,
    max: 6,
    default: 0
  },
  eps: {
    type: String,
    trim: true
  },
  direccion: {
    type: String,
    trim: true
  },
  fechaNacimiento: {
    type: Date
  },
  genero: {
    type: String,
    enum: GENEROS
  },
  foto: {
    type: String
  },
  firma: {
    type: String
  },
  tipoPerfil: {
    type: String,
    enum: Object.values(ROLES),
    required: true
  },
  institucionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institucion'
  },
  nucleoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DireccionNucleo'
  },
  credenciales: {
    usuario: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    debeCambiarPassword: {
      type: Boolean,
      default: false
    },
    ultimoLogin: {
      type: Date
    },
    tokenRecuperacion: {
      type: String
    },
    tokenRecuperacionExpira: {
      type: Date
    }
  },
  estudiantes: [{
    estudianteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    parentesco: {
      type: String,
      trim: true
    },
    nombre: {
      type: String,
      trim: true
    }
  }],
  acudientes: [{
    acudienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    parentesco: {
      type: String,
      trim: true
    }
  }],
  estado: {
    type: String,
    enum: Object.values(ESTADOS_USUARIO),
    default: 'activo'
  }
}, {
  timestamps: true
});

usuarioSchema.index({ institucionId: 1, documento: 1 }, { unique: true });
usuarioSchema.index({ institucionId: 1, 'credenciales.usuario': 1 });
usuarioSchema.index({ nucleoId: 1, 'credenciales.usuario': 1 });

usuarioSchema.pre('save', function(next) {
  this.nombreCompleto = `${this.nombres} ${this.apellidos}`.trim();
  next();
});

usuarioSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.credenciales.passwordHash);
};

usuarioSchema.statics.hashPassword = async function(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

module.exports = mongoose.model('Usuario', usuarioSchema);