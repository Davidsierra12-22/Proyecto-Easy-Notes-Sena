require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Institucion = require('./src/models/Institucion');
const Sede = require('./src/models/Sede');
const Usuario = require('./src/models/Usuario');
const AnioAcademico = require('./src/models/AnioAcademico');
const Area = require('./src/models/Area');
const Asignatura = require('./src/models/Asignatura');
const Grupo = require('./src/models/Grupo');
const CargaAcademica = require('./src/models/CargaAcademica');
const Matricula = require('./src/models/Matricula');
const ConceptosContables = require('./src/models/ConceptosContables');

const NAMES_M = ['Juan','Carlos','Andrés','Miguel','Luis','Pedro','Diego','Santiago','Mateo','Sebastián','Daniel','Nicolás','Tomás','Samuel','David','Lucas','Emiliano','Isaac','Gabriel','Adrián'];
const NAMES_F = ['María','Ana','Laura','Sofía','Valentina','Camila','Daniela','Isabella','Luciana','Gabriela','Paula','Emma','Victoria','Martina','Catalina','Alejandra','Andrea','Natalia','Carolina','Juliana'];
const APE = ['García','Rodríguez','Martínez','López','González','Hernández','Pérez','Sánchez','Ramírez','Torres','Flores','Rivera','Gómez','Díaz','Cruz','Morales','Reyes','Gutiérrez','Ortiz','Vargas'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.round((Math.random() * (max - min) + min) * 10) / 10; }
function doc() { return String(Math.floor(10000000 + Math.random() * 90000000)); }

const SEED_PASS = bcrypt.hashSync('123456', 10);

