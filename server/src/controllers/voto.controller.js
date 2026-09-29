const Voto = require("../models/Voto");
const EventoElectoral = require("../models/EventoElectoral");
const { conAlcancePorRelacion } = require("../utils/alcance");

// Voto no guarda institucionId: se acota por los eventos del colegio.
const porEventoDeMiColegio = (req, filtro = {}) =>
  conAlcancePorRelacion(req.usuario, filtro, {
    modelo: EventoElectoral,
    campo: "eventoId",
  });

// Obtener todos los votos
const getAll = async (req, res) => {
  try {
    // Sin este filtro, Voto.find() devolvia el Padrón de votos de todos los
    // colegios del sistema a cualquier rector o coordinador.
    const data = await Voto.find(await porEventoDeMiColegio(req))
      .populate("eventoId", "titulo")
      .populate("estudianteId", "nombre apellido")
      .sort({ createdAt: -1 });

    res.json({
      ok: true,
      data,
      message: "Listado de votos obtenido correctamente",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al obtener los votos",
      error: error.message,
    });
  }
};

// Obtener voto por ID
const getById = async (req, res) => {
  try {
    const data = await Voto.findOne(
      await porEventoDeMiColegio(req, { _id: req.params.id })
    )
      .populate("eventoId", "titulo")
      .populate("estudianteId", "nombre apellido");

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Voto no encontrado",
      });
    }

    res.json({
      ok: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al obtener el voto",
      error: error.message,
    });
  }
};

// Registrar voto
const create = async (req, res) => {
  try {
    // El evento debe ser del colegio del votante. Sin esta comprobacion un
    // estudiante emitia su voto en una eleccion de otro colegio.
    const evento = await EventoElectoral.findOne({
      _id: req.body.eventoId,
      ...(req.usuario?.institucionId
        ? { institucionId: req.usuario.institucionId }
        : {}),
    });
    if (!evento) {
      return res.status(404).json({
        ok: false,
        message: "Evento electoral no encontrado",
      });
    }

    const existe = await Voto.findOne({
      eventoId: req.body.eventoId,
      estudianteId: req.usuario._id,
      cargo: req.body.cargo,
    });

    if (existe) {
      return res.status(400).json({
        ok: false,
        message: "Ya registró un voto para este cargo.",
      });
    }

    const voto = await Voto.create({
      eventoId: req.body.eventoId,
      estudianteId: req.usuario._id,
      candidatoId: req.body.candidatoId,
      cargo: req.body.cargo,
    });

    res.status(201).json({
      ok: true,
      data: voto,
      message: "Voto registrado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al registrar el voto",
      error: error.message,
    });
  }
};

// Eliminar voto
const remove = async (req, res) => {
  try {
    const voto = await Voto.findOneAndDelete(
      await porEventoDeMiColegio(req, { _id: req.params.id })
    );

    if (!voto) {
      return res.status(404).json({
        ok: false,
        message: "Voto no encontrado",
      });
    }

    res.json({
      ok: true,
      message: "Voto eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al eliminar el voto",
      error: error.message,
    });
  }
};

// Obtener votos por evento
const getByEvento = async (req, res) => {
  try {
    const data = await Voto.find(
      await porEventoDeMiColegio(req, { eventoId: req.params.eventoId })
    ).populate("estudianteId", "nombre apellido");

    res.json({
      ok: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al consultar votos del evento",
      error: error.message,
    });
  }
};

// Obtener votos por candidato
const getByCandidato = async (req, res) => {
  try {
    const data = await Voto.find(
      await porEventoDeMiColegio(req, { candidatoId: req.params.candidatoId })
    );

    res.json({
      ok: true,
      total: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al consultar votos del candidato",
      error: error.message,
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  remove,
  getByEvento,
  getByCandidato,
};