const request = require('supertest');
const app = require('../app');
const { crearInstitucion, crearUsuario, loginYToken } = require('./helpers');
const DireccionNucleo = require('../src/models/DireccionNucleo');

/**
 * DireccionNucleo es un catalogo REGIONAL del SENA, no un recurso por colegio.
 *
 * No tiene institucionId a proposito: es la lista de direcciones regionales
 * (Bogota, Tolima, ...) y en ella se apoya Institucion.direccionNucleoId,
 * Usuario.direccionNucleoId, Bitacora y SolicitudRegistro. Como es un
 * catalogo de referencia, todos los usuarios autenticados pueden leerlo: un admin de
 * un colegio necesita poder elegir la direccion regional que le corresponde.
 *
 * Lo que no puede es haberlo modificado. Solo el super_admin (Direccion de
 * Nucleo) escribe, y el propio nucleoScope ya le bloquea el resto de modulos.
 *
 * Estas pruebas fijan esa frontera para que nadie "arregle" el modelo
 * anadiendo un institucionId que rompa las referencias, ni al reves.
 */
describe('Catalogo regional de direcciones de nucleo', () => {
  let colegioA;
  let adminA; let tokenAdmin;
  let superAdmin; let tokenSuper;

  beforeEach(async () => {
    colegioA = await crearInstitucion({ nombre: 'Colegio A' });
    adminA = await crearUsuario({ tipoPerfil: 'admin', institucionId: colegioA._id });
    // El super_admin es la Direccion de Nucleo: no pertenece a un colegio.
    superAdmin = await crearUsuario({ tipoPerfil: 'super_admin' });

    tokenAdmin = await loginYToken(adminA);
    tokenSuper = await loginYToken(superAdmin);

    await DireccionNucleo.create({ nombre: 'Direccion Regional Tolima', codigo: 'TOL', departamento: 'Tolima' });
    await DireccionNucleo.create({ nombre: 'Direccion Regional Bogota', codigo: 'BOG', departamento: 'Cundinamarca' });
  });

  it('es un catalogo global: un colegio ve todas las direcciones regionales', async () => {
    const res = await request(app)
      .get('/api/nucleos')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    // Si el catalogo se acotara por colegio, un admin no podria asignar su
    // propia Institucion.direccionNucleoId. Que vea todas es lo correcto.
    expect(res.body.data.length).toBe(2);
  });

  it('un admin de colegio no puede crear direcciones regionales', async () => {
    const res = await request(app)
      .post('/api/nucleos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Direccion Regional Inventada', codigo: 'XXX' });
    expect(res.status).toBe(403);
    expect(await DireccionNucleo.countDocuments({ codigo: 'XXX' })).toBe(0);
  });

  it('un admin de colegio no puede editar ni borrar una direccion regional', async () => {
    const regional = await DireccionNucleo.findOne({ codigo: 'TOL' });

    const editado = await request(app)
      .put(`/api/nucleos/${regional._id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Renombrada' });
    expect(editado.status).toBe(403);

    const borrado = await request(app)
      .delete(`/api/nucleos/${regional._id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(borrado.status).toBe(403);

    expect((await DireccionNucleo.findById(regional._id)).nombre).toBe('Direccion Regional Tolima');
  });

  it('la direccion de nucleo si administra el catalogo', async () => {
    const creado = await request(app)
      .post('/api/nucleos')
      .set('Authorization', `Bearer ${tokenSuper}`)
      .send({ nombre: 'Direccion Regional Boyaca', codigo: 'BOY' });
    expect(creado.status).toBe(201);

    const editado = await request(app)
      .put(`/api/nucleos/${creado.body.data._id}`)
      .set('Authorization', `Bearer ${tokenSuper}`)
      .send({ nombre: 'Direccion Regional Boyaca - Sede Central' });
    expect(editado.status).toBe(200);

    const borrado = await request(app)
      .delete(`/api/nucleos/${creado.body.data._id}`)
      .set('Authorization', `Bearer ${tokenSuper}`);
    expect(borrado.status).toBe(200);
    expect(await DireccionNucleo.findById(creado.body.data._id)).toBeNull();
  });

  it('el catalogo exige sesion incluso para leer', async () => {
    const res = await request(app).get('/api/nucleos');
    expect(res.status).toBe(401);
  });
});
