const request = require('supertest');
const app = require('../app');
const { crearInstitucion } = require('./helpers');
const AnioAcademico = require('../src/models/AnioAcademico');
const Prematricula = require('../src/models/Prematricula');
const { derivarSlug } = require('../src/models/Institucion');

/**
 * Prematrícula pública: la parte del sistema SIN login.
 *
 * Estas rutas las usan padres que no tienen cuenta, así que no hay sesión de
 * la que sacar el colegio. Antes de este cambio el colegio se elegía con una
 * búsqueda de "el año con prematrícula abierta" SIN filtro de institución, y
 * eso producía tres fallos:
 *
 *   - la solicitud se creaba en el colegio que primero apareciera, no en el
 *     que el padre eligió;
 *   - el estado se consultaba por número de documento de un niño sobre TODOS
 *     los colegios del sistema, sin autenticarse;
 *   - el chequeo de duplicado era global, así que un niño que ya se postuló
 *     al Colegio A quedaba bloqueado para el Colegio B, y la respuesta le
 *     confirmaba que ese documento ya existía.
 *
 * Ahora el colegio viaja en el parámetro "colegio" (el slug que publica cada
 * institución) y todas las consultas quedan acotadas a ese colegio.
 */
describe('Prematrícula pública acotada al colegio del enlace', () => {
  let colegioA; let colegioB;
  let slugA; let slugB;

  const abrirPrematricula = (institucionId) =>
    AnioAcademico.create({
      institucionId,
      anio: 2027,
      nombre: '2027',
      numero: 2027,
      cronograma: {
        prematricula: {
          estado: 'abierta',
          inicio: new Date(Date.now() - 86400000),
          fin: new Date(Date.now() + 86400000)
        }
      }
    });

  const datosEstudiante = (documento) => ({
    estudiante: { nombres: 'Juan', apellidos: 'Perez', tipoDocumento: 'TI', documento },
    acudiente: { nombres: 'Maria', apellidos: 'Perez' },
    gradoSolicitado: 6
  });

  beforeEach(async () => {
    colegioA = await crearInstitucion({ nombre: 'Colegio Nueva Granada' });
    colegioB = await crearInstitucion({ nombre: 'Colegio Santa Fe' });
    slugA = colegioA.slug;
    slugB = colegioB.slug;

    await abrirPrematricula(colegioA._id);
    await abrirPrematricula(colegioB._id);
  });

  it('deriva un slug legible del nombre, sin tildes ni mayusculas', () => {
    expect(derivarSlug('Colegio Nueva Granada')).toBe('colegio-nueva-granada');
    expect(derivarSlug('Instituto Técnico Departamental')).toBe('instituto-tecnico-departamental');
    expect(derivarSlug('  Colegio  A&B  ')).toBe('colegio-a-b');
  });

  // ------------------------------------------------------------------
  describe('Consulta del período', () => {
    it('devuelve el período del colegio del enlace, no el de otro', async () => {
      const resA = await request(app).get(`/api/prematriculas/periodo?colegio=${slugA}`);
      expect(resA.status).toBe(200);
      expect(resA.body.data.abierta).toBe(true);
      expect(resA.body.data.colegio).toBe('Colegio Nueva Granada');

      // A y B tienen el mismo anio, así que la prueba real es que el
      // institucionId que devuelve sea el del colegio pedido.
      expect(String(resA.body.data.institucionId)).toBe(String(colegioA._id));
    });

    it('sin identificador de colegio no devuelve el período de ninguno', async () => {
      // Regresión: antes devolvía el de cualquier colegio con la ventana
      // abierta, aunque quien preguntara no hubiera dicho a cuál.
      const res = await request(app).get('/api/prematriculas/periodo');
      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('un colegio con el slug equivocado no ve el período de otro', async () => {
      const res = await request(app).get('/api/prematriculas/periodo?colegio=colegio-que-no-existe');
      expect(res.status).toBe(400);
    });

    it('si el colegio no tiene el período abierto, lo dice cerrado', async () => {
      await AnioAcademico.deleteMany({ institucionId: colegioA._id });
      const res = await request(app).get(`/api/prematriculas/periodo?colegio=${slugA}`);
      expect(res.status).toBe(200);
      expect(res.body.data.abierta).toBe(false);
    });

    it('una ventana ya vencida cuenta como cerrada', async () => {
      await AnioAcademico.updateMany(
        { institucionId: colegioA._id },
        { $set: { 'cronograma.prematricula.fin': new Date(Date.now() - 86400000) } }
      );
      const res = await request(app).get(`/api/prematriculas/periodo?colegio=${slugA}`);
      expect(res.body.data.abierta).toBe(false);
    });
  });

  // ------------------------------------------------------------------
  describe('Registro de solicitud', () => {
    it('crea la solicitud en el colegio del enlace', async () => {
      const res = await request(app)
        .post('/api/prematriculas/solicitar')
        .send({ colegio: slugA, ...datosEstudiante('111111111') });

      expect(res.status).toBe(201);
      const creada = await Prematricula.findOne({ 'estudiante.documento': '111111111' });
      expect(String(creada.institucionId)).toBe(String(colegioA._id));
    });

    it('no puede crear la solicitud en un colegio que no se indique', async () => {
      const res = await request(app)
        .post('/api/prematriculas/solicitar')
        .send(datosEstudiante('222222222'));
      expect(res.status).toBe(400);
      expect(await Prematricula.countDocuments({ 'estudiante.documento': '222222222' })).toBe(0);
    });

    it('no puede pedir la institucionId en el cuerpo', async () => {
      // Regresión: el cuerpo se procesaba tal cual y la institucionId acababa
      // mandando la solicitud al colegio que el cuerpo dijera, no al del enlace.
      const res = await request(app)
        .post('/api/prematriculas/solicitar')
        .send({ colegio: slugA, institucionId: colegioB._id, ...datosEstudiante('333333333') });

      expect(res.status).toBe(201);
      const creada = await Prematricula.findOne({ 'estudiante.documento': '333333333' });
      expect(String(creada.institucionId)).toBe(String(colegioA._id));
    });

    it('el duplicado se evalua dentro del colegio, no globalmente', async () => {
      // Regresión: con el filtro global, un niño que ya se postuló al Colegio
      // A quedaba bloqueado para el Colegio B, y el error le confirmaba que
      // su documento ya existía.
      const primera = await request(app)
        .post('/api/prematriculas/solicitar')
        .send({ colegio: slugA, ...datosEstudiante('444444444') });
      expect(primera.status).toBe(201);

      const enOtro = await request(app)
        .post('/api/prematriculas/solicitar')
        .send({ colegio: slugB, ...datosEstudiante('444444444') });
      expect(enOtro.status).toBe(201);

      const repetida = await request(app)
        .post('/api/prematriculas/solicitar')
        .send({ colegio: slugA, ...datosEstudiante('444444444') });
      expect(repetida.status).toBe(400);
    });

    it('no registra la solicitud si el colegio tiene el período cerrado', async () => {
      await AnioAcademico.updateMany(
        { institucionId: colegioA._id },
        { $set: { 'cronograma.prematricula.estado': 'cerrada' } }
      );
      const res = await request(app)
        .post('/api/prematriculas/solicitar')
        .send({ colegio: slugA, ...datosEstudiante('555555555') });
      expect(res.status).toBe(400);
      expect(await Prematricula.countDocuments({ 'estudiante.documento': '555555555' })).toBe(0);
    });
  });

  // ------------------------------------------------------------------
  describe('Consulta de estado por documento', () => {
    let documentoCompartido;

    beforeEach(async () => {
      documentoCompartido = '999888777';
      await Prematricula.create({
        institucionId: colegioA._id,
        anioAcademicoId: (await AnioAcademico.findOne({ institucionId: colegioA._id }))._id,
        estudiante: { nombres: 'Lucia', apellidos: 'Gomez', tipoDocumento: 'TI', documento: documentoCompartido },
        acudiente: { nombres: 'Ana', apellidos: 'Gomez' },
        gradoSolicitado: 7
      });
      await Prematricula.create({
        institucionId: colegioB._id,
        anioAcademicoId: (await AnioAcademico.findOne({ institucionId: colegioB._id }))._id,
        estudiante: { nombres: 'Lucia', apellidos: 'Gomez', tipoDocumento: 'TI', documento: documentoCompartido },
        acudiente: { nombres: 'Ana', apellidos: 'Gomez' },
        gradoSolicitado: 7
      });
    });

    it('el padre ve el estado de su colegio', async () => {
      const res = await request(app).get(
        `/api/prematriculas/estado/${documentoCompartido}?colegio=${slugA}`
      );
      expect(res.status).toBe(200);
      expect(res.body.data.nombres).toBe('Lucia Gomez');
    });

    it('no ve el estado de un colegio ajeno aunque conozca el documento', async () => {
      // El caso central: el mismo documento está en A y en B. Quien tiene el
      // enlace de B solo obtiene lo de B.
      const resB = await request(app).get(
        `/api/prematriculas/estado/${documentoCompartido}?colegio=${slugB}`
      );
      expect(resB.status).toBe(200);
      const idEsperado = String(
        (await Prematricula.findOne({ institucionId: colegioB._id, 'estudiante.documento': documentoCompartido }))._id
      );
      expect(String(resB.body.data._id)).toBe(idEsperado);
    });

    it('no responde nada sin identificador de colegio', async () => {
      // Regresión principal: sin sesión y sin colegio, la consulta por
      // documento de un niño recorría todas las instituciones.
      const res = await request(app).get(`/api/prematriculas/estado/${documentoCompartido}`);
      expect(res.status).toBe(400);
      expect(res.body.data).toBeUndefined();
    });

    it('no encuentra nada con un colegio que no existe', async () => {
      const res = await request(app).get(
        `/api/prematriculas/estado/${documentoCompartido}?colegio=no-existe`
      );
      expect(res.status).toBe(400);
    });

    it('no filtra datos del acudiente en la respuesta publica', async () => {
      // La vista publica no necesita el correo ni el telefono del acudiente.
      const res = await request(app).get(
        `/api/prematriculas/estado/${documentoCompartido}?colegio=${slugA}`
      );
      expect(res.body.data).not.toHaveProperty('acudiente');
      expect(res.body.data).not.toHaveProperty('institucionId');
    });

    it('limita los intentos de consulta por documento', async () => {
      // Sin sesion no hay forma de autenticar al que consulta, asi que la
      // unica defensa contra enumerar documentos es el limite de tasa.
      const respuestas = [];
      for (let i = 0; i < 14; i += 1) {
        const r = await request(app).get(
          `/api/prematriculas/estado/${100000000 + i}?colegio=${slugA}`
        );
        respuestas.push(r.status);
      }
      expect(respuestas.filter(s => s === 429).length).toBeGreaterThan(0);
    });
  });
});
