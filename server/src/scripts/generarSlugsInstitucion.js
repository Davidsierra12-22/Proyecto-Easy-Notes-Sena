/**
 * Rellena el campo slug de las instituciones que todavia no lo tienen.
 *
 * El slug es el identificador que usa el enlace publico de prematrícula
 * (easynots.co/prematricula/colegio-tolima). Se derives del nombre en el
 * pre-validate del modelo, asi que toda institucion nueva ya lo trae; este
 * script es para las que ya estaban en la base antes de que el campo
 * existiera.
 *
 * Es idempotente: solo toca las que no tienen slug, y se puede correr
 * cuantas veces se quiera.
 *
 *   node src/scripts/generarSlugsInstitucion.js
 *
 * Si dos colegios derivan el mismo slug, el segundo recibe un sufijo con su
 * NIT para que las URLs sigan siendo distintas.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Institucion = require('../models/Institucion');
const { derivarSlug } = require('../models/Institucion');

const conectar = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI no definida');
  await mongoose.connect(uri);
  console.log('Conectado a MongoDB');
};

const main = async () => {
  await conectar();

  const existentes = await Institucion.find({ $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }] })
    .select('nombre nit slug');

  console.log(`Instituciones sin slug: ${existentes.length}`);

  // Los slugs ya tomados, para no chocar con los que si existen.
  const tomados = new Set(
    (await Institucion.find({ slug: { $exists: true, $nin: [null, ''] } }).select('slug'))
      .map((i) => i.slug)
  );

  let actualizados = 0;
  for (const inst of existentes) {
    let slug = derivarSlug(inst.nombre) || String(inst.nit).toLowerCase();

    // Colisión: dos colegios con el mismo nombre. Se agrega el NIT.
    if (tomados.has(slug)) {
      slug = `${slug}-${String(inst.nit).toLowerCase()}`;
    }
    // Por si el NIT también repetition (no debería, es unique).
    let sufijo = 2;
    while (tomados.has(slug)) {
      slug = `${derivarSlug(inst.nombre)}-${String(inst.nit).toLowerCase()}-${sufijo++}`;
    }

    inst.slug = slug;
    await inst.save({ validateBeforeSave: false });
    tomados.add(slug);
    actualizados++;
    console.log(`  ${inst.nombre} -> ${slug}`);
  }

  console.log(`\nListo. ${actualizados} instituciones actualizadas.`);
  console.log('Enlace de ejemplo: /prematricula/' + (actualizados ? '' : '<slug>'));
};

main()
  .then(async () => { await mongoose.disconnect(); process.exit(0); })
  .catch(async (err) => {
    console.error('Error:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  });
