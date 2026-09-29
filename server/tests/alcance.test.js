const mongoose = require('mongoose');
const { conAlcance, conAlcanceListado, sinCamposDeAlcance } = require('../src/utils/alcance');

const A = new mongoose.Types.ObjectId();
const B = new mongoose.Types.ObjectId();

describe('Alcance de institucion', () => {
  describe('conAlcance', () => {
    it('acota por institucion cuando el usuario tiene una', () => {
      const f = conAlcance({ institucionId: A }, { _id: B });
      expect(f).toEqual({ _id: B, institucionId: A });
    });

    it('no inventa institucion para el super_admin, que administra varias', () => {
      const f = conAlcance({ tipoPerfil: 'super_admin' }, { _id: B });
      expect(f).toEqual({ _id: B });
    });

    it('no filtra nada si no hay usuario, en vez de devolverlo todo', () => {
      const f = conAlcance(undefined, {});
      expect(f.institucionId).toBeUndefined();
    });

    it('no muta el filtro recibido', () => {
      const original = { _id: B };
      conAlcance({ institucionId: A }, original);
      expect(original).toEqual({ _id: B });
    });
  });

  describe('conAlcanceListado', () => {
    it('impide que la query amplie el alcance del admin', () => {
      const f = conAlcanceListado({ institucionId: A }, {}, { institucionId: B });
      expect(f.institucionId.toString()).toBe(A.toString());
    });

    it('permite que el super_admin filtre por institucion', () => {
      const f = conAlcanceListado({ tipoPerfil: 'super_admin' }, {}, { institucionId: B });
      expect(f.institucionId.toString()).toBe(B.toString());
    });

    it('conserva los demas filtros del listado', () => {
      const f = conAlcanceListado({ institucionId: A }, { estado: 'activo' }, {});
      expect(f).toEqual({ estado: 'activo', institucionId: A });
    });
  });

  describe('sinCamposDeAlcance', () => {
    it('descarta los campos que deciden a que colegio pertenece el recurso', () => {
      const limpio = sinCamposDeAlcance({
        nombre: 'Matematicas',
        _id: B,
        institucionId: B,
        nucleoId: B
      });
      expect(limpio).toEqual({ nombre: 'Matematicas' });
    });

    it('no muta el cuerpo original', () => {
      const body = { nombre: 'X', institucionId: B };
      sinCamposDeAlcance(body);
      expect(body.institucionId).toBe(B);
    });
  });
});
