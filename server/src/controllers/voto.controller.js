const Voto = require("../models/Voto");

// Obtener todos los votos
const getAll = async (req, res) => {
  try {
    const data = await Voto.find()
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
    const data = await Voto.findById(req.params.id)
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
    const voto = await Voto.findByIdAndDelete(req.params.id);

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
    const data = await Voto.find({
      eventoId: req.params.eventoId,
    }).populate("estudianteId", "nombre apellido");

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
    const data = await Voto.find({
      candidatoId: req.params.candidatoId,
    });

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