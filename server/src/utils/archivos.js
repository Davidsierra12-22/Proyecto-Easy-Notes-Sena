const esDataUriImagen = (v = '') => typeof v === 'string' && v.startsWith('data:image/');

const sanearFoto = (v) => (esDataUriImagen(v) ? v : null);

module.exports = { esDataUriImagen, sanearFoto };