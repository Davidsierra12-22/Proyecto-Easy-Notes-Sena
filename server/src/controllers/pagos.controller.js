const Pagos = require("../models/Pagos");

// Obtener todos
const getAll = async (req, res) => {
  try {
    const filtro = req.usuario?.institucionId
      ? { institucionId: req.usuario.institucionId }
      : {};

    const data = await Pagos.find(filtro)
      .populate("estudianteId", "nombre apellido documento")
      .populate("conceptoId", "nombre valor")
      .sort({ createdAt: -1 });

    res.json({
      ok: true,
      data,
      message: "Listado obtenido",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al listar pagos",
      error: error.message,
    });
  }
};

// Obtener por ID
const getById = async (req, res) => {
  try {
    const data = await Pagos.findById(req.params.id)
      .populate("estudianteId", "nombre apellido documento")
      .populate("conceptoId", "nombre valor");

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Pago no encontrado",
      });
    }

    res.json({
      ok: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al obtener pago",
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

    const data = await Pagos.create(body);

    res.status(201).json({
      ok: true,
      data,
      message: "Pago creado correctamente",
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: "Error al crear pago",
      error: error.message,
    });
  }
};

// Actualizar
const update = async (req, res) => {
  try {
    const data = await Pagos.findByIdAndUpdate(
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
        message: "Pago no encontrado",
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
    const data = await Pagos.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Pago no encontrado",
      });
    }

    res.json({
      ok: true,
      message: "Pago eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al eliminar pago",
      error: error.message,
    });
  }
};

// Registrar pago
const registrarPago = async (req, res) => {
  try {
    const pago = await Pagos.findById(req.params.id);

    if (!pago) {
      return res.status(404).json({
        ok: false,
        message: "Pago no encontrado",
      });
    }

    pago.estado = "pagado";
pago.fechaPago = new Date();
pago.recibidoPor = req.usuario._id;

if (req.body.metodoPago) {
    pago.metodoPago = req.body.metodoPago;
}

if (req.body.referencia) {
    pago.referencia = req.body.referencia;
}

await pago.save();

    res.json({
      ok: true,
      data: pago,
      message: "Pago registrado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al registrar pago",
      error: error.message,
    });
  }
};

// Obtener pagos por estudiante
const getByEstudiante = async (req, res) => {
  try {
    const data = await Pagos.find({
      estudianteId: req.params.id,
    })
      .populate("conceptoId", "nombre valor")
      .sort({ createdAt: -1 });

    res.json({
      ok: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al consultar pagos",
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
  registrarPago,
  getByEstudiante,
};