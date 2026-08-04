const request = require('supertest');
const app = require('../app');
const Usuario = require('../src/models/Usuario');
const Institucion = require('../src/models/Institucion');

const crearInstitucion = async (datos = {}) => {
  return Institucion.create({
    nombre: 'Colegio Test',
    nit: `900${Math.floor(Math.random() * 999999)}`,
    direccion: 'Calle 1 #2-3',
    estado: 'activo',
    ...datos
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
