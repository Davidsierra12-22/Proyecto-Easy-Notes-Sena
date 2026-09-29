const request = require('supertest');
const app = require('../app');
const { crearInstitucion, crearUsuario, loginYToken } = require('./helpers');
const AnioAcademico = require('../src/models/AnioAcademico');
const Asignatura = require('../src/models/Asignatura');
const Area = require('../src/models/Area');
const Comunicados = require('../src/models/Comunicados');
const Observador = require('../src/models/Observador');
const Excusas = require('../src/models/Excusas');
const Pagos = require('../src/models/Pagos');
const ConceptosContables = require('../src/models/ConceptosContables');
const Elecciones = require('../src/models/Elecciones');
const EventoElectoral = require('../src/models/EventoElectoral');
const Voto = require('../src/models/Voto');
const Prematricula = require('../src/models/Prematricula');
const Indicador = require('../src/models/Indicador');

/**
 * Aislamiento de comunicacion, secretaria, finanzas y elecciones.
 *
 * Tres formas distintas de fallo, y por eso conviene no tratarlas igual:
 *
 *  1. Escrituras con findById + save(), que escriben por _id sin mirar la
 *     institucion: marcar leido un comunicado ajeno, agregar un
 *     seguimiento a una observacion ajena, aprobar una excusa ajena o
 *     registrar el pago de una factura ajena.
 *
 *  2. Consultas por entidad relacionada que solo traian el id del
 *     estudiante: el historial de pagos y el historial disciplinario de
 *     cualquier alumno de cualquier colegio, con solo conocer su id.
 *
 *  3. Voto, que no guarda institucionId y hay que acotar resolviendo
 *     primero los eventos del colegio.
 */
