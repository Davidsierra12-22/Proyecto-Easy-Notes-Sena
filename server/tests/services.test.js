const mongoose = require('mongoose');
const CalificacionService = require('../src/services/calificacionService');
const PromocionService = require('../src/services/promocionService');
const ReporteService = require('../src/services/reporteService');
const Calificacion = require('../src/models/Calificacion');
const AnioAcademico = require('../src/models/AnioAcademico');
const Grupo = require('../src/models/Grupo');
const Usuario = require('../src/models/Usuario');
const Institucion = require('../src/models/Institucion');

const asignaturaId = new mongoose.Types.ObjectId();

const crearBase = async () => {
  const institucion = await Institucion.create({
    nombre: 'Colegio Test Services',
    nit: `900${Math.floor(Math.random() * 999999)}`,
    direccion: 'Calle 1 #2-3',
    estado: 'activo'
  });

  const anio = await AnioAcademico.create({
    institucionId: institucion._id,
    anio: 2025,
    estado: 'activo',
    cronograma: {
      periodos: [
        { numero: 1, nombre: 'Periodo 1', estado: 'cerrado' },
        { numero: 2, nombre: 'Periodo 2', estado: 'abierto' },
        { numero: 3, nombre: 'Periodo 3', estado: 'abierto' },
        { numero: 4, nombre: 'Periodo 4', estado: 'abierto' }
      ]
    },
    configuracion: {
      notaMinima: 3.0,
      notaMaxima: 5.0,
      numeroPeriodos: 4,
      numPerdidas: 3
    }
  });

  const estudiante = await Usuario.create({
    tipoDocumento: 'CC',
    documento: `1${Math.floor(Math.random() * 999999999)}`,
    nombres: 'Estudiante',
    apellidos: 'Prueba',
    tipoPerfil: 'estudiante',
    institucionId: institucion._id,
    credenciales: {
      usuario: `est${Math.floor(Math.random() * 999999)}`,
      passwordHash: await Usuario.hashPassword('password123')
    }
  });

  const docente = await Usuario.create({
    tipoDocumento: 'CC',
    documento: `1${Math.floor(Math.random() * 999999999)}`,
    nombres: 'Docente',
    apellidos: 'Prueba',
    tipoPerfil: 'docente',
    institucionId: institucion._id,
    credenciales: {
      usuario: `doc${Math.floor(Math.random() * 999999)}`,
      passwordHash: await Usuario.hashPassword('password123')
    }
  });

  const grupo = await Grupo.create({
    institucionId: institucion._id,
    anioAcademicoId: anio._id,
    nombre: '10-A',
    grado: 10,
    jornada: 'manana'
  });

  return { institucion, anio, estudiante, docente, grupo };
};

