const request = require('supertest');
const app = require('../app');
const Usuario = require('../src/models/Usuario');
const Institucion = require('../src/models/Institucion');
const DireccionNucleo = require('../src/models/DireccionNucleo');
const Sede = require('../src/models/Sede');
const Grupo = require('../src/models/Grupo');
const Matricula = require('../src/models/Matricula');
const AnioAcademico = require('../src/models/AnioAcademico');
const { loginYToken } = require('./helpers');

const numero = () => Math.floor(Math.random() * 89999999) + 10000000;

const crearSuperAdmin = async () => {
  return Usuario.create({
    tipoDocumento: 'CC',
    documento: `${numero()}`,
    nombres: 'Direccion',
    apellidos: 'Nucleo',
    tipoPerfil: 'super_admin',
    credenciales: {
      usuario: `nucleo${numero()}`,
      passwordHash: await Usuario.hashPassword('password123')
    }
  });
};

const crearColegio = async () => {
  return Institucion.create({
    nombre: 'Colegio Nucleo',
    nit: `900${Math.floor(Math.random() * 999999)}`,
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

describe('Dirección de Núcleo (super_admin)', () => {
  let sa, token;
  beforeEach(async () => {
    sa = await crearSuperAdmin();
    token = await loginYToken(sa);
  });

  describe('Gestión de núcleos', () => {
    it('crea una dirección de núcleo y la lista (CRUD)', async () => {
      const crear = await request(app)
        .post('/api/nucleos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Núcleo Oriente',
          codigo: 'NO-01',
          municipio: 'Bogotá',
          departamento: 'Cundinamarca',
          contacto: { nombre: 'Contacto', email: 'contacto@nucleo.edu', telefono: '3001234567' }
        });
      expect(crear.status).toBe(201);

      const listar = await request(app)
        .get('/api/nucleos')
        .set('Authorization', `Bearer ${token}`);
      expect(listar.status).toBe(200);
      expect(listar.body.data).toHaveLength(1);
      expect(listar.body.data[0].nombre).toBe('Núcleo Oriente');
    });
  });

  describe('Colegios del núcleo + admin inicial', () => {
    it('crea colegio y su admin inicial', async () => {
      const crear = await request(app)
        .post('/api/nucleo/instituciones')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'IES Nuevo Amanecer', nit: `900${numero() % 100000}` });

      expect(crear.status).toBe(201);
      const instId = crear.body.data._id;

      const admin = await request(app)
        .post(`/api/nucleo/instituciones/${instId}/admin`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          tipoDocumento: 'CC',
          documento: `${numero()}`,
          nombres: 'Admin Colegio',
          apellidos: 'Inicial'
        });

      expect(admin.status).toBe(201);
      expect(admin.body.data.credenciales.usuario).toBeDefined();
      expect(admin.body.data.credenciales.debeCambiarPassword).toBe(true);

      const listado = await request(app)
        .get('/api/nucleo/instituciones')
        .set('Authorization', `Bearer ${token}`);
      expect(listado.status).toBe(200);
      expect(listado.body.data).toHaveLength(1);
    });

    it('rechaza NIT duplicado', async () => {
      const nit = `900${numero() % 100000}`;
      await request(app)
        .post('/api/nucleo/instituciones')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Colegio A', nit });

      const res = await request(app)
        .post('/api/nucleo/instituciones')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Colegio B', nit });
      expect(res.status).toBe(400);
    });
  });

  describe('Estadísticas y comparativo', () => {
    it('agrega KPIs de todos los colegios', async () => {
      const colegio = await crearColegio();
      const nucleo = await DireccionNucleo.create({ nombre: 'Núcleo Central', municipio: 'Medellín' });
      colegio.nucleoId = nucleo._id;
      await colegio.save();

      await Sede.create({ institucionId: colegio._id, nombre: 'Sede Principal' });
      await crearUsuario('estudiante', colegio._id);
      await crearUsuario('estudiante', colegio._id);
      await crearUsuario('docente', colegio._id);
      const anio = await AnioAcademico.create({ institucionId: colegio._id, anio: 2026, estado: 'activo' });
      const grupo = await Grupo.create({
        institucionId: colegio._id,
        anioAcademicoId: anio._id,
        nombre: '6-1',
        grado: 6
      });
      const est = await crearUsuario('estudiante', colegio._id);
      await Matricula.create({
        institucionId: colegio._id,
        anioAcademicoId: anio._id,
        estudianteId: est._id,
        grupoId: grupo._id,
        estado: 'activa'
      });

      const res = await request(app)
        .get('/api/nucleo/estadisticas')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.colegios).toBe(1);
      expect(res.body.data.sedes).toBe(1);
      expect(res.body.data.grupos).toBe(1);
      expect(res.body.data.estudiantes).toBe(3);
      expect(res.body.data.docentes).toBe(1);
      expect(res.body.data.matriculasActivas).toBe(1);
    });

    it('genera el comparativo entre colegios', async () => {
      await crearColegio();
      await crearColegio();
      const res = await request(app)
        .get('/api/nucleo/comparativo')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('Restricción de acceso a datos operativos', () => {
    const rutasBloqueadas = [
      '/api/usuarios',
      '/api/sedes',
      '/api/areas',
      '/api/asignaturas',
      '/api/grupos',
      '/api/matriculas',
      '/api/calificaciones',
      '/api/pagos',
      '/api/anios-academicos',
      '/api/comunicados',
      '/api/bitacora',
      '/api/carga-academica',
      '/api/catalogos'
    ];

    it.each(rutasBloqueadas)('bloquea a la dirección de núcleo en %s (403)', async (ruta) => {
      const res = await request(app)
        .get(ruta)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('sí puede listar instituciones (gestión de colegios del núcleo)', async () => {
      const res = await request(app)
        .get('/api/instituciones')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('responde 401 sin token', async () => {
      const res = await request(app).get('/api/nucleo/estadisticas');
      expect(res.status).toBe(401);
    });

    it('un admin de colegio conserva acceso a su institución (200)', async () => {
      const colegio = await crearColegio();
      const admin = await crearUsuario('admin', colegio._id);
      const tokenAdmin = await loginYToken(admin);
      const res = await request(app)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(200);
    });
  });
});