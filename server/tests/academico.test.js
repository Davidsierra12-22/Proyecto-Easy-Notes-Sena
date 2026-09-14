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

  describe('Apertura Temporal de Período (RN-CRO-04)', () => {
    it('reabre un período cerrado temporalmente', async () => {
      const institucion = await crearInstitucion();
      const admin = await crearUsuario({ tipoPerfil: 'admin', institucionId: institucion._id });
      const token = await loginYToken(admin);

      // Crear año con período cerrado
      const anio = await AnioAcademico.create({
        institucionId: institucion._id,
        anio: 2027,
        estado: 'activo',
        cronograma: {
          periodos: [
            { numero: 1, nombre: 'Periodo 1', estado: 'cerrado' },
            { numero: 2, nombre: 'Periodo 2', estado: 'abierto' }
          ]
        }
      });

      // Reabrir período 1 por 30 minutos
      const res = await request(app)
        .put(`/api/anios-academicos/${anio._id}/reabrir-periodo`)
        .set('Authorization', `Bearer ${token}`)
        .send({ periodo: 1, duracionMinutos: 30, motivo: 'Corrección de notas' });

      expect(res.status).toBe(200);
      expect(res.body.data.estado).toBe('abierto_temporal');
      expect(res.body.data.duracionMinutos).toBe(30);
      expect(res.body.data.motivo).toBe('Corrección de notas');
      expect(res.body.data.fechaExpiracion).toBeTruthy();
    });

    it('rechaza reabrir período que no está cerrado', async () => {
      const institucion = await crearInstitucion();
      const admin = await crearUsuario({ tipoPerfil: 'admin', institucionId: institucion._id });
      const token = await loginYToken(admin);

      const anio = await AnioAcademico.create({
        institucionId: institucion._id,
        anio: 2028,
        estado: 'activo',
        cronograma: {
          periodos: [
            { numero: 1, nombre: 'Periodo 1', estado: 'abierto' }
          ]
        }
      });

      const res = await request(app)
        .put(`/api/anios-academicos/${anio._id}/reabrir-periodo`)
        .set('Authorization', `Bearer ${token}`)
        .send({ periodo: 1, duracionMinutos: 30 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('no está cerrado');
    });

    it('rechaza duración fuera de rango', async () => {
      const institucion = await crearInstitucion();
      const admin = await crearUsuario({ tipoPerfil: 'admin', institucionId: institucion._id });
      const token = await loginYToken(admin);

      const anio = await AnioAcademico.create({
        institucionId: institucion._id,
        anio: 2029,
        estado: 'activo',
        cronograma: {
          periodos: [
            { numero: 1, nombre: 'Periodo 1', estado: 'cerrado' }
          ]
        }
      });

      const res = await request(app)
        .put(`/api/anios-academicos/${anio._id}/reabrir-periodo`)
        .set('Authorization', `Bearer ${token}`)
        .send({ periodo: 1, duracionMinutos: 3 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('entre 5 y 480');
    });

    it('docente no puede reabrir período (solo admin)', async () => {
      const institucion = await crearInstitucion();
      const docente = await crearUsuario({ tipoPerfil: 'docente', institucionId: institucion._id });
      const token = await loginYToken(docente);

      const anio = await AnioAcademico.create({
        institucionId: institucion._id,
        anio: 2030,
        estado: 'activo',
        cronograma: {
          periodos: [
            { numero: 1, nombre: 'Periodo 1', estado: 'cerrado' }
          ]
        }
      });

      const res = await request(app)
        .put(`/api/anios-academicos/${anio._id}/reabrir-periodo`)
        .set('Authorization', `Bearer ${token}`)
        .send({ periodo: 1, duracionMinutos: 30 });

      expect(res.status).toBe(403);
    });

    it('cierra reapertura temporal manualmente', async () => {
      const institucion = await crearInstitucion();
      const admin = await crearUsuario({ tipoPerfil: 'admin', institucionId: institucion._id });
      const token = await loginYToken(admin);

      const anio = await AnioAcademico.create({
        institucionId: institucion._id,
        anio: 2031,
        estado: 'activo',
        cronograma: {
          periodos: [
            { numero: 1, nombre: 'Periodo 1', estado: 'cerrado' }
          ]
        }
      });

      // Reabrir
      await request(app)
        .put(`/api/anios-academicos/${anio._id}/reabrir-periodo`)
        .set('Authorization', `Bearer ${token}`)
        .send({ periodo: 1, duracionMinutos: 60 });

      // Cerrar manualmente
      const res = await request(app)
        .put(`/api/anios-academicos/${anio._id}/cerrar-reapertura`)
        .set('Authorization', `Bearer ${token}`)
        .send({ periodo: 1 });

      expect(res.status).toBe(200);
      expect(res.body.data.estado).toBe('cerrado');
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