async function createUser(data, username) {
  return Usuario.create({
    ...data,
    credenciales: { usuario: username || data.documento, passwordHash: SEED_PASS }
  });
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado a MongoDB Atlas');

  // Limpiar
  const cols = ['usuarios','institucions','sedes','anioacademicos','areas','asignaturas','grupos','cargaacademicas','matriculas','conceptoscontables','calificacions','indicadors','actividads','pagos','comunicados','comunicados'];
  for (const c of cols) {
    await mongoose.connection.db.collection(c).deleteMany({});
  }
  console.log('BD limpiada');

  // 1. SUPER ADMIN
  const superAdmin = await createUser({
    tipoDocumento: 'CC', documento: '00000000',
    nombres: 'Super', apellidos: 'Admin',
    email: 'super@easynots.com', celular: '3000000000',
    tipoPerfil: 'super_admin', roles: ['super_admin'],
    estado: 'activo'
  }, 'super');
  console.log('Super Admin creado: super / 123456');

  // 2. INSTITUCIÓN
  const inst = await Institucion.create({
    nombre: 'I.E.D. San José del Carmen',
    nit: '890123456-7',
    direccion: 'Calle 45 #12-34, Bogotá',
    telefono: '6013456789',
    email: 'info@sanjose.edu.co',
    dane: '11100100010',
    tipo: 'privado',
    configuracion: { notaMinima: 3.0, notaMaxima: 5.0, numeroPeriodos: 4, numPerdidas: 3 },
    estado: 'activo'
  });
  console.log('Institución creada');

  // 3. SEDES
  const sede1 = await Sede.create({ institucionId: inst._id, nombre: 'Sede Principal', abreviatura: 'SP', direccion: 'Calle 45 #12-34', telefono: '6013456789', estado: 'activo' });
  const sede2 = await Sede.create({ institucionId: inst._id, nombre: 'Sede Norte', abreviatura: 'SN', direccion: 'Carrera 78 #56-12', telefono: '6013456790', estado: 'activo' });
  console.log('2 sedes creadas');

  // 4. ADMIN del colegio
  const admin = await createUser({
    tipoDocumento: 'CC', documento: '1234567890',
    nombres: 'Admin', apellidos: 'Colegio',
    email: 'admin@sanjose.edu.co', celular: '3101234567',
    tipoPerfil: 'admin', roles: ['admin'],
    institucionId: inst._id, estado: 'activo'
  }, 'admin');
  console.log('Admin colegio: admin / 123456');

  // 5. RECTOR
  const rector = await createUser({
    tipoDocumento: 'CC', documento: '80123456',
    nombres: 'Roberto', apellidos: 'Martínez',
    email: 'rector@sanjose.edu.co', celular: '3112345678',
    tipoPerfil: 'rector', roles: ['rector'],
    institucionId: inst._id, estado: 'activo'
  }, 'rector');

  // 6. COORDINADOR
  const coordinador = await createUser({
    tipoDocumento: 'CC', documento: '80234567',
    nombres: 'Patricia', apellidos: 'López',
    email: 'coord@sanjose.edu.co', celular: '3123456789',
    tipoPerfil: 'coordinador', roles: ['coordinador'],
    institucionId: inst._id, estado: 'activo'
  }, 'coord');

  // 7. SECRETARIA
  const secretaria = await createUser({
    tipoDocumento: 'CC', documento: '80345678',
    nombres: 'Claudia', apellidos: 'Rodríguez',
    email: 'secretaria@sanjose.edu.co', celular: '3134567890',
    tipoPerfil: 'secretaria', roles: ['secretaria'],
    institucionId: inst._id, sedeId: sede1._id, estado: 'activo'
  }, 'secretaria');
  console.log('Rector, Coordinador, Secretaria creados');

  // 8. DOCENTES (10)
  const DOC_NAMES = [
    ['Carlos','Mendoza'],['Laura','Giraldo'],['Fernando','Álvarez'],
    ['Mónica','Castro'],['Ricardo','Peña'],['Diana','Suárez'],
    ['Andrés','Vargas'],['Camila','Rojas'],['Jorge','Medina'],['Elena','Silva']
  ];
  const docentes = [];
  for (let i = 0; i < DOC_NAMES.length; i++) {
    const d = await createUser({
      tipoDocumento: 'CC', documento: String(90000000 + i),
      nombres: DOC_NAMES[i][0], apellidos: DOC_NAMES[i][1],
      email: `docente${i+1}@sanjose.edu.co`, celular: `32000000${String(i).padStart(2,'0')}`,
      tipoPerfil: 'docente', roles: ['docente'],
      institucionId: inst._id, sedeId: i < 5 ? sede1._id : sede2._id,
      estado: 'activo'
    }, `docente${i+1}`);
    docentes.push(d);
  }
  console.log('10 docentes creados');

  // 9. AÑO ACADÉMICO
  const periodos = [];
  for (let p = 1; p <= 4; p++) {
    const inicio = new Date(2026, (p - 1) * 3, 1);
    const fin = new Date(2026, p * 3, 0);
    periodos.push({ numero: p, nombre: `${p} Periodo`, ciclo: 'normal', inicio, fin, estado: 'abierto' });
  }
  const anio = await AnioAcademico.create({
    institucionId: inst._id, anio: 2026, estado: 'activo',
    configuracion: { notaMinima: 3.0, notaMaxima: 5.0, numeroPeriodos: 4, numPerdidas: 3 },
    cronograma: { periodos }
  });
  console.log('Año académico 2026 creado');

  // 10. ÁREAS
  const areaData = [
    { nombre: 'Ciencias Naturales', abreviatura: 'CN', porcentaje: 25 },
    { nombre: 'Matemáticas', abreviatura: 'MAT', porcentaje: 25 },
    { nombre: 'Humanidades', abreviatura: 'HUM', porcentaje: 25 },
    { nombre: 'Inglés', abreviatura: 'ING', porcentaje: 15 },
    { nombre: 'Tecnología', abreviatura: 'TEC', porcentaje: 10 }
  ];
  const areas = [];
  for (let i = 0; i < areaData.length; i++) {
    const a = await Area.create({ institucionId: inst._id, sedeId: sede1._id, ...areaData[i], orden: i + 1 });
    areas.push(a);
  }
  console.log('5 áreas creadas');

  // 11. ASIGNATURAS
  const asigData = [
    { nombre: 'Biología', area: 0, hor: 4 },
    { nombre: 'Química', area: 0, hor: 4 },
    { nombre: 'Física', area: 0, hor: 4 },
    { nombre: 'Matemáticas', area: 1, hor: 5 },
    { nombre: 'Cálculo', area: 1, hor: 4 },
    { nombre: 'Lengua Castellana', area: 2, hor: 5 },
    { nombre: 'Literatura', area: 2, hor: 3 },
    { nombre: 'Filosofía', area: 2, hor: 2 },
    { nombre: 'Inglés', area: 3, hor: 4 },
    { nombre: 'Ciencias Sociales', area: 4, hor: 3 },
    { nombre: 'Historia', area: 4, hor: 3 },
    { nombre: 'Geografía', area: 4, hor: 2 },
    { nombre: 'Educación Física', area: 4, hor: 2 },
    { nombre: 'Arte', area: 4, hor: 2 },
    { nombre: 'Tecnología e Informática', area: 4, hor: 3 },
    { nombre: 'Religión', area: 4, hor: 1 },
    { nombre: 'Ética y Valores', area: 4, hor: 1 }
  ];
  const asignaturas = [];
  for (let i = 0; i < asigData.length; i++) {
    const s = await Asignatura.create({
      institucionId: inst._id, sedeId: sede1._id,
      areaId: areas[asigData[i].area]._id,
      nombre: asigData[i].nombre, intensidadHoraria: asigData[i].hor, orden: i + 1
    });
    asignaturas.push(s);
  }
  console.log(`${asignaturas.length} asignaturas creadas`);

  // 12. GRUPOS (6° a 11°, 2 jornadas)
  const grupos = [];
  const jornadas = ['manana', 'tarde'];
  for (let g = 6; g <= 11; g++) {
    for (const j of jornadas) {
      const director = docentes[g - 6];
      const gr = await Grupo.create({
        institucionId: inst._id, anioAcademicoId: anio._id,
        sedeId: g <= 8 ? sede1._id : sede2._id,
        nombre: `${g}° ${j === 'manana' ? 'A' : 'B'}`, grado: g, jornada: j,
        docenteDirectorId: director._id, capacidad: 35
      });
      grupos.push(gr);
    }
  }
  console.log(`${grupos.length} grupos creados (6° a 11°, mañana y tarde)`);

  // 13. CARGA ACADÉMICA (asignar docentes a grupos/asignaturas)
  const cargas = [];
  const asigPorGrado = {
    6: [0, 3, 5, 8, 9],
    7: [0, 1, 3, 5, 8, 10],
    8: [0, 1, 2, 3, 5, 8, 10],
    9: [1, 2, 3, 4, 5, 6, 8, 10],
    10: [1, 2, 3, 4, 5, 6, 7, 8, 9, 11],
    11: [1, 2, 3, 4, 5, 6, 7, 8, 9, 12]
  };
  let docenteIdx = 0;
  for (const gr of grupos) {
    const asigs = asigPorGrado[gr.grado] || [3, 5, 8];
    for (const ai of asigs) {
      const docente = docentes[docenteIdx % docentes.length];
      docenteIdx++;
      const c = await CargaAcademica.create({
        institucionId: inst._id, anioAcademicoId: anio._id,
        grupoId: gr._id, asignaturaId: asignaturas[ai]._id,
        docenteId: docente._id, horasSemanales: asignaturas[ai].intensidadHoraria || 4
      });
      cargas.push(c);
    }
  }
  console.log(`${cargas.length} cargas académicas creadas`);

  // 14. ESTUDIANTES (36 = 3 por grupo de 6° a 11°)
  const estudiantes = [];
  const acudientes = [];
  let estIdx = 0;
  for (const gr of grupos) {
    for (let i = 0; i < 3; i++) {
      const esMujer = Math.random() > 0.5;
      const nombres = esMujer ? pick(NAMES_F) : pick(NAMES_M);
      const apellidos = pick(APE) + ' ' + pick(APE);

      // Acudiente
      const acu = await createUser({
        tipoDocumento: 'CC', documento: doc(),
        nombres: esMujer ? pick(NAMES_F) + ' Acu' : pick(NAMES_M) + ' Acu',
        apellidos,
        email: `acudiente${estIdx}@test.com`,
        celular: `330${String(estIdx).padStart(7, '0')}`,
        tipoPerfil: 'acudiente', roles: ['acudiente'],
        institucionId: inst._id, estado: 'activo'
      });
      acudientes.push(acu);

      // Estudiante
      const est = await createUser({
        tipoDocumento: Math.random() > 0.3 ? 'TI' : 'RC',
        documento: String(1000000000 + estIdx),
        nombres, apellidos,
        email: `est${estIdx}@estudiante.edu.co`,
        celular: `340${String(estIdx).padStart(7, '0')}`,
        fechaNacimiento: new Date(2012 - (gr.grado - 6), Math.floor(Math.random()*12), Math.floor(Math.random()*28)+1),
        genero: esMujer ? 'F' : 'M',
        tipoPerfil: 'estudiante', roles: ['estudiante'],
        institucionId: inst._id, sedeId: gr.sedeId,
        acudientes: [{ acudienteId: acu._id, parentesco: 'Madre/Padre' }],
        estado: 'activo'
      });

      // Matrícula
      await Matricula.create({
        institucionId: inst._id, anioAcademicoId: anio._id,
        estudianteId: est._id, grupoId: gr._id,
        tipoMatricula: 'nueva', estado: 'activa'
      });

      estudiantes.push(est);
      estIdx++;
    }
  }
  console.log(`${estudiantes.length} estudiantes creados con matrícula y acudientes`);

  // 15. CONCEPTOS CONTABLES
  const conceptos = [];
  const conceptData = [
    { nombre: 'Matrícula', tipo: 'obligatorio', periodicidad: 'unico', valor: 150000 },
    { nombre: 'Pensión Mensual', tipo: 'obligatorio', periodicidad: 'mensual', valor: 280000 },
    { nombre: 'Seguro Escolar', tipo: 'obligatorio', periodicidad: 'anual', valor: 35000 },
    { nombre: 'Cuota de Mejoramiento', tipo: 'opcional', periodicidad: 'mensual', valor: 50000 },
    { nombre: 'Uniforme', tipo: 'opcional', periodicidad: 'unico', valor: 180000 },
    { nombre: 'Transporte', tipo: 'opcional', periodicidad: 'mensual', valor: 120000 }
  ];
  for (const cd of conceptData) {
    const c = await ConceptosContables.create({ institucionId: inst._id, ...cd, estado: 'activo' });
    conceptos.push(c);
  }
  console.log(`${conceptos.length} conceptos contables creados`);

  // RESUMEN
  console.log('\n========== RESUMEN ==========');
  console.log(`Super Admin:  super / 123456`);
  console.log(`Admin Colegio: admin / 123456`);
  console.log(`Rector:       rector / 123456 (doc: 80123456)`);
  console.log(`Coordinador:  coord / 123456 (doc: 80234567)`);
  console.log(`Secretaria:   secretaria / 123456 (doc: 80345678)`);
  console.log(`Docentes:     docente1..10 / 123456`);
  console.log(`Estudiantes:  estudiante con doc TI/RC / 123456`);
  console.log('================================');
  console.log(`Institución: ${inst.nombre}`);
  console.log(`Sedes: ${sede1.nombre}, ${sede2.nombre}`);
  console.log(`Año: 2026 (activo, 4 periodos)`);
  console.log(`Áreas: ${areas.length}`);
  console.log(`Asignaturas: ${asignaturas.length}`);
  console.log(`Grupos: ${grupos.length}`);
  console.log(`Cargas académicas: ${cargas.length}`);
  console.log(`Estudiantes: ${estudiantes.length}`);
  console.log(`Acudientes: ${acudientes.length}`);
  console.log(`Conceptos contables: ${conceptos.length}`);

  process.exit(0);
}

seed().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
