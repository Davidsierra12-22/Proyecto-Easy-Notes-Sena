const mongoose = require('mongoose');
const CalificacionService = require('../src/services/calificacionService');
const Calificacion = require('../src/models/Calificacion');
const Indicador = require('../src/models/Indicador');
const Actividad = require('../src/models/Actividad');
const AnioAcademico = require('../src/models/AnioAcademico');
const Grupo = require('../src/models/Grupo');
const Usuario = require('../src/models/Usuario');
const Institucion = require('../src/models/Institucion');

const asignaturaId = new mongoose.Types.ObjectId();

const crearBase = async () => {
  const institucion = await Institucion.create({
    nombre: 'Colegio Test Plantilla',
    nit: `800${Math.floor(Math.random() * 999999)}`,
    direccion: 'Calle 1 #2-3',
    estado: 'activo'
  });

  const anio = await AnioAcademico.create({
    institucionId: institucion._id,
    anio: 2025,
    estado: 'activo',
    cronograma: {
      periodos: [
        { numero: 1, nombre: 'Periodo 1', estado: 'abierto' },
        { numero: 2, nombre: 'Periodo 2', estado: 'abierto' }
      ]
    },
    configuracion: {
      notaMinima: 3.0,
      notaMaxima: 5.0,
      numeroPeriodos: 2,
      numPerdidas: 3
    }
  });

  const estudiante = await Usuario.create({
    tipoDocumento: 'CC',
    documento: `3${Math.floor(Math.random() * 999999999)}`,
    nombres: 'Estudiante',
    apellidos: 'Plantilla',
    tipoPerfil: 'estudiante',
    institucionId: institucion._id,
    credenciales: {
      usuario: `estp${Math.floor(Math.random() * 999999)}`,
      passwordHash: await Usuario.hashPassword('password123')
    }
  });

  const docente = await Usuario.create({
    tipoDocumento: 'CC',
    documento: `3${Math.floor(Math.random() * 999999999)}`,
    nombres: 'Docente',
    apellidos: 'Plantilla',
    tipoPerfil: 'docente',
    institucionId: institucion._id,
    credenciales: {
      usuario: `docp${Math.floor(Math.random() * 999999)}`,
      passwordHash: await Usuario.hashPassword('password123')
    }
  });

  const grupo = await Grupo.create({
    institucionId: institucion._id,
    anioAcademicoId: anio._id,
    nombre: '11-A',
    grado: 11,
    jornada: 'manana'
  });

  return { institucion, anio, estudiante, docente, grupo };
};

const crearIndicador = async ({ institucion, anio, asignaturaId, periodo = 1, peso = 100 }) => {
  return Indicador.create({
    institucionId: institucion._id,
    anioAcademicoId: anio._id,
    asignaturaId,
    periodo,
    descripcion: 'Actividades',
    peso,
    orden: 0,
    estado: 'activo'
  });
};

const crearActividades = async ({ institucion, anio, grupo, docente, indicador, lista }) => {
  const creadas = [];
  for (const act of lista) {
    creadas.push(await Actividad.create({
      institucionId: institucion._id,
      anioAcademicoId: anio._id,
      indicadorId: indicador._id,
      asignaturaId,
      grupoId: grupo._id,
      docenteId: docente._id,
      periodo: act.periodo ?? 1,
      titulo: act.titulo,
      tipo: act.tipo || 'tarea',
      porcentaje: act.porcentaje,
      estado: 'activo'
    }));
  }
  return creadas;
};

