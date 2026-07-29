const mongoose = require('mongoose');

const actividadSchema = new mongoose.Schema({
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
  indicadorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Indicador',
    required: true
  },
  asignaturaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asignatura',
    required: true
  },
  grupoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grupo',
    required: true
  },
  docenteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  periodo: {
    type: Number,
    required: true
  },
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  tipo: {
    type: String,
    enum: ['tarea', 'examen', 'quiz', 'proyecto', 'participacion', 'otro'],
    default: 'tarea'
  },
  porcentaje: {
    type: Number,
    default: 0
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaLimite: {
    type: Date
  },
  estado: {
    type: String,
    enum: ['activo', 'cerrado', 'eliminado'],
    default: 'activo'
  }
}, {
  timestamps: true
});

actividadSchema.index({ institucionId: 1, indicadorId: 1 });
actividadSchema.index({ institucionId: 1, grupoId: 1, asignaturaId: 1, periodo: 1 });

module.exports = mongoose.model('Actividad', actividadSchema);