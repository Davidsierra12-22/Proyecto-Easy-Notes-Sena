# EasyNotes-Rutas — Plan de Trabajo

## Integrantes

| Persona | Rol |
|---------|------|
| **Yorman** | Infraestructura y Setup |
| **Sneider** | Modulo Institucional |
| **Santiago** | Modulo Academico |
| **Martin** | Matricula y Calificaciones |
| **Avila** | Modulos Transversales |

---

## Convenciones para todos

### Ubicacion de archivos

```
server/src/
+-- config/constants.js                    <- Yorman
+-- middleware/auth.js                      <- Yorman
+-- controllers/
|   +-- auth.controller.js                 <- Yorman
|   +-- usuario.controller.js              <- Yorman
|   +-- bitacora.controller.js             <- Yorman
|   +-- institucion.controller.js          <- Sneider
|   +-- sede.controller.js                 <- Sneider
|   +-- direccionNucleo.controller.js      <- Sneider
|   +-- solicitudRegistro.controller.js    <- Sneider
|   +-- catalogo.controller.js             <- Sneider
|   +-- anioAcademico.controller.js        <- Santiago
|   +-- area.controller.js                 <- Santiago
|   +-- asignatura.controller.js           <- Santiago
|   +-- grupo.controller.js                <- Santiago
|   +-- cargaAcademica.controller.js       <- Santiago
|   +-- prematricula.controller.js         <- Martin
|   +-- matricula.controller.js            <- Martin
|   +-- indicador.controller.js            <- Martin
|   +-- actividad.controller.js            <- Martin
|   +-- calificacion.controller.js         <- Martin
|   +-- comunicados.controller.js          <- Avila
|   +-- observador.controller.js           <- Avila
|   +-- excusas.controller.js              <- Avila
|   +-- conceptosContables.controller.js   <- Avila
|   +-- pagos.controller.js                <- Avila
|   +-- elecciones.controller.js           <- Avila
|   +-- eventoElectoral.controller.js      <- Avila
|   +-- voto.controller.js                 <- Avila
+-- routes/
|   +-- index.js                           <- Yorman (todos registran aqui)
|   +-- auth.routes.js                     <- Yorman
|   +-- usuario.routes.js                  <- Yorman
|   +-- bitacora.routes.js                 <- Yorman
|   +-- institucion.routes.js              <- Sneider
|   +-- sede.routes.js                     <- Sneider
|   +-- direccionNucleo.routes.js          <- Sneider
|   +-- solicitudRegistro.routes.js        <- Sneider
|   +-- catalogo.routes.js                 <- Sneider
|   +-- anioAcademico.routes.js            <- Santiago
|   +-- area.routes.js                     <- Santiago
|   +-- asignatura.routes.js               <- Santiago
|   +-- grupo.routes.js                    <- Santiago
|   +-- cargaAcademica.routes.js           <- Santiago
|   +-- prematricula.routes.js             <- Martin
|   +-- matricula.routes.js                <- Martin
|   +-- indicador.routes.js                <- Martin
|   +-- actividad.routes.js                <- Martin
|   +-- calificacion.routes.js             <- Martin
|   +-- comunicados.routes.js              <- Avila
|   +-- observador.routes.js               <- Avila
|   +-- excusas.routes.js                  <- Avila
|   +-- conceptosContables.routes.js       <- Avila
|   +-- pagos.routes.js                    <- Avila
|   +-- elecciones.routes.js               <- Avila
|   +-- eventoElectoral.routes.js          <- Avila
|   +-- voto.routes.js                     <- Avila
+-- models/                                <- Ya existen (27 archivos)
+-- config/database.js                     <- Ya existe
+-- server.js                              <- Yorman
```

### Formato de respuesta unificada

```javascript
{ ok: true, data: ..., message: "...", error: "..." }
```

### Formato de controller CRUD (todos usan esta misma estructura)

