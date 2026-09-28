const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const AnioAcademico = require('../src/models/AnioAcademico');
const Grupo = require('../src/models/Grupo');
const Matricula = require('../src/models/Matricula');
const Calificacion = require('../src/models/Calificacion');
const { crearUsuario, loginYToken, crearInstitucion } = require('./helpers');

describe('Informacion (primeros puestos)', () => {
  const crearBase = async () => {
    const institucion = await crearInstitucion();
    const admin = await crearUsuario({ tipoPerfil: 'admin', institucionId: institucion._id });
    const token = await loginYToken(admin);

    const anio = await AnioAcademico.create({
      institucionId: institucion._id,
      anio: 2026,
      estado: 'activo'
    });

    const grupo = await Grupo.create({
      institucionId: institucion._id,
      anioAcademicoId: anio._id,
      nombre: '10-A',
      grado: 10,
      jornada: 'manana'
    });

    const estudiante1 = await crearUsuario({
      tipoPerfil: 'estudiante', institucionId: institucion._id, nombres: 'Ana', apellidos: 'Zuluaga'
    });
    const estudiante2 = await crearUsuario({
      tipoPerfil: 'estudiante', institucionId: institucion._id, nombres: 'Beto', apellidos: 'Alvarez'
    });

    const crearMatricula = async (estudiante) => Matricula.create({
      institucionId: institucion._id,
      anioAcademicoId: anio._id,
      estudianteId: estudiante._id,
      grupoId: grupo._id,
      estado: 'activa'
    });

    const mat1 = await crearMatricula(estudiante1);
    const mat2 = await crearMatricula(estudiante2);

    const crearCal = async (estudiante, nota) => Calificacion.create({
      institucionId: institucion._id,
      anioAcademicoId: anio._id,
      estudianteId: estudiante._id,
      asignaturaId: new mongoose.Types.ObjectId(),
      grupoId: grupo._id,
      periodo: 1,
      nota,
      estado: 'activo'
    });

    await crearCal(estudiante1, 4.8);
    await crearCal(estudiante2, 3.5);

    return { institucion, admin, token, anio, grupo, mat1, mat2, estudiante1, estudiante2 };
  };

  it('devuelve 401 sin token', async () => {
    const { anio } = await crearBase();
    const res = await request(app).get(`/api/informacion?anioAcademicoId=${anio._id}&periodo=1&topN=3`);
    expect(res.status).toBe(401);
  });

  it('devuelve el ranking por curso ordenado por promedio', async () => {
    const { token, anio, grupo, estudiante1, estudiante2 } = await crearBase();
    const res = await request(app)
      .get(`/api/informacion?anioAcademicoId=${anio._id}&periodo=1&topN=3`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const [grado] = res.body.data;
    expect(grado.gradoNumero).toBe(10);
    expect(grado.grupos).toHaveLength(1);
    const curso = grado.grupos[0];
    expect(curso.grupoNombre).toBe(grupo.nombre);
    expect(curso.estudiantes).toHaveLength(2);
    // Ana (4.8) primero, Beto (3.5) segundo
    expect(curso.estudiantes[0].estudianteId).toBe(estudiante1._id.toString());
    expect(curso.estudiantes[0].puesto).toBe(1);
    expect(curso.estudiantes[0].promedio).toBe(4.8);
    expect(curso.estudiantes[1].estudianteId).toBe(estudiante2._id.toString());
    expect(curso.estudiantes[1].puesto).toBe(2);
  });

  it('respeta topN recortando la lista', async () => {
    const { token, anio } = await crearBase();
    const res = await request(app)
      .get(`/api/informacion?anioAcademicoId=${anio._id}&periodo=1&topN=1`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const [grado] = res.body.data;
    expect(grado.grupos[0].estudiantes).toHaveLength(1);
    expect(grado.grupos[0].estudiantes[0].puesto).toBe(1);
  });

  it('rechaza un período inválido', async () => {
    const { token, anio } = await crearBase();
    const res = await request(app)
      .get(`/api/informacion?anioAcademicoId=${anio._id}&periodo=9`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});