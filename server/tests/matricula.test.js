const request = require('supertest');
const app = require('../app');
const { crearUsuario, loginYToken, crearInstitucion } = require('./helpers');

describe('Matriculas', () => {
  describe('GET /api/matriculas', () => {
    it('devuelve 401 sin token', async () => {
      const res = await request(app).get('/api/matriculas');
      expect(res.status).toBe(401);
    });

    it('devuelve 200 con token de rector', async () => {
      const institucion = await crearInstitucion();
      const rector = await crearUsuario({ tipoPerfil: 'rector', institucionId: institucion._id });
      const token = await loginYToken(rector);

      const res = await request(app)
        .get('/api/matriculas')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('bloquea crear a un estudiante', async () => {
      const institucion = await crearInstitucion();
      const estudiante = await crearUsuario({ tipoPerfil: 'estudiante', institucionId: institucion._id });
      const token = await loginYToken(estudiante);

      const res = await request(app)
        .post('/api/matriculas')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(403);
    });
  });
});