```javascript
const Model = require('../models/Modelo');

const getAll = async (req, res) => {
  try {
    const filter = req.usuario?.institucionId
      ? { institucionId: req.usuario.institucionId }
      : {};
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

module.exports = { getAll, getById, create, update, remove };
```

### Formato de rutas (todos usan la misma estructura)

```javascript
const { Router } = require('express');
const router = Router();
const controller = require('../controllers/modelo.controller');
const { protect } = require('../middleware/auth');

router.get('/', protect, controller.getAll);
router.get('/:id', protect, controller.getById);
router.post('/', protect, controller.create);
router.put('/:id', protect, controller.update);
router.delete('/:id', protect, controller.remove);

module.exports = router;
```

### Ruta base por recurso

| Recurso | Ruta |
|---------|------|
| Auth | `/api/auth` |
| Usuarios | `/api/usuarios` |
| Bitacora | `/api/bitacora` |
| Instituciones | `/api/instituciones` |
| Sedes | `/api/sedes` |
| Nucleos | `/api/nucleos` |
| Solicitudes Registro | `/api/solicitudes-registro` |
| Catalogos | `/api/catalogos` |
| Anios Academicos | `/api/anios-academicos` |
| Areas | `/api/areas` |
| Asignaturas | `/api/asignaturas` |
| Grupos | `/api/grupos` |
| Carga Academica | `/api/carga-academica` |
| Prematriculas | `/api/prematriculas` |
| Matriculas | `/api/matriculas` |
| Indicadores | `/api/indicadores` |
| Actividades | `/api/actividades` |
| Calificaciones | `/api/calificaciones` |
| Comunicados | `/api/comunicados` |
| Observador | `/api/observador` |
| Excusas | `/api/excusas` |
| Conceptos Contables | `/api/conceptos-contables` |
| Pagos | `/api/pagos` |
| Elecciones | `/api/elecciones` |
| Eventos Electorales | `/api/eventos-electorales` |
| Votos | `/api/votos` |

---

## Asignacion detallada por persona

---

### Yorman - Infraestructura y Setup

**Dependencia:** Nadie. Todos dependen de el.

| Archivo | Contenido |
|---------|-----------|
| `src/config/constants.js` | Constantes: `ROLES`, `ESTADOS_USUARIO`, `TIPOS_DOCUMENTO`, `GENEROS`, `ESTADOS_ANIO`, `ESTADOS_PERIODO` |
| `server.js` | Express app con cors, helmet, rate-limit, JSON parser, conexion MongoDB, montar rutas |
| `src/middleware/auth.js` | Middleware `protect` (verify JWT, adjuntar `req.usuario`) y `authorize(...roles)` |
| `src/routes/index.js` | Centralizar import de todas las rutas |
| `src/controllers/auth.controller.js` | `login` (POST /api/auth/login), `me` (GET /api/auth/me), `cambiarPassword` (PUT /api/auth/password) |
| `src/routes/auth.routes.js` | Rutas de auth (login sin protect, me y password con protect) |
| `src/controllers/usuario.controller.js` | CRUD completo + endpoints extras: `misEstudiantes`, `misAcudientes`, `buscarPorDocumento` |
| `src/routes/usuario.routes.js` | Rutas con protect |
| `src/controllers/bitacora.controller.js` | Solo lectura: `getAll`, `getById`, `getByUsuario` |
| `src/routes/bitacora.routes.js` | Rutas de solo lectura |

#### Rutas de auth

```javascript
POST   /api/auth/login       -> controller.login        (sin token)
GET    /api/auth/me           -> controller.me           (con protect)
PUT    /api/auth/password     -> controller.cambiarPassword (con protect)
```

#### Rutas de usuario

```javascript
GET    /api/usuarios          -> controller.getAll
GET    /api/usuarios/:id      -> controller.getById
POST   /api/usuarios          -> controller.create
PUT    /api/usuarios/:id      -> controller.update
DELETE /api/usuarios/:id      -> controller.remove
GET    /api/usuarios/:id/estudiantes  -> controller.misEstudiantes
GET    /api/usuarios/:id/acudientes   -> controller.misAcudientes
GET    /api/usuarios/buscar/:documento -> controller.buscarPorDocumento
```

