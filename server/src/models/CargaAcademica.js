const mongoose = require('mongoose');

const cargaAcademicaSchema = new mongoose.Schema({
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
  grupoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grupo',
    required: true
  },
  asignaturaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asignatura',
    required: true
  },
  docenteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  horasSemanales: {
    type: Number,
    default: 4
  },
  puedeCalificar: {
    type: Boolean,
    default: true
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo'],
    default: 'activo'
  }
}, {
  timestamps: true
});

cargaAcademicaSchema.index({ institucionId: 1, anioAcademicoId: 1, grupoId: 1, asignaturaId: 1 }, { unique: true });
cargaAcademicaSchema.index({ institucionId: 1, anioAcademicoId: 1, docenteId: 1 });
cargaAcademicaSchema.index({ institucionId: 1, anioAcademicoId: 1, grupoId: 1 });

module.exports = mongoose.model('CargaAcademica', cargaAcademicaSchema);