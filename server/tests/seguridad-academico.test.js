const request = require('supertest');
const app = require('../app');
const { crearInstitucion, crearUsuario, loginYToken } = require('./helpers');
const AnioAcademico = require('../src/models/AnioAcademico');
const Grupo = require('../src/models/Grupo');
const Area = require('../src/models/Area');
const Asignatura = require('../src/models/Asignatura');
const Calificacion = require('../src/models/Calificacion');
const CargaAcademica = require('../src/models/CargaAcademica');
const Matricula = require('../src/models/Matricula');
const Actividad = require('../src/models/Actividad');
const Indicador = require('../src/models/Indicador');

/**
 * Aislamiento del modulo academico.
 *
 * A diferencia de otros lotes, aqui los findById sin filtro permiten
 * ESCRIBIR en datos de otro colegio, no solo leerlos: retirar una
 * matricula, promover a un estudiante, reabrir un periodo de notas ya
 * cerrado o activar el ano academico de la victima.
 *
 * Cada caso de ataque tiene ademas su contraparte positiva: el admin
 * sigue pudiendo hacer lo mismo dentro de su colegio, el docente sigue
 * calificando los grupos que tiene asignados y el estudiante sigue
 * viendo unicamente su propio boletin.
 */
describe('Aislamiento del modulo academico entre colegios', () => {
  let colegioA; let colegioB;
  let adminA; let secretariaA; let docenteA; let docenteSinCarga;
  let tokenAdmin; let tokenSecretaria; let tokenDocente;
  let anioA; let anioB;
  let grupoA; let grupoB;
  let asignaturaA; let asignaturaA2; let asignaturaB;
  let estudianteA; let estudianteB;

  const crearAnio = (institucionId) =>
    AnioAcademico.create({ institucionId, anio: 2026, nombre: '2026', numero: 2026 });

  beforeEach(async () => {
    colegioA = await crearInstitucion({ nombre: 'Colegio A' });
    colegioB = await crearInstitucion({ nombre: 'Colegio B' });

    adminA = await crearUsuario({ tipoPerfil: 'admin', institucionId: colegioA._id });
    secretariaA = await crearUsuario({ tipoPerfil: 'secretaria', institucionId: colegioA._id });
    docenteA = await crearUsuario({ tipoPerfil: 'docente', institucionId: colegioA._id });
    docenteSinCarga = await crearUsuario({ tipoPerfil: 'docente', institucionId: colegioA._id });
    estudianteA = await crearUsuario({ tipoPerfil: 'estudiante', institucionId: colegioA._id });
    estudianteB = await crearUsuario({ tipoPerfil: 'estudiante', institucionId: colegioB._id });

    tokenAdmin = await loginYToken(adminA);
    tokenSecretaria = await loginYToken(secretariaA);
    tokenDocente = await loginYToken(docenteA);

    anioA = await crearAnio(colegioA._id);
    anioB = await crearAnio(colegioB._id);

    grupoA = await Grupo.create({ institucionId: colegioA._id, anioAcademicoId: anioA._id, nombre: '6A', grado: 6 });
    grupoB = await Grupo.create({ institucionId: colegioB._id, anioAcademicoId: anioB._id, nombre: '6B', grado: 6 });

    const areaA = await Area.create({ institucionId: colegioA._id, nombre: 'Matematicas' });
    const areaB = await Area.create({ institucionId: colegioB._id, nombre: 'Matematicas' });
    asignaturaA = await Asignatura.create({ institucionId: colegioA._id, areaId: areaA._id, nombre: 'Algebra' });
    asignaturaA2 = await Asignatura.create({ institucionId: colegioA._id, areaId: areaA._id, nombre: 'Geometria' });
    asignaturaB = await Asignatura.create({ institucionId: colegioB._id, areaId: areaB._id, nombre: 'Algebra' });

    // El docente A solo tiene carga en grupoA/asignaturaA.
    await CargaAcademica.create({
      institucionId: colegioA._id,
      anioAcademicoId: anioA._id,
      grupoId: grupoA._id,
      asignaturaId: asignaturaA._id,
      docenteId: docenteA._id,
      puedeCalificar: true
    });
  });

  // ------------------------------------------------------------------
  describe('Matriculas: escrituras que antes cruzaban colegios', () => {
    let matriculaB;

    beforeEach(async () => {
      matriculaB = await Matricula.create({
        institucionId: colegioB._id,
        anioAcademicoId: anioB._id,
        estudianteId: estudianteB._id,
        grupoId: grupoB._id
      });
    });

    it('no puede retirar la matricula de un alumno de otro colegio', async () => {
      const res = await request(app)
        .put(`/api/matriculas/${matriculaB._id}/retirar`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ observaciones: 'secuestro' });

      expect(res.status).toBe(404);
      const despues = await Matricula.findById(matriculaB._id);
      expect(despues.estado).toBe('activa');
    });

    it('no puede promover a un alumno de otro colegio', async () => {
      const res = await request(app)
        .put(`/api/matriculas/${matriculaB._id}/promover`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ promovido: false });

      expect(res.status).toBe(404);
      const despues = await Matricula.findById(matriculaB._id);
      expect(despues.promovido).toBeFalsy();
    });

    it('no puede leer, editar ni borrar la matricula de otro colegio', async () => {
      const ver = await request(app).get(`/api/matriculas/${matriculaB._id}`).set('Authorization', `Bearer ${tokenAdmin}`);
      expect(ver.status).toBe(404);

      const editar = await request(app).put(`/api/matriculas/${matriculaB._id}`).set('Authorization', `Bearer ${tokenAdmin}`).send({ observaciones: 'x' });
      expect(editar.status).toBe(404);

      const borrar = await request(app).delete(`/api/matriculas/${matriculaB._id}`).set('Authorization', `Bearer ${tokenAdmin}`);
      expect(borrar.status).toBe(404);
      expect(await Matricula.countDocuments({ _id: matriculaB._id })).toBe(1);
    });

    it('no puede mover una matricula propia a otro colegio al editarla', async () => {
      const propia = await Matricula.create({
        institucionId: colegioA._id,
        anioAcademicoId: anioA._id,
        estudianteId: estudianteA._id,
        grupoId: grupoA._id
      });

      await request(app)
        .put(`/api/matriculas/${propia._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ institucionId: String(colegioB._id) });

      const despues = await Matricula.findById(propia._id);
      expect(despues.institucionId.toString()).toBe(colegioA._id.toString());
    });

    // Contraparte positiva: retirar dentro del propio colegio sigue funcionando.
    it('el admin si retira una matricula de su propio colegio', async () => {
      const propia = await Matricula.create({
        institucionId: colegioA._id,
        anioAcademicoId: anioA._id,
        estudianteId: estudianteA._id,
        grupoId: grupoA._id
      });

      const res = await request(app)
        .put(`/api/matriculas/${propia._id}/retirar`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ observaciones: 'se traslado' });

      expect(res.status).toBe(200);
      const despues = await Matricula.findById(propia._id);
      expect(despues.estado).toBe('retirada');
    });
  });

  // ------------------------------------------------------------------
  describe('Anio academico: no se toca el calendario de otro colegio', () => {
    it('un intento fallido de activar no deja cerrados los años del propio colegio', async () => {
      // Regresión: activar cerraba primero los años del colegio y solo
      // después comprobaba el alcance, así que un intento sobre un año ajeno
      // fallaba pero dejaba el año propio cerrado como efecto colateral.
      const anioA2 = await AnioAcademico.create({
        institucionId: colegioA._id, anio: 2027, nombre: '2027', numero: 2027
      });
      await AnioAcademico.findById(anioA._id).then(a => a.updateOne({ estado: 'activo' }));

      const res = await request(app)
        .put(`/api/anios-academicos/${anioB._id}/activar`)
        .set('Authorization', `Bearer ${tokenSecretaria}`);
      expect(res.status).toBe(404);

      expect((await AnioAcademico.findById(anioA._id)).estado).toBe('activo');
      expect((await AnioAcademico.findById(anioA2._id)).estado).not.toBe('cerrado');
    });

    it('no puede reabrir un periodo cerrado de otro colegio', async () => {
      anioB.cronograma = {
        periodos: [{ numero: 1, nombre: 'Primer periodo', estado: 'cerrado' }]
      };
      await anioB.save();

      const res = await request(app)
        .put(`/api/anios-academicos/${anioB._id}/reabrir-periodo`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ periodo: 1, duracionMinutos: 60, motivo: 'secuestro' });

      expect(res.status).toBe(404);
      const despues = await AnioAcademico.findById(anioB._id);
      expect(despues.cronograma.periodos[0].estado).toBe('cerrado');
      // El schema deja reaperturaTemporal con { activa: false } por defecto,
      // asi que se comprueba que nunca se activo.
      expect(despues.cronograma.periodos[0].reaperturaTemporal?.activa).toBeFalsy();
    });

    it('no puede activar ni cerrar el ano academico de otro colegio', async () => {
      const activar = await request(app)
        .put(`/api/anios-academicos/${anioB._id}/activar`)
        .set('Authorization', `Bearer ${tokenSecretaria}`);
      expect(activar.status).toBe(404);

      const cerrar = await request(app)
        .put(`/api/anios-academicos/${anioB._id}/cerrar`)
        .set('Authorization', `Bearer ${tokenSecretaria}`);
      expect(cerrar.status).toBe(404);

      const despues = await AnioAcademico.findById(anioB._id);
      expect(despues.estado).toBe('prematricula');
    });

    it('no puede cerrar por migracion un ano que pertenece a otro colegio', async () => {
      const anioDestinoAjeno = await AnioAcademico.create({
        institucionId: colegioB._id, anio: 2027, nombre: '2027', numero: 2027
      });

      // El origen (anioB) ya es de otro colegio, y el destino tambien.
      const res = await request(app)
        .put(`/api/anios-academicos/${anioB._id}/cerrar-migracion`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ anioDestinoId: String(anioDestinoAjeno._id) });

      expect(res.status).toBe(404);
      const origen = await AnioAcademico.findById(anioB._id);
      expect(origen.estado).toBe('prematricula');
    });

    it('no puede leer ni borrar el ano academico de otro colegio', async () => {
      const ver = await request(app).get(`/api/anios-academicos/${anioB._id}`).set('Authorization', `Bearer ${tokenAdmin}`);
      expect(ver.status).toBe(404);

      const borrar = await request(app).delete(`/api/anios-academicos/${anioB._id}`).set('Authorization', `Bearer ${tokenAdmin}`);
      expect(borrar.status).toBe(404);
      expect(await AnioAcademico.countDocuments({ _id: anioB._id })).toBe(1);
    });

    it('la secretaria si puede activar el ano de su propio colegio', async () => {
      const res = await request(app)
        .put(`/api/anios-academicos/${anioA._id}/activar`)
        .set('Authorization', `Bearer ${tokenSecretaria}`);

      expect(res.status).toBe(200);
      expect((await AnioAcademico.findById(anioA._id)).estado).toBe('activo');
    });
  });

  // ------------------------------------------------------------------
  describe('Calificaciones', () => {
    let calificacionB;

    beforeEach(async () => {
      calificacionB = await Calificacion.create({
        institucionId: colegioB._id,
        anioAcademicoId: anioB._id,
        estudianteId: estudianteB._id,
        asignaturaId: asignaturaB._id,
        grupoId: grupoB._id,
        periodo: 1,
        nota: 4.5
      });
    });

    it('no puede leer, editar ni borrar una calificacion de otro colegio', async () => {
      const ver = await request(app).get(`/api/calificaciones/${calificacionB._id}`).set('Authorization', `Bearer ${tokenAdmin}`);
      expect(ver.status).toBe(404);

      const editar = await request(app).put(`/api/calificaciones/${calificacionB._id}`).set('Authorization', `Bearer ${tokenAdmin}`).send({ nota: 1 });
      expect(editar.status).toBe(404);

      const borrar = await request(app).delete(`/api/calificaciones/${calificacionB._id}`).set('Authorization', `Bearer ${tokenAdmin}`);
      expect(borrar.status).toBe(404);
      expect((await Calificacion.findById(calificacionB._id)).nota).toBe(4.5);
    });

    it('no puede colgar una calificacion propia de un grupo de otro colegio', async () => {
      // Se comparan solo los registros de A: comparar contra el total de
      // la coleccion hacia que la asercion pasara por casualidad.
      const antes = await Calificacion.countDocuments({ institucionId: colegioA._id });

      await request(app)
        .post('/api/calificaciones/masivo')
        .set('Authorization', `Bearer ${tokenDocente}`)
        .send({
          grupoId: String(grupoB._id),
          asignaturaId: String(asignaturaB._id),
          anioAcademicoId: String(anioB._id),
          periodo: 1,
          calificaciones: [{ estudianteId: String(estudianteB._id), nota: 5 }]
        });

      // No debe quedar ningun registro de A apuntando a datos de B.
      const filtradas = await Calificacion.find({ institucionId: colegioA._id });
      expect(filtradas.length).toBe(antes);
    });

    it('el docente no puede calificar un grupo sin carga asignada', async () => {
      const sinCarga = await loginYToken(docenteSinCarga);

      const res = await request(app)
        .post('/api/calificaciones/masivo')
        .set('Authorization', `Bearer ${sinCarga}`)
        .send({
          grupoId: String(grupoA._id),
          asignaturaId: String(asignaturaA._id),
          anioAcademicoId: String(anioA._id),
          periodo: 1,
          calificaciones: [{ estudianteId: String(estudianteA._id), nota: 5 }]
        });

      expect(res.status).toBe(403);
      const creada = await Calificacion.findOne({ estudianteId: estudianteA._id, grupoId: grupoA._id });
      expect(creada).toBeNull();
    });

    it('el docente si puede calificar el grupo que tiene asignado', async () => {
      const res = await request(app)
        .post('/api/calificaciones/masivo')
        .set('Authorization', `Bearer ${tokenDocente}`)
        .send({
          grupoId: String(grupoA._id),
          asignaturaId: String(asignaturaA._id),
          anioAcademicoId: String(anioA._id),
          periodo: 1,
          calificaciones: [{ estudianteId: String(estudianteA._id), nota: 4.2 }]
        });

      expect(res.status).toBe(200);
      const creada = await Calificacion.findOne({ estudianteId: estudianteA._id, grupoId: grupoA._id });
      expect(creada.nota).toBe(4.2);
      // La institucion la hereda del docente, nunca del cuerpo.
      expect(creada.institucionId.toString()).toBe(colegioA._id.toString());
    });

    it('descarta los campos que no deben escribirse al guardar notas', async () => {
      const res = await request(app)
        .post('/api/calificaciones/masivo')
        .set('Authorization', `Bearer ${tokenDocente}`)
        .send({
          grupoId: String(grupoA._id),
          asignaturaId: String(asignaturaA._id),
          anioAcademicoId: String(anioA._id),
          periodo: 1,
          calificaciones: [{
            estudianteId: String(estudianteA._id),
            nota: 3.5,
            // Campos que antes llegaban crudo al documento:
            estado: 'cerrado',
            calificacionDocenteId: 'inventado',
            __v: 99
          }]
        });

      expect(res.status).toBe(200);
      const creada = await Calificacion.findOne({ estudianteId: estudianteA._id, grupoId: grupoA._id });
      expect(creada.estado).toBe('cerrado');
      expect(creada.calificacionDocenteId).toBeUndefined();
    });

    it('el estudiante sigue viendo solo su propio boletin', async () => {
      const tokenEstudiante = await loginYToken(estudianteA);

      const propio = await request(app)
        .get(`/api/calificaciones/estudiante/${estudianteA._id}/anio/${anioA._id}`)
        .set('Authorization', `Bearer ${tokenEstudiante}`);
      expect(propio.status).toBe(200);

      // Su propio id, pero apuntando al boletin de un alumno de otro colegio.
      const ajena = await Calificacion.findById(calificacionB._id);
      const dentro = await request(app)
        .get(`/api/calificaciones/estudiante/${estudianteA._id}/anio/${ajena.anioAcademicoId._id}`)
        .set('Authorization', `Bearer ${tokenEstudiante}`);
      expect(dentro.status).toBe(200);
      const ids = JSON.stringify(dentro.body);
      expect(ids).not.toContain(calificacionB._id.toString());
    });
  });

  // ------------------------------------------------------------------
  describe('Carga academica: el listado de un docente no puede ser de otro colegio', () => {
    it('no puede consultar la carga de un docente de otro colegio', async () => {
      const docenteB = await crearUsuario({ tipoPerfil: 'docente', institucionId: colegioB._id });
      await CargaAcademica.create({
        institucionId: colegioB._id,
        anioAcademicoId: anioB._id,
        grupoId: grupoB._id,
        asignaturaId: asignaturaB._id,
        docenteId: docenteB._id
      });

      const res = await request(app)
        .get(`/api/carga-academica/docente/${docenteB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });

    it('no puede consultar la carga de un grupo de otro colegio', async () => {
      const docenteB = await crearUsuario({ tipoPerfil: 'docente', institucionId: colegioB._id });
      await CargaAcademica.create({
        institucionId: colegioB._id,
        anioAcademicoId: anioB._id,
        grupoId: grupoB._id,
        asignaturaId: asignaturaB._id,
        docenteId: docenteB._id
      });

      const res = await request(app)
        .get(`/api/carga-academica/grupo/${grupoB._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });

    it('no puede leer, editar ni borrar una carga de otro colegio', async () => {
      const ajena = await CargaAcademica.create({
        institucionId: colegioB._id,
        anioAcademicoId: anioB._id,
        grupoId: grupoB._id,
        asignaturaId: asignaturaB._id,
        docenteId: (await crearUsuario({ tipoPerfil: 'docente', institucionId: colegioB._id }))._id,
        horasSemanales: 20
      });

      const ver = await request(app).get(`/api/carga-academica/${ajena._id}`).set('Authorization', `Bearer ${tokenAdmin}`);
      expect(ver.status).toBe(404);

      const editar = await request(app).put(`/api/carga-academica/${ajena._id}`).set('Authorization', `Bearer ${tokenAdmin}`).send({ horasSemanales: 99 });
      expect(editar.status).toBe(404);

      const borrar = await request(app).delete(`/api/carga-academica/${ajena._id}`).set('Authorization', `Bearer ${tokenAdmin}`);
      expect(borrar.status).toBe(404);
      expect((await CargaAcademica.findById(ajena._id)).horasSemanales).toBe(20);
    });

    it('no puede reasignar una carga propia a un docente de otro colegio', async () => {
      const propia = await CargaAcademica.findOne({ docenteId: docenteA._id });
      const docenteB = await crearUsuario({ tipoPerfil: 'docente', institucionId: colegioB._id });

      await request(app)
        .put(`/api/carga-academica/${propia._id}`)
        .set('Authorization', `Bearer ${tokenSecretaria}`)
        .send({ docenteId: String(docenteB._id) });

      const despues = await CargaAcademica.findById(propia._id);
      expect(despues.docenteId.toString()).toBe(docenteA._id.toString());
    });

    // Contraparte positiva: la secretaria si asigna carga dentro de su colegio.
    it('la secretaria si crea y consulta la carga de su propio colegio', async () => {
      const crear = await request(app)
        .post('/api/carga-academica')
        .set('Authorization', `Bearer ${tokenSecretaria}`)
        .send({
          anioAcademicoId: String(anioA._id),
          grupoId: String(grupoA._id),
          asignaturaId: String(asignaturaA2._id),
          docenteId: String(docenteSinCarga._id),
          horasSemanales: 10
        });
      expect(crear.status).toBe(201);

      const consulta = await request(app)
        .get(`/api/carga-academica/docente/${docenteSinCarga._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(consulta.status).toBe(200);
      expect(consulta.body.data.length).toBe(1);
    });
  });

  // ------------------------------------------------------------------
  describe('Actividades', () => {
    let actividadB;

    beforeEach(async () => {
      const indicadorB = await Indicador.create({
        institucionId: colegioB._id,
        anioAcademicoId: anioB._id,
        asignaturaId: asignaturaB._id,
        periodo: 1,
        descripcion: 'Indicador de prueba'
      });
      actividadB = await Actividad.create({
        institucionId: colegioB._id,
        anioAcademicoId: anioB._id,
        indicadorId: indicadorB._id,
        asignaturaId: asignaturaB._id,
        grupoId: grupoB._id,
        docenteId: estudianteB._id,
        periodo: 1,
        titulo: 'Actividad de B'
      });
    });

    it('no puede leer, editar ni borrar una actividad de otro colegio', async () => {
      const ver = await request(app).get(`/api/actividades/${actividadB._id}`).set('Authorization', `Bearer ${tokenAdmin}`);
      expect(ver.status).toBe(404);

      const editar = await request(app).put(`/api/actividades/${actividadB._id}`).set('Authorization', `Bearer ${tokenDocente}`).send({ titulo: 'Secuestrada' });
      expect(editar.status).toBe(404);

      const borrar = await request(app).delete(`/api/actividades/${actividadB._id}`).set('Authorization', `Bearer ${tokenDocente}`);
      expect(borrar.status).toBe(404);
      expect((await Actividad.findById(actividadB._id)).titulo).toBe('Actividad de B');
    });
  });
});
