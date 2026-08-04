const request = require('supertest');
const app = require('../app');
const { crearUsuario } = require('./helpers');

describe('Auth', () => {
  describe('POST /api/auth/login', () => {
    it('devuelve token con credenciales validas', async () => {
      const usuario = await crearUsuario();

      const res = await request(app)
        .post('/api/auth/login')
        .send({ usuario: usuario.credenciales.usuario, password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.token).toBeTruthy();
      expect(res.body.data.usuario).toHaveProperty('tipoPerfil');
    });

    it('rechaza password incorrecta', async () => {
      const usuario = await crearUsuario();

      const res = await request(app)
        .post('/api/auth/login')
        .send({ usuario: usuario.credenciales.usuario, password: 'incorrecta' });

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    });

    it('rechaza usuario inexistente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ usuario: 'noexiste', password: 'password123' });

      expect(res.status).toBe(401);
    });

    it('requiere usuario y password', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('devuelve 401 sin token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('devuelve el usuario con token valido', async () => {
      const usuario = await crearUsuario();

      const login = await request(app)
        .post('/api/auth/login')
        .send({ usuario: usuario.credenciales.usuario, password: 'password123' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${login.body.data.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.credenciales.passwordHash).toBeUndefined();
    });
  });
});