#### Rutas de bitacora

```javascript
GET    /api/bitacora          -> controller.getAll
GET    /api/bitacora/:id      -> controller.getById
GET    /api/bitacora/usuario/:usuarioId -> controller.getByUsuario
```

---

### Sneider - Modulo Institucional

**Dependencia:** constants.js, auth.js, routes/index.js (Yorman)

| Controller + Routes | Modelo | Notas |
|---|---|---|
| institucion | **Institucion** | Al crear, configuracion tiene defaults definidos en el schema |
| sede | **Sede** | Filtrar por institucionId |
| direccionNucleo | **DireccionNucleo** | No tiene institucionId (es supra-institucional) |
| solicitudRegistro | **SolicitudRegistro** | Flujo: pendiente -> aprobada/rechazada. Endpoint aprobar que al aceptar crea la Institucion |
| catalogo | **Catalogo** | CRUD generico por tipo e institucionId |

#### Rutas de institucion

```javascript
GET    /api/instituciones          -> getAll
GET    /api/instituciones/:id      -> getById
POST   /api/instituciones          -> create
PUT    /api/instituciones/:id      -> update
DELETE /api/instituciones/:id      -> remove
```

#### Rutas de sede

```javascript
GET    /api/sedes              -> getAll
GET    /api/sedes/:id          -> getById
POST   /api/sedes              -> create
PUT    /api/sedes/:id          -> update
DELETE /api/sedes/:id          -> remove
```

#### Rutas de nucleo

```javascript
GET    /api/nucleos            -> getAll
GET    /api/nucleos/:id        -> getById
POST   /api/nucleos            -> create
PUT    /api/nucleos/:id        -> update
DELETE /api/nucleos/:id        -> remove
```

#### Rutas de solicitudes-registro

```javascript
GET    /api/solicitudes-registro       -> getAll
GET    /api/solicitudes-registro/:id   -> getById
POST   /api/solicitudes-registro       -> create
PUT    /api/solicitudes-registro/:id   -> update
DELETE /api/solicitudes-registro/:id   -> remove
PUT    /api/solicitudes-registro/:id/aprobar    -> aprobar (crea Institucion)
PUT    /api/solicitudes-registro/:id/rechazar   -> rechazar
```

#### Rutas de catalogo

```javascript
GET    /api/catalogos          -> getAll
GET    /api/catalogos/:id      -> getById
POST   /api/catalogos          -> create
PUT    /api/catalogos/:id      -> update
DELETE /api/catalogos/:id      -> remove
GET    /api/catalogos/tipo/:tipo -> getByTipo
```

---

### Santiago - Modulo Academico (Estructura)

**Dependencia:** constants.js, auth.js, routes/index.js (Yorman)

| Controller + Routes | Modelo | Notas |
|---|---|---|
| anioAcademico | **AnioAcademico** | Solo un año activo por institucion. Los periodos se crean con defaults |
| area | **Area** | CRUD simple |
| asignatura | **Asignatura** | CRUD, filtrar por areaId |
| grupo | **Grupo** | CRUD, filtrar por anioAcademicoId |
| cargaAcademica | **CargaAcademica** | CRUD, validar que no haya duplicado (indice unico en grupo+asignatura) |

#### Rutas de anio academico

```javascript
GET    /api/anios-academicos          -> getAll
GET    /api/anios-academicos/:id      -> getById
POST   /api/anios-academicos          -> create
PUT    /api/anios-academicos/:id      -> update
DELETE /api/anios-academicos/:id      -> remove
PUT    /api/anios-academicos/:id/activar   -> activar (desactiva el resto)
PUT    /api/anios-academicos/:id/cerrar    -> cerrar
```

#### Rutas de area

```javascript
GET    /api/areas               -> getAll
GET    /api/areas/:id           -> getById
POST   /api/areas               -> create
PUT    /api/areas/:id           -> update
DELETE /api/areas/:id           -> remove
```