describe('Plantilla de calificaciones (RN-CAL-POND)', () => {
  describe('calcularNotaPeriodo con porcentajes', () => {
    it('calcula promedio ponderado por porcentaje de las actividades', async () => {
      const { institucion, anio, estudiante, grupo, docente } = await crearBase();
      const indicador = await crearIndicador({ institucion, anio, asignaturaId });
      const [taller, quiz, examen] = await crearActividades({
        institucion, anio, grupo, docente, indicador,
        lista: [
          { titulo: 'Taller', porcentaje: 30 },
          { titulo: 'Quiz', porcentaje: 30 },
          { titulo: 'Examen', porcentaje: 40 }
        ]
      });

      await Calificacion.create({
        institucionId: institucion._id,
        anioAcademicoId: anio._id,
        estudianteId: estudiante._id,
        asignaturaId,
        grupoId: grupo._id,
        periodo: 1,
        docenteId: docente._id,
        actividades: [
          { actividadId: taller._id, nota: 4.0 },
          { actividadId: quiz._id, nota: 5.0 },
          { actividadId: examen._id, nota: 3.0 }
        ]
      });

      const resultado = await CalificacionService.calcularNotaPeriodo({
        estudianteId: estudiante._id,
        asignaturaId,
        grupoId: grupo._id,
        anioAcademicoId: anio._id,
        periodo: 1,
        institucionId: institucion._id
      });

      // 4.0*0.30 + 5.0*0.30 + 3.0*0.40 = 1.2 + 1.5 + 1.2 = 3.9
      expect(resultado.notaFinal).toBe(3.9);
      expect(resultado.indicadores[0].nota).toBe(3.9);
      const cal = await Calificacion.findOne({ estudianteId: estudiante._id });
      expect(cal.nota).toBe(3.9);
    });

    it('usa promedio aritmético si las actividades no tienen porcentaje', async () => {
      const { institucion, anio, estudiante, grupo, docente } = await crearBase();
      const indicador = await crearIndicador({ institucion, anio, asignaturaId });
      const [a1, a2] = await crearActividades({
        institucion, anio, grupo, docente, indicador,
        lista: [
          { titulo: 'A1', porcentaje: 0 },
          { titulo: 'A2', porcentaje: 0 }
        ]
      });

      await Calificacion.create({
        institucionId: institucion._id,
        anioAcademicoId: anio._id,
        estudianteId: estudiante._id,
        asignaturaId,
        grupoId: grupo._id,
        periodo: 1,
        docenteId: docente._id,
        actividades: [
          { actividadId: a1._id, nota: 4.0 },
          { actividadId: a2._id, nota: 2.0 }
        ]
      });

      const resultado = await CalificacionService.calcularNotaPeriodo({
        estudianteId: estudiante._id,
        asignaturaId,
        grupoId: grupo._id,
        anioAcademicoId: anio._id,
        periodo: 1,
        institucionId: institucion._id
      });

      expect(resultado.notaFinal).toBe(3.0);
    });

    it('no pondera las actividades de otros indicadores del mismo período', async () => {
      const { institucion, anio, estudiante, grupo, docente } = await crearBase();
      const indicadorA = await crearIndicador({ institucion, anio, asignaturaId, peso: 70 });
      const indicadorB = await Indicador.create({
        institucionId: institucion._id,
        anioAcademicoId: anio._id,
        asignaturaId,
        periodo: 1,
        descripcion: 'Saberes',
        peso: 30,
        orden: 1,
        estado: 'activo'
      });

      const [actA] = await crearActividades({
        institucion, anio, grupo, docente, indicador: indicadorA,
        lista: [{ titulo: 'Act A', porcentaje: 100 }]
      });
      const [actB] = await crearActividades({
        institucion, anio, grupo, docente, indicador: indicadorB,
        lista: [{ titulo: 'Act B', porcentaje: 100 }]
      });

      await Calificacion.create({
        institucionId: institucion._id,
        anioAcademicoId: anio._id,
        estudianteId: estudiante._id,
        asignaturaId,
        grupoId: grupo._id,
        periodo: 1,
        docenteId: docente._id,
        actividades: [
          { actividadId: actA._id, nota: 4.0 },
          { actividadId: actB._id, nota: 1.0 }
        ]
      });

      const resultado = await CalificacionService.calcularNotaPeriodo({
        estudianteId: estudiante._id,
        asignaturaId,
        grupoId: grupo._id,
        anioAcademicoId: anio._id,
        periodo: 1,
        institucionId: institucion._id
      });

      // Act A = 4.0 (en indicadorA, no pondera B), Act B = 1.0 (en indicadorB)
      // nota = (4.0*70 + 1.0*30) / 100 = 2.8 + 0.3 = 3.1
      expect(resultado.indicadores.find(i => i.descripcion === 'Actividades').nota).toBe(4.0);
      expect(resultado.indicadores.find(i => i.descripcion === 'Saberes').nota).toBe(1.0);
      expect(resultado.notaFinal).toBe(3.1);
    });

    it('recalcula el indicador aunque exista una nota de indicador guardada desactualizada', async () => {
      const { institucion, anio, estudiante, grupo, docente } = await crearBase();
      const indicador = await crearIndicador({ institucion, anio, asignaturaId });
      const [a1, a2] = await crearActividades({
        institucion, anio, grupo, docente, indicador,
        lista: [
          { titulo: 'Taller', porcentaje: 30 },
          { titulo: 'Examen', porcentaje: 70 }
        ]
      });

      // Se guardó antes con una nota de indicador vieja (2.0)
      const cal = await Calificacion.create({
        institucionId: institucion._id,
        anioAcademicoId: anio._id,
        estudianteId: estudiante._id,
        asignaturaId,
        grupoId: grupo._id,
        periodo: 1,
        docenteId: docente._id,
        nota: 2.0,
        indicadores: [{ indicadorId: indicador._id, nota: 2.0 }]
      });

      // Ahora se recalcula con actividades nuevas
      cal.indicadores = [];
      cal.actividades = [
        { actividadId: a1._id, nota: 4.0 },
        { actividadId: a2._id, nota: 2.0 }
      ];
      await cal.save();

      const resultado = await CalificacionService.calcularNotaPeriodo({
        estudianteId: estudiante._id,
        asignaturaId,
        grupoId: grupo._id,
        anioAcademicoId: anio._id,
        periodo: 1,
        institucionId: institucion._id
      });

      // 0.3*4.0 + 0.7*2.0 = 1.2 + 1.4 = 2.6
      expect(resultado.notaFinal).toBe(2.6);
      expect(resultado.indicadores[0].nota).toBe(2.6);
    });
  });

  describe('crear indicador "Actividades" automático', () => {
    it('no duplica el indicador al lanzar una actividad en la misma asignatura/período', async () => {
      const { institucion, anio, grupo, docente } = await crearBase();
      const ind1 = await crearIndicador({ institucion, anio, asignaturaId });
      const ind2 = await Indicador.findOne({
        institucionId: institucion._id,
        anioAcademicoId: anio._id,
        asignaturaId,
        periodo: 1,
        descripcion: 'Actividades'
      });
      expect(ind2._id.toString()).toBe(ind1._id.toString());
    });

    it('el service solo considera indicadores de la misma asignatura y período para ponderar', async () => {
      const { institucion, anio, estudiante, grupo, docente } = await crearBase();
      const indicadorA = await crearIndicador({ institucion, anio, asignaturaId, peso: 100 });
      const [act] = await crearActividades({
        institucion, anio, grupo, docente, indicador: indicadorA,
        lista: [{ titulo: 'Taller', porcentaje: 100 }]
      });

      await Calificacion.create({
        institucionId: institucion._id,
        anioAcademicoId: anio._id,
        estudianteId: estudiante._id,
        asignaturaId,
        grupoId: grupo._id,
        periodo: 1,
        docenteId: docente._id,
        actividades: [{ actividadId: act._id, nota: 4.5 }]
      });

      const resultado = await CalificacionService.calcularNotaPeriodo({
        estudianteId: estudiante._id,
        asignaturaId,
        grupoId: grupo._id,
        anioAcademicoId: anio._id,
        periodo: 1,
        institucionId: institucion._id
      });
      expect(resultado.notaFinal).toBe(4.5);
    });
  });
});