describe('Aislamiento de comunicacion, finanzas y elecciones entre colegios', () => {
  let colegioA; let colegioB;
  let adminA; let adminB; let estudianteA;
  let tokenAdmin; let tokenAdminB; let tokenEstudiante;
  let anioA; let anioB;
  let estudianteDocA; let estudianteDocB;
  let asignaturaA;

  beforeEach(async () => {
    colegioA = await crearInstitucion({ nombre: 'Colegio A' });
    colegioB = await crearInstitucion({ nombre: 'Colegio B' });

    adminA = await crearUsuario({ tipoPerfil: 'admin', institucionId: colegioA._id });
    adminB = await crearUsuario({ tipoPerfil: 'admin', institucionId: colegioB._id });
    estudianteA = await crearUsuario({ tipoPerfil: 'estudiante', institucionId: colegioA._id });
    // El indice de Credenciales exige usuario unico: crear un segundo
    // admin con el mismo nombre de usuario revienta el create.
    estudianteDocA = await crearUsuario({ tipoPerfil: 'estudiante', institucionId: colegioA._id, nombres: 'Alumno' });
    estudianteDocB = await crearUsuario({ tipoPerfil: 'estudiante', institucionId: colegioB._id, nombres: 'Alumno' });

    tokenAdmin = await loginYToken(adminA);
    tokenAdminB = await loginYToken(adminB);
    tokenEstudiante = await loginYToken(estudianteA);

    anioA = await AnioAcademico.create({ institucionId: colegioA._id, anio: 2026, nombre: '2026', numero: 2026 });
    anioB = await AnioAcademico.create({ institucionId: colegioB._id, anio: 2026, nombre: '2026', numero: 2026 });

    const areaA = await Area.create({ institucionId: colegioA._id, nombre: 'Matematicas' });
    asignaturaA = await Asignatura.create({ institucionId: colegioA._id, areaId: areaA._id, nombre: 'Algebra' });
  });

  // ------------------------------------------------------------------
  describe('Comunicados', () => {
    let comunicadoB;

    beforeEach(async () => {
      comunicadoB = await Comunicados.create({
        institucionId: colegioB._id,
        remitenteId: adminB._id,
        asunto: 'Reunion de padres',
        mensaje: 'Se cites el sabado.'
      });
    });

    it('no lista comunicados de otro colegio', async () => {
      const res = await request(app)
        .get('/api/comunicados')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(200);
      expect(res.body.data.every(c => String(c.institucionId) === String(colegioA._id))).toBe(true);
    });

    it('no puede leer un comunicado de otro colegio', async () => {
      const res = await request(app)
        .get(`/api/comunicados/${comunicadoB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(404);
    });

    it('no puede editar un comunicado de otro colegio', async () => {
      const res = await request(app)
        .put(`/api/comunicados/${comunicadoB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ mensaje: 'Mensaje inyectado' });
      expect(res.status).toBe(404);
      expect((await Comunicados.findById(comunicadoB._id)).mensaje).toBe('Se cites el sabado.');
    });

    it('no puede borrar un comunicado de otro colegio', async () => {
      const res = await request(app)
        .delete(`/api/comunicados/${comunicadoB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(404);
      expect(await Comunicados.findById(comunicadoB._id)).not.toBeNull();
    });

    it('no puede marcar como leido un comunicado de otro colegio', async () => {
      // Regresión: findById + save() escribia por _id sin mirar la
      // institucion, dejando la marca de lectura dentro del comunicado ajeno.
      const res = await request(app)
        .put(`/api/comunicados/${comunicadoB._id}/leer`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(404);
      const despues = await Comunicados.findById(comunicadoB._id);
      expect(despues.leido.some(l => String(l.usuarioId) === String(adminA._id))).toBe(false);
    });

    it('no puede colgar un comunicado propio de otro colegio', async () => {
      const res = await request(app)
        .post('/api/comunicados')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ institucionId: colegioB._id, asunto: 'Colgado', mensaje: 'Prueba' });
      expect(res.status).toBe(201);
      expect(String(res.body.data.institucionId)).toBe(String(colegioA._id));
    });

    it('el admin si gestiona los comunicados de su colegio', async () => {
      const creado = await request(app)
        .post('/api/comunicados')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ asunto: 'Reunion', mensaje: 'Miercoles' });
      expect(creado.status).toBe(201);

      const id = creado.body.data._id;
      const leido = await request(app)
        .put(`/api/comunicados/${id}/leer`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(leido.status).toBe(200);
      expect(leido.body.data.leido.length).toBe(1);

      const borrado = await request(app)
        .delete(`/api/comunicados/${id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(borrado.status).toBe(200);
    });
  });

  // ------------------------------------------------------------------
  describe('Observador: historial disciplinario', () => {
    let observacionB;

    beforeEach(async () => {
      observacionB = await Observador.create({
        institucionId: colegioB._id,
        anioAcademicoId: anioB._id,
        estudianteId: estudianteDocB._id,
        tipo: 'disciplinario',
        descripcion: 'Conducta adecuada en el aula.'
      });
    });

    it('no puede leer una observacion de otro colegio', async () => {
      const res = await request(app)
        .get(`/api/observador/${observacionB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(404);
    });

    it('no puede editar una observacion de otro colegio', async () => {
      const res = await request(app)
        .put(`/api/observador/${observacionB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ descripcion: 'Reescrita' });
      expect(res.status).toBe(404);
      expect((await Observador.findById(observacionB._id)).descripcion).toBe('Conducta adecuada en el aula.');
    });

    it('no puede borrar una observacion de otro colegio', async () => {
      const res = await request(app)
        .delete(`/api/observador/${observacionB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(404);
      expect(await Observador.findById(observacionB._id)).not.toBeNull();
    });

    it('no puede agregar seguimiento a una observacion de otro colegio', async () => {
      // Regresión: findById + save() sobre seguimiento, escritura por _id.
      const res = await request(app)
        .post(`/api/observador/${observacionB._id}/seguimiento`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ observacion: 'Seguimiento inyectado' });
      expect(res.status).toBe(404);
      const despues = await Observador.findById(observacionB._id);
      expect(despues.seguimiento.length).toBe(0);
    });

    it('no puede consultar el historial disciplinario de un alumno de otro colegio', async () => {
      // Regresión: el filtro solo traia estudianteId, sin institucionId.
      const res = await request(app)
        .get(`/api/observador/estudiante/${estudianteDocB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('el admin si ve y sigue el historial disciplinario de su colegio', async () => {
      const observacionA = await Observador.create({
        institucionId: colegioA._id,
        anioAcademicoId: anioA._id,
        estudianteId: estudianteDocA._id,
        tipo: 'academico',
        descripcion: 'Mejora notable.'
      });

      const lista = await request(app)
        .get(`/api/observador/estudiante/${estudianteDocA._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(lista.body.data.length).toBe(1);

      const seguimiento = await request(app)
        .post(`/api/observador/${observacionA._id}/seguimiento`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ observacion: 'Se cita a la familia' });
      expect(seguimiento.status).toBe(200);
      expect((await Observador.findById(observacionA._id)).seguimiento.length).toBe(1);
    });
  });

  // ------------------------------------------------------------------
  describe('Excusas', () => {
    let excusaB;

    beforeEach(async () => {
      excusaB = await Excusas.create({
        institucionId: colegioB._id,
        anioAcademicoId: anioB._id,
        docenteId: adminB._id,
        fechaInicio: new Date('2026-03-02'),
        fechaFin: new Date('2026-03-03'),
        motivo: 'Cita medica'
      });
    });

    it('no puede leer una excusa de otro colegio', async () => {
      const res = await request(app)
        .get(`/api/excusas/${excusaB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(404);
    });

    it('no puede editar una excusa de otro colegio', async () => {
      const res = await request(app)
        .put(`/api/excusas/${excusaB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ motivo: 'Motivo reescrito' });
      expect(res.status).toBe(404);
      expect((await Excusas.findById(excusaB._id)).motivo).toBe('Cita medica');
    });

    it('no puede aprobar una excusa de otro colegio', async () => {
      // Regresión: findById + save() daba por buena la excusa ajena.
      const res = await request(app)
        .put(`/api/excusas/${excusaB._id}/aprobar`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(404);
      expect((await Excusas.findById(excusaB._id)).estado).toBe('pendiente');
    });

    it('no puede rechazar una excusa de otro colegio', async () => {
      const res = await request(app)
        .put(`/api/excusas/${excusaB._id}/rechazar`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(404);
      expect((await Excusas.findById(excusaB._id)).estado).toBe('pendiente');
    });

    it('el admin si aprueba las excusas de su colegio', async () => {
      const excusaA = await Excusas.create({
        institucionId: colegioA._id,
        anioAcademicoId: anioA._id,
        docenteId: adminA._id,
        fechaInicio: new Date('2026-03-02'),
        fechaFin: new Date('2026-03-03'),
        motivo: 'Cita medica'
      });
      const res = await request(app)
        .put(`/api/excusas/${excusaA._id}/aprobar`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(200);
      expect((await Excusas.findById(excusaA._id)).estado).toBe('aprobada');
    });
  });

  // ------------------------------------------------------------------
  describe('Pagos: informacion financiera de terceros', () => {
    let conceptoB; let pagoB;

    beforeEach(async () => {
      conceptoB = await ConceptosContables.create({
        institucionId: colegioB._id, nombre: 'Matricula B', tipo: 'obligatorio'
      });
      pagoB = await Pagos.create({
        institucionId: colegioB._id,
        anioAcademicoId: anioB._id,
        estudianteId: estudianteDocB._id,
        conceptoId: conceptoB._id,
        valor: 500000,
        valorFinal: 500000,
        fechaVencimiento: new Date('2026-02-01')
      });
    });

    it('no puede leer un pago de otro colegio', async () => {
      const res = await request(app)
        .get(`/api/pagos/${pagoB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(404);
    });

    it('no puede consultar los pagos de un alumno de otro colegio', async () => {
      // Regresión: getByEstudiante filtraba solo por estudianteId, asi que
      // cualquier usuario con permiso financiero obtenia el estado de cuenta
      // de un alumno de otro colegio con solo su id.
      const res = await request(app)
        .get(`/api/pagos/estudiante/${estudianteDocB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('no puede registrar el pago de una factura de otro colegio', async () => {
      // Regresión: findById + save() marcaba como pagado el pago ajeno.
      const res = await request(app)
        .put(`/api/pagos/${pagoB._id}/registrar-pago`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ metodoPago: 'efectivo' });
      expect(res.status).toBe(404);
      expect((await Pagos.findById(pagoB._id)).estado).toBe('pendiente');
    });

    it('no puede editar ni borrar un pago de otro colegio', async () => {
      const edit = await request(app)
        .put(`/api/pagos/${pagoB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ valor: 1 });
      expect(edit.status).toBe(404);

      const del = await request(app)
        .delete(`/api/pagos/${pagoB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(del.status).toBe(404);
      expect((await Pagos.findById(pagoB._id)).valor).toBe(500000);
    });

    it('la cartera no incluye deudas de otros colegios', async () => {
      const res = await request(app)
        .get('/api/pagos/cartera')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(200);
      const ids = (res.body.data.estudiantes || [])
        .map(c => c.estudiante?._id || c.estudiante)
        .filter(Boolean)
        .map(String);
      // Este reporte YA venia acotado por institucionId, asi que esta prueba
      // no es una regresion: es una red de seguridad para que siga asi. Se
      // mantiene porque el reporte financiero es el dato mas sensible.
      expect(ids).not.toContain(String(estudianteDocB._id));
    });

    it('el admin si registra los pagos de su colegio', async () => {
      const conceptoA = await ConceptosContables.create({
        institucionId: colegioA._id, nombre: 'Matricula A', tipo: 'obligatorio'
      });
      const pagoA = await Pagos.create({
        institucionId: colegioA._id,
        anioAcademicoId: anioA._id,
        estudianteId: estudianteDocA._id,
        conceptoId: conceptoA._id,
        valor: 400000,
        valorFinal: 400000,
        fechaVencimiento: new Date('2026-02-01')
      });
      const res = await request(app)
        .put(`/api/pagos/${pagoA._id}/registrar-pago`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ metodoPago: 'efectivo' });
      expect(res.status).toBe(200);
      expect((await Pagos.findById(pagoA._id)).estado).toBe('pagado');
    });
  });

  // ------------------------------------------------------------------
  describe('Indicadores de aula', () => {
    let indicadorB;

    beforeEach(async () => {
      const areaB = await Area.create({ institucionId: colegioB._id, nombre: 'Matematicas' });
      const asignaturaB = await Asignatura.create({
        institucionId: colegioB._id, areaId: areaB._id, nombre: 'Algebra'
      });
      indicadorB = await Indicador.create({
        institucionId: colegioB._id,
        anioAcademicoId: anioB._id,
        asignaturaId: asignaturaB._id,
        periodo: 1,
        descripcion: 'Razonamiento algebraico'
      });
    });

    it('no puede leer, editar ni borrar un indicador de otro colegio', async () => {
      const leido = await request(app)
        .get(`/api/indicadores/${indicadorB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(leido.status).toBe(404);

      const editado = await request(app)
        .put(`/api/indicadores/${indicadorB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ descripcion: 'Reescrito' });
      expect(editado.status).toBe(404);

      const borrado = await request(app)
        .delete(`/api/indicadores/${indicadorB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(borrado.status).toBe(404);
      expect(await Indicador.findById(indicadorB._id)).not.toBeNull();
    });

    it('no lista indicadores de otros colegios', async () => {
      const res = await request(app)
        .get('/api/indicadores')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(200);
      expect(res.body.data.every(i => String(i.institucionId) === String(colegioA._id))).toBe(true);
    });
  });

  // ------------------------------------------------------------------
  describe('Conceptos contables', () => {
    it('no puede leer, editar ni borrar un concepto de otro colegio', async () => {
      const conceptoB = await ConceptosContables.create({
        institucionId: colegioB._id, nombre: 'Transporte B', tipo: 'opcional'
      });

      expect((await request(app)
        .get(`/api/conceptos-contables/${conceptoB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)).status).toBe(404);

      expect((await request(app)
        .put(`/api/conceptos-contables/${conceptoB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ nombre: 'Renombrado' })).status).toBe(404);

      expect((await request(app)
        .delete(`/api/conceptos-contables/${conceptoB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)).status).toBe(404);
      expect(await ConceptosContables.findById(conceptoB._id)).not.toBeNull();
    });
  });

  // ------------------------------------------------------------------
  describe('Elecciones y eventos electorales', () => {
    let eleccionB; let eventoB;

    beforeEach(async () => {
      eleccionB = await Elecciones.create({
        institucionId: colegioB._id,
        anioAcademicoId: anioB._id,
        nombre: 'Consejo de estudiantes B',
        fecha: new Date('2026-03-01')
      });
      eventoB = await EventoElectoral.create({
        institucionId: colegioB._id,
        titulo: 'Eleccion B',
        fechaInicio: new Date('2026-03-01'),
        fechaFin: new Date('2026-03-02')
      });
    });

    it('no puede leer ni editar una eleccion de otro colegio', async () => {
      expect((await request(app)
        .get(`/api/elecciones/${eleccionB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)).status).toBe(404);

      expect((await request(app)
        .put(`/api/elecciones/${eleccionB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ nombre: 'Renombrada' })).status).toBe(404);
      expect((await Elecciones.findById(eleccionB._id)).nombre).toBe('Consejo de estudiantes B');
    });

    it('no puede abrir ni cerrar una eleccion de otro colegio', async () => {
      expect((await request(app)
        .put(`/api/elecciones/${eleccionB._id}/abrir`)
        .set('Authorization', `Bearer ${tokenAdmin}`)).status).toBe(404);
      expect((await request(app)
        .put(`/api/elecciones/${eleccionB._id}/cerrar`)
        .set('Authorization', `Bearer ${tokenAdmin}`)).status).toBe(404);
      expect((await Elecciones.findById(eleccionB._id)).estado).toBe('borrador');
    });

    it('no puede leer los resultados de una eleccion de otro colegio', async () => {
      const res = await request(app)
        .get(`/api/elecciones/${eleccionB._id}/resultados`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(404);
    });

    it('no puede leer, editar ni borrar un evento electoral de otro colegio', async () => {
      expect((await request(app)
        .get(`/api/eventos-electorales/${eventoB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)).status).toBe(404);

      expect((await request(app)
        .put(`/api/eventos-electorales/${eventoB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ titulo: 'Renombrado' })).status).toBe(404);

      expect((await request(app)
        .delete(`/api/eventos-electorales/${eventoB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)).status).toBe(404);
      expect(await EventoElectoral.findById(eventoB._id)).not.toBeNull();
    });

    it('no puede votar en una eleccion de otro colegio', async () => {
      const res = await request(app)
        .post(`/api/elecciones/${eleccionB._id}/votar`)
        .set('Authorization', `Bearer ${tokenEstudiante}`)
        .send({ candidatoId: adminB._id, cargo: 'representante' });
      expect(res.status).toBe(404);
    });

    it('el admin si abre y cierra las elecciones de su colegio', async () => {
      const eleccionA = await Elecciones.create({
        institucionId: colegioA._id,
        anioAcademicoId: anioA._id,
        nombre: 'Consejo A',
        fecha: new Date('2026-03-01')
      });
      expect((await request(app)
        .put(`/api/elecciones/${eleccionA._id}/abrir`)
        .set('Authorization', `Bearer ${tokenAdmin}`)).status).toBe(200);
      expect((await Elecciones.findById(eleccionA._id)).estado).toBe('activa');
      expect((await request(app)
        .put(`/api/elecciones/${eleccionA._id}/cerrar`)
        .set('Authorization', `Bearer ${tokenAdmin}`)).status).toBe(200);
      expect((await Elecciones.findById(eleccionA._id)).estado).toBe('cerrada');
    });
  });

  // ------------------------------------------------------------------
  describe('Votos: modelo sin institucionId', () => {
    let eventoA; let eventoB; let votoB;

    beforeEach(async () => {
      eventoA = await EventoElectoral.create({
        institucionId: colegioA._id,
        titulo: 'Eleccion A',
        fechaInicio: new Date('2026-03-01'),
        fechaFin: new Date('2026-03-02')
      });
      eventoB = await EventoElectoral.create({
        institucionId: colegioB._id,
        titulo: 'Eleccion B',
        fechaInicio: new Date('2026-03-01'),
        fechaFin: new Date('2026-03-02')
      });
      votoB = await Voto.create({
        eventoId: eventoB._id,
        estudianteId: estudianteDocB._id,
        candidatoId: adminB._id,
        cargo: 'representante'
      });
    });

    it('no lista los votos de otros colegios', async () => {
      // Regresión: Voto.find() sin ningun filtro devolvia el padron de votos
      // de todos los colegios del sistema a cualquier rector o coordinador.
      const res = await request(app)
        .get('/api/votos')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(200);
      expect(res.body.data.every(v => String(v.eventoId?._id || v.eventoId) === String(eventoA._id))).toBe(true);
    });

    it('no puede leer un voto ajeno', async () => {
      const res = await request(app)
        .get(`/api/votos/${votoB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(404);
    });

    it('no puede contar los votos de un evento de otro colegio', async () => {
      const res = await request(app)
        .get(`/api/votos/evento/${eventoB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('no puede contar los votos de un candidato de otro colegio', async () => {
      const res = await request(app)
        .get(`/api/votos/candidato/${adminB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('no puede borrar un voto ajeno', async () => {
      const res = await request(app)
        .delete(`/api/votos/${votoB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(404);
      expect(await Voto.findById(votoB._id)).not.toBeNull();
    });

    it('un estudiante no puede votar en un evento de otro colegio', async () => {
      const res = await request(app)
        .post('/api/votos')
        .set('Authorization', `Bearer ${tokenEstudiante}`)
        .send({ eventoId: eventoB._id, candidatoId: adminB._id, cargo: 'representante' });
      expect(res.status).toBe(404);
      expect(await Voto.findOne({ eventoId: eventoB._id, estudianteId: estudianteA._id })).toBeNull();
    });

    it('el estudiante si vota en el evento de su colegio', async () => {
      const res = await request(app)
        .post('/api/votos')
        .set('Authorization', `Bearer ${tokenEstudiante}`)
        .send({ eventoId: eventoA._id, candidatoId: adminA._id, cargo: 'representante' });
      expect(res.status).toBe(201);
      expect(res.body.data.eventoId).toBe(String(eventoA._id));
    });

    it('el admin si ve los votos de su colegio', async () => {
      await Voto.create({
        eventoId: eventoA._id,
        estudianteId: estudianteA._id,
        candidatoId: adminA._id,
        cargo: 'representante'
      });
      const res = await request(app)
        .get(`/api/votos/evento/${eventoA._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  // ------------------------------------------------------------------
  describe('Prematrícula: gestión interna', () => {
    let premB;

    beforeEach(async () => {
      premB = await Prematricula.create({
        institucionId: colegioB._id,
        anioAcademicoId: anioB._id,
        estudiante: {
          nombres: 'Niña', apellidos: 'Sosa', tipoDocumento: 'CC', documento: '900111222'
        },
        acudiente: { nombres: 'Maria', apellidos: 'Sosa' },
        gradoSolicitado: 6
      });
    });

    it('no lista prematriculas de otro colegio', async () => {
      const res = await request(app)
        .get('/api/prematriculas')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(200);
      expect(res.body.data.every(p => String(p.institucionId) === String(colegioA._id))).toBe(true);
    });

    it('no puede leer una prematrícula de otro colegio', async () => {
      const res = await request(app)
        .get(`/api/prematriculas/${premB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(404);
    });

    it('no puede editar ni borrar una prematrícula de otro colegio', async () => {
      expect((await request(app)
        .put(`/api/prematriculas/${premB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ gradoSolicitado: 9 })).status).toBe(404);

      expect((await request(app)
        .delete(`/api/prematriculas/${premB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)).status).toBe(404);
      expect(await Prematricula.findById(premB._id)).not.toBeNull();
    });

    it('no puede aprobar ni rechazar una prematrícula de otro colegio', async () => {
      // Regresión: findById + save() aprobaba la prematrícula ajena, y el
      // alta de la matricula se hacia contra su colegio.
      const aprobar = await request(app)
        .put(`/api/prematriculas/${premB._id}/aprobar`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(aprobar.status).toBe(404);

      const rechazar = await request(app)
        .put(`/api/prematriculas/${premB._id}/rechazar`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(rechazar.status).toBe(404);

      expect((await Prematricula.findById(premB._id)).estado).toBe('pendiente');
    });

    it('no puede colgar una prematrícula propia de otro colegio', async () => {
      const res = await request(app)
        .post('/api/prematriculas')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          institucionId: colegioB._id,
          anioAcademicoId: anioB._id,
          estudiante: { nombres: 'X', apellidos: 'Y', tipoDocumento: 'CC', documento: '900333444' },
          acudiente: { nombres: 'Z', apellidos: 'W' },
          gradoSolicitado: 7
        });
      expect(res.status).toBe(201);
      expect(String(res.body.data.institucionId)).toBe(String(colegioA._id));
    });
  });
});
