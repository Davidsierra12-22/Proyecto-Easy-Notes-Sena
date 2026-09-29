/**
 * Alcance de institucion.
 *
 * EasyNotes guarda todos los colegios en una misma base de datos, asi que
 * toda consulta que parta de un id recibido del cliente debe comprobar que
 * el recurso pertenece a la institucion del usuario autenticado.
 *
 * Sobre las sedes
 * ---------------
 * Un colegio tiene varias sedes y su direccion las controla todas. La
 * frontera valida no es la sede, sino el colegio: Sede, Area, Asignatura y
 * Grupo cuelgan de la institucion y pueden Colgarse ademas de una sede.
 * Por eso el alcance se calcula SIEMPRE con institucionId y nunca con
 * sedeId. Usar sedeId dejaria fuera los recursos de la propia institucion
 * que todavia no tienen sede asignada, rompiendo el trabajo del admin.
 *
 * Este modulo solo construye filtros. El metodo de Mongoose se elige en el
 * sitio de llamada, a proposito: findByIdAndUpdate recibe un id, no un
 * filtro, y pasado un objeto ignora en silencio el resto de claves y
 * escribe solo por _id.
 */

const conAlcance = (usuario, filtro = {}) => {
  const f = { ...filtro };
  if (usuario?.institucionId) f.institucionId = usuario.institucionId;
  return f;
};

/**
 * Filtro de listados.
 *
 * Los parametros de la URL pueden estrechar el alcance, nunca ampliarlo.
 * Por eso institucionId solo se toma de la query cuando el usuario no tiene
 * institucion asignada (super_admin, que administra las de su nucleo).
 */
const conAlcanceListado = (usuario, filtro = {}, query = {}) => {
  const f = conAlcance(usuario, filtro);
  if (!usuario?.institucionId && query.institucionId) {
    f.institucionId = query.institucionId;
  }
  return f;
};

/**
 * Campos que jamas pueden venir del cuerpo de la peticion al crear o
 * editar un recurso ya ligado a una institucion. Sin esto, un admin
 * podria colgar un area, una sede o un usuario de otro colegio.
 */
const sinCamposDeAlcance = (body) => {
  const copia = { ...body };
  delete copia._id;
  delete copia.institucionId;
  delete copia.nucleoId;
  return copia;
};

/**
 * Filtro para documentos que NO guardan institucionId, sino una referencia
 * a otro documento que si la guarda.
 *
 * Voto es el caso: solo guarda eventoId, y es EventoElectoral quien tiene la
 * institucion. Filtrar por institucionId aqui no daria ningun resultado
 * (Mongoose lo descartaria), asi que se resuelve primero el conjunto de
 * documentos padre que si son del colegio del usuario y se filtra por ese
 * conjunto.
 *
 * Si el usuario no tiene institucion (super_admin) no se recorta nada, igual
 * que en conAlcance.
 */
const conAlcancePorRelacion = async (usuario, filtro, { modelo, campo }) => {
  const f = { ...filtro };
  if (usuario?.institucionId) {
    const permitidos = await modelo
      .find({ institucionId: usuario.institucionId })
      .select("_id")
      .lean();
    // Un conjunto vacio debe dejar el filtro en "sin resultados", no en
    // "sin condicion": con { $in: [] } Mongoose no encuentra nada, que es
    // justo lo que corresponde a un colegio sin eventos.
    f[campo] = { $in: permitidos.map((d) => d._id) };
  }
  return f;
};

module.exports = {
  conAlcance,
  conAlcanceListado,
  sinCamposDeAlcance,
  conAlcancePorRelacion,
};
