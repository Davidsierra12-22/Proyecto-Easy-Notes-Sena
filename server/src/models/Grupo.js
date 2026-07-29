const mongoose = require('mongoose');

const grupoSchema = new mongoose.Schema({
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
  sedeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sede'
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  grado: {
    type: Number,
    required: true,
    min: 0,
    max: 11
  },
  jornada: {
    type: String,
    enum: ['manana', 'tarde', 'noche', 'continua'],
    default: 'manana'
  },
  ciclo: {
    type: String,
    enum: ['normal', 'semestre1', 'semestre2'],
    default: 'normal'
  },
  nivelCodigo: {
    type: String,
    trim: true
  },
  especialidad: {
    type: String,
    enum: ['', 'tecnica', 'comercial', 'industrial', 'pedagogica', 'otra'],
    default: ''
  },
  docenteDirectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  capacidad: {
    type: Number,
    default: 35
  },
  escuelaNueva: {
    type: String,
    enum: ['SI', 'NO'],
    default: 'NO'
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo', 'cerrado'],
    default: 'activo'
  }
}, {
  timestamps: true
});

grupoSchema.index({ institucionId: 1, anioAcademicoId: 1 });
grupoSchema.index({ institucionId: 1, nombre: 1, anioAcademicoId: 1 }, { unique: true });

module.exports = mongoose.model('Grupo', grupoSchema);