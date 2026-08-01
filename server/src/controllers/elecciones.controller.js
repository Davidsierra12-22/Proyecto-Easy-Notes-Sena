const Elecciones = require("../models/Elecciones");

// Obtener todas
const getAll = async (req, res) => {
  try {
    const filtro = req.usuario?.institucionId
      ? { institucionId: req.usuario.institucionId }
      : {};

    const data = await Elecciones.find(filtro).sort({ createdAt: -1 });

    res.json({
      ok: true,
      data,
      message: "Listado obtenido",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al listar elecciones",
      error: error.message,
    });
  }
};

// Obtener por ID
const getById = async (req, res) => {
  try {
    const data = await Elecciones.findById(req.params.id);

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Elección no encontrada",
      });
    }

    res.json({
      ok: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al obtener elección",
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

    const data = await Elecciones.create(body);

    res.status(201).json({
      ok: true,
      data,
      message: "Elección creada correctamente",
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: "Error al crear elección",
      error: error.message,
    });
  }
};

// Actualizar
const update = async (req, res) => {
  try {
    const data = await Elecciones.findByIdAndUpdate(
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
        message: "Elección no encontrada",
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

// Eliminar
const remove = async (req, res) => {
  try {
    const data = await Elecciones.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Elección no encontrada",
      });
    }

    res.json({
      ok: true,
      message: "Eliminada correctamente",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al eliminar",
      error: error.message,
    });
  }
};

// Abrir elección
const abrir = async (req, res) => {
  try {
    const eleccion = await Elecciones.findById(req.params.id);

    if (!eleccion) {
      return res.status(404).json({
        ok: false,
        message: "Elección no encontrada",
      });
    }

    eleccion.estado = "activa";

    await eleccion.save();

    res.json({
      ok: true,
      data: eleccion,
      message: "Elección abierta correctamente",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al abrir elección",
      error: error.message,
    });
  }
};

// Cerrar elección
const cerrar = async (req, res) => {
  try {
    const eleccion = await Elecciones.findById(req.params.id);

    if (!eleccion) {
      return res.status(404).json({
        ok: false,
        message: "Elección no encontrada",
      });
    }

    eleccion.estado = "cerrada";

    await eleccion.save();

    res.json({
      ok: true,
      data: eleccion,
      message: "Elección cerrada correctamente",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al cerrar elección",
      error: error.message,
    });
  }
};

// Votar
const votar = async (req, res) => {
  try {
    const eleccion = await Elecciones.findById(req.params.id);

    if (!eleccion) {
      return res.status(404).json({
        ok: false,
        message: "Elección no encontrada",
      });
    }

    if (eleccion.estado !== "activa") {
      return res.status(400).json({
        ok: false,
        message: "La elección no está activa",
      });
    }

    const yaVoto = eleccion.votos.some(
      (v) => v.estudianteId.toString() === req.usuario._id.toString()
    );

    if (yaVoto) {
      return res.status(400).json({
        ok: false,
        message: "El usuario ya votó",
      });
    }

    eleccion.votos.push({
      estudianteId: req.usuario._id,
      candidatoId: req.body.candidatoId,
    });

    await eleccion.save();

    res.json({
      ok: true,
      message: "Voto registrado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al registrar voto",
      error: error.message,
    });
  }
};

// Resultados
const resultados = async (req, res) => {
  try {
    const eleccion = await Elecciones.findById(req.params.id);

    if (!eleccion) {
      return res.status(404).json({
        ok: false,
        message: "Elección no encontrada",
      });
    }

    const conteo = {};

    eleccion.votos.forEach((voto) => {
      const id = voto.candidatoId.toString();
      conteo[id] = (conteo[id] || 0) + 1;
    });

    res.json({
      ok: true,
      data: conteo,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al obtener resultados",
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
  votar,
  resultados,
  abrir,
  cerrar,
};