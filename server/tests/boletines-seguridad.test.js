const request = require('supertest');
const app = require('../app');
const Usuario = require('../src/models/Usuario');
const Institucion = require('../src/models/Institucion');
const AnioAcademico = require('../src/models/AnioAcademico');
const { loginYToken } = require('./helpers');

const crearInstitucion = async () => {
  return Institucion.create({
    nombre: 'Colegio Seguridad',
    nit: `900${Math.floor(Math.random() * 999999)}`,
    direccion: 'Calle 1 #2-3',
    estado: 'activo'
  });
};

const crearAdmin = async (institucionId) => {
  return Usuario.create({
    tipoDocumento: 'CC',
    documento: `1${Math.floor(Math.random() * 89999999) + 10000000}`,
    nombres: 'Admin',
    apellidos: 'Test',
    tipoPerfil: 'admin',
    institucionId,
    credenciales: {
      usuario: `admin${Math.floor(Math.random() * 99999)}`,
      passwordHash: await Usuario.hashPassword('password123')
    }
  });
};

const crearEstudiante = async (institucionId, acudienteId = null) => {
  const acudientes = acudienteId ? [{ acudienteId }] : [];
  return Usuario.create({
    tipoDocumento: 'CC',
    documento: `8${Math.floor(Math.random() * 89999999) + 10000000}`,
    nombres: 'Estudiante',
    apellidos: 'Test',
    tipoPerfil: 'estudiante',
    institucionId,
    acudientes,
    credenciales: {
      usuario: `est${Math.floor(Math.random() * 99999)}`,
      passwordHash: await Usuario.hashPassword('password123')
    }
  });
};

const crearAcudiente = async () => {
  return Usuario.create({
    tipoDocumento: 'CC',
    documento: `9${Math.floor(Math.random() * 89999999) + 10000000}`,
    nombres: 'Acudiente',
    apellidos: 'Test',
    tipoPerfil: 'acudiente',
    credenciales: {
      usuario: `acu${Math.floor(Math.random() * 99999)}`,
      passwordHash: await Usuario.hashPassword('password123')
    }
  });
};

