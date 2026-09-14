const Excusas = require("../models/Excusas");

// Obtener todas
const getAll = async (req, res) => {
  try {
    const filtro = req.usuario?.institucionId
      ? { institucionId: req.usuario.institucionId }
      : {};

    if (req.usuario?.tipoPerfil === 'estudiante') {
      filtro.estudianteId = req.usuario._id;
    }

    const data = await Excusas.find(filtro)
      .populate("estudianteId", "nombres apellidos documento")
      .populate("aprobadoPor", "nombre apellido")
      .sort({ createdAt: -1 });

    res.json({
      ok: true,
      data,
      message: "Listado obtenido",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al listar excusas",
      error: error.message,
    });
  }
};

// Obtener por ID
const getById = async (req, res) => {
  try {
    const data = await Excusas.findById(req.params.id)
      .populate("estudianteId", "nombre apellido")
      .populate("aprobadoPor", "nombre apellido");

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Excusa no encontrada",
      });
    }

    res.json({
      ok: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al obtener la excusa",
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

    if (req.usuario?.tipoPerfil === 'estudiante') {
      body.estudianteId = req.usuario._id;
    }

    const data = await Excusas.create(body);

    res.status(201).json({
      ok: true,
      data,
      message: "Excusa creada correctamente",
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: "Error al crear la excusa",
      error: error.message,
    });
  }
};

// Actualizar
const update = async (req, res) => {
  try {
    const data = await Excusas.findByIdAndUpdate(
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
        message: "Excusa no encontrada",
      });
    }

    res.json({
      ok: true,
      data,
      message: "Actualizada correctamente",
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: "Error al actualizar",
      error: error.message,
    });
  }
};

// Aprobar
const aprobar = async (req, res) => {
  try {
    const data = await Excusas.findById(req.params.id);

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Excusa no encontrada",
      });
    }

    data.estado = "aprobada";
    data.aprobadoPor = req.usuario._id;
    data.aprobadoEn = new Date();

    await data.save();

    res.json({
      ok: true,
      data,
      message: "Excusa aprobada correctamente",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al aprobar la excusa",
      error: error.message,
    });
  }
};

// Rechazar
const rechazar = async (req, res) => {
  try {
    const data = await Excusas.findById(req.params.id);

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Excusa no encontrada",
      });
    }

    data.estado = "rechazada";
    data.aprobadoPor = req.usuario._id;
    data.aprobadoEn = new Date();

    await data.save();

    res.json({
      ok: true,
      data,
      message: "Excusa rechazada correctamente",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al rechazar la excusa",
      error: error.message,
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  aprobar,
  rechazar,
};