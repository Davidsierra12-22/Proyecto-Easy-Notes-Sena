const request = require('supertest');
const app = require('../app');
const AnioAcademico = require('../src/models/AnioAcademico');
const { crearUsuario, loginYToken, crearInstitucion } = require('./helpers');

describe('Modulo Academico', () => {
  describe('AnioAcademico', () => {
    it('devuelve 401 sin token (ruta protegida)', async () => {
      const res = await request(app).get('/api/anios-academicos');
      expect(res.status).toBe(401);
    });

    it('crea un anio academico y lo activa', async () => {
      const institucion = await crearInstitucion();
      const admin = await crearUsuario({ tipoPerfil: 'admin', institucionId: institucion._id });
      const token = await loginYToken(admin);

      const res = await request(app)
        .post('/api/anios-academicos')
        .set('Authorization', `Bearer ${token}`)
        .send({ anio: 2026, institucionId: institucion._id });

      expect(res.status).toBe(201);
      const id = res.body.data._id;

      const activar = await request(app)
        .put(`/api/anios-academicos/${id}/activar`)
        .set('Authorization', `Bearer ${token}`);

      expect(activar.status).toBe(200);
      expect(activar.body.data.estado).toBe('activo');
    });
  });

  describe('Asignaturas', () => {
    it('crea y lista asignaturas', async () => {
      const institucion = await crearInstitucion();
      const admin = await crearUsuario({ tipoPerfil: 'admin', institucionId: institucion._id });
      const token = await loginYToken(admin);

      const res = await request(app)
        .post('/api/asignaturas')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Matematicas', institucionId: institucion._id });

      expect(res.status).toBe(201);

      const list = await request(app)
        .get('/api/asignaturas')
        .set('Authorization', `Bearer ${token}`);

      expect(list.status).toBe(200);
      expect(list.body.data.length).toBeGreaterThan(0);
    });
  });
});
