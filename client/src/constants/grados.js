export const GRADOS_ESTANDAR = [
  { numero: 0, nombre: 'Preescolar' },
  { numero: 1, nombre: 'Primero' },
  { numero: 2, nombre: 'Segundo' },
  { numero: 3, nombre: 'Tercero' },
  { numero: 4, nombre: 'Cuarto' },
  { numero: 5, nombre: 'Quinto' },
  { numero: 6, nombre: 'Sexto' },
  { numero: 7, nombre: 'Séptimo' },
  { numero: 8, nombre: 'Octavo' },
  { numero: 9, nombre: 'Noveno' },
  { numero: 10, nombre: 'Décimo' },
  { numero: 11, nombre: 'Once' }
]

export const gradoNombre = (numero, gradosConfig = []) =>
  gradosConfig.find(g => Number(g.numero) === Number(numero))?.nombre

export const gradoLabel = (numero, gradosConfig = []) =>
  gradoNombre(numero, gradosConfig) || `Grado ${numero}`