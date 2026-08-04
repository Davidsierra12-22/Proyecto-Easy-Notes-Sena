const request = require('supertest');
const app = require('../app');
const Institucion = require('../src/models/Institucion');
const { crearUsuario, loginYToken, crearInstitucion } = require('./helpers');

describe('Instituciones', () => {
  describe('GET /api/instituciones', () => {
    it('devuelve 401 sin token', async () => {
      const res = await request(app).get('/api/instituciones');
      expect(res.status).toBe(401);
    });

    it('lista las instituciones con token', async () => {
      await crearInstitucion({ nombre: 'Colegio Alpha' });
      const admin = await crearUsuario({ tipoPerfil: 'admin' });
      const token = await loginYToken(admin);

      const res = await request(app)
        .get('/api/instituciones')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/instituciones', () => {
    it('crea una institucion', async () => {
      const admin = await crearUsuario({ tipoPerfil: 'admin' });
      const token = await loginYToken(admin);

      const res = await request(app)
        .post('/api/instituciones')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Colegio Nuevo', nit: '900123456' });

      expect(res.status).toBe(201);
      expect(res.body.data.nit).toBe('900123456');
      expect(res.body.data.estado).toBe('activo');
    });

    it('rechaza NIT duplicado', async () => {
      await crearInstitucion({ nit: '900111222' });
      const admin = await crearUsuario({ tipoPerfil: 'admin' });
      const token = await loginYToken(admin);

      const res = await request(app)
        .post('/api/instituciones')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Duplicado', nit: '900111222' });

      expect(res.status).toBe(400);
    });

    it('bloquea a un estudiante', async () => {
      const estudiante = await crearUsuario({ tipoPerfil: 'estudiante' });
      const token = await loginYToken(estudiante);

      const res = await request(app)
        .post('/api/instituciones')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Sin permiso', nit: '900555666' });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/instituciones/:id/configuracion', () => {
    it('devuelve la configuracion por defecto', async () => {
      const institucion = await crearInstitucion();
      const admin = await crearUsuario({ tipoPerfil: 'admin' });
      const token = await loginYToken(admin);

      const res = await request(app)
        .get(`/api/instituciones/${institucion._id}/configuracion`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notaMaxima).toBe(5);
      expect(res.body.data.numeroPeriodos).toBe(4);
    });
  });
});