describe('CalificacionService', () => {
  describe('generarLogro', () => {
    it('retorna Desempeño Superior para nota >= 4.6', () => {
      expect(CalificacionService.generarLogro(4.8)).toBe('Desempeño Superior');
      expect(CalificacionService.generarLogro(5.0)).toBe('Desempeño Superior');
    });

    it('retorna Desempeño Alto para nota 4.0-4.5', () => {
      expect(CalificacionService.generarLogro(4.0)).toBe('Desempeño Alto');
      expect(CalificacionService.generarLogro(4.5)).toBe('Desempeño Alto');
    });

    it('retorna Desempeño Básico para nota 3.0-3.9', () => {
      expect(CalificacionService.generarLogro(3.0)).toBe('Desempeño Básico');
      expect(CalificacionService.generarLogro(3.5)).toBe('Desempeño Básico');
    });

    it('retorna Desempeño Bajo para nota < 3.0', () => {
      expect(CalificacionService.generarLogro(1.0)).toBe('Desempeño Bajo');
      expect(CalificacionService.generarLogro(2.9)).toBe('Desempeño Bajo');
    });
  });

  describe('calcularNotaPeriodo', () => {
    it('retorna 0 si no hay indicadores', async () => {
      const { institucion, anio, estudiante, grupo } = await crearBase();
      const resultado = await CalificacionService.calcularNotaPeriodo({
        estudianteId: estudiante._id,
        asignaturaId,
        grupoId: grupo._id,
        anioAcademicoId: anio._id,
        periodo: 1,
        institucionId: institucion._id
      });
      expect(resultado.notaFinal).toBe(0);
      expect(resultado.indicadores).toEqual([]);
    });
  });

  describe('aplicarRecuperacion', () => {
    it('rechaza si la nota es >= 3.0', async () => {
      const { institucion, anio, estudiante, grupo, docente } = await crearBase();
      const cal = await Calificacion.create({
        institucionId: institucion._id,
        anioAcademicoId: anio._id,
        estudianteId: estudiante._id,
        asignaturaId,
        grupoId: grupo._id,
        periodo: 1,
        nota: 4.0,
        docenteId: docente._id
      });

      await expect(
        CalificacionService.aplicarRecuperacion({
          calificacionId: cal._id,
          notaRecuperacion: 3.5,
          institucionId: institucion._id
        })
      ).rejects.toThrow('solo aplica para estudiantes reprobados');
    });

    it('aplica recuperación si nota < 3.0', async () => {
      const { institucion, anio, estudiante, grupo, docente } = await crearBase();
      const cal = await Calificacion.create({
        institucionId: institucion._id,
        anioAcademicoId: anio._id,
        estudianteId: estudiante._id,
        asignaturaId,
        grupoId: grupo._id,
        periodo: 2,
        nota: 2.0,
        docenteId: docente._id
      });

      const resultado = await CalificacionService.aplicarRecuperacion({
        calificacionId: cal._id,
        notaRecuperacion: 2.8,
        institucionId: institucion._id
      });

      expect(resultado.notaFinal).toBe(2.8);
      expect(resultado.estado).toBe('recuperado');
    });

    it('limita recuperación a máximo 3.0', async () => {
      const { institucion, anio, estudiante, grupo, docente } = await crearBase();
      const cal = await Calificacion.create({
        institucionId: institucion._id,
        anioAcademicoId: anio._id,
        estudianteId: estudiante._id,
        asignaturaId,
        grupoId: grupo._id,
        periodo: 3,
        nota: 2.5,
        docenteId: docente._id
      });

      const resultado = await CalificacionService.aplicarRecuperacion({
        calificacionId: cal._id,
        notaRecuperacion: 4.5,
        institucionId: institucion._id
      });

      expect(resultado.notaFinal).toBe(3.0);
    });
  });

  describe('aplicarHabilitacion', () => {
    it('rechaza si nota no está entre 2.0 y 2.9', async () => {
      const { institucion, anio, estudiante, grupo, docente } = await crearBase();
      const cal = await Calificacion.create({
        institucionId: institucion._id,
        anioAcademicoId: anio._id,
        estudianteId: estudiante._id,
        asignaturaId,
        grupoId: grupo._id,
        periodo: 4,
        nota: 1.5,
        docenteId: docente._id
      });

      await expect(
        CalificacionService.aplicarHabilitacion({
          calificacionId: cal._id,
          notaHabilitacion: 3.5,
          institucionId: institucion._id
        })
      ).rejects.toThrow('solo aplica para notas entre 2.0 y 2.9');
    });

    it('aplica habilitación si nota entre 2.0 y 2.9', async () => {
      const { institucion, anio, estudiante, grupo, docente } = await crearBase();
      const cal = await Calificacion.create({
        institucionId: institucion._id,
        anioAcademicoId: anio._id,
        estudianteId: estudiante._id,
        asignaturaId,
        grupoId: grupo._id,
        periodo: 4,
        nota: 2.5,
        docenteId: docente._id
      });

      const resultado = await CalificacionService.aplicarHabilitacion({
        calificacionId: cal._id,
        notaHabilitacion: 3.0,
        institucionId: institucion._id
      });

      expect(resultado.notaFinal).toBe(3.0);
      expect(resultado.estado).toBe('habilitado');
    });
  });
});

