const Pagos = require("../models/Pagos");
const { paginarQuery } = require("../utils/paginacion");

// Obtener todos
const getAll = async (req, res) => {
  try {
    const filtro = req.usuario?.institucionId
      ? { institucionId: req.usuario.institucionId }
      : {};

    const pg = paginarQuery(req);
    const query = Pagos.find(filtro)
      .populate("estudianteId", "nombres apellidos documento")
      .populate("conceptoId", "nombre valor")
      .sort({ createdAt: -1 });

    if (pg) {
      const [data, total] = await Promise.all([
        query.skip(pg.skip).limit(pg.limite),
        Pagos.countDocuments(filtro)
      ]);
      return res.json({
        ok: true,
        data,
        paginacion: { pagina: pg.pagina, limite: pg.limite, total, totalPaginas: Math.ceil(total / pg.limite) },
      });
    }

    const data = await query;

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
      .populate("estudianteId", "nombres apellidos documento")
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

// Reporte de cartera (RN-CONT-04): deudas pendientes/vencidas por estudiante
const getCartera = async (req, res) => {
  try {
    const filtro = {
      estado: { $in: ["pendiente", "vencido"] },
    };
    if (req.usuario?.institucionId) {
      filtro.institucionId = req.usuario.institucionId;
    }

    const pagos = await Pagos.find(filtro)
      .populate("estudianteId", "nombres apellidos documento")
      .populate("conceptoId", "nombre valor")
      .sort({ fechaVencimiento: 1 });

    const porEstudiante = {};
    for (const p of pagos) {
      const key = p.estudianteId?._id?.toString() || p.estudianteId?.toString();
      if (!key || !p.estudianteId) continue;

      const diasMora = p.estado === "vencido" && p.fechaVencimiento
        ? Math.max(0, Math.floor((Date.now() - new Date(p.fechaVencimiento).getTime()) / 86400000))
        : 0;

      const item = porEstudiante[key] || (porEstudiante[key] = {
        estudiante: p.estudianteId,
        totalDeuda: 0,
        conceptos: [],
        diasMora: 0,
      });

      item.totalDeuda += p.valorFinal ?? p.valor ?? 0;
      item.diasMora = Math.max(item.diasMora, diasMora);
      item.conceptos.push({
        concepto: p.conceptoId?.nombre || "Concepto",
        valor: p.valorFinal ?? p.valor ?? 0,
        estado: p.estado,
        fechaVencimiento: p.fechaVencimiento,
        pagoId: p._id,
      });
    }

    const estudiantes = Object.values(porEstudiante)
      .sort((a, b) => b.totalDeuda - a.totalDeuda);

    const resumen = {
      totalCartera: estudiantes.reduce((a, b) => a + b.totalDeuda, 0),
      estudiantesDeudores: estudiantes.length,
      enMora: estudiantes.filter((x) => x.diasMora > 0).length,
    };

    res.json({
      ok: true,
      data: { resumen, estudiantes },
      message: "Cartera obtenida",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al obtener cartera",
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
  getCartera,
};