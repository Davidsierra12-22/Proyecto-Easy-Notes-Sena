/**
 * Formato del NIT.
 *
 * El NIT se guarda como cadena, nunca como numero: un NIT no es una cantidad
 * con la que se hacen cuentas, es un identificador, y tratarlo como numerico
 * perdia el digito de control (900123456-7 se guardaba como 900123456) y
 * admitia notacion cientifica desde el cuerpo de la peticion.
 *
 * Formato colombiano: nueve digitos y, opcionalmente, el digito de control
 * separado por un guion.
 *
 *   900123456      nueve digitos
 *   900123456-7    nueve digitos, guion y digito de control
 *   9001234567     diez digitos pegados
 *
 * Se aceptan las tres formas porque las tres se escriben en la practica y las
 * tres estan ya en la base: exigir el digito de control habria hecho
 * ineditable el NIT de los colegios que se cargaron sin el.
 *
 * El guion solo cuenta si va seguido de un digito. Por eso las tres formas
 * estan escritas separadas en vez de como "9 digitos y guion opcional": con
 * el guion opcional de verdad, un "900123456-" a medio escribir pasaria por
 * NIT valido.
 */
const REGEX_NIT = /^(?:\d{9}|\d{9}-\d|\d{10})$/;

/** Deja solo el texto del NIT: recorta espacios y descarta cualquier otra cosa. */
const normalizarNit = (valor) => {
  if (valor === null || valor === undefined) return '';
  return String(valor).trim();
};

/** El NIT tiene el formato esperado? Acepta las tres formas de arriba. */
const esNitValido = (valor) => REGEX_NIT.test(normalizarNit(valor));

/**
 * Deja escribir el NIT sin que entren letras.
 *
 * No corrige ni completa el valor: solo descarta lo que no puede ser un NIT
 * (letras, puntos, espacios, otros simbolos) y conserva el guion cuando esta
 * en su sitio, que es despues del noveno digito. Devolver el texto casi tal
 * cual lo escribio quien teclea, sin inventarle un guion que no puso.
 */
const limpiarNit = (valor) => {
  const texto = normalizarNit(valor);
  const digitos = texto.replace(/\D/g, '');
  // El guion solo se conserva puesto en su lugar. Escribilo en cualquier otro
  // sitio es mas probablemente un error de tipeo que un separador.
  const guionEnSuSitio = texto.replace(/[^\d-]/g, '').indexOf('-') === 9;
  const cuerpo = digitos.slice(0, 9);
  if (!guionEnSuSitio) return digitos.slice(0, 10);
  return `${cuerpo}-${digitos.slice(9, 10)}`;
};

const MENSAJE_NIT =
  'Formato de NIT invalido. Son 9 digitos y, opcionalmente, el digito de control separado por guion: 900123456-7';

module.exports = { REGEX_NIT, normalizarNit, esNitValido, limpiarNit, MENSAJE_NIT };
