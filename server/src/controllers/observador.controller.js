const Observador = require("../models/Observador");

// Obtener todos
const getAll = async (req, res) => {
  try {
    const filtro = req.usuario?.institucionId
      ? { institucionId: req.usuario.institucionId }
      : {};

    const data = await Observador.find(filtro)
      .populate("estudianteId", "nombre apellido")
      .populate("docenteId", "nombre apellido")
      .sort({ createdAt: -1 });

    res.json({
      ok: true,
      data,
      message: "Listado obtenido",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al listar observaciones",
      error: error.message,
    });
  }
};

// Obtener por ID
const getById = async (req, res) => {
  try {
    const data = await Observador.findById(req.params.id)
      .populate("estudianteId", "nombre apellido")
      .populate("docenteId", "nombre apellido");

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Registro no encontrado",
      });
    }

    res.json({
      ok: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al obtener registro",
      error: error.message,
    });
  }
};

// Crear
const create = async (req, res) => {
  try {
    const body = { ...req.body };

    if (req.usuario?.institucionId) {
      body.institucionId = req.usuario.institucionId;
    }

    if (req.usuario?._id) {
      body.docenteId = req.usuario._id;
    }

    const data = await Observador.create(body);

    res.status(201).json({
      ok: true,
      data,
      message: "Registro creado correctamente",
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: "Error al crear registro",
      error: error.message,
    });
  }
};

// Actualizar
const update = async (req, res) => {
  try {
    const data = await Observador.findByIdAndUpdate(
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
        message: "Registro no encontrado",
      });
    }

    res.json({
      ok: true,
      data,
      message: "Actualizado correctamente",
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: "Error al actualizar",
      error: error.message,
    });
  }
};

// Eliminar
const remove = async (req, res) => {
  try {
    const data = await Observador.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Registro no encontrado",
      });
    }

    res.json({
      ok: true,
      message: "Eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al eliminar",
      error: error.message,
    });
  }
};

// Agregar seguimiento
const agregarSeguimiento = async (req, res) => {
  try {
    const observacion = await Observador.findById(req.params.id);

    if (!observacion) {
      return res.status(404).json({
        ok: false,
        message: "Registro no encontrado",
      });
    }

observacion.seguimiento.push({
    observacion: req.body.observacion,
    fecha: new Date(),
    responsable: req.usuario._id,
});

    await observacion.save();

    res.json({
      ok: true,
      data: observacion,
      message: "Seguimiento agregado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al agregar seguimiento",
      error: error.message,
    });
  }
};

// Obtener observaciones por estudiante
const getByEstudiante = async (req, res) => {
  try {
    const data = await Observador.find({
      estudianteId: req.params.id,
    })
      .populate("docenteId", "nombre apellido")
      .sort({ createdAt: -1 });

    res.json({
      ok: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al consultar observaciones",
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
  agregarSeguimiento,
  getByEstudiante,
};