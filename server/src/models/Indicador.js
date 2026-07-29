const mongoose = require('mongoose');

const indicadorSchema = new mongoose.Schema({
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
  asignaturaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asignatura',
    required: true
  },
  periodo: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  codigo: {
    type: String,
    trim: true
  },
  descripcion: {
    type: String,
    required: true,
    trim: true
  },
  peso: {
    type: Number,
    default: 0
  },
  orden: {
    type: Number,
    default: 0
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo'],
    default: 'activo'
  }
}, {
  timestamps: true
});

indicadorSchema.index({ institucionId: 1, anioAcademicoId: 1, asignaturaId: 1, periodo: 1 });

module.exports = mongoose.model('Indicador', indicadorSchema);