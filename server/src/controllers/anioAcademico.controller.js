const Model = require('../models/AnioAcademico');
const PromocionService = require('../services/promocionService');

const getAll = async (req, res) => {
    try {
        const filter = req.usuario?.institucionId ? { institucionId: req.usuario.institucionId } : {};
        const data = await Model.find(filter);
        res.json({ ok: true, data, message: 'Listado obtenido' });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al listar', error: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const data = await Model.findById(req.params.id);
        if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
        res.json({ ok: true, data });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al obtener', error: error.message });
    }
};

const create = async (req, res) => {
    try {
        const body = { ...req.body };
        if (req.usuario?.institucionId) body.institucionId = req.usuario.institucionId;
        const data = await Model.create(body);
        res.status(201).json({ ok: true, data, message: 'Creado correctamente' });
    } catch (error) {
        res.status(400).json({ ok: false, message: 'Error al crear', error: error.message });
    }
};

const update = async (req, res) => {
    try {
        const data = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
        res.json({ ok: true, data, message: 'Actualizado correctamente' });
    } catch (error) {
        res.status(400).json({ ok: false, message: 'Error al actualizar', error: error.message });
    }
};

const remove = async (req, res) => {
    try {
        const data = await Model.findByIdAndDelete(req.params.id);
        if (!data) return res.status(404).json({ ok: false, message: 'No encontrado' });
        res.json({ ok: true, message: 'Eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al eliminar', error: error.message });
    }
};

const activar = async (req, res) => {
    try {
        const institucionId = req.usuario?.institucionId;
        await Model.updateMany({ institucionId }, { estado: 'cerrado' });
        const data = await Model.findByIdAndUpdate(req.params.id, { estado: 'activo' }, { new: true });
        res.json({ ok: true, data, message: 'Año académico activado. Los demás han sido desactivados.' });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al activar', error: error.message });
    }
};

const cerrar = async (req, res) => {
    try {
        const data = await Model.findByIdAndUpdate(req.params.id, { estado: 'cerrado' }, { new: true });
        res.json({ ok: true, data, message: 'Año académico cerrado' });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al cerrar', error: error.message });
    }
};

const cerrarConMigracion = async (req, res) => {
    try {
        const anioOrigenId = req.params.id;
        const { anioDestinoId } = req.body;

        if (!anioDestinoId) {
            return res.status(400).json({ ok: false, message: 'anioDestinoId es requerido' });
        }

        const institucionId = req.usuario?.institucionId;

        // Verificar que el año origen esté activo
        const anioOrigen = await Model.findById(anioOrigenId);
        if (!anioOrigen) {
            return res.status(404).json({ ok: false, message: 'Año origen no encontrado' });
        }
        if (anioOrigen.estado !== 'activo') {
            return res.status(400).json({ ok: false, message: 'El año origen debe estar activo para cerrar con migración' });
        }

        // Verificar que el año destino exista
        const anioDestino = await Model.findById(anioDestinoId);
        if (!anioDestino) {
            return res.status(404).json({ ok: false, message: 'Año destino no encontrado' });
        }

        // Ejecutar migración masiva (RN-PRO-05)
        const resultado = await PromocionService.cerrarAnio({
            anioOrigenId,
            anioDestinoId,
            institucionId
        });

        // Cerrar el año origen
        await Model.findByIdAndUpdate(anioOrigenId, { estado: 'cerrado' });

        res.json({
            ok: true,
            data: {
                anioOrigen: anioOrigen.anio,
                anioDestino: anioDestino.anio,
                ...resultado
            },
            message: `Año cerrado. ${resultado.estudiantesCopiados} estudiantes migrados, ${resultado.matriculasCreadas} matrículas creadas.`
        });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al cerrar con migración', error: error.message });
    }
};

module.exports = { getAll, getById, create, update, remove, activar, cerrar, cerrarConMigracion };
