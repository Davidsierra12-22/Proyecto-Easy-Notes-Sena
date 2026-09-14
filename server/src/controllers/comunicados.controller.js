const Comunicados = require("../models/Comunicados");
const { paginarQuery } = require("../utils/paginacion");

// Obtener todos
const getAll = async (req, res) => {
  try {
    const filtro = req.usuario?.institucionId
      ? { institucionId: req.usuario.institucionId }
      : {};

    const pg = paginarQuery(req);
    const query = Comunicados.find(filtro)
      .populate("remitenteId", "nombres apellidos")
      .populate("destinatarios.usuarioId", "nombres apellidos")
      .sort({ createdAt: -1 });

    if (pg) {
      const [data, total] = await Promise.all([
        query.skip(pg.skip).limit(pg.limite),
        Comunicados.countDocuments(filtro)
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
      message: "Error al listar comunicados",
      error: error.message,
    });
  }
};

// Obtener por id
const getById = async (req, res) => {
  try {
    const data = await Comunicados.findById(req.params.id)
      .populate("remitenteId", "nombres apellidos")
      .populate("destinatarios.usuarioId", "nombres apellidos");

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Comunicado no encontrado",
      });
    }

    res.json({
      ok: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al obtener comunicado",
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
      body.remitenteId = req.usuario._id;
    }

    const data = await Comunicados.create(body);

    res.status(201).json({
      ok: true,
      data,
      message: "Comunicado creado correctamente",
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: "Error al crear comunicado",
      error: error.message,
    });
  }
};

// Actualizar
const update = async (req, res) => {
  try {
    const data = await Comunicados.findByIdAndUpdate(
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
        message: "Comunicado no encontrado",
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
    const data = await Comunicados.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Comunicado no encontrado",
      });
    }

    res.json({
      ok: true,
      message: "Comunicado eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al eliminar",
      error: error.message,
    });
  }
};

// Marcar como leído
const marcarLeido = async (req, res) => {
  try {
    const comunicado = await Comunicados.findById(req.params.id);

    if (!comunicado) {
      return res.status(404).json({
        ok: false,
        message: "Comunicado no encontrado",
      });
    }

    const yaLeido = comunicado.leido.some(
      (item) => item.usuarioId.toString() === req.usuario._id.toString()
    );

    if (!yaLeido) {
      comunicado.leido.push({
        usuarioId: req.usuario._id,
        fechaLectura: new Date(),
      });

      await comunicado.save();
    }

    res.json({
      ok: true,
      data: comunicado,
      message: "Comunicado marcado como leído",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error al marcar como leído",
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
  marcarLeido,
};