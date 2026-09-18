/**
 * services/api.service.js — consumo de cualquier API.
 * Escribe el acceso al backend en UN solo lugar: get, post, put y delete.
 * La instancia de axios (configuracion + interceptores) vive en plugins/axios.
 */
export { default } from '../plugins/axios'