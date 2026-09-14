/**
 * Paginación server-side reutilizable.
 * Si el cliente NO envía `page`, retorna null (comportamiento actual: listado completo).
 * Si envía `page`, se aplica skip/limit con topes por seguridad.
 * @param {Object} req - Request de Express
 * @param {Number} porDefecto - Límite por defecto
 * @param {Number} maximo - Límite máximo permitido
 * @returns {null|{pagina:Number, limite:Number, skip:Number}} Configuración de paginación o null
 */
const paginarQuery = (req, porDefecto = 50, maximo = 200) => {
  if (req.query.page === undefined) return null;
  const pagina = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limite = Math.min(maximo, Math.max(1, parseInt(req.query.limit, 10) || porDefecto));
  return { pagina, limite, skip: (pagina - 1) * limite };
};

module.exports = { paginarQuery };