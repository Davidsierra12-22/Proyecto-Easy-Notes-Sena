const request = require('supertest');
const app = require('../app');
const Usuario = require('../src/models/Usuario');
const Institucion = require('../src/models/Institucion');

const crearInstitucion = async (datos = {}) => {
  return Institucion.create({
    nombre: 'Colegio Test',
    nit: `900${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
    direccion: 'Calle 1 #2-3',
    estado: 'activo',
    ...datos,
    // El slug es unique y se deriva del nombre, asi que dos "Colegio Test"
    // en la misma suite chocarian. Se deriva del NIT, que ya es unico, para
    // que crear varias instituciones con el mismo nombre de prueba siga
    // funcionando.
    slug: datos.slug ?? `colegio-test-${datos.nit ?? Math.floor(Math.random() * 999999)}`
  });
};

const crearUsuario = async (datos = {}) => {
  const body = {
    tipoDocumento: 'CC',
    documento: `1${Math.floor(Math.random() * 999999999)}`,
    nombres: 'Usuario',
    apellidos: 'Prueba',
    tipoPerfil: 'admin',
    credenciales: {
      usuario: `user${Math.floor(Math.random() * 999999)}`,
      passwordHash: await Usuario.hashPassword('password123')
    },
    ...datos
  };
  return Usuario.create(body);
};

const loginYToken = async (usuario, password = 'password123') => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ usuario: usuario.credenciales.usuario, password });
  return res.body.data.token;
};

module.exports = { crearInstitucion, crearUsuario, loginYToken };
