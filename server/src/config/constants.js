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
  CERRADO: 'cerrado'
};

module.exports = {
  ROLES,
  ESTADOS_USUARIO,
  TIPOS_DOCUMENTO,
  GENEROS,
  ESTADOS_ANIO,
  ESTADOS_PERIODO
};