describe('PromocionService', () => {
  describe('evaluarPromocion', () => {
    it('evalúa correctamente la promoción', async () => {
      const { institucion, anio, estudiante, grupo, docente } = await crearBase();
      await Calificacion.create({
        institucionId: institucion._id,
        anioAcademicoId: anio._id,
        estudianteId: estudiante._id,
        asignaturaId,
        grupoId: grupo._id,
        periodo: 1,
        nota: 4.0,
        estado: 'cerrado',
        docenteId: docente._id
      });

      const resultado = await PromocionService.evaluarPromocion({
        estudianteId: estudiante._id,
        grupoId: grupo._id,
        anioAcademicoId: anio._id,
        institucionId: institucion._id
      });

      expect(resultado).toHaveProperty('promovido');
      expect(resultado).toHaveProperty('areasPerdidas');
      expect(resultado).toHaveProperty('umbral');
    });
  });

  describe('asignarGrupoRepitente', () => {
    it('lanza error si no hay grupo del mismo grado', async () => {
      const { institucion, anio, estudiante, grupo } = await crearBase();
      await expect(
        PromocionService.asignarGrupoRepitente({
          estudianteId: estudiante._id,
          grupoActualId: grupo._id,
          anioAcademicoId: anio._id,
          institucionId: institucion._id
        })
      ).rejects.toThrow('No hay grupo disponible');
    });
  });
});

describe('ReporteService', () => {
  describe('generarBoletinAcumulativo', () => {
    it('retorna estructura correcta', async () => {
      const { institucion, anio, estudiante } = await crearBase();
      const resultado = await ReporteService.generarBoletinAcumulativo({
        estudianteId: estudiante._id,
        anioAcademicoId: anio._id,
        institucionId: institucion._id
      });

      expect(resultado.tipo).toBe('acumulativo');
      expect(resultado).toHaveProperty('asignaturas');
      expect(resultado).toHaveProperty('totalAsignaturas');
    });
  });

  describe('generarBoletinCorto', () => {
    it('retorna estructura correcta', async () => {
      const { institucion, anio, estudiante } = await crearBase();
      const resultado = await ReporteService.generarBoletinCorto({
        estudianteId: estudiante._id,
        anioAcademicoId: anio._id,
        institucionId: institucion._id,
        periodo: 1
      });

      expect(resultado.tipo).toBe('corto');
      expect(resultado.periodo).toBe(1);
    });
  });

  describe('generarBoletinDescriptivo', () => {
    it('retorna estructura correcta', async () => {
      const { institucion, anio, estudiante } = await crearBase();
      const resultado = await ReporteService.generarBoletinDescriptivo({
        estudianteId: estudiante._id,
        anioAcademicoId: anio._id,
        institucionId: institucion._id,
        periodo: 1
      });

      expect(resultado.tipo).toBe('descriptivo');
      expect(resultado).toHaveProperty('asignaturas');
    });
  });

  describe('generarBoletinFinal', () => {
    it('retorna resumen con veredicto', async () => {
      const { institucion, anio, estudiante } = await crearBase();
      const resultado = await ReporteService.generarBoletinFinal({
        estudianteId: estudiante._id,
        anioAcademicoId: anio._id,
        institucionId: institucion._id
      });

      expect(resultado.tipo).toBe('final');
      expect(resultado.resumen).toHaveProperty('veredicto');
      expect(resultado.resumen).toHaveProperty('promedioGeneral');
    });
  });

  describe('generarBoletinPreescolar', () => {
    it('retorna escala cualitativa', async () => {
      const { institucion, anio, estudiante } = await crearBase();
      const resultado = await ReporteService.generarBoletinPreescolar({
        estudianteId: estudiante._id,
        anioAcademicoId: anio._id,
        institucionId: institucion._id,
        periodo: 1
      });

      expect(resultado.tipo).toBe('preescolar');
      expect(resultado.escalaCualitativa).toHaveProperty('S');
      expect(resultado.escalaCualitativa).toHaveProperty('C');
    });
  });
});