#### Rutas de asignatura

```javascript
GET    /api/asignaturas              -> getAll
GET    /api/asignaturas/:id          -> getById
POST   /api/asignaturas              -> create
PUT    /api/asignaturas/:id          -> update
DELETE /api/asignaturas/:id          -> remove
GET    /api/asignaturas/area/:areaId -> getByArea
```

#### Rutas de grupo

```javascript
GET    /api/grupos               -> getAll
GET    /api/grupos/:id           -> getById
POST   /api/grupos               -> create
PUT    /api/grupos/:id           -> update
DELETE /api/grupos/:id           -> remove
GET    /api/grupos/anio/:anioAcademicoId -> getByAnio
```

#### Rutas de carga academica

```javascript
GET    /api/carga-academica           -> getAll
GET    /api/carga-academica/:id       -> getById
POST   /api/carga-academica           -> create
PUT    /api/carga-academica/:id       -> update
DELETE /api/carga-academica/:id       -> remove
GET    /api/carga-academica/docente/:docenteId -> getByDocente
GET    /api/carga-academica/grupo/:grupoId     -> getByGrupo
```

---

### Martin - Matricula y Calificaciones (Flujo critico)

**Dependencia:** constants.js, auth.js, routes/index.js (Yorman)

| Controller + Routes | Modelo | Notas |
|---|---|---|
| prematricula | **Prematricula** | CRUD + endpoint aprobar (crea Matricula + Usuario estudiante) |
| matricula | **Matricula** | CRUD + endpoint retirar, promover |
| indicador | **Indicador** | CRUD, filtrar por asignaturaId + periodo |
| actividad | **Actividad** | CRUD, filtrar por indicadorId o grupoId + periodo |
| calificacion | **Calificacion** | CRUD + endpoint masivo guardarNotas (POST /masivo). Validar nota entre 0 y 5 |

#### Rutas de prematricula

```javascript
GET    /api/prematriculas              -> getAll
GET    /api/prematriculas/:id          -> getById
POST   /api/prematriculas              -> create
PUT    /api/prematriculas/:id          -> update
DELETE /api/prematriculas/:id          -> remove
PUT    /api/prematriculas/:id/aprobar  -> aprobar (crea Usuario + Matricula)
PUT    /api/prematriculas/:id/rechazar -> rechazar
```

#### Rutas de matricula

```javascript
GET    /api/matriculas              -> getAll
GET    /api/matriculas/:id          -> getById
POST   /api/matriculas              -> create
PUT    /api/matriculas/:id          -> update
DELETE /api/matriculas/:id          -> remove
PUT    /api/matriculas/:id/retirar  -> retirar
PUT    /api/matriculas/:id/promover -> promover
GET    /api/matriculas/grupo/:grupoId -> getByGrupo
```

#### Rutas de indicador

```javascript
GET    /api/indicadores                    -> getAll
GET    /api/indicadores/:id                -> getById
POST   /api/indicadores                    -> create
PUT    /api/indicadores/:id                -> update
DELETE /api/indicadores/:id                -> remove
GET    /api/indicadores/asignatura/:asignaturaId/periodo/:periodo -> getByAsignaturaPeriodo
```

#### Rutas de actividad

```javascript
GET    /api/actividades              -> getAll
GET    /api/actividades/:id          -> getById
POST   /api/actividades              -> create
PUT    /api/actividades/:id          -> update
DELETE /api/actividades/:id          -> remove
GET    /api/actividades/grupo/:grupoId/periodo/:periodo -> getByGrupoPeriodo
```

#### Rutas de calificacion

```javascript
GET    /api/calificaciones               -> getAll
GET    /api/calificaciones/:id           -> getById
POST   /api/calificaciones               -> create
PUT    /api/calificaciones/:id           -> update
DELETE /api/calificaciones/:id           -> remove
POST   /api/calificaciones/masivo        -> guardarNotas (array de notas)
GET    /api/calificaciones/grupo/:grupoId/asignatura/:asignaturaId/periodo/:periodo -> getByGrupoAsignaturaPeriodo
GET    /api/calificaciones/estudiante/:estudianteId/anio/:anioAcademicoId -> getBoletin
```

