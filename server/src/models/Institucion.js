const mongoose = require('mongoose');
const { REGEX_NIT } = require('../utils/nit');

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
    trim: true,
    // El NIT es un identificador, no una cantidad: se guarda siempre como
    // cadena para no perder el digito de control. El match cierra tambien la
    // ruta de creacion del admin, que pasa el cuerpo crudo al modelo. La
    // expresion sale de utils/nit.js para que no pueda divergir de la que usa
    // el controlador.
    match: REGEX_NIT
  },
  /**
   * Identificador publico para los enlaces de prematrícula.
   *
   * La prematrícula es la unica parte del sistema sin login: la usan padres
   * que no tienen cuenta. Como no hay sesion de la que sacar el colegio, el
   * padre tiene que decir a cual postula, y ese dato viaja en la URL que el
   * colegio publica (easynots.co/prematricula/colegio-tolima).
   *
   * No se usa el NIT para esto porque son 9 digitos consecutivos y se
   * adivina una institucion probando numeros.
   */
  slug: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    match: /^[a-z0-9-]{3,60}$/
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
    }],
    grados: [{
      numero: Number,
      nombre: String
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

/**
 * Deriva el slug a partir del nombre cuando no se envia.
 *
 * Se hace en el modelo y no en el controlador para que no dependa de que
 * cada alta pase por el mismo camino: si una institucion se crea desde una
 * carga masiva o desde un script, tambien queda con slug. El indice es
 * unique, asi que un slug repetido revienta el create en lugar de dejar dos
 * colegios compartiendo la misma URL de prematrícula.
 */
const derivationDeSlug = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // quita las tildes: "Bogotá" -> "Bogota"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

institucionSchema.pre('validate', function (next) {
  if (!this.slug && this.nombre) {
    this.slug = derivationDeSlug(this.nombre) || undefined;
  }
  next();
});

module.exports = mongoose.model('Institucion', institucionSchema);
module.exports.derivarSlug = derivationDeSlug;