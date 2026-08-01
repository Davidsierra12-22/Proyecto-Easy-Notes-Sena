const Matricula = require('../models/Matricula');

const getAll = async (req, res) => {
  try {
    const filter = { institucionId: req.usuario.institucionId };
    if (req.query.estado) filter.estado = req.query.estado;
    if (req.query.anioAcademicoId) filter.anioAcademicoId = req.query.anioAcademicoId;
    if (req.query.grupoId) filter.grupoId = req.query.grupoId;

    const data = await Matricula.find(filter)
      .populate('estudianteId', 'nombres apellidos documento tipoDocumento')
      .populate('grupoId', 'nombre grado jornada')
      .sort({ createdAt: -1 });
    res.json({ ok: true, data, message: 'Listado obtenido' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const data = await Matricula.findById(req.params.id)
      .populate('estudianteId', 'nombres apellidos documento tipoDocumento')
      .populate('grupoId', 'nombre grado jornada');
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al obtener', error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const body = { ...req.body, institucionId: req.usuario.institucionId };
    const data = await Matricula.create(body);
    res.status(201).json({ ok: true, data, message: 'Matricula creada correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al crear', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const data = await Matricula.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, data, message: 'Actualizado correctamente' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al actualizar', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const data = await Matricula.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
    res.json({ ok: true, message: 'Eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al eliminar', error: error.message });
  }
};

const retirar = async (req, res) => {
  try {
    const data = await Matricula.findById(req.params.id);
    if (!data) return res.status(404).json({ ok: false, message: 'Matricula no encontrada' });
    if (data.estado !== 'activa') {
      return res.status(400).json({ ok: false, message: `La matricula ya esta ${data.estado}` });
    }
    data.estado = 'retirada';
    data.observaciones = req.body.observaciones || data.observaciones;
    await data.save();
    res.json({ ok: true, data, message: 'Matricula retirada' });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al retirar', error: error.message });
  }
};

const promover = async (req, res) => {
  try {
    const data = await Matricula.findById(req.params.id);
    if (!data) return res.status(404).json({ ok: false, message: 'Matricula no encontrada' });

    const promovido = req.body.promovido === true;
    if (promovido) {
      data.estado = 'graduado';
    } else {
      data.estado = 'trasladada';
    }
    data.promovido = promovido;
    data.observaciones = req.body.observaciones || data.observaciones;
    await data.save();
    res.json({
      ok: true,
      data,
      message: promovido ? 'Estudiante promovido' : 'Estudiante no promovido'
    });
  } catch (error) {
    res.status(400).json({ ok: false, message: 'Error al promover', error: error.message });
  }
};

const getByGrupo = async (req, res) => {
  try {
    const filter = {
      institucionId: req.usuario.institucionId,
      grupoId: req.params.grupoId,
      estado: 'activa'
    };
    if (req.query.anioAcademicoId) filter.anioAcademicoId = req.query.anioAcademicoId;

    const data = await Matricula.find(filter)
      .populate('estudianteId', 'nombres apellidos documento tipoDocumento')
      .sort({ 'estudianteId.apellidos': 1 });
    res.json({ ok: true, data, message: 'Listado del grupo obtenido' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al listar grupo', error: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove, retirar, promover, getByGrupo };
