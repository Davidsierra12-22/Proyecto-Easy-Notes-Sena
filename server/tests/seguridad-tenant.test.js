const request = require('supertest');
const app = require('../app');
const Usuario = require('../src/models/Usuario');
const Institucion = require('../src/models/Institucion');
const DireccionNucleo = require('../src/models/DireccionNucleo');
const Bitacora = require('../src/models/Bitacora');
const SolicitudRegistro = require('../src/models/SolicitudRegistro');
const { loginYToken } = require('./helpers');

const numero = () => Math.floor(Math.random() * 89999999) + 10000000;

const crearColegio = async (nucleoId = null) => Institucion.create({
  nombre: `Colegio ${numero()}`,
  nit: `900${Math.floor(Math.random() * 999999)}`,
  estado: 'activo',
  nucleoId
});

const crearUsuario = async (tipoPerfil, institucionId, extra = {}) => Usuario.create({
  tipoDocumento: 'CC',
  documento: `${numero()}`,
  nombres: 'Usuario',
  apellidos: 'Aislamiento',
  email: `user${numero()}@test.com`,
  tipoPerfil,
  institucionId,
  credenciales: {
    usuario: `usr${numero()}`,
    passwordHash: await Usuario.hashPassword('password123')
  },
  ...extra
});

/**
 * EasyNotes es multi-institucion: todos los colegios comparten la misma
 * base de datos. Estos tests fijan el comportamiento esperado para que
 * un usuario de un colegio NUNCA alcance datos de otro colegio.
 */
describe('Aislamiento entre instituciones', () => {
  let colegioA, colegioB, adminA, adminB, tokenA, tokenB;

  beforeEach(async () => {
    colegioA = await crearColegio();
    colegioB = await crearColegio();
    adminA = await crearUsuario('admin', colegioA._id);
    adminB = await crearUsuario('admin', colegioB._id);
    tokenA = await loginYToken(adminA);
    tokenB = await loginYToken(adminB);
  });

  it('no permite a un admin restablecer la contraseña de un usuario de otro colegio', async () => {
    const victima = await crearUsuario('docente', colegioB._id);

    const res = await request(app)
      .post(`/api/usuarios/${victima._id}/notificar-credenciales`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ password: 'hackeado123' });

    expect(res.status).toBe(404);

    // La clave del usuario de otro colegio no debe haber cambiado.
    const despues = await Usuario.findById(victima._id);
    const coincide = await despues.comparePassword('password123');
    expect(coincide).toBe(true);
  });

  it('sí permite restablecer la contraseña dentro de la propia institución', async () => {
    const propio = await crearUsuario('docente', colegioA._id);

    const res = await request(app)
      .post(`/api/usuarios/${propio._id}/notificar-credenciales`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ password: 'nuevaclave9' });

    expect(res.status).toBe(200);
    const despues = await Usuario.findById(propio._id);
    expect(await despues.comparePassword('nuevaclave9')).toBe(true);
  });

  it('no filtra ninguna credencial cuando el objetivo es de otro colegio', async () => {
    const victima = await crearUsuario('docente', colegioB._id);

    const res = await request(app)
      .post(`/api/usuarios/${victima._id}/notificar-credenciales`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ password: 'hackeado123' });

    expect(res.status).toBe(404);
    const cuerpo = JSON.stringify(res.body);
    expect(cuerpo).not.toContain('hackeado123');
    expect(res.body.data).toBeUndefined();
  });

  it('omite la contraseña en la respuesta cuando el correo sí se envió', async () => {
    const propio = await crearUsuario('docente', colegioA._id);
    const mailService = require('../src/services/mailService');
    const original = mailService.configurado;
    const originalEnvio = mailService.enviarCredenciales;
    mailService.configurado = true;
    mailService.enviarCredenciales = async () => {};
    try {
      const res = await request(app)
        .post(`/api/usuarios/${propio._id}/notificar-credenciales`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ password: 'nuevaclave9' });

      expect(res.status).toBe(200);
      expect(res.body.data.enviado).toBe(true);
      expect(res.body.data.password).toBeUndefined();
    } finally {
      mailService.configurado = original;
      mailService.enviarCredenciales = originalEnvio;
    }
  });

  it('no permite leer la ficha de un usuario de otro colegio', async () => {
    const victima = await crearUsuario('estudiante', colegioB._id);

    const res = await request(app)
      .get(`/api/usuarios/${victima._id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
    expect(res.body.data).toBeUndefined();
  });

  it('no permite leer la lista de estudiantes ni acudientes de otro colegio', async () => {
    const victima = await crearUsuario('estudiante', colegioB._id);

    const resEstudiantes = await request(app)
      .get(`/api/usuarios/${victima._id}/estudiantes`)
      .set('Authorization', `Bearer ${tokenA}`);
    const resAcudientes = await request(app)
      .get(`/api/usuarios/${victima._id}/acudientes`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(resEstudiantes.status).toBe(404);
    expect(resAcudientes.status).toBe(404);
  });

  it('no permite leer la configuración de una institución ajena', async () => {
    const res = await request(app)
      .get(`/api/instituciones/${colegioB._id}/configuracion`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
  });

  it('no permite cambiar el logo ni la firma de una institución ajena', async () => {
    const logoAjeno = await request(app)
      .post(`/api/upload/${colegioB._id}/firma-rector`)
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('archivo', Buffer.from('imagen-falsa'), 'firma.png');

    expect(logoAjeno.status).toBe(404);

    const institucion = await Institucion.findById(colegioB._id);
    expect(institucion.certificadoEncabezado).toBeFalsy();
  });

  it('no permite modificar a un usuario de otro colegio', async () => {
    const victima = await crearUsuario('docente', colegioB._id);

    const res = await request(app)
      .put(`/api/usuarios/${victima._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ telefono: '999' });

    expect(res.status).toBe(404);
    const despues = await Usuario.findById(victima._id);
    expect(despues.telefono).toBeUndefined();
  });
});

