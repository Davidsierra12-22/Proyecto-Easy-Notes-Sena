const EventoElectoral = require("../models/EventoElectoral");

// Obtener todos los eventos
const getAll = async (req, res) => {
  try {
    const filtro = req.usuario?.institucionId
      ? { institucionId: req.usuario.institucionId }
      : {};

    const data = await EventoElectoral.find(filtro).sort({
      createdAt: -1,
    });

    res.json({
      ok: true,
      data,
      message: "Eventos obtenidos correctamente",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al obtener eventos",
      error: error.message,
    });
  }
};

// Obtener un evento por ID
const getById = async (req, res) => {
  try {
    const data = await EventoElectoral.findById(req.params.id);

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Evento electoral no encontrado",
      });
    }

    res.json({
      ok: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al obtener el evento",
      error: error.message,
    });
  }
};

// Crear evento
const create = async (req, res) => {
  try {
    const body = { ...req.body };

    if (req.usuario?.institucionId) {
      body.institucionId = req.usuario.institucionId;
    }

    const data = await EventoElectoral.create(body);

    res.status(201).json({
      ok: true,
      data,
      message: "Evento creado correctamente",
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: "Error al crear el evento",
      error: error.message,
    });
  }
};

// Actualizar evento
const update = async (req, res) => {
  try {
    const data = await EventoElectoral.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Evento electoral no encontrado",
      });
    }

    res.json({
      ok: true,
      data,
      message: "Evento actualizado correctamente",
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: "Error al actualizar el evento",
      error: error.message,
    });
  }
};

// Eliminar evento
const remove = async (req, res) => {
  try {
    const data = await EventoElectoral.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Evento electoral no encontrado",
      });
    }

    res.json({
      ok: true,
      message: "Evento eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al eliminar el evento",
      error: error.message,
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};