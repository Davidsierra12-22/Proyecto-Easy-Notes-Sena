const Model = require('../models/Asignatura');
const { paginarQuery } = require('../utils/paginacion');
const { conAlcance, sinCamposDeAlcance } = require('../utils/alcance');

const getAll = async (req, res) => {
    try {
        const filter = req.usuario?.institucionId ? { institucionId: req.usuario.institucionId } : {};

        const pg = paginarQuery(req, 50);
        let query = Model.find(filter).sort({ nombre: 1 });

        if (pg) {
            const [data, total] = await Promise.all([
                query.skip(pg.skip).limit(pg.limite),
                Model.countDocuments(filter)
            ]);
            return res.json({ ok: true, data, message: 'Listado obtenido', paginacion: { pagina: pg.pagina, limite: pg.limite, total, totalPaginas: Math.ceil(total / pg.limite) } });
        }

        const data = await query;
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
        const data = await Model.findOneAndUpdate(
            conAlcance(req.usuario, { _id: req.params.id }),
            sinCamposDeAlcance(req.body),
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

// --- Función Específica ---
const getByArea = async (req, res) => {
    try {
        const filter = { areaId: req.params.areaId };
        const data = await Model.find(filter);
        res.json({ ok: true, data, message: 'Asignaturas obtenidas por área' });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al obtener', error: error.message });
    }
};

module.exports = { getAll, getById, create, update, remove, getByArea };