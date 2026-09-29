const request = require('supertest');
const app = require('../app');
const { crearInstitucion, crearUsuario, loginYToken } = require('./helpers');
const Sede = require('../src/models/Sede');
const Area = require('../src/models/Area');
const Asignatura = require('../src/models/Asignatura');
const Grupo = require('../src/models/Grupo');
const Catalogo = require('../src/models/Catalogo');
const AnioAcademico = require('../src/models/AnioAcademico');

/**
 * Alcance del admin sobre las sedes.
 *
 * Un colegio tiene varias sedes, y su admin las controla todas. El limite
 * valido no es la sede sino el colegio: todo lo que pertenezca a la
 * institucion del admin es suyo, sin importar en que sede este colgado.
 * Estas pruebas fijan exactamente esa frontera, para que un endurecimiento
 * futuro no termine dejando al admin sin acceso a sus propias sedes.
 */
describe('Alcance del admin sobre sedes y catalogos de su colegio', () => {
  let colegioA; let colegioB;
  let adminA; let tokenA;

  beforeEach(async () => {
    colegioA = await crearInstitucion({ nombre: 'Colegio A' });
    colegioB = await crearInstitucion({ nombre: 'Colegio B' });
    adminA = await crearUsuario({ tipoPerfil: 'admin', institucionId: colegioA._id });
    tokenA = await loginYToken(adminA);
  });

  const crearSede = (institucionId, nombre) => Sede.create({ institucionId, nombre });

  describe('Listado de sedes', () => {
    it('solo lista las sedes de su propio colegio', async () => {
      await crearSede(colegioA._id, 'Sede A norte');
      await crearSede(colegioB._id, 'Sede B sur');

      const res = await request(app)
        .get('/api/sedes')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const nombres = res.body.data.map(s => s.nombre);
      expect(nombres).toContain('Sede A norte');
      expect(nombres).not.toContain('Sede B sur');
    });

    it('no puede pedir las sedes de otro colegio con el parametro institucionId', async () => {
      await crearSede(colegioA._id, 'Sede A norte');
      await crearSede(colegioB._id, 'Sede B sur');

      const res = await request(app)
        .get(`/api/sedes?institucionId=${colegioB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const nombres = res.body.data.map(s => s.nombre);
      expect(nombres).not.toContain('Sede B sur');
      expect(nombres).toEqual(expect.arrayContaining(['Sede A norte']));
    });
  });

  describe('Operaciones sobre una sede', () => {
    it('no puede leer una sede de otro colegio', async () => {
      const ajena = await crearSede(colegioB._id, 'Sede B sur');

      const res = await request(app)
        .get(`/api/sedes/${ajena._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
    });

    it('no puede modificar ni borrar una sede de otro colegio', async () => {
      const ajena = await crearSede(colegioB._id, 'Sede B sur');

      const put = await request(app)
        .put(`/api/sedes/${ajena._id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ nombre: 'Secuestrada' });
      expect(put.status).toBe(404);

      const del = await request(app)
        .delete(`/api/sedes/${ajena._id}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(del.status).toBe(404);

      const intacta = await Sede.findById(ajena._id);
      expect(intacta.nombre).toBe('Sede B sur');
    });

    it('no puede crear una sede dentro de otro colegio', async () => {
      const res = await request(app)
        .post('/api/sedes')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ nombre: 'Sede infiltrada', institucionId: String(colegioB._id) });

      expect([201, 400]).toContain(res.status);
      const creada = await Sede.findOne({ nombre: 'Sede infiltrada' });
      if (creada) {
        expect(creada.institucionId.toString()).toBe(colegioA._id.toString());
      } else {
        expect(res.status).toBe(400);
      }
    });

    it('no puede mover una sede propia a otro colegio al editarla', async () => {
      const propia = await crearSede(colegioA._id, 'Sede A norte');

      await request(app)
        .put(`/api/sedes/${propia._id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ institucionId: String(colegioB._id) });

      const despues = await Sede.findById(propia._id);
      expect(despues.institucionId.toString()).toBe(colegioA._id.toString());
    });

    // Esta es la parte que el admin SI necesita: varias sedes, mismo colegio.
    it('el admin gestiona todas las sedes de su colegio, no solo una', async () => {
      const norte = await crearSede(colegioA._id, 'Sede A norte');
      const sur = await crearSede(colegioA._id, 'Sede A sur');

      for (const sede of [norte, sur]) {
        const ver = await request(app)
          .get(`/api/sedes/${sede._id}`)
          .set('Authorization', `Bearer ${tokenA}`);
        expect(ver.status).toBe(200);

        const editar = await request(app)
          .put(`/api/sedes/${sede._id}`)
          .set('Authorization', `Bearer ${tokenA}`)
          .send({ telefono: '5551234' });
        expect(editar.status).toBe(200);
      }
    });
  });

  describe('Areas, asignaturas y grupos (recursos que pueden colgar de una sede)', () => {
    const crearAnio = (institucionId) =>
      AnioAcademico.create({ institucionId, numero: 2026, nombre: '2026', anio: 2026 });

    const montar = async (institucionId) => {
      const anio = await crearAnio(institucionId);
      const area = await Area.create({ institucionId, nombre: 'Matematicas' });
      const asignatura = await Asignatura.create({ institucionId, areaId: area._id, nombre: 'Algebra' });
      const grupo = await Grupo.create({ institucionId, anioAcademicoId: anio._id, grado: 6, letra: 'A', nombre: '6A' });
      return { area, asignatura, grupo };
    };

    it('no puede leer ni modificar recursos de otro colegio', async () => {
      const ajeno = await montar(colegioB._id);

      for (const [ruta, id] of [
        ['/api/areas', ajeno.area._id],
        ['/api/asignaturas', ajeno.asignatura._id],
        ['/api/grupos', ajeno.grupo._id]
      ]) {
        const ver = await request(app).get(`${ruta}/${id}`).set('Authorization', `Bearer ${tokenA}`);
        expect(ver.status).toBe(404);

        const editar = await request(app).put(`${ruta}/${id}`).set('Authorization', `Bearer ${tokenA}`).send({ nombre: 'Secuestrado' });
        expect(editar.status).toBe(404);
      }

      expect((await Area.findById(ajeno.area._id)).nombre).toBe('Matematicas');
      expect((await Grupo.findById(ajeno.grupo._id)).nombre).toBe('6A');
    });

    it('no puede borrar recursos de otro colegio', async () => {
      const ajeno = await montar(colegioB._id);

      const res = await request(app)
        .delete(`/api/areas/${ajeno.area._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(await Area.countDocuments({ _id: ajeno.area._id })).toBe(1);
    });

    it('el admin si alcanza sus propios recursos aunque colguen de una sede', async () => {
      const sedePropia = await crearSede(colegioA._id, 'Sede A norte');
      const anio = await crearAnio(colegioA._id);
      const area = await Area.create({ institucionId: colegioA._id, sedeId: sedePropia._id, nombre: 'Ciencias' });
      const grupo = await Grupo.create({ institucionId: colegioA._id, sedeId: sedePropia._id, anioAcademicoId: anio._id, grado: 7, letra: 'B', nombre: '7B' });

      const verArea = await request(app).get(`/api/areas/${area._id}`).set('Authorization', `Bearer ${tokenA}`);
      expect(verArea.status).toBe(200);

      const verGrupo = await request(app).get(`/api/grupos/${grupo._id}`).set('Authorization', `Bearer ${tokenA}`);
      expect(verGrupo.status).toBe(200);

      const editarGrupo = await request(app)
        .put(`/api/grupos/${grupo._id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ nombre: '7B renegado' });
      expect(editarGrupo.status).toBe(200);
    });

    it('el filtro por sede solo puede estrechar, nunca ampliar el alcance', async () => {
      const sedeAjena = await crearSede(colegioB._id, 'Sede B sur');
      const anioB = await crearAnio(colegioB._id);
      const anioA = await crearAnio(colegioA._id);
      const grupoAjeno = await Grupo.create({ institucionId: colegioB._id, sedeId: sedeAjena._id, anioAcademicoId: anioB._id, grado: 8, letra: 'C', nombre: '8C' });
      await Grupo.create({ institucionId: colegioA._id, anioAcademicoId: anioA._id, grado: 8, letra: 'C', nombre: '8C propio' });

      const res = await request(app)
        .get(`/api/grupos?sedeId=${sedeAjena._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map(g => g._id);
      expect(ids).not.toContain(grupoAjeno._id.toString());
    });
  });

  describe('Catalogos', () => {
    it('no puede listar los catalogos de otro colegio por parametro', async () => {
      const propio = await Catalogo.create({ institucionId: colegioA._id, nombre: 'Tipos de documento', tipo: 'tipoDocumento', codigo: 'CC' });
      const ajeno = await Catalogo.create({ institucionId: colegioB._id, nombre: 'Tipos de documento', tipo: 'tipoDocumento', codigo: 'CC' });

      const res = await request(app)
        .get(`/api/catalogos?institucionId=${colegioB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map(c => c._id);
      expect(ids).not.toContain(ajeno._id.toString());
      expect(ids).toContain(propio._id.toString());
    });

    it('no puede leer ni borrar un catalogo de otro colegio', async () => {
      const ajeno = await Catalogo.create({ institucionId: colegioB._id, nombre: 'Niveles', tipo: 'otro', codigo: 'N1' });

      const ver = await request(app).get(`/api/catalogos/${ajeno._id}`).set('Authorization', `Bearer ${tokenA}`);
      expect(ver.status).toBe(404);

      const del = await request(app).delete(`/api/catalogos/${ajeno._id}`).set('Authorization', `Bearer ${tokenA}`);
      expect(del.status).toBe(404);
      expect(await Catalogo.countDocuments({ _id: ajeno._id })).toBe(1);
    });
  });
});
