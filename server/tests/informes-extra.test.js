const request = require('supertest');
const app = require('../app');
const Usuario = require('../src/models/Usuario');
const Institucion = require('../src/models/Institucion');
const AnioAcademico = require('../src/models/AnioAcademico');
const { loginYToken } = require('./helpers');
const { PERMISOS } = require('../src/config/constants');

const numero = () => Math.floor(Math.random() * 89999999) + 10000000;

const crearInstitucion = async (dane, icfes) => {
  return Institucion.create({
    nombre: 'Colegio Doc',
    nit: `900${Math.floor(Math.random() * 999999)}`,
    direccion: 'Calle 1 #2-3',
    dane,
    icfes,
    estado: 'activo'
  });
};

const crearUsuario = async (tipoPerfil, institucionId = null) => {
  return Usuario.create({
    tipoDocumento: 'CC',
    documento: `${numero()}`,
    nombres: 'Usuario',
    apellidos: 'Test',
    tipoPerfil,
    institucionId,
    credenciales: {
      usuario: `usr${numero()}`,
      passwordHash: await Usuario.hashPassword('password123')
    }
  });
};

describe('Certificados de estudio', () => {
  it('devuelve 401 sin token', async () => {
    const res = await request(app).get('/api/certificados/abc/anio/def');
    expect(res.status).toBe(401);
  });

  it('devuelve 400 si estudianteId no es ObjectId', async () => {
    const inst = await crearInstitucion();
    const admin = await crearUsuario('admin', inst._id);
    const token = await loginYToken(admin);
    const res = await request(app)
      .get('/api/certificados/xyz/anio/6a9ee7e37861ba204743c56c')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('admin del mismo colegio genera certificado (200) con datos de la institucion', async () => {
    const inst = await crearInstitucion('123456789', '987654321');
    const admin = await crearUsuario('admin', inst._id);
    const est = await crearUsuario('estudiante', inst._id);
    const token = await loginYToken(admin);
    const anio = await AnioAcademico.create({ institucionId: inst._id, anio: 2026, estado: 'activo' });
    const res = await request(app)
      .get(`/api/certificados/${est._id}/anio/${anio._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.estudiante.documento).toBe(est.documento);
    expect(res.body.data.institucion.dane).toBe('123456789');
  });

  it('admin de otro colegio NO genera certificado (403)', async () => {
    const instA = await crearInstitucion();
    const instB = await crearInstitucion();
    const adminB = await crearUsuario('admin', instB._id);
    const est = await crearUsuario('estudiante', instA._id);
    const token = await loginYToken(adminB);
    const anio = await AnioAcademico.create({ institucionId: instA._id, anio: 2026, estado: 'activo' });
    const res = await request(app)
      .get(`/api/certificados/${est._id}/anio/${anio._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('estudiante solo genera su propio certificado (se fuerza su id)', async () => {
    const inst = await crearInstitucion();
    const est = await crearUsuario('estudiante', inst._id);
    const otro = await crearUsuario('estudiante', inst._id);
    const token = await loginYToken(est);
    const anio = await AnioAcademico.create({ institucionId: inst._id, anio: 2026, estado: 'activo' });
    const res = await request(app)
      .get(`/api/certificados/${otro._id}/anio/${anio._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.estudiante.documento).toBe(est.documento);
  });
});

describe('Reporte de cartera', () => {
  it('devuelve 401 sin token', async () => {
    const res = await request(app).get('/api/pagos/cartera');
    expect(res.status).toBe(401);
  });

  it('admin con permiso financiero obtiene la cartera (200)', async () => {
    const inst = await crearInstitucion();
    const admin = await crearUsuario('admin', inst._id);
    const token = await loginYToken(admin);
    const res = await request(app)
      .get('/api/pagos/cartera')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.resumen).toBeDefined();
    expect(Array.isArray(res.body.data.estudiantes)).toBe(true);
  });

  it('docente sin permiso financiero NO accede (403)', async () => {
    const inst = await crearInstitucion();
    const docente = await crearUsuario('docente', inst._id);
    const token = await loginYToken(docente);
    const res = await request(app)
      .get('/api/pagos/cartera')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});