describe('Seguridad de reportes (boletines)', () => {
  describe('Validaciones de entrada', () => {
    it('devuelve 401 sin token', async () => {
      const res = await request(app).get('/api/boletines/acumulativo/abc/anio/def');
      expect(res.status).toBe(401);
    });

    it('devuelve 400 si estudianteId no es ObjectId', async () => {
      const inst = await crearInstitucion();
      const admin = await crearAdmin(inst._id);
      const token = await loginYToken(admin);
      const res = await request(app)
        .get('/api/boletines/acumulativo/no-valido/anio/6a9ee7e37861ba204743c56c')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it('devuelve 400 si anioAcademicoId no es ObjectId', async () => {
      const inst = await crearInstitucion();
      const admin = await crearAdmin(inst._id);
      const token = await loginYToken(admin);
      const res = await request(app)
        .get('/api/boletines/acumulativo/6a9ee7e37861ba204743c56c/anio/xyz')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it('devuelve 400 si periodo está fuera de rango', async () => {
      const inst = await crearInstitucion();
      const admin = await crearAdmin(inst._id);
      const token = await loginYToken(admin);
      const res = await request(app)
        .get('/api/boletines/corto/6a9ee7e37861ba204743c56c/anio/6a9ee7e37861ba204743c56c/periodo/9')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  describe('Roles institucionales', () => {
    let instA, instB, adminA, adminB, tokenA, tokenB, anio;
    beforeEach(async () => {
      instA = await crearInstitucion();
      instB = await crearInstitucion();
      adminA = await crearAdmin(instA._id);
      adminB = await crearAdmin(instB._id);
      tokenA = await loginYToken(adminA);
      tokenB = await loginYToken(adminB);
      anio = await AnioAcademico.create({ institucionId: instA._id, anio: 2026, estado: 'activo' });
    });

    it('admin del mismo colegio puede generar boletín (200)', async () => {
      const est = await crearEstudiante(instA._id);
      const res = await request(app)
        .get(`/api/boletines/acumulativo/${est._id}/anio/${anio._id}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(200);
    });

    it('admin de otro colegio NO puede generar boletín (403)', async () => {
      const est = await crearEstudiante(instA._id);
      const res = await request(app)
        .get(`/api/boletines/acumulativo/${est._id}/anio/${anio._id}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(403);
    });

    it('devuelve 404 si el estudiante no existe', async () => {
      const res = await request(app)
        .get(`/api/boletines/acumulativo/${anio._id}/anio/${anio._id}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(404);
    });
  });

  describe('Super administrador', () => {
    it('no tiene ámbito institucional -> 403', async () => {
      const inst = await crearInstitucion();
      const admin = await crearAdmin(inst._id);
      const est = await crearEstudiante(inst._id);
      const sa = await Usuario.create({
        tipoDocumento: 'CC',
        documento: `99${Math.floor(Math.random() * 999999)}`,
        nombres: 'Super',
        apellidos: 'Admin',
        tipoPerfil: 'super_admin',
        credenciales: {
          usuario: `sa${Math.floor(Math.random() * 99999)}`,
          passwordHash: await Usuario.hashPassword('password123')
        }
      });
      const token = await loginYToken(sa);
      const anio = await AnioAcademico.create({ institucionId: inst._id, anio: 2026, estado: 'activo' });
      const res = await request(app)
        .get(`/api/boletines/acumulativo/${est._id}/anio/${anio._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Estudiante (solo su propio boletín)', () => {
    it('puede generar su propio boletín (200)', async () => {
      const inst = await crearInstitucion();
      const est = await crearEstudiante(inst._id);
      const token = await loginYToken(est);
      const anio = await AnioAcademico.create({ institucionId: inst._id, anio: 2026, estado: 'activo' });
      const res = await request(app)
        .get(`/api/boletines/acumulativo/${est._id}/anio/${anio._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.estudianteId).toBe(est._id.toString());
    });

    it('si pide el boletín de otro estudiante, se fuerza el suyo (200 con su id)', async () => {
      const inst = await crearInstitucion();
      const est = await crearEstudiante(inst._id);
      const otro = await crearEstudiante(inst._id);
      const token = await loginYToken(est);
      const anio = await AnioAcademico.create({ institucionId: inst._id, anio: 2026, estado: 'activo' });
      const res = await request(app)
        .get(`/api/boletines/acumulativo/${otro._id}/anio/${anio._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.estudianteId).toBe(est._id.toString());
    });
  });

  describe('Acudiente (solo representados)', () => {
    it('puede generar boletín de su representado (200)', async () => {
      const inst = await crearInstitucion();
      const acu = await crearAcudiente();
      const est = await crearEstudiante(inst._id, acu._id);
      const token = await loginYToken(acu);
      const anio = await AnioAcademico.create({ institucionId: inst._id, anio: 2026, estado: 'activo' });
      const res = await request(app)
        .get(`/api/boletines/acumulativo/${est._id}/anio/${anio._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('NO puede generar boletín de un estudiante que no le corresponde (403)', async () => {
      const inst = await crearInstitucion();
      const acu = await crearAcudiente();
      const ajeno = await crearEstudiante(inst._id);
      const token = await loginYToken(acu);
      const anio = await AnioAcademico.create({ institucionId: inst._id, anio: 2026, estado: 'activo' });
      const res = await request(app)
        .get(`/api/boletines/acumulativo/${ajeno._id}/anio/${anio._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Endpoint /calificaciones/estudiante (usado por la UI)', () => {
    it('acudiente NO puede ver calificaciones de un estudiante ajeno (403)', async () => {
      const inst = await crearInstitucion();
      const acu = await crearAcudiente();
      const ajeno = await crearEstudiante(inst._id);
      const token = await loginYToken(acu);
      const anio = await AnioAcademico.create({ institucionId: inst._id, anio: 2026, estado: 'activo' });
      const res = await request(app)
        .get(`/api/calificaciones/estudiante/${ajeno._id}/anio/${anio._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });
});