---

### Avila - Modulos Transversales

**Dependencia:** constants.js, auth.js, routes/index.js (Yorman)

| Controller + Routes | Modelo | Notas |
|---|---|---|
| comunicados | **Comunicados** | CRUD + endpoint marcarLeido |
| observador | **Observador** | CRUD + agregar entrada al array seguimiento |
| excusas | **Excusas** | CRUD + endpoint aprobar/rechazar |
| conceptosContables | **ConceptosContables** | CRUD simple |
| pagos | **Pagos** | CRUD + endpoint registrarPago |
| elecciones | **Elecciones** | CRUD + endpoints: votar, resultados, abrir/cerrar |
| eventoElectoral | **EventoElectoral** | CRUD simple |
| voto | **Voto** | CRUD, consultar por eventoId y candidatoId |

#### Rutas de comunicados

```javascript
GET    /api/comunicados           -> getAll
GET    /api/comunicados/:id       -> getById
POST   /api/comunicados           -> create
PUT    /api/comunicados/:id       -> update
DELETE /api/comunicados/:id       -> remove
PUT    /api/comunicados/:id/leer  -> marcarLeido
```

#### Rutas de observador

```javascript
GET    /api/observador                  -> getAll
GET    /api/observador/:id              -> getById
POST   /api/observador                  -> create
PUT    /api/observador/:id              -> update
DELETE /api/observador/:id              -> remove
POST   /api/observador/:id/seguimiento  -> agregarSeguimiento
GET    /api/observador/estudiante/:estudianteId -> getByEstudiante
```

#### Rutas de excusas

```javascript
GET    /api/excusas              -> getAll
GET    /api/excusas/:id          -> getById
POST   /api/excusas              -> create
PUT    /api/excusas/:id          -> update
DELETE /api/excusas/:id          -> remove
PUT    /api/excusas/:id/aprobar  -> aprobar
PUT    /api/excusas/:id/rechazar -> rechazar
```

#### Rutas de conceptos contables

```javascript
GET    /api/conceptos-contables          -> getAll
GET    /api/conceptos-contables/:id      -> getById
POST   /api/conceptos-contables          -> create
PUT    /api/conceptos-contables/:id      -> update
DELETE /api/conceptos-contables/:id      -> remove
```

#### Rutas de pagos

```javascript
GET    /api/pagos                -> getAll
GET    /api/pagos/:id            -> getById
POST   /api/pagos                -> create
PUT    /api/pagos/:id            -> update
DELETE /api/pagos/:id            -> remove
PUT    /api/pagos/:id/registrar-pago -> registrarPago (cambia estado, fecha, metodo)
GET    /api/pagos/estudiante/:estudianteId -> getByEstudiante
```

#### Rutas de elecciones

```javascript
GET    /api/elecciones                -> getAll
GET    /api/elecciones/:id            -> getById
POST   /api/elecciones                -> create
PUT    /api/elecciones/:id            -> update
DELETE /api/elecciones/:id            -> remove
POST   /api/elecciones/:id/votar      -> votar
GET    /api/elecciones/:id/resultados -> resultados
PUT    /api/elecciones/:id/abrir      -> abrir
PUT    /api/elecciones/:id/cerrar     -> cerrar
```

#### Rutas de evento electoral

```javascript
GET    /api/eventos-electorales    -> getAll
GET    /api/eventos-electorales/:id -> getById
POST   /api/eventos-electorales    -> create
PUT    /api/eventos-electorales/:id -> update
DELETE /api/eventos-electorales/:id -> remove
```

#### Rutas de voto