describe('Escalada de privilegios', () => {
  let colegioA, admin, token;

  beforeEach(async () => {
    colegioA = await crearColegio();
    admin = await crearUsuario('admin', colegioA._id);
    token = await loginYToken(admin);
  });

  it('impide que un admin se promueva a sí mismo a super_admin', async () => {
    const objetivo = await crearUsuario('docente', colegioA._id);

    const res = await request(app)
      .put(`/api/usuarios/${objetivo._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tipoPerfil: 'super_admin' });

    expect(res.status).toBe(403);
    const despues = await Usuario.findById(objetivo._id);
    expect(despues.tipoPerfil).toBe('docente');
  });

  it('impide crear un usuario con rol super_admin', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tipoDocumento: 'CC',
        documento: `${numero()}`,
        nombres: 'Intruso',
        apellidos: 'Escalado',
        email: `nuevo${numero()}@test.com`,
        tipoPerfil: 'super_admin',
        credenciales: { usuario: `nuevo${numero()}`, password: 'abc12345' }
      });

    expect(res.status).toBe(403);
  });

  it('impide asignar super_admin dentro del array roles', async () => {
    const objetivo = await crearUsuario('docente', colegioA._id);

    const res = await request(app)
      .put(`/api/usuarios/${objetivo._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roles: ['docente', 'super_admin'] });

    expect(res.status).toBe(403);
    const despues = await Usuario.findById(objetivo._id);
    expect(despues.roles || []).not.toContain('super_admin');
  });

  it('ignora un intento de mover el usuario a otra institución', async () => {
    const otro = await crearColegio();
    const objetivo = await crearUsuario('docente', colegioA._id);

    await request(app)
      .put(`/api/usuarios/${objetivo._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ institucionId: String(otro._id) });

    // La institución del usuario no puede cambiarse desde la edición.
    const despues = await Usuario.findById(objetivo._id);
    expect(despues.institucionId.toString()).toBe(colegioA._id.toString());
  });

  it('permite cambiar roles dentro de los perfiles permitidos', async () => {
    const objetivo = await crearUsuario('docente', colegioA._id);

    const res = await request(app)
      .put(`/api/usuarios/${objetivo._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tipoPerfil: 'coordinador' });

    expect(res.status).toBe(200);
    const despues = await Usuario.findById(objetivo._id);
    expect(despues.tipoPerfil).toBe('coordinador');
  });
});

describe('Aislamiento entre núcleos', () => {
  it('impide que un super_admin cree admins en un colegio de otro núcleo', async () => {
    const nucleoPropio = await DireccionNucleo.create({ nombre: 'Nucleo A', codigo: `NA${numero()}` });
    const nucleoAjeno = await DireccionNucleo.create({ nombre: 'Nucleo B', codigo: `NB${numero()}` });
    const colegioAjeno = await crearColegio(nucleoAjeno._id);

    const superAdmin = await crearUsuario('super_admin', null, { nucleoId: nucleoPropio._id });
    const token = await loginYToken(superAdmin);

    const res = await request(app)
      .post(`/api/nucleo/instituciones/${colegioAjeno._id}/admin`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tipoDocumento: 'CC', documento: `${numero()}`, nombres: 'Admin', apellidos: 'Infiltrado' });

    expect(res.status).toBe(404);
    const infiltrado = await Usuario.findOne({ documento: String(res.body.data?._id || '') });
    expect(infiltrado).toBeNull();
  });
});

describe('Solicitud de registro publica', () => {
  it('no permite auto-aprobar una solicitud ni falsificar el procesadoPor', async () => {
    const nucleo = await DireccionNucleo.create({ nombre: 'Nucleo Publico', codigo: `NP${numero()}` });

    const res = await request(app)
      .post('/api/solicitudes-registro')
      .send({
        nucleoId: String(nucleo._id),
        nombre: 'Solicitante Externo',
        nit: `900${Math.floor(Math.random() * 999999)}`,
        contacto: { nombre: 'Externo', email: 'externo@test.com' },
        estado: 'aprobada',
        procesadoPor: '000000000000000000000000'
      });

    expect(res.status).toBe(201);

    const guardada = await SolicitudRegistro.findOne({ nit: res.body.data.nit });
    expect(guardada.estado).toBe('pendiente');
    expect(guardada.procesadoPor).toBeFalsy();
  });
});

describe('Bitácora de auditoría', () => {
  let colegioA, admin, token;

  beforeEach(async () => {
    colegioA = await crearColegio();
    admin = await crearUsuario('admin', colegioA._id);
    token = await loginYToken(admin);
    await Bitacora.create({ accion: 'crear', coleccion: 'Prueba', institucionId: colegioA._id, usuarioId: admin._id });
    await Bitacora.create({ accion: 'editar', coleccion: 'Prueba', institucionId: colegioA._id, usuarioId: admin._id });
  });

  it('no permite borrar toda la bitácora con un valor negativo', async () => {
    const res = await request(app)
      .delete('/api/bitacora/limpiar?meses=-1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);

    // Los dos registros originales deben seguir intactos. El intento
    // fallido queda registrado en la bitácora, y eso es lo correcto.
    const originales = await Bitacora.find({ institucionId: colegioA._id, coleccion: 'Prueba' });
    expect(originales.length).toBe(2);
  });

  it('acepta un valor válido y solo borra lo anterior al corte', async () => {
    const res = await request(app)
      .delete('/api/bitacora/limpiar?meses=12')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // Registros creados ahora: no son anteriores a la fecha de corte, y la
    // propia petición de limpieza queda registrada en la bitácora.
    expect(res.body.data.meses).toBe(12);
    const restantes = await Bitacora.find({ institucionId: colegioA._id, coleccion: 'Prueba' });
    expect(restantes.length).toBe(2);
  });
});

/**
 * Guardarraíl de arquitectura.
 *
 * En Mongoose 8, findByIdAndUpdate espera un id, no un filtro. Si se le pasa
 * un objeto { _id, institucionId } NO lanza error: ignora en silencio las
 * claves sobrantes y escribe solo por _id. El alcance por institución
 * desaparece sin avisar.
 *
 * Esta prueba falla si alguien vuelve a introducir ese patron, que es la
 * forma mas facil de "refactorizar" el scope de una escritura y dejarla
 * abierta a otros colegios sin romper ningun test.
 */
describe('Uso correcto de las escrituras con scope', () => {
  const fs = require('fs');
  const path = require('path');
  const dir = path.join(__dirname, '..', 'src', 'controllers');

  it('ningún controlador escribe con findByIdAnd* sobre un objeto filtro', () => {
    const ofensores = [];
    // Solo es peligroso el objeto { _id, institucionId }: un
    // findByIdAndUpdate(req.params.id) de un solo id es correcto.
    const patronPeligroso = /\.findByIdAnd(?:Update|Delete)\s*\(\s*\{/;

    for (const archivo of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
      const fuente = fs.readFileSync(path.join(dir, archivo), 'utf8');
      fuente.split('\n').forEach((linea, i) => {
        if (patronPeligroso.test(linea)) ofensores.push(`${archivo}:${i + 1}`);
      });
    }

    expect(ofensores).toEqual([]);
  });
});
