const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  RECTOR: 'rector',
  COORDINADOR: 'coordinador',
  DOCENTE: 'docente',
  ESTUDIANTE: 'estudiante',
  ACUDIENTE: 'acudiente',
  SECRETARIA: 'secretaria'
};

// super_admin = Dirección de Núcleo: solo gestiona núcleos, colegios del núcleo
// y estadísticas agregadas. NO tiene acceso a datos operativos de los colegios.
const PERMISOS = {
  LECTURA: [],
  GESTION: [ROLES.ADMIN, ROLES.SECRETARIA],
  DOCENTE: [ROLES.DOCENTE, ROLES.COORDINADOR, ROLES.RECTOR, ROLES.ADMIN],
  INSTITUCIONAL: [ROLES.ADMIN],
  DIRECCION: [ROLES.ADMIN],
  FINANCIERO: [ROLES.ADMIN, ROLES.SECRETARIA],
  SOLO_ADMIN: [ROLES.ADMIN],
  ESTUDIANTE: [ROLES.ESTUDIANTE],
  NUCLEO: [ROLES.SUPER_ADMIN],
  AMPLIO: [ROLES.ADMIN, ROLES.RECTOR, ROLES.COORDINADOR, ROLES.DOCENTE, ROLES.ESTUDIANTE]
};

const HTTP = {
  OK: 200, CREATED: 201, BAD_REQUEST: 400,
  UNAUTHORIZED: 401, FORBIDDEN: 403, NOT_FOUND: 404,
  CONFLICT: 409, SERVER_ERROR: 500
};

const MENSAJES = {
  NO_AUTORIZADO: 'No autorizado, token requerido',
  TOKEN_INVALIDO: 'Token invalido',
  TOKEN_EXPIRADO: 'Sesion expirada, inicie sesion nuevamente',
  SIN_PERMISOS: 'No tienes permisos para esta accion',
  NO_ENCONTRADO: 'Recurso no encontrado',
  DOCUMENTO_DUPLICADO: 'El documento ya existe en el sistema',
  PARAMETROS_INVALIDOS: 'Parametros invalidos'
};

const ESTADOS_USUARIO = {
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
  BLOQUEADO: 'bloqueado'
};

const TIPOS_DOCUMENTO = ['RC', 'TI', 'CC', 'CE', 'PAS'];

const GENEROS = ['M', 'F', 'O'];

const ESTADOS_ANIO = {
  PREMATRICULA: 'prematricula',
  ACTIVO: 'activo',
  CERRADO: 'cerrado'
};

const ESTADOS_PERIODO = {
  ABIERTO: 'abierto',
  CERRADO: 'cerrado',
  ABIERTO_TEMPORAL: 'abierto_temporal'
};

const BITACORA = {
  RETENCION_MESES: parseInt(process.env.BITACORA_RETENCION_MESES, 10) || 3
};

module.exports = {
  ROLES, PERMISOS, HTTP, MENSAJES,
  ESTADOS_USUARIO, TIPOS_DOCUMENTO, GENEROS,
  ESTADOS_ANIO, ESTADOS_PERIODO, BITACORA
};
