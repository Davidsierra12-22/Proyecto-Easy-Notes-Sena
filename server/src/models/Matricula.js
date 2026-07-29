const mongoose = require('mongoose');

const matriculaSchema = new mongoose.Schema({
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
  estudianteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  grupoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grupo',
    required: true
  },
  tipoMatricula: {
    type: String,
    enum: ['nueva', 'renovacion', 'traslado', 'promovido'],
    default: 'nueva'
  },
  fechaMatricula: {
    type: Date,
    default: Date.now
  },
  numeroMatricula: {
    type: String
  },
  estado: {
    type: String,
    enum: ['activa', 'retirada', 'trasladada', 'graduado'],
    default: 'activa'
  },
  promovido: {
    type: Boolean,
    default: null
  },
  observaciones: {
    type: String
  }
}, {
  timestamps: true
});

matriculaSchema.index({ institucionId: 1, anioAcademicoId: 1, estudianteId: 1 }, { unique: true });
matriculaSchema.index({ institucionId: 1, anioAcademicoId: 1, grupoId: 1 });
matriculaSchema.index({ institucionId: 1, estado: 1 });

module.exports = mongoose.model('Matricula', matriculaSchema);