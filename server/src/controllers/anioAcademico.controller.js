const Model = require('../models/AnioAcademico');
const PromocionService = require('../services/promocionService');
const { conAlcance, sinCamposDeAlcance } = require('../utils/alcance');
const getAll = async (req, res) => {
    try {
        const filter = conAlcance(req.usuario, {});
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

const activar = async (req, res) => {
    try {
        // Se resuelve primero el anio de destino. Antes, el updateMany de
        // abajo corria antes de comprobar el alcance: un intento sobre un
        // anio ajeno fallaba, pero dejaba mientras tanto cerrados los anos
        // del propio colegio.
        const data = await Model.findOneAndUpdate(
            conAlcance(req.usuario, { _id: req.params.id }),
            { estado: 'activo' },
            { new: true }
        );
        // findOneAndUpdate devuelve null cuando el filtro no encuentra nada.
        // Sin esta comprobacion, el alcance hacia su trabajo pero la peticion
        // respondia 200 con data vacia, dando a entender que si se actualizo.
        if (!data) return res.status(404).json({ ok: false, message: 'Año académico no encontrado' });

        const institucionId = req.usuario?.institucionId;
        await Model.updateMany({ institucionId, _id: { $ne: data._id } }, { estado: 'cerrado' });

        res.json({ ok: true, data, message: 'Año académico activado. Los demás han sido desactivados.' });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al activar', error: error.message });
    }
};

const cerrar = async (req, res) => {
    try {
        const data = await Model.findOneAndUpdate(conAlcance(req.usuario, { _id: req.params.id }), { estado: 'cerrado' }, { new: true });
        if (!data) return res.status(404).json({ ok: false, message: 'Año académico no encontrado' });
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

        const anioOrigen = await Model.findOne(conAlcance(req.usuario, { _id: anioOrigenId }));
        if (!anioOrigen) {
            return res.status(404).json({ ok: false, message: 'Año origen no encontrado' });
        }
        if (anioOrigen.estado !== 'activo') {
            return res.status(400).json({ ok: false, message: 'El año origen debe estar activo para cerrar con migración' });
        }

        // El destino tambien se acota: si no, se migrarian matriculas
        // hacia el año de otro colegio.
        const anioDestino = await Model.findOne(conAlcance(req.usuario, { _id: anioDestinoId }));
        if (!anioDestino) {
            return res.status(404).json({ ok: false, message: 'Año destino no encontrado' });
        }

        const resultado = await PromocionService.cerrarAnio({
            anioOrigenId,
            anioDestinoId,
            institucionId
        });

        await Model.findOneAndUpdate(conAlcance(req.usuario, { _id: anioOrigenId }), { estado: 'cerrado' });

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

// RN-CRO-04: Apertura temporal de período por admin
const reabrirPeriodo = async (req, res) => {
    try {
        const { periodo, duracionMinutos, motivo } = req.body;

        if (!periodo || !duracionMinutos) {
            return res.status(400).json({
                ok: false,
                message: 'periodo (número) y duracionMinutos son requeridos'
            });
        }

        if (duracionMinutos < 5 || duracionMinutos > 480) {
            return res.status(400).json({
                ok: false,
                message: 'La duración debe ser entre 5 y 480 minutos (8 horas máximo)'
            });
        }

        const anio = await Model.findOne(conAlcance(req.usuario, { _id: req.params.id }));
        if (!anio) {
            return res.status(404).json({ ok: false, message: 'Año académico no encontrado' });
        }

        const periodoData = anio.cronograma?.periodos?.find(
            p => p.numero === parseInt(periodo, 10)
        );

        if (!periodoData) {
            return res.status(404).json({ ok: false, message: `Período ${periodo} no encontrado` });
        }

        if (periodoData.estado !== 'cerrado') {
            return res.status(400).json({
                ok: false,
                message: `El período ${periodo} no está cerrado. Estado actual: ${periodoData.estado}`
            });
        }

        // Calcular fecha de expiración
        const ahora = new Date();
        const expiracion = new Date(ahora.getTime() + duracionMinutos * 60 * 1000);

        // Actualizar período
        periodoData.estado = 'abierto_temporal';
        periodoData.reaperturaTemporal = {
            activa: true,
            fechaApertura: ahora,
            fechaExpiracion: expiracion,
            adminId: req.usuario._id,
            motivo: motivo || 'Corrección excepcional autorizada por administrador'
        };

        await anio.save();

        res.json({
            ok: true,
            data: {
                anioId: anio._id,
                periodo: parseInt(periodo, 10),
                estado: 'abierto_temporal',
                fechaApertura: ahora,
                fechaExpiracion: expiracion,
                duracionMinutos,
                admin: req.usuario._id,
                motivo: motivo || 'Corrección excepcional autorizada por administrador'
            },
            message: `Período ${periodo} reabierto temporalmente por ${duracionMinutos} minutos`
        });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al reabrir período', error: error.message });
    }
};

// Cerrar reapertura temporal antes de que expire (o al expirar)
const cerrarReapertura = async (req, res) => {
    try {
        const { periodo } = req.body;

        if (!periodo) {
            return res.status(400).json({ ok: false, message: 'periodo (número) es requerido' });
        }

        const anio = await Model.findOne(conAlcance(req.usuario, { _id: req.params.id }));
        if (!anio) {
            return res.status(404).json({ ok: false, message: 'Año académico no encontrado' });
        }

        const periodoData = anio.cronograma?.periodos?.find(
            p => p.numero === parseInt(periodo, 10)
        );

        if (!periodoData) {
            return res.status(404).json({ ok: false, message: `Período ${periodo} no encontrado` });
        }

        if (periodoData.estado !== 'abierto_temporal') {
            return res.status(400).json({
                ok: false,
                message: `El período ${periodo} no tiene reapertura temporal activa`
            });
        }

        periodoData.estado = 'cerrado';
        periodoData.reaperturaTemporal = { activa: false };

        await anio.save();

        res.json({
            ok: true,
            data: { periodo: parseInt(periodo, 10), estado: 'cerrado' },
            message: `Reapertura del período ${periodo} cerrada`
        });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al cerrar reapertura', error: error.message });
    }
};

module.exports = {
    getAll, getById, create, update, remove,
    activar, cerrar, cerrarConMigracion,
    reabrirPeriodo, cerrarReapertura
};
