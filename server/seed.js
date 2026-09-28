require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const DireccionNucleo = require('./src/models/DireccionNucleo');
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

  // Limpiar todas las colecciones
  const cols = await mongoose.connection.db.listCollections().toArray();
  for (const c of cols) {
    await mongoose.connection.db.collection(c.name).deleteMany({});
  }
  console.log('BD limpiada');

  // =============================================
  // 1. NÚCLEOS (2)
  // =============================================
  const nucleo1 = await DireccionNucleo.create({
    nombre: 'Núcleo No. 1 - Centro',
    codigo: 'NC-01',
    municipio: 'Bogotá',
    departamento: 'Bogotá D.C.',
    contacto: { nombre: 'Pedro Núñez', email: 'nucleo1@easynots.com', telefono: '6013001111' },
    estado: 'activo'
  });

  const nucleo2 = await DireccionNucleo.create({
    nombre: 'Núcleo No. 2 - Oriente',
    codigo: 'NC-02',
    municipio: 'Bucaramanga',
    departamento: 'Santander',
    contacto: { nombre: 'Laura Puentes', email: 'nucleo2@easynots.com', telefono: '6076002222' },
    estado: 'activo'
  });
  console.log('2 núcleos creados');

  // =============================================
  // 2. INSTITUCIONES / COLEGIOS (3)
  // =============================================
  const inst1 = await Institucion.create({
    nombre: 'I.E.D. San José del Carmen',
    nit: '890123456-7',
    direccion: 'Calle 45 #12-34, Bogotá',
    telefono: '6013456789',
    email: 'info@sanjose.edu.co',
    dane: '11100100010',
    tipo: 'privado',
    nucleoId: nucleo1._id,
    configuracion: { notaMinima: 3.0, notaMaxima: 5.0, numeroPeriodos: 4, numPerdidas: 3 },
    estado: 'activo'
  });

  const inst2 = await Institucion.create({
    nombre: 'Colegio Santa María',
    nit: '890123457-8',
    direccion: 'Carrera 15 #30-45, Bogotá',
    telefono: '6013456790',
    email: 'info@santamaria.edu.co',
    dane: '11100100020',
    tipo: 'publico',
    nucleoId: nucleo1._id,
    configuracion: { notaMinima: 3.0, notaMaxima: 5.0, numeroPeriodos: 4, numPerdidas: 3 },
    estado: 'activo'
  });

  const inst3 = await Institucion.create({
    nombre: 'Institución Educativa El Llano',
    nit: '800198765-1',
    direccion: 'Avenida 56 #20-10, Bucaramanga',
    telefono: '6076301234',
    email: 'info@elllano.edu.co',
    dane: '68000100010',
    tipo: 'privado',
    nucleoId: nucleo2._id,
    configuracion: { notaMinima: 3.0, notaMaxima: 5.0, numeroPeriodos: 4, numPerdidas: 3 },
    estado: 'activo'
  });
  console.log('3 colegios creados');

  // =============================================
  // 3. SEDES (2 por colegio)
  // =============================================
  const sede1a = await Sede.create({ institucionId: inst1._id, nombre: 'Sede Principal', abreviatura: 'SP', direccion: 'Calle 45 #12-34', telefono: '6013456789', estado: 'activo' });
  const sede1b = await Sede.create({ institucionId: inst1._id, nombre: 'Sede Norte', abreviatura: 'SN', direccion: 'Carrera 78 #56-12', telefono: '6013456790', estado: 'activo' });
  const sede2a = await Sede.create({ institucionId: inst2._id, nombre: 'Sede Central', abreviatura: 'SC', direccion: 'Carrera 15 #30-45', telefono: '6013456791', estado: 'activo' });
  const sede3a = await Sede.create({ institucionId: inst3._id, nombre: 'Sede Principal', abreviatura: 'SPL', direccion: 'Avenida 56 #20-10', telefono: '6076301234', estado: 'activo' });
  const sede3b = await Sede.create({ institucionId: inst3._id, nombre: 'Sede Sur', abreviatura: 'SSU', direccion: 'Calle 10 #5-20', telefono: '6076301235', estado: 'activo' });
  console.log('5 sedes creadas');

  // =============================================
  // 4. SUPER ADMIN
  // =============================================
  const superAdmin = await createUser({
    tipoDocumento: 'CC', documento: '00000000',
    nombres: 'Super', apellidos: 'Admin',
    email: 'super@easynots.com', celular: '3000000000',
    tipoPerfil: 'super_admin', roles: ['super_admin'],
    estado: 'activo'
  }, 'super');
  console.log('Super Admin: super / 123456');

  // =============================================
  // 5. USUARIOS POR ROL — COLEGIO 1 (San José)
  // =============================================

  // Admin
  const admin1 = await createUser({
    tipoDocumento: 'CC', documento: '1234567890',
    nombres: 'Carlos', apellidos: 'Admin',
    email: 'admin@sanjose.edu.co', celular: '3101234567',
    tipoPerfil: 'admin', roles: ['admin'],
    institucionId: inst1._id, estado: 'activo'
  }, 'admin');

  // Rector
  const rector1 = await createUser({
    tipoDocumento: 'CC', documento: '80123456',
    nombres: 'Roberto', apellidos: 'Martínez',
    email: 'rector@sanjose.edu.co', celular: '3112345678',
    tipoPerfil: 'rector', roles: ['rector'],
    institucionId: inst1._id, estado: 'activo'
  }, 'rector');

  // Coordinador
  const coord1 = await createUser({
    tipoDocumento: 'CC', documento: '80234567',
    nombres: 'Patricia', apellidos: 'López',
    email: 'coord@sanjose.edu.co', celular: '3123456789',
    tipoPerfil: 'coordinador', roles: ['coordinador'],
    institucionId: inst1._id, estado: 'activo'
  }, 'coord');

  // Secretaria
  const secretaria1 = await createUser({
    tipoDocumento: 'CC', documento: '80345678',
    nombres: 'Claudia', apellidos: 'Rodríguez',
    email: 'secretaria@sanjose.edu.co', celular: '3134567890',
    tipoPerfil: 'secretaria', roles: ['secretaria'],
    institucionId: inst1._id, sedeId: sede1a._id, estado: 'activo'
  }, 'secretaria');

  // Docentes (10 en colegio 1)
  const DOC1 = [
    ['Carlos','Mendoza'],['Laura','Giraldo'],['Fernando','Álvarez'],
    ['Mónica','Castro'],['Ricardo','Peña'],['Diana','Suárez'],
    ['Andrés','Vargas'],['Camila','Rojas'],['Jorge','Medina'],['Elena','Silva']
  ];
  const docentes1 = [];
  for (let i = 0; i < DOC1.length; i++) {
    const d = await createUser({
      tipoDocumento: 'CC', documento: String(90000000 + i),
      nombres: DOC1[i][0], apellidos: DOC1[i][1],
      email: `docente${i+1}@sanjose.edu.co`, celular: `32000000${String(i).padStart(2,'0')}`,
      tipoPerfil: 'docente', roles: ['docente'],
      institucionId: inst1._id, sedeId: i < 5 ? sede1a._id : sede1b._id,
      estado: 'activo'
    }, `docente${i+1}`);
    docentes1.push(d);
  }
  console.log('Colegio 1: admin, rector, coordinador, secretaria, 10 docentes');

  // =============================================
  // 6. USUARIOS POR ROL — COLEGIO 2 (Santa María)
  // =============================================
  const admin2 = await createUser({
    tipoDocumento: 'CC', documento: '2234567890',
    nombres: 'Martha', apellidos: 'Gómez',
    email: 'admin@santamaria.edu.co', celular: '3201234567',
    tipoPerfil: 'admin', roles: ['admin'],
    institucionId: inst2._id, estado: 'activo'
  }, 'admin2');

  const rector2 = await createUser({
    tipoDocumento: 'CC', documento: '81123456',
    nombres: 'Fernando', apellidos: 'Díaz',
    email: 'rector@santamaria.edu.co', celular: '3212345678',
    tipoPerfil: 'rector', roles: ['rector'],
    institucionId: inst2._id, estado: 'activo'
  }, 'rector2');

  const coord2 = await createUser({
    tipoDocumento: 'CC', documento: '81234567',
    nombres: 'Sandra', apellidos: 'Morales',
    email: 'coord@santamaria.edu.co', celular: '3223456789',
    tipoPerfil: 'coordinador', roles: ['coordinador'],
    institucionId: inst2._id, estado: 'activo'
  }, 'coord2');

  const secretaria2 = await createUser({
    tipoDocumento: 'CC', documento: '81345678',
    nombres: 'Mónica', apellidos: 'Torres',
    email: 'secretaria@santamaria.edu.co', celular: '3234567890',
    tipoPerfil: 'secretaria', roles: ['secretaria'],
    institucionId: inst2._id, sedeId: sede2a._id, estado: 'activo'
  }, 'secretaria2');

  const DOC2 = [
    ['Pedro','Ángel'],['Ana','Ríos'],['Luis','Castaño'],
    ['Diana','Ospina'],['Santiago','Cardona']
  ];
  const docentes2 = [];
  for (let i = 0; i < DOC2.length; i++) {
    const d = await createUser({
      tipoDocumento: 'CC', documento: String(91000000 + i),
      nombres: DOC2[i][0], apellidos: DOC2[i][1],
      email: `docente${i+1}@santamaria.edu.co`, celular: `32400000${String(i).padStart(2,'0')}`,
      tipoPerfil: 'docente', roles: ['docente'],
      institucionId: inst2._id, sedeId: sede2a._id,
      estado: 'activo'
    }, `docente${i+1}c2`);
    docentes2.push(d);
  }
  console.log('Colegio 2: admin, rector, coordinador, secretaria, 5 docentes');

  // =============================================
  // 7. USUARIOS POR ROL — COLEGIO 3 (El Llano)
  // =============================================
  const admin3 = await createUser({
    tipoDocumento: 'CC', documento: '3234567890',
    nombres: 'Jorge', apellidos: 'Restrepo',
    email: 'admin@elllano.edu.co', celular: '3301234567',
    tipoPerfil: 'admin', roles: ['admin'],
    institucionId: inst3._id, estado: 'activo'
  }, 'admin3');

  const rector3 = await createUser({
    tipoDocumento: 'CC', documento: '82123456',
    nombres: 'Gloria', apellidos: 'Suárez',
    email: 'rector@elllano.edu.co', celular: '3312345678',
    tipoPerfil: 'rector', roles: ['rector'],
    institucionId: inst3._id, estado: 'activo'
  }, 'rector3');

  const coord3 = await createUser({
    tipoDocumento: 'CC', documento: '82234567',
    nombres: 'Ricardo', apellidos: 'Zambrano',
    email: 'coord@elllano.edu.co', celular: '3323456789',
    tipoPerfil: 'coordinador', roles: ['coordinador'],
    institucionId: inst3._id, estado: 'activo'
  }, 'coord3');

  const secretaria3 = await createUser({
    tipoDocumento: 'CC', documento: '82345678',
    nombres: 'Teresa', apellidos: 'Herrera',
    email: 'secretaria@elllano.edu.co', celular: '3334567890',
    tipoPerfil: 'secretaria', roles: ['secretaria'],
    institucionId: inst3._id, sedeId: sede3a._id, estado: 'activo'
  }, 'secretaria3');

  const DOC3 = [
    ['Andrés','Santos'],['Valentina','Luna'],['Miguel','Parra'],
    ['Carolina','Bernal'],['Felipe','Guerra'],['Lucía','Mejía']
  ];
  const docentes3 = [];
  for (let i = 0; i < DOC3.length; i++) {
    const d = await createUser({
      tipoDocumento: 'CC', documento: String(92000000 + i),
      nombres: DOC3[i][0], apellidos: DOC3[i][1],
      email: `docente${i+1}@elllano.edu.co`, celular: `33400000${String(i).padStart(2,'0')}`,
      tipoPerfil: 'docente', roles: ['docente'],
      institucionId: inst3._id, sedeId: i < 3 ? sede3a._id : sede3b._id,
      estado: 'activo'
    }, `docente${i+1}c3`);
    docentes3.push(d);
  }
  console.log('Colegio 3: admin, rector, coordinador, secretaria, 6 docentes');

  // =============================================
  // 8. ÁREAS Y ASIGNATURAS (por colegio)
  // =============================================
  const areaData = [
    { nombre: 'Ciencias Naturales', abreviatura: 'CN', porcentaje: 25 },
    { nombre: 'Matemáticas', abreviatura: 'MAT', porcentaje: 25 },
    { nombre: 'Humanidades', abreviatura: 'HUM', porcentaje: 25 },
    { nombre: 'Inglés', abreviatura: 'ING', porcentaje: 15 },
    { nombre: 'Tecnología', abreviatura: 'TEC', porcentaje: 10 }
  ];
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
    { nombre: 'Tecnología e Informática', area: 4, hor: 3 }
  ];

  async function crearAcademico(institucion, sede, docentes) {
    // Áreas
    const areas = [];
    for (let i = 0; i < areaData.length; i++) {
      const a = await Area.create({ institucionId: institucion._id, sedeId: null, ...areaData[i], orden: i + 1 });
      areas.push(a);
    }

    // Asignaturas
    const asignaturas = [];
    for (let i = 0; i < asigData.length; i++) {
      const s = await Asignatura.create({
        institucionId: institucion._id, sedeId: null,
        areaId: areas[asigData[i].area]._id,
        nombre: asigData[i].nombre, intensidadHoraria: asigData[i].hor, orden: i + 1
      });
      asignaturas.push(s);
    }

    // Año académico
    const periodos = [];
    for (let p = 1; p <= 4; p++) {
      periodos.push({ numero: p, nombre: `${p} Periodo`, ciclo: 'normal', inicio: new Date(2026, (p-1)*3, 1), fin: new Date(2026, p*3, 0), estado: 'abierto' });
    }
    const anio = await AnioAcademico.create({
      institucionId: institucion._id, anio: 2026, estado: 'activo',
      configuracion: { notaMinima: 3.0, notaMaxima: 5.0, numeroPeriodos: 4, numPerdidas: 3 },
      cronograma: { periodos }
    });

    // Grupos (6° a 11°, mañana)
    const grupos = [];
    for (let g = 6; g <= 11; g++) {
      const director = docentes[(g - 6) % docentes.length];
      const gr = await Grupo.create({
        institucionId: institucion._id, anioAcademicoId: anio._id,
        sedeId: sede._id,
        nombre: `${g}° A`, grado: g, jornada: 'manana',
        docenteDirectorId: director._id, capacidad: 35
      });
      grupos.push(gr);
    }

    // Carga académica
    let idx = 0;
    for (const gr of grupos) {
      const asigIndices = [3, 5, 8]; // Matemáticas, Lengua, Inglés
      for (const ai of asigIndices) {
        await CargaAcademica.create({
          institucionId: institucion._id, anioAcademicoId: anio._id,
          grupoId: gr._id, asignaturaId: asignaturas[ai]._id,
          docenteId: docentes[idx % docentes.length]._id,
          horasSemanales: asignaturas[ai].intensidadHoraria || 4
        });
        idx++;
      }
    }

    // Conceptos contables (solo colegios privados)
    const conceptData = [
      { nombre: 'Matrícula', tipo: 'obligatorio', periodicidad: 'unico', valor: 150000 },
      { nombre: 'Pensión Mensual', tipo: 'obligatorio', periodicidad: 'mensual', valor: 280000 },
      { nombre: 'Seguro Escolar', tipo: 'obligatorio', periodicidad: 'anual', valor: 35000 },
      { nombre: 'Cuota de Mejoramiento', tipo: 'opcional', periodicidad: 'mensual', valor: 50000 }
    ];
    if (institucion.tipo !== 'publico') {
      for (const cd of conceptData) {
        await ConceptosContables.create({ institucionId: institucion._id, ...cd, estado: 'activo' });
      }
    }

    return { areas, asignaturas, anio, grupos };
  }

  const acad1 = await crearAcademico(inst1, sede1a, docentes1);
  console.log('Académico colegio 1 creado');

  const acad2 = await crearAcademico(inst2, sede2a, docentes2);
  console.log('Académico colegio 2 creado');

  const acad3 = await crearAcademico(inst3, sede3a, docentes3);
  console.log('Académico colegio 3 creado');

  // =============================================
  // 9. ESTUDIANTES Y ACUDIENTES
  // =============================================
  const NAMES_M = ['Juan','Carlos','Andrés','Miguel','Luis','Pedro','Diego','Santiago','Mateo','Sebastián','Daniel','Nicolás'];
  const NAMES_F = ['María','Ana','Laura','Sofía','Valentina','Camila','Daniela','Isabella','Luciana','Gabriela','Paula','Emma'];
  const APE = ['García','Rodríguez','Martínez','López','González','Hernández','Pérez','Sánchez','Ramírez','Torres','Flores','Rivera'];
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function doc() { return String(Math.floor(10000000 + Math.random() * 90000000)); }

  async function crearEstudiantes(institucion, sede, grupos, docentes, prefijo) {
    const estudiantes = [];
    const acudientes = [];
    let estIdx = 0;
    for (const gr of grupos) {
      for (let i = 0; i < 2; i++) {
        const esMujer = Math.random() > 0.5;
        const nombres = esMujer ? pick(NAMES_F) : pick(NAMES_M);
        const apellidos = pick(APE) + ' ' + pick(APE);

        const acu = await createUser({
          tipoDocumento: 'CC', documento: doc(),
          nombres: esMujer ? pick(NAMES_F) + ' Acu' : pick(NAMES_M) + ' Acu',
          apellidos,
          email: `acudiente${prefijo}${estIdx}@test.com`,
          celular: `33${String(estIdx).padStart(8, '0')}`,
          tipoPerfil: 'acudiente', roles: ['acudiente'],
          institucionId: institucion._id, estado: 'activo'
        });
        acudientes.push(acu);

        const est = await createUser({
          tipoDocumento: Math.random() > 0.3 ? 'TI' : 'RC',
          documento: `${prefijo}${String(100000 + estIdx).slice(-6)}`,
          nombres, apellidos,
          email: `est${prefijo}${estIdx}@estudiante.edu.co`,
          celular: `34${String(estIdx).padStart(8, '0')}`,
          fechaNacimiento: new Date(2012 - (gr.grado - 6), Math.floor(Math.random()*12), Math.floor(Math.random()*28)+1),
          genero: esMujer ? 'F' : 'M',
          tipoPerfil: 'estudiante', roles: ['estudiante'],
          institucionId: institucion._id, sedeId: sede._id,
          acudientes: [{ acudienteId: acu._id, parentesco: 'Madre/Padre' }],
          estado: 'activo'
        });

        await Matricula.create({
          institucionId: institucion._id, anioAcademicoId: grupos[0] ? (await AnioAcademico.findOne({ institucionId: institucion._id }))._id : null,
          estudianteId: est._id, grupoId: gr._id,
          tipoMatricula: 'nueva', estado: 'activa'
        });

        estudiantes.push(est);
        estIdx++;
      }
    }
    return { estudiantes, acudientes };
  }

  const est1 = await crearEstudiantes(inst1, sede1a, acad1.grupos, docentes1, 'C1');
  console.log(`Colegio 1: ${est1.estudiantes.length} estudiantes, ${est1.acudientes.length} acudientes`);

  const est2 = await crearEstudiantes(inst2, sede2a, acad2.grupos, docentes2, 'C2');
  console.log(`Colegio 2: ${est2.estudiantes.length} estudiantes, ${est2.acudientes.length} acudientes`);

  const est3 = await crearEstudiantes(inst3, sede3a, acad3.grupos, docentes3, 'C3');
  console.log(`Colegio 3: ${est3.estudiantes.length} estudiantes, ${est3.acudientes.length} acudientes`);

  // =============================================
  // RESUMEN
  // =============================================
  console.log('\n' + '='.repeat(50));
  console.log('           RESUMEN DEL SEED');
  console.log('='.repeat(50));
  console.log('\nNÚCLEOS:');
  console.log(`  ${nucleo1.nombre} (Código: ${nucleo1.codigo})`);
  console.log(`  ${nucleo2.nombre} (Código: ${nucleo2.codigo})`);
  console.log('\nCOLEGIOS:');
  console.log(`  1. ${inst1.nombre} → Núcleo 1`);
  console.log(`  2. ${inst2.nombre} → Núcleo 1`);
  console.log(`  3. ${inst3.nombre} → Núcleo 2`);
  console.log('\nUSUARIOS PARA PROBAR (todos con contraseña: 123456):');
  console.log('─'.repeat(50));
  console.log('  ROL              | USUARIO     | COLEGIO');
  console.log('─'.repeat(50));
  console.log('  super_admin      | super       | (todos)');
  console.log('  admin            | admin       | San José');
  console.log('  admin            | admin2      | Santa María');
  console.log('  admin            | admin3      | El Llano');
  console.log('  rector           | rector      | San José');
  console.log('  rector           | rector2     | Santa María');
  console.log('  rector           | rector3     | El Llano');
  console.log('  coordinador      | coord       | San José');
  console.log('  coordinador      | coord2      | Santa María');
  console.log('  coordinador      | coord3      | El Llano');
  console.log('  secretaria       | secretaria  | San José');
  console.log('  secretaria       | secretaria2 | Santa María');
  console.log('  secretaria       | secretaria3 | El Llano');
  console.log('  docente          | docente1-10 | San José');
  console.log('  docente          | docente1-5c2| Santa María');
  console.log('  docente          | docente1-6c3| El Llano');
  console.log('  estudiante       | C100000-C1  | San José');
  console.log('  estudiante       | C200000-C2  | Santa María');
  console.log('  estudiante       | C300000-C3  | El Llano');
  console.log('  acudiente        | acudienteC1*| San José');
  console.log('  acudiente        | acudienteC2*| Santa María');
  console.log('  acudiente        | acudienteC3*| El Llano');
  console.log('─'.repeat(50));
  console.log('\nTodos los usuarios usan contraseña: 123456');
  console.log('Los estudiantes y acudientes se loguean con su N° de documento');

  process.exit(0);
}

seed().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