```javascript
GET    /api/votos                  -> getAll
GET    /api/votos/:id              -> getById
POST   /api/votos                  -> create
DELETE /api/votos/:id              -> remove
GET    /api/votos/evento/:eventoId -> getByEvento
GET    /api/votos/candidato/:candidatoId -> getByCandidato
```

---

## Dependencias entre personas

```
Yorman (constants, server, auth)
  +-- Sneider (usa constants + auth)
  +-- Santiago (usa constants + auth)
  +-- Martin (usa constants + auth)
  +-- Avila (usa constants + auth)
```

### Orden recomendado

1. **Yorman** entrega `constants.js` y `middleware/auth.js` -> los demas pueden empezar sus controllers y rutas
2. **Yorman** entrega `routes/index.js` y `server.js` -> cada uno registra sus rutas ahi
3. Cada persona entrega sus controllers y routes por separado
4. **Yorman** integra todo al final

---

## Server.js final (Yorman)

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const app = express();

// Middleware global
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
}));

// Rutas
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/usuarios', require('./src/routes/usuario.routes'));
app.use('/api/bitacora', require('./src/routes/bitacora.routes'));
app.use('/api/instituciones', require('./src/routes/institucion.routes'));
app.use('/api/sedes', require('./src/routes/sede.routes'));
app.use('/api/nucleos', require('./src/routes/direccionNucleo.routes'));
app.use('/api/solicitudes-registro', require('./src/routes/solicitudRegistro.routes'));
app.use('/api/catalogos', require('./src/routes/catalogo.routes'));
app.use('/api/anios-academicos', require('./src/routes/anioAcademico.routes'));
app.use('/api/areas', require('./src/routes/area.routes'));
app.use('/api/asignaturas', require('./src/routes/asignatura.routes'));
app.use('/api/grupos', require('./src/routes/grupo.routes'));
app.use('/api/carga-academica', require('./src/routes/cargaAcademica.routes'));
app.use('/api/prematriculas', require('./src/routes/prematricula.routes'));
app.use('/api/matriculas', require('./src/routes/matricula.routes'));
app.use('/api/indicadores', require('./src/routes/indicador.routes'));
app.use('/api/actividades', require('./src/routes/actividad.routes'));
app.use('/api/calificaciones', require('./src/routes/calificacion.routes'));
app.use('/api/comunicados', require('./src/routes/comunicados.routes'));
app.use('/api/observador', require('./src/routes/observador.routes'));
app.use('/api/excusas', require('./src/routes/excusas.routes'));
app.use('/api/conceptos-contables', require('./src/routes/conceptosContables.routes'));
app.use('/api/pagos', require('./src/routes/pagos.routes'));
app.use('/api/elecciones', require('./src/routes/elecciones.routes'));
app.use('/api/eventos-electorales', require('./src/routes/eventoElectoral.routes'));
app.use('/api/votos', require('./src/routes/voto.routes'));

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('[OK] MongoDB conectado');
    app.listen(PORT, () => console.log('[OK] Servidor en puerto', PORT));
  })
  .catch(err => {
    console.error('[ERROR] MongoDB:', err.message);
    process.exit(1);
  });
```

---

## constants.js (Yorman)

```javascript
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  RECTOR: 'rector',
  COORDINADOR: 'coordinador',
  DOCENTE: 'docente',
  ESTUDIANTE: 'estudiante',
  ACUDIENTE: 'acudiente',
  SECRETARIA: 'secretaria',
};

const ESTADOS_USUARIO = {
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
  BLOQUEADO: 'bloqueado',
};

const TIPOS_DOCUMENTO = ['RC', 'TI', 'CC', 'CE', 'PAS'];

const GENEROS = ['M', 'F', 'O'];

const ESTADOS_ANIO = {
  PREMATRICULA: 'prematricula',
  ACTIVO: 'activo',
  CERRADO: 'cerrado',
};

const ESTADOS_PERIODO = {
  ABIERTO: 'abierto',
  CERRADO: 'cerrado',
};

module.exports = {
  ROLES,
  ESTADOS_USUARIO,
  TIPOS_DOCUMENTO,
  GENEROS,
  ESTADOS_ANIO,
  ESTADOS_PERIODO,
};
```

---

## middleware/auth.js (Yorman)

```javascript
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const JWT_SECRET = process.env.JWT_SECRET || 'easynots_secret_key_2026';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ ok: false, message: 'No autorizado, token requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = await Usuario.findById(decoded.id).select('-credenciales.passwordHash -credenciales.tokenRecuperacion -credenciales.tokenRecuperacionExpira');
    if (!req.usuario) {
      return res.status(401).json({ ok: false, message: 'Token invalido, usuario no existe' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ ok: false, message: 'Token invalido', error: error.message });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.tipoPerfil)) {
      return res.status(403).json({ ok: false, message: 'No tienes permisos para esta accion' });
    }
    next();
  };
};

const generarToken = (usuarioId) => {
  return jwt.sign({ id: usuarioId }, JWT_SECRET, { expiresIn: '8h' });
};

module.exports = { protect, authorize, generarToken };
```

---

## routes/index.js (Yorman - cada uno registra sus rutas aqui)

```javascript
const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/usuarios', require('./usuario.routes'));
router.use('/bitacora', require('./bitacora.routes'));
router.use('/instituciones', require('./institucion.routes'));
router.use('/sedes', require('./sede.routes'));
router.use('/nucleos', require('./direccionNucleo.routes'));
router.use('/solicitudes-registro', require('./solicitudRegistro.routes'));
router.use('/catalogos', require('./catalogo.routes'));
router.use('/anios-academicos', require('./anioAcademico.routes'));
router.use('/areas', require('./area.routes'));
router.use('/asignaturas', require('./asignatura.routes'));
router.use('/grupos', require('./grupo.routes'));
router.use('/carga-academica', require('./cargaAcademica.routes'));
router.use('/prematriculas', require('./prematricula.routes'));
router.use('/matriculas', require('./matricula.routes'));
router.use('/indicadores', require('./indicador.routes'));
router.use('/actividades', require('./actividad.routes'));
router.use('/calificaciones', require('./calificacion.routes'));
router.use('/comunicados', require('./comunicados.routes'));
router.use('/observador', require('./observador.routes'));
router.use('/excusas', require('./excusas.routes'));
router.use('/conceptos-contables', require('./conceptosContables.routes'));
router.use('/pagos', require('./pagos.routes'));
router.use('/elecciones', require('./elecciones.routes'));
router.use('/eventos-electorales', require('./eventoElectoral.routes'));
router.use('/votos', require('./voto.routes'));

module.exports = router;
```

---

## Checklist de integracion

| Quien | Archivo | Estados que los demas esperan listo |
|-------|---------|--------------------------------------|
| **Yorman** | `src/config/constants.js` | Todos lo necesitan |
| **Yorman** | `src/middleware/auth.js` | Todos protegen sus rutas |
| **Yorman** | `routes/index.js` y `server.js` | Cada uno registra sus rutas |
| **Yorman** | `controllers/auth.controller.js` + `routes/auth.routes.js` | Login funcional para probar |
| **Yorman** | `controllers/usuario.controller.js` + `routes/usuario.routes.js` | Usuarios funcional |
| **Yorman** | `controllers/bitacora.controller.js` + `routes/bitacora.routes.js` | Bitacora funcional |
| **Sneider** | institucion, sede, direccionNucleo, solicitudRegistro, catalogo | Entregar controllers + routes |
| **Santiago** | anioAcademico, area, asignatura, grupo, cargaAcademica | Entregar controllers + routes |
| **Martin** | prematricula, matricula, indicador, actividad, calificacion | Entregar controllers + routes |
| **Avila** | comunicados, observador, excusas, conceptosContables, pagos, elecciones, eventoElectoral, voto | Entregar controllers + routes |
```

<｜｜DSML｜｜parameter name="filePath" string="true">/home/lenovot440/Escritorio/easynots-modelos/server/PLAN_RUTAS.md