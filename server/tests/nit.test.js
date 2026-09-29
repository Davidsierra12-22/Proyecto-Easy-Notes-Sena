const request = require('supertest');
const app = require('../app');
const Institucion = require('../src/models/Institucion');
const Usuario = require('../src/models/Usuario');
const { esNitValido, normalizarNit, limpiarNit } = require('../src/utils/nit');
const { loginYToken } = require('./helpers');

const numero = () => Math.floor(Math.random() * 89999999) + 10000000;
const nitValido = () => `900${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;

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

describe('Formato del NIT', () => {
  describe('esNitValido', () => {
    it('acepta nueve digitos', () => {
      expect(esNitValido('900123456')).toBe(true);
    });

    it('acepta nueve digitos, guion y digito de control', () => {
      expect(esNitValido('900123456-7')).toBe(true);
    });

    it('acepta los diez digitos pegados', () => {
      expect(esNitValido('9001234567')).toBe(true);
    });

    it('acepta el NIT real de una institucion con digito de control', () => {
      expect(esNitValido('890123456-7')).toBe(true);
      expect(esNitValido('800198765-1')).toBe(true);
    });

    it('rechaza letras', () => {
      expect(esNitValido('ABC123456')).toBe(false);
      expect(esNitValido('90012345a')).toBe(false);
      expect(esNitValido('9a01234567')).toBe(false);
    });

    it('rechaza puntos y espacios', () => {
      expect(esNitValido('900.123.456')).toBe(false);
      expect(esNitValido('900 123 456')).toBe(false);
    });

    it('rechaza el guion fuera de su sitio', () => {
      expect(esNitValido('900-123456')).toBe(false);
      expect(esNitValido('9001234567-')).toBe(false);
      expect(esNitValido('-900123456')).toBe(false);
    });

    it('rechaza guiones repetidos', () => {
      expect(esNitValido('900123456--7')).toBe(false);
    });

    it('rechaza longitudes que no son de un NIT', () => {
      expect(esNitValido('90012345')).toBe(false);      // 8
      expect(esNitValido('90012345678')).toBe(false);   // 11
      expect(esNitValido('900123456-77')).toBe(false);  // 9 + guion + 2
    });

    it('rechaza vacio y valores sin sentido', () => {
      expect(esNitValido('')).toBe(false);
      expect(esNitValido(null)).toBe(false);
      expect(esNitValido(undefined)).toBe(false);
    });

    it('normaliza a cadena un NIT que llega como numero', () => {
      // String(9.00123457e8) es '900123457', no la notacion cientifica, asi
      // que un NIT numerico se acepta igual. Lo que no se permite es que
      // quede guardado como numero.
      expect(esNitValido(900123456)).toBe(true);
      expect(esNitValido(9.00123457e8)).toBe(true);
      expect(normalizarNit(9.00123457e8)).toBe('900123457');
    });
  });

  describe('normalizarNit', () => {
    it('recorta espacios y convierte a cadena', () => {
      expect(normalizarNit('  900123456-7  ')).toBe('900123456-7');
      expect(normalizarNit(900123456)).toBe('900123456');
    });

    it('deja vacio lo que no es texto', () => {
      expect(normalizarNit(null)).toBe('');
      expect(normalizarNit(undefined)).toBe('');
    });
  });

  describe('limpiarNit', () => {
    it('descarta las letras', () => {
      expect(limpiarNit('abc900123456')).toBe('900123456');
      expect(limpiarNit('9a0b0c1d2e3f4g5h6')).toBe('900123456');
    });

    it('descarta puntos y espacios', () => {
      expect(limpiarNit('900.123.456')).toBe('900123456');
      expect(limpiarNit('900 123 456')).toBe('900123456');
    });

    it('conserva el guion cuando esta despues del noveno digito', () => {
      expect(limpiarNit('900123456-7')).toBe('900123456-7');
    });

    it('descarta el guion puesto en otro sitio', () => {
      expect(limpiarNit('900-123456')).toBe('900123456');
      expect(limpiarNit('-900123456')).toBe('900123456');
    });

    it('deja el guion solo mientras se escribe el digito de control', () => {
      // El guion ya esta en su sitio: quitarselo seria pelear con quien esta
      // escribiendo 900123456-7. El error de formato aparece al guardar.
      expect(limpiarNit('900123456-')).toBe('900123456-');
      expect(esNitValido(limpiarNit('900123456-'))).toBe(false);
    });

    it('no inventa el guion que el usuario no escribio', () => {
      expect(limpiarNit('9001234567')).toBe('9001234567');
    });

    it('corta lo que sobra', () => {
      expect(limpiarNit('900123456789999')).toBe('9001234567');
    });
  });

  describe('modelo Institucion', () => {
    it('rechaza un NIT con letras', async () => {
      await expect(
        Institucion.create({ nombre: 'Colegio Letras', nit: 'ABC123456', estado: 'activo' })
      ).rejects.toThrow();
    });

    it('guarda el NIT con digito de control tal cual vino', async () => {
      const inst = await Institucion.create({
        nombre: 'Colegio Con Control',
        nit: '800198765-1',
        slug: `con-control-${Math.floor(Math.random() * 999999999)}`,
        estado: 'activo'
      });
      expect(inst.nit).toBe('800198765-1');
      expect(typeof inst.nit).toBe('string');
    });
  });

  describe('POST /api/nucleo/instituciones', () => {
    let token;

    beforeEach(async () => {
      const sa = await crearSuperAdmin();
      token = await loginYToken(sa);
    });

    it('crea el colegio guardando el NIT como cadena y con el digito de control', async () => {
      const res = await request(app)
        .post('/api/nucleo/instituciones')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'IES Con Control', nit: '890123456-7' });

      expect(res.status).toBe(201);
      expect(res.body.data.nit).toBe('890123456-7');
      expect(typeof res.body.data.nit).toBe('string');
    });

    it('acepta el NIT de nueve digitos sin digito de control', async () => {
      const res = await request(app)
        .post('/api/nucleo/instituciones')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'IES Sin Control', nit: nitValido() });

      expect(res.status).toBe(201);
    });

    it('rechaza un NIT con letras y no crea el colegio', async () => {
      const res = await request(app)
        .post('/api/nucleo/instituciones')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'IES Letras', nit: 'ABC123456' });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(await Institucion.countDocuments({ nombre: 'IES Letras' })).toBe(0);
    });

    it('rechaza un NIT con puntos', async () => {
      const res = await request(app)
        .post('/api/nucleo/instituciones')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'IES Puntos', nit: '900.123.456' });

      expect(res.status).toBe(400);
      expect(await Institucion.countDocuments({ nombre: 'IES Puntos' })).toBe(0);
    });

    it('rechaza un NIT demasiado corto', async () => {
      const res = await request(app)
        .post('/api/nucleo/instituciones')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'IES Corto', nit: '90012345' });

      expect(res.status).toBe(400);
    });

    it('guarda como cadena un NIT que llega como numero', async () => {
      // El cuerpo puede traer el NIT como numero. Se acepta porque 900123457
      // son nueve digitos, pero tiene que quedar guardado como cadena para
      // que no se lleve por delante el digito de control de los demas.
      const res = await request(app)
        .post('/api/nucleo/instituciones')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'IES Numerico', nit: 900123457 });

      expect(res.status).toBe(201);
      expect(res.body.data.nit).toBe('900123457');
      expect(typeof res.body.data.nit).toBe('string');

      const guardado = await Institucion.findById(res.body.data._id);
      expect(typeof guardado.nit).toBe('string');
    });

    it('sigue rechazando el NIT duplicado', async () => {
      const nit = nitValido();
      await request(app)
        .post('/api/nucleo/instituciones')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Colegio A', nit });

      const res = await request(app)
        .post('/api/nucleo/instituciones')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Colegio B', nit });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Ya existe/);
    });
  });
});
