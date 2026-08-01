const ConceptosContables = require("../models/ConceptosContables");

// Obtener todos
const getAll = async (req, res) => {
  try {
    const filtro = req.usuario?.institucionId
      ? { institucionId: req.usuario.institucionId }
      : {};

    const data = await ConceptosContables.find(filtro).sort({ createdAt: -1 });

    res.json({
      ok: true,
      data,
      message: "Listado obtenido",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al listar conceptos contables",
      error: error.message,
    });
  }
};

// Obtener por ID
const getById = async (req, res) => {
  try {
    const data = await ConceptosContables.findById(req.params.id);

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Concepto contable no encontrado",
      });
    }

    res.json({
      ok: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al obtener concepto contable",
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

    const data = await ConceptosContables.create(body);

    res.status(201).json({
      ok: true,
      data,
      message: "Concepto contable creado correctamente",
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: "Error al crear concepto contable",
      error: error.message,
    });
  }
};

// Actualizar
const update = async (req, res) => {
  try {
    const data = await ConceptosContables.findByIdAndUpdate(
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
        message: "Concepto contable no encontrado",
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
      message: "Error al actualizar concepto contable",
      error: error.message,
    });
  }
};

// Eliminar
const remove = async (req, res) => {
  try {
    const data = await ConceptosContables.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Concepto contable no encontrado",
      });
    }

    res.json({
      ok: true,
      message: "Concepto contable eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al eliminar concepto contable",
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