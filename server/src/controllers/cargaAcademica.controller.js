const Model = require('../models/CargaAcademica');
const Grupo = require('../models/Grupo');
const { conAlcance, sinCamposDeAlcance } = require('../utils/alcance');

const getAll = async (req, res) => {
    try {
        const filter = conAlcance(req.usuario, {});
        if (req.query.sedeId) {
            const gruposSede = await Grupo.find({ institucionId: req.usuario.institucionId, sedeId: req.query.sedeId }).select('_id');
            filter.grupoId = { $in: gruposSede.map(g => g._id) };
        }
        const data = await Model.find(filter);
        res.json({ ok: true, data, message: 'Listado obtenido' });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al listar', error: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const data = await Model.findOne(conAlcance(req.usuario, { _id: req.params.id }));
        if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
        res.json({ ok: true, data });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al obtener', error: error.message });
    }
};

const create = async (req, res) => {
    try {
        const body = sinCamposDeAlcance(req.body);
        if (req.usuario?.institucionId) body.institucionId = req.usuario.institucionId;
        const data = await Model.create(body);
        res.status(201).json({ ok: true, data, message: 'Creado correctamente' });
    } catch (error) {
        res.status(400).json({ ok: false, message: 'Error al crear', error: error.message });
    }
};

const update = async (req, res) => {
    try {
        // La reasignacion de docente, grupo o asignatura es una operacion
        // propia, no un efecto colateral de editar campos como horas.
        const cambios = sinCamposDeAlcance(req.body);
        delete cambios.docenteId;
        delete cambios.grupoId;
        delete cambios.asignaturaId;
        delete cambios.anioAcademicoId;

        const data = await Model.findOneAndUpdate(
            conAlcance(req.usuario, { _id: req.params.id }),
            cambios,
            { new: true, runValidators: true }
        );
        if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
        res.json({ ok: true, data, message: 'Actualizado correctamente' });
    } catch (error) {
        res.status(400).json({ ok: false, message: 'Error al actualizar', error: error.message });
    }
};

const remove = async (req, res) => {
    try {
        const data = await Model.findOneAndDelete(conAlcance(req.usuario, { _id: req.params.id }));
        if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
        res.json({ ok: true, message: 'Eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al eliminar', error: error.message });
    }
};

// --- Funciones Específicas ---
const getByDocente = async (req, res) => {
    try {
        const data = await Model.find(conAlcance(req.usuario, { docenteId: req.params.docenteId }))
            .populate('grupoId', 'nombre grado jornada')
            .populate('asignaturaId', 'nombre abreviatura');
        res.json({ ok: true, data, message: 'Carga académica del docente obtenida' });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al obtener', error: error.message });
    }
};

const getByGrupo = async (req, res) => {
    try {
        const data = await Model.find(conAlcance(req.usuario, { grupoId: req.params.grupoId }));
        res.json({ ok: true, data, message: 'Carga académica del grupo obtenida' });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al obtener', error: error.message });
    }
};

module.exports = { getAll, getById, create, update, remove, getByDocente, getByGrupo };