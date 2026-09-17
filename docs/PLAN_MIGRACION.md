# 📋 Plan de Migración EasyNotes

## Migración de ASP.NET WebForms (VB.NET + MySQL) → Node.js + MongoDB + React

---

## 1. Resumen del Sistema Actual

### 1.1 Tecnología Actual
| Componente | Tecnología |
|---|---|
| Backend | ASP.NET WebForms (.NET Framework 4.0) con VB.NET |
| Base de Datos | MySQL con Stored Procedures |
| Controles UI | DevExpress v10.1 (Grids, Editors, Reports) |
| Autenticación | Forms Authentication |
| Almacenamiento | FTP externo para imágenes (escudos, firmas, carnets) |
| Reportes | DevExpress Reports (XtraReport) |

### 1.2 Roles del Sistema (7 perfiles)
| # | Rol | Descripción |
|---|---|---|
| 1 | Estudiante | Consulta notas, boletines, observador, cronograma, votaciones |
| 2 | Docente | Calificar, indicadores, actividades, observador, planillas |
| 3 | Admin/Secretaría | Gestión completa: estudiantes, docentes, configuración, reportes |
| 4 | Acudiente | Ver notas, boletines, observador, cronograma de sus hijos |
| 5 | Rector | Estadísticas, seguimiento, informes periódicos, observador |
| 6 | Coordinador | Seguimiento, estadísticas, excusas, informes, observador |
| 7 | Dirección de Núcleo | Gestiona instituciones del núcleo, aprueba auto-registros, ve estadísticas de todos sus colegios |

### 1.3 Módulos Identificados por Rol

#### 🔹 Admin/Secretaría (40+ pantallas)
- **Gestión de Personas**: Agregar/Editar Estudiantes, Docentes, Acudientes, Usuarios
- **Gestión Académica**: Áreas, Grupos, Carga Académica, Indicadores, Cambio de Grupo, Especialidad
- **Calificación**: Calificar, Calificar Indicadores
- **Configuración**: Configurar Sistema, Configuración Contable, Concepto Contable
- **Cronograma**: Gestión de períodos académicos (variable, hasta 5 períodos)
- **Generación de Documentos**: Boletines, Carnets, Matrículas, Certificados, Constancias, Pensiones
- **Contabilidad**: Generar Pensión, Conceptos Contables, Recibos
- **Estadísticas**: Estadísticas académicas generales
- **Elecciones**: Candidatos, Eventos Electorales
- **Otros**: Bitácora, Envío de Comunicados, Excusas Docentes, Habilitaciones, Cierre de Año, Cambio Tipo Persona, Forzar Eliminación

#### 🔹 Docente (25+ pantallas)
- **Calificación**: Calificar, Calificar Actividades, Calificar Indicadores
- **Gestión Académica**: Carga Académica, Indicadores, Crear Actividades, Carga de Indicadores
- **Observador**: Observador del Estudiante, Observaciones por Área, Observaciones por Estudiante
- **Planillas**: Planilla de Actividades
- **Informes**: Informes Periódicos, Boletín de Estudiante, Estadísticas
- **Recuperaciones y Habilitaciones**
- **Excusas**: Excusas del Docente
- **Listados Varios**
- **Bitácora, Perfil, Cronograma**

#### 🔹 Acudiente (8 pantallas)
- **Consulta de Notas**: Ver Notas de sus hijos
- **Documentos**: Ver Boletín, Ver Observador
- **Cronograma**: Ver Cronograma
- **Perfil y Cambio de Contraseña**

#### 🔹 Coordinador (20+ pantallas)
- **Seguimiento Académico**: Seguimiento, Informes Periódicos
- **Observador**: Observador del Estudiante
- **Estadísticas**: Estadísticas académicas
- **Gestión**: Excusas Docentes, Certificados, Constancias
- **Elecciones**: Candidatos, Eventos Electorales, Permisos, Resultados
- **Informes**: Boletín de Estudiante, Listados Varios, Informe de Excusas
- **Bitácora, Perfil, Cronograma**

#### 🔹 Rector (15+ pantallas)
- **Seguimiento Académico**: Seguimiento, Informes Periódicos
- **Observador**: Observador del Estudiante
- **Estadísticas**: Estadísticas académicas
- **Gestión**: Excusas Docentes
- **Elecciones**: Eventos Electorales, Resultados
- **Informes**: Listados Varios, Informe de Excusas
- **Bitácora, Perfil, Cronograma**

#### 🔹 Estudiante (12+ pantallas)
- **Consulta**: Ver Notas, Ver Boletín, Ver Observador
- **Elecciones**: Candidatos, Votar, Puestos, Elecciones, Resultados
- **Cronograma, Información, Perfil**

#### 🔹 Dirección de Núcleo (nuevo rol)
- **Gestión de Instituciones**: Crear colegios asignados al núcleo, crear usuario admin inicial por colegio
- **Auto-registro**: Aprobar o rechazar solicitudes de colegios que quieren unirse al núcleo
- **Estadísticas**: Ver estadísticas agregadas de todos los colegios del núcleo, comparativo entre colegios
- **Reportes**: Reportes consolidados del núcleo
- **Restricción**: Sin acceso a datos operativos internos de los colegios (calificaciones, estudiantes, docentes, observador)

#### 🔹 Público (sin autenticación)
- **Login**: Selección de colegio, año, perfil
- **Prematrícula**: Registro y edición de prematrícula
- **Recuperación de Contraseña**
- **Selección de colegio para acudientes con múltiples hijos**

### 1.4 Reportes Identificados (DevExpress XtraReports)
| Categoría | Reportes |
|---|---|
| Boletines | Acumulativo, Corto, Descriptivo, por Áreas, por Estudiante, Final, Preescolar, Indicadores, Inclusión, Semestralizado |
| Certificados | Individual (4 formatos), Por Grupo (4 formatos), Valoración Final |
| Constancias | 2 formatos |
| Contables | Conceptos, Falta por Pagar, Listado Novedad, Pagos Recibidos, Permisos, Recibos, Subrecibos, Valores por Concepto |
| Estadísticas | Estadísticas generales, Áreas perdidas, Evolución (docente/estudiante/grupo), Cuadro de Honor, Mejores por Grupo, Rendimiento (docente/sede), Promovidos, Listas Totales |
| Periódicos | Resumen Académico, Acumulativo por Grupo, Acumulativo Fallas, Ingreso de Notas, Ingreso de Indicadores, Resumen Gráfico, Seguimiento de Resultados |
| Electorales | Abstención por Grupo, Votos por Candidato |
| Carnets | Generación de carnets (estudiantes, docentes, administrativos) |
| Seguimiento | Seguimiento de resultados |
| Varios | Libro Final, Listados Varios, Generales, Recibos Contables |

### 1.5 Stored Procedures Identificados (desde código VB)
| SP | Función |
|---|---|
| `paFillLogin1` | Validar credenciales de login |
| `paFillConfiguracion` | Obtener configuración del colegio |
| `paUdConfiguracion` | Guardar configuración del colegio |
| `paUdConvenciones1` | Guardar niveles/convenciones de notas |
| `paUdDaneColegio` | Guardar código DANE e ICFES |
| `paFillCronograma` | Obtener cronograma de períodos |
| `PaFillCronogramaprematricula` | Obtener fechas de prematrícula |
| `paFillEstudiantesAcudiente` | Obtener estudiantes asociados a un acudiente |
| `g_Bitacora` | Registrar evento en bitácora |

---

## 2. Stack Tecnológico Nuevo

### 2.1 Backend
| Componente | Tecnología | Justificación |
|---|---|---|
| Runtime | Node.js (LTS) | Alta concurrencia, ecosistema maduro |
| Framework | Express.js | Simple, flexible, amplio ecosistema |
| ODM | Mongoose | Schema validation, middleware, population |
| Base de Datos | MongoDB | Flexible para multi-institución, documentos anidados |
| Autenticación | JWT (jsonwebtoken + bcrypt) | Stateless, escalable para SPA |
| Validación | express-validator | Validación de entrada en middleware |
| Reportes PDF | PDFKit o Puppeteer | Generación dinámica de reportes |
| Subida de Archivos | Multer + almacenamiento local/S3 | Reemplazo de FTP |
| Logging | Winston | Logging estructurado |
| CORS | cors | Configuración multi-origen |
| Variables de Entorno | dotenv | Configuración segura |
| Seguridad | helmet, express-rate-limit | Headers seguros, rate limiting |
| Testing | Jest + Supertest | Testing de APIs |

### 2.2 Frontend
| Componente | Tecnología | Justificación |
|---|---|---|
| Framework | React 18+ | Componentes reutilizables, gran ecosistema |
| Build Tool | Vite | Rápido HMR, build optimizado |
| Routing | React Router v6 | Navegación SPA |
| Estado Global | Zustand | Ligero, simple, sin boilerplate |
| HTTP Client | Axios | Interceptors, cancelación de requests |
| Formularios | React Hook Form + Zod | Rendimiento y validación type-safe |
| Tablas/Datos | TanStack Table (React Table) | Tablas potentes con ordenamiento, filtros, paginación |
| UI Components | Shadcn/ui + Tailwind CSS | Componentes modernos, personalizables, sin dependencias pesadas |
| Gráficos | Recharts | Estadísticas visuales |
| PDF en cliente | @react-pdf/renderer | Generación de PDF en frontend |
| Icons | Lucide React | Iconografía consistente |
| Testing | Vitest + React Testing Library | Testing de componentes |

### 2.3 DevOps / Infraestructura
| Componente | Tecnología |
|---|---|
| Servidor | VPS (DigitalOcean, Hetzner, Linode, etc.) |
| OS | Ubuntu Server LTS |
| Proxy Inverso | Nginx |
| Process Manager | PM2 |
| Contenedores | Docker + Docker Compose (opcional) |
| CI/CD | GitHub Actions (opcional) |
| SSL | Let's Encrypt (Certbot) |
| Backups | Mongodump + cron automatizado |
| Monitoreo | PM2 Monitor o Netdata (opcional) |

---

## 3. Diseño de Base de Datos (MongoDB)

### 3.1 Estrategia Multi-Institución
Se utilizará una **base de datos única con aislamiento por campo `institucionId`** en cada colección. Esto permite:
- Consultas simples y rápidas
- Índices compuestos eficientes
- Escalabilidad horizontal futura
- Facilidad de administración

> **Alternativa evaluada**: Base de datos separada por institución (descartada por complejidad de mantenimiento y migración).

### 3.2 Colecciones Principales

```
Instituciones
├── _id, nucleoId              (ref: DireccionesNucleo, opcional)
├── nombre, nit, direccion, telefono, email, logo
├── configuracion: {
│     notaMaxima, notaMinima, aproximarPromedio,
│     niveles: [{ orden, codigo, valor }],
│     ligaCalificacion, ligaPeriodo, fotoEstudiante,
│     pierdeAnoPor, numPerdidas,
│     notaHabilitaciones, porcentajeHabilitaciones,
│     anoLectivo, actaRecuperacion
│   }
├── dane, icfes
├── imagenes: { escudo, firmaRector, firmaSecretaria, carnetFrente, carnetAtras }
├── rectorId, secretariaId
├── certificadoEncabezado
└── estado, createdAt, updatedAt

Usuarios
├── _id, institucionId          (null para rol dirNucleo)
├── nucleoId                    (solo para tipoPerfil "7"=dirNucleo; null para los demás)
├── tipoDocumento, documento, nombres, apellidos
├── nombreCompleto (virtual / concatenado)
├── email, telefono, direccion, fechaNacimiento, lugarNacimiento
├── genero, foto, estado (1=activo, 2=inactivo)
├── tipoPerfil: String ("1"=est, "2"=doc, "3"=acu, "5.1"=admin, "5.2"=rector, "5.3"=coord, "7"=dirNucleo)
├── acudientes: [{ acudienteId, parentesco }]         (para estudiantes)
├── estudiantes: [{ estudianteId, parentesco, nombre }] (para acudientes)
├── credenciales: {
│     usuario, passwordHash,
│     debeCambiarPassword: Boolean,
│     ultimoLogin
│   }
└── createdAt, updatedAt

AniosAcademicos
├── _id, institucionId
├── anio (ej: 2026)
├── estado: 'activo' | 'cerrado'
├── cronograma: {
│     prematricula: { inicio, fin, estado },
│     periodos: [{
│       numero, nombre, inicio, fin, estado,
│       recuperacion: { inicio, fin }
│     }],
│     habilitaciones: { inicio, fin }
│   }
└── configuracion: { notaMaxima, notaMinima, niveles[], pierdeAnoPor,
                     numPerdidas, notaHabilitaciones, porcentajeHabilitaciones,
                     aproximar }

DireccionesNucleo
├── _id, nombre, codigo, municipio, departamento
├── responsableId              (ref: Usuarios)
├── contacto: { nombre, email, telefono }
└── estado, createdAt, updatedAt

SolicitudesRegistro            (auto-registro de colegios al núcleo)
├── _id, nucleoId              (ref: DireccionesNucleo)
├── nombre, nit, municipio, direccion
├── contacto: { nombre, email, telefono }
├── estado: 'pendiente' | 'aprobada' | 'rechazada'
├── procesadoPor, observaciones
└── createdAt, updatedAt

Sedes
├── _id, institucionId, nombre, direccion, estado
└── createdAt, updatedAt

Grupos
├── _id, institucionId, anioAcademicoId, sedeId
├── nombre, grado, jornada, especialidad
├── docenteDirectorId
└── estado, capacidad

Areas
├── _id, institucionId
├── nombre, abreviatura, orden
├── porcentaje (si aplica)
└── estado

Asignaturas (Materias)
├── _id, institucionId, areaId
├── nombre, abreviatura, orden
├── intensidadHoraria
└── estado

CargaAcademica
├── _id, institucionId, anioAcademicoId, grupoId, asignaturaId
├── docenteId, horasSemanales
└── estado

Matriculas
├── _id, institucionId, anioAcademicoId, estudianteId, grupoId
├── tipoMatricula: 'nueva' | 'renovacion' | 'traslado' | 'promovido'
├── fechaMatricula, numeroMatricula
├── estado: 'activa' | 'retirada' | 'trasladada'
└── promovido, observaciones

Indicadores
├── _id, institucionId, anioAcademicoId, asignaturaId, periodo
├── codigo, descripcion, estado, orden
└── createdAt, updatedAt

Actividades
├── _id, institucionId, anioAcademicoId, asignaturaId, grupoId, docenteId
├── periodo, titulo, descripcion, tipo, porcentaje
├── fechaCreacion, fechaLimite
└── estado

Calificaciones
├── _id, institucionId, anioAcademicoId
├── estudianteId, asignaturaId, grupoId, periodo
├── nota, recuperacion, habilitacion
├── indicadores: [{ indicadorId, nota }]
├── actividades: [{ actividadId, nota }]
├── observacion
├── docenteId, fechaCalificacion
└── estado

Observador
├── _id, institucionId, anioAcademicoId, estudianteId
├── tipo: 'disciplinario' | 'academico' | 'convivencia'
├── fecha, descripcion, compromiso
├── docenteId, coordinadorId
├── seguimiento: [{ fecha, observacion, responsable }]
├── estado: 'abierto' | 'cerrado' | 'seguimiento'
└── categoria, gravedad

Excusas
├── _id, institucionId, anioAcademicoId
├── docenteId, fechaInicio, fechaFin
├── motivo, soporteDocumental
├── estado: 'pendiente' | 'aprobada' | 'rechazada'
└── aprobadoPor, observaciones

Bitacora
├── _id, institucionId
├── usuarioId, accion, observacion, ip
└── createdAt

Comunicados
├── _id, institucionId
├── remitenteId, destinatarios: [{ usuarioId, rol }]
├── asunto, mensaje, fecha, prioridad
├── leido: [{ usuarioId, fechaLectura }]
└── estado

Elecciones
├── _id, institucionId, anioAcademicoId
├── nombre, descripcion, fecha, estado
├── candidatos: [{ estudianteId, propuesta, foto }]
├── votos: [{ estudianteId, candidatoId, fecha }]
├── permisos: [{ grupoId, habilitado }]
└── resultados

ConceptosContables
├── _id, institucionId
├── nombre, descripcion, tipo, valor
├── periodicidad, estado, configuracion
└── createdAt, updatedAt

Pagos
├── _id, institucionId, anioAcademicoId, estudianteId
├── conceptoId, valor, descuento, recargo
├── fechaPago, fechaVencimiento
├── estado: 'pendiente' | 'pagado' | 'vencido' | 'anulado'
├── metodoPago, referencia, observaciones
└── recibidoPor

Prematriculas
├── _id, institucionId, anioAcademicoId
├── estudiante: { nombres, apellidos, tipoDocumento, documento, fechaNacimiento, genero, ... }
├── acudiente: { nombres, apellidos, tipoDocumento, documento, parentesco, email, telefono, ... }
├── gradoSolicitado, grupoSolicitado
├── documentosAdjuntos: []
├── estado: 'pendiente' | 'aprobada' | 'rechazada' | 'matriculada'
└── observaciones, fechaRegistro
```

### 3.3 Índices Recomendados
```javascript
// Colecciones críticas por rendimiento (hasta 4000 estudiantes)
db.Usuarios.createIndex({ institucionId: 1, documento: 1 }, { unique: true })
db.Usuarios.createIndex({ institucionId: 1, "credenciales.usuario": 1 })
db.Matriculas.createIndex({ institucionId: 1, anioAcademicoId: 1, grupoId: 1 })
db.Matriculas.createIndex({ institucionId: 1, estudianteId: 1, anioAcademicoId: 1 })
db.Calificaciones.createIndex({ institucionId: 1, anioAcademicoId: 1, grupoId: 1, periodo: 1 })
db.Calificaciones.createIndex({ institucionId: 1, estudianteId: 1, anioAcademicoId: 1 })
db.CargaAcademica.createIndex({ institucionId: 1, anioAcademicoId: 1, docenteId: 1 })
db.CargaAcademica.createIndex({ institucionId: 1, anioAcademicoId: 1, grupoId: 1 })
db.Observador.createIndex({ institucionId: 1, estudianteId: 1, anioAcademicoId: 1 })
db.Bitacora.createIndex({ institucionId: 1, createdAt: -1 })
db.Pagos.createIndex({ institucionId: 1, anioAcademicoId: 1, estado: 1 })
db.Elecciones.createIndex({ institucionId: 1, anioAcademicoId: 1, estado: 1 })
db.Instituciones.createIndex({ nucleoId: 1 })
db.Usuarios.createIndex({ nucleoId: 1, "credenciales.usuario": 1 })
db.SolicitudesRegistro.createIndex({ nucleoId: 1, estado: 1 })
```

---

## 4. Arquitectura del Backend

### 4.1 Estructura de Directorios
```
server/
├── src/
│   ├── config/
│   │   ├── database.js              # Conexión MongoDB
│   │   ├── env.js                   # Variables de entorno
│   │   └── constants.js             # Constantes del sistema
│   ├── models/
│   │   ├── Institucion.js
│   │   ├── DireccionNucleo.js
│   │   ├── SolicitudRegistro.js
│   │   ├── Usuario.js
│   │   ├── AnioAcademico.js
│   │   ├── Sede.js
│   │   ├── Grupo.js
│   │   ├── Area.js
│   │   ├── Asignatura.js
│   │   ├── CargaAcademica.js
│   │   ├── Matricula.js
│   │   ├── Indicador.js
│   │   ├── Actividad.js
│   │   ├── Calificacion.js
│   │   ├── Observador.js
│   │   ├── Excusa.js
│   │   ├── Bitacora.js
│   │   ├── Comunicado.js
│   │   ├── Eleccion.js
│   │   ├── ConceptoContable.js
│   │   ├── Pago.js
│   │   └── Prematricula.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── institucionController.js
│   │   ├── nucleoController.js
│   │   ├── usuarioController.js
│   │   ├── anioAcademicoController.js
│   │   ├── grupoController.js
│   │   ├── cargaAcademicaController.js
│   │   ├── matriculaController.js
│   │   ├── calificacionController.js
│   │   ├── observadorController.js
│   │   ├── reporteController.js
│   │   ├── eleccionController.js
│   │   ├── contabilidadController.js
│   │   ├── comunicacionController.js
│   │   └── prematriculaController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── institucionRoutes.js
│   │   ├── nucleoRoutes.js
│   │   ├── usuarioRoutes.js
│   │   ├── anioAcademicoRoutes.js
│   │   ├── grupoRoutes.js
│   │   ├── cargaAcademicaRoutes.js
│   │   ├── matriculaRoutes.js
│   │   ├── calificacionRoutes.js
│   │   ├── observadorRoutes.js
│   │   ├── reporteRoutes.js
│   │   ├── eleccionRoutes.js
│   │   ├── contabilidadRoutes.js
│   │   ├── comunicacionRoutes.js
│   │   └── prematriculaRoutes.js
│   ├── middlewares/
│   │   ├── auth.js                   # Verificación JWT
│   │   ├── roleAuth.js              # Autorización por rol (incluye restricción de escritura para dirNucleo)
│   │   ├── institucionAuth.js       # Filtro multi-institución (soporta array de institucionIds para dirNucleo)
│   │   ├── errorHandler.js          # Manejo centralizado de errores
│   │   ├── validator.js             # Validación de schemas
│   │   └── logger.js                # Logging de requests
│   ├── services/
│   │   ├── authService.js           # Lógica de autenticación
│   │   ├── calificacionService.js   # Lógica compleja de calificaciones
│   │   ├── promocionService.js      # Lógica de promoción/reprobación
│   │   ├── reporteService.js        # Generación de reportes
│   │   ├── contabilidadService.js   # Cálculos contables
│   │   └── eleccionService.js       # Lógica electoral
│   ├── utils/
│   │   ├── pdfGenerator.js          # Generación de PDFs
│   │   ├── fileUpload.js            # Subida de archivos
│   │   ├── helpers.js               # Funciones auxiliares
│   │   └── numeroALetras.js         # Conversión número a letras
│   └── app.js                       # App Express principal
├── .env
├── .env.example
├── package.json
└── server.js                        # Entry point
```

### 4.2 API REST - Endpoints Principales

#### Autenticación
```
POST   /api/auth/login                    # Login con selección de rol
POST   /api/auth/logout                   # Logout (invalidar token)
POST   /api/auth/cambiar-password          # Cambio de contraseña obligatorio/opcional
POST   /api/auth/recuperar-password        # Recuperar contraseña
GET    /api/auth/me                        # Info del usuario actual + cronograma
GET    /api/auth/cronograma                # Cronograma del año activo
```

#### Institución (Super Admin)
```
GET    /api/instituciones                  # Listar instituciones
POST   /api/instituciones                  # Crear institución
GET    /api/instituciones/:id              # Detalle institución
PUT    /api/instituciones/:id              # Actualizar institución
PUT    /api/instituciones/:id/configuracion  # Configuración académica
PUT    /api/instituciones/:id/imagenes     # Subir imágenes (escudo, firmas, carnets)
```

#### Usuarios
```
GET    /api/usuarios                       # Listar (filtros: rol, grupo, estado, búsqueda)
POST   /api/usuarios                       # Crear usuario
GET    /api/usuarios/:id                   # Detalle
PUT    /api/usuarios/:id                   # Actualizar
DELETE /api/usuarios/:id                   # Desactivar (soft delete)
PUT    /api/usuarios/:id/password          # Reset password
PUT    /api/usuarios/:id/estado            # Cambiar estado activo/inactivo
PUT    /api/usuarios/:id/tipo              # Cambiar tipo de persona
POST   /api/usuarios/importar              # Importar desde CSV/Excel
GET    /api/usuarios/exportar              # Exportar a Excel/CSV
```

#### Años Académicos y Cronograma
```
GET    /api/anios-academicos               # Listar años
POST   /api/anios-academicos               # Crear año académico
GET    /api/anios-academicos/:id           # Detalle
PUT    /api/anios-academicos/:id           # Actualizar
PUT    /api/anios-academicos/:id/cronograma    # Configurar cronograma (períodos variable)
POST   /api/anios-academicos/:id/cierre    # Cierre de año (promoción masiva)
```

#### Estructura Académica
```
# Sedes
GET/POST/PUT/DELETE  /api/sedes

# Grupos
GET/POST/PUT/DELETE  /api/grupos
GET                  /api/grupos/:id/estudiantes

# Áreas
GET/POST/PUT/DELETE  /api/areas

# Asignaturas
GET/POST/PUT/DELETE  /api/asignaturas

# Carga Académica
GET/POST/PUT/DELETE  /api/carga-academica
GET                  /api/carga-academica/docente/:id
GET                  /api/carga-academica/grupo/:id
```

#### Matrículas
```
GET    /api/matriculas                     # Listar (filtros: grupo, estado, año)
POST   /api/matriculas                     # Nueva matrícula
PUT    /api/matriculas/:id                 # Actualizar
PUT    /api/matriculas/:id/cambio-grupo    # Cambio de grupo
POST   /api/matriculas/masiva              # Matrícula masiva
GET    /api/matriculas/exportar            # Exportar listado
```

#### Calificaciones
```
GET    /api/calificaciones                 # Listar (filtros: grupo, asignatura, periodo)
POST   /api/calificaciones                 # Crear/actualizar calificación
PUT    /api/calificaciones/:id             # Actualizar
POST   /api/calificaciones/masivo          # Calificación masiva por grupo
GET    /api/calificaciones/estudiante/:id  # Notas de un estudiante
POST   /api/calificaciones/cerrar-periodo  # Cerrar periodo de calificación
```

#### Indicadores
```
GET    /api/indicadores                    # Listar (filtros: asignatura, periodo)
POST   /api/indicadores                    # Crear
PUT    /api/indicadores/:id                # Actualizar
DELETE /api/indicadores/:id                # Eliminar
POST   /api/indicadores/cargar             # Carga masiva
```

#### Actividades
```
GET    /api/actividades                    # Listar
POST   /api/actividades                    # Crear
PUT    /api/actividades/:id                # Actualizar
DELETE /api/actividades/:id                # Eliminar
POST   /api/actividades/:id/calificar      # Calificar actividad
```

#### Observador
```
GET    /api/observador                     # Listar (filtros: estudiante, tipo, estado)
POST   /api/observador                     # Nueva observación
PUT    /api/observador/:id                 # Actualizar
POST   /api/observador/:id/seguimiento     # Agregar seguimiento
GET    /api/observador/estudiante/:id      # Observaciones de un estudiante
```

#### Excusas
```
GET    /api/excusas                        # Listar
POST   /api/excusas                        # Crear
PUT    /api/excusas/:id                    # Actualizar
PUT    /api/excusas/:id/aprobar            # Aprobar/rechazar
```

#### Elecciones
```
GET    /api/elecciones                     # Listar eventos
POST   /api/elecciones                     # Crear evento
PUT    /api/elecciones/:id                 # Actualizar
POST   /api/elecciones/:id/candidatos      # Registrar candidatos
POST   /api/elecciones/:id/votar           # Emitir voto
GET    /api/elecciones/:id/resultados      # Ver resultados
PUT    /api/elecciones/:id/permisos        # Permisos por grupo
```

#### Contabilidad
```
GET/POST/PUT/DELETE  /api/conceptos-contables
GET/POST/PUT         /api/pagos
GET                   /api/pagos/resumen
POST                  /api/pagos/generar-pension
GET                   /api/reportes/contables/*
```

#### Prematrícula (Público)
```
GET    /api/prematricula/cronograma        # Fechas de prematrícula
POST   /api/prematricula                   # Registrar prematrícula
PUT    /api/prematricula/:id               # Editar prematrícula
GET    /api/prematricula/consultar         # Consultar estado
```

#### Reportes PDF
```
GET    /api/reportes/boletin/:estudianteId         # Boletín individual
GET    /api/reportes/boletin-grupo/:grupoId         # Boletines por grupo
GET    /api/reportes/certificado/:estudianteId      # Certificado
GET    /api/reportes/constancia/:estudianteId       # Constancia
GET    /api/reportes/carnet/:grupoId                # Carnets por grupo
GET    /api/reportes/planilla/:grupoId/:asignaturaId # Planilla de calificación
GET    /api/reportes/listado/:grupoId               # Listado de estudiantes
GET    /api/reportes/estadisticas/:tipo             # Estadísticas académicas
GET    /api/reportes/acumulativo/:grupoId           # Informe acumulativo
GET    /api/reportes/observador/:estudianteId       # Informe observador
GET    /api/reportes/libro-final/:grupoId           # Libro final
GET    /api/reportes/promovidos/:anioId             # Listado de promovidos
GET    /api/reportes/fallas/:grupoId                # Informe de fallas
GET    /api/reportes/evolucion/:grupoId             # Evolución del grupo
```

#### Comunicados
```
GET    /api/comunicados                    # Listar
POST   /api/comunicados                    # Enviar comunicado
PUT    /api/comunicados/:id/leer           # Marcar como leído
```

#### Bitácora
```
GET    /api/bitacora                       # Consultar (con filtros: fecha, usuario, acción)
```

#### Dirección de Núcleo
```
# Gestión de instituciones del núcleo
GET    /api/nucleo/instituciones                  # Lista de colegios del núcleo con KPIs
POST   /api/nucleo/instituciones                  # Crear nueva institución asignada al núcleo
POST   /api/nucleo/instituciones/:id/admin        # Crear usuario admin inicial del colegio

# Auto-registro de colegios
GET    /api/nucleo/solicitudes                    # Solicitudes pendientes de auto-registro
PUT    /api/nucleo/solicitudes/:id/aprobar        # Aprobar solicitud (crea la institución)
PUT    /api/nucleo/solicitudes/:id/rechazar       # Rechazar solicitud

# Estadísticas y reportes (solo GET — sin acceso a datos operativos)
GET    /api/nucleo/estadisticas                   # Estadísticas agregadas de todos los colegios
GET    /api/nucleo/estadisticas/:instId           # Estadísticas de un colegio específico
GET    /api/nucleo/comparativo                    # Comparativo entre colegios del núcleo
GET    /api/nucleo/reportes/:tipo                 # Reportes consolidados del núcleo
```

#### Auto-registro público (sin autenticación)
```
GET    /api/registro/nucleos                      # Listar núcleos disponibles (para el formulario)
POST   /api/registro/solicitud                    # Enviar solicitud de auto-registro al núcleo
GET    /api/registro/solicitud/:id                # Consultar estado de la solicitud
```

---

## 5. Arquitectura del Frontend

### 5.1 Estructura de Directorios
```
client/
├── public/
│   ├── index.html
│   └── assets/
├── src/
│   ├── api/
│   │   ├── axios.js                      # Configuración base Axios + interceptors
│   │   ├── authApi.js
│   │   ├── usuarioApi.js
│   │   ├── calificacionApi.js
│   │   ├── grupoApi.js
│   │   ├── reporteApi.js
│   │   └── ... (un archivo por dominio)
│   ├── components/
│   │   ├── common/
│   │   │   ├── Layout.jsx                # Layout principal con sidebar
│   │   │   ├── Sidebar.jsx               # Menú lateral dinámico por rol
│   │   │   ├── Header.jsx                # Barra superior con info usuario
│   │   │   ├── DataTable.jsx             # Tabla reutilizable con filtros/paginación
│   │   │   ├── Modal.jsx                 # Modal reutilizable
│   │   │   ├── ConfirmDialog.jsx         # Diálogo de confirmación
│   │   │   ├── Card.jsx                  # Tarjetas para dashboards
│   │   │   ├── Loading.jsx               # Spinner de carga
│   │   │   ├── Alert.jsx                 # Alertas/notificaciones
│   │   │   ├── Pagination.jsx            # Paginación
│   │   │   ├── SearchBar.jsx             # Barra de búsqueda
│   │   │   ├── FileUpload.jsx            # Subida de archivos
│   │   │   ├── ProtectedRoute.jsx        # Ruta protegida por auth/rol
│   │   │   └── ExportButton.jsx          # Botón exportar Excel/PDF
│   │   ├── calificacion/
│   │   │   ├── GrillaCalificacion.jsx    # Grid de calificación estilo Excel
│   │   │   ├── FilaEstudiante.jsx
│   │   │   └── ResumenNotas.jsx
│   │   ├── observador/
│   │   │   ├── FormObservacion.jsx
│   │   │   └── TimelineSeguimiento.jsx
│   │   └── reportes/
│   │       ├── VisorPDF.jsx              # Visor de PDFs
│   │       └── FiltroReporte.jsx
│   ├── pages/
│   │   ├── public/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── ColegioSelectPage.jsx
│   │   │   ├── PrematriculaPage.jsx
│   │   │   ├── AutoRegistroPage.jsx          # Solicitud de registro de nuevo colegio al núcleo
│   │   │   └── PasswordRecoveryPage.jsx
│   │   ├── admin/
│   │   │   ├── DashboardAdmin.jsx
│   │   │   ├── EstudiantesPage.jsx
│   │   │   ├── DocentesPage.jsx
│   │   │   ├── AcudientesPage.jsx
│   │   │   ├── UsuariosPage.jsx
│   │   │   ├── GruposPage.jsx
│   │   │   ├── AreasPage.jsx
│   │   │   ├── AsignaturasPage.jsx
│   │   │   ├── CargaAcademicaPage.jsx
│   │   │   ├── ConfiguracionPage.jsx
│   │   │   ├── ConfiguracionContablePage.jsx
│   │   │   ├── CalificarAdminPage.jsx
│   │   │   ├── IndicadoresPage.jsx
│   │   │   ├── CronogramaPage.jsx
│   │   │   ├── MatriculasPage.jsx
│   │   │   ├── GenerarBoletinPage.jsx
│   │   │   ├── CertificadosPage.jsx
│   │   │   ├── ConstanciasPage.jsx
│   │   │   ├── CarnetsPage.jsx
│   │   │   ├── GenerarPensionPage.jsx
│   │   │   ├── ConceptosContablesPage.jsx
│   │   │   ├── EstadisticasPage.jsx
│   │   │   ├── EleccionesPage.jsx
│   │   │   ├── ComunicadosPage.jsx
│   │   │   ├── BitacoraPage.jsx
│   │   │   ├── ExcusasPage.jsx
│   │   │   ├── HabilitacionesPage.jsx
│   │   │   ├── CambioGrupoPage.jsx
│   │   │   └── CierreAnoPage.jsx
│   │   ├── docente/
│   │   │   ├── DashboardDocente.jsx
│   │   │   ├── CalificarPage.jsx
│   │   │   ├── CalificarActividadesPage.jsx
│   │   │   ├── CalificarIndicadoresPage.jsx
│   │   │   ├── IndicadoresPage.jsx
│   │   │   ├── ActividadesPage.jsx
│   │   │   ├── ObservadorEstudiantePage.jsx
│   │   │   ├── ObservacionesAreaPage.jsx
│   │   │   ├── PlanillaActividadesPage.jsx
│   │   │   ├── CargaAcademicaPage.jsx
│   │   │   ├── InformesPeriodicosPage.jsx
│   │   │   ├── BoletinEstudiantePage.jsx
│   │   │   ├── EstadisticasDocentePage.jsx
│   │   │   ├── RecuperacionesPage.jsx
│   │   │   ├── HabilitacionesPage.jsx
│   │   │   ├── ExcusasPage.jsx
│   │   │   └── ListadosVariosPage.jsx
│   │   ├── acudiente/
│   │   │   ├── DashboardAcudiente.jsx
│   │   │   ├── VerNotasPage.jsx
│   │   │   ├── VerBoletinPage.jsx
│   │   │   ├── VerObservadorPage.jsx
│   │   │   └── VerCronogramaPage.jsx
│   │   ├── coordinador/
│   │   │   ├── DashboardCoordinador.jsx
│   │   │   ├── SeguimientoPage.jsx
│   │   │   ├── ObservadorPage.jsx
│   │   │   ├── EstadisticasPage.jsx
│   │   │   ├── ExcusasPage.jsx
│   │   │   ├── InformesPeriodicosPage.jsx
│   │   │   ├── CertificadosPage.jsx
│   │   │   ├── ConstanciasPage.jsx
│   │   │   ├── BoletinEstudiantePage.jsx
│   │   │   ├── EleccionesPage.jsx
│   │   │   ├── InformeExcusasPage.jsx
│   │   │   └── ListadosVariosPage.jsx
│   │   ├── rector/
│   │   │   ├── DashboardRector.jsx
│   │   │   ├── SeguimientoPage.jsx
│   │   │   ├── EstadisticasPage.jsx
│   │   │   ├── InformesPeriodicosPage.jsx
│   │   │   ├── ObservadorPage.jsx
│   │   │   ├── ExcusasPage.jsx
│   │   │   ├── InformeExcusasPage.jsx
│   │   │   ├── EleccionesPage.jsx
│   │   │   └── ListadosVariosPage.jsx
│   │   ├── nucleo/
│   │   │   ├── DashboardNucleo.jsx           # Vista general: lista de colegios con KPIs
│   │   │   ├── CrearInstitucionPage.jsx      # Crear colegio + admin inicial
│   │   │   ├── SolicitudesPage.jsx           # Aprobar/rechazar auto-registros
│   │   │   ├── EstadisticasNucleo.jsx        # Estadísticas agregadas y por colegio
│   │   │   ├── ComparativoPage.jsx           # Comparativo entre colegios
│   │   │   └── ReportesNucleo.jsx            # Reportes consolidados del núcleo
│   │   └── estudiante/
│   │       ├── DashboardEstudiante.jsx
│   │       ├── MisNotasPage.jsx
│   │       ├── MiBoletinPage.jsx
│   │       ├── MiObservadorPage.jsx
│   │       ├── MiCronogramaPage.jsx
│   │       ├── MiInformacionPage.jsx
│   │       └── EleccionesPage.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useCalificacion.js
│   │   ├── useCronograma.js
│   │   ├── useReport.js
│   │   ├── usePagination.js
│   │   └── useExport.js
│   ├── store/
│   │   ├── authStore.js                  # Estado de autenticación
│   │   └── appStore.js                   # Estado global de la app
│   ├── utils/
│   │   ├── constants.js                  # Roles, estados, tipos
│   │   ├── helpers.js                    # Funciones auxiliares
│   │   ├── validators.js                # Esquemas de validación Zod
│   │   └── formatters.js                # Formateo de fechas, números
│   ├── styles/
│   │   └── global.css
│   ├── App.jsx                           # Rutas principales
│   └── main.jsx                          # Entry point
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## 6. Funcionalidades Nuevas a Implementar

### 6.1 Mejoras Planificadas
| # | Funcionalidad | Descripción | Prioridad |
|---|---|---|---|
| 1 | **Dashboard con KPIs** | Panel resumen por rol con indicadores clave (estudiantes matriculados, promedio general, etc.) | Alta |
| 2 | **Búsqueda global** | Buscar estudiantes, docentes, grupos desde cualquier pantalla | Alta |
| 3 | **Exportación flexible** | Exportar listas a Excel/CSV/PDF desde cualquier tabla de datos | Alta |
| 4 | **Responsive Design** | Uso completo en móviles y tablets (solo consultas para acudientes/estudiantes) | Alta |
| 5 | **Importación masiva** | Carga de estudiantes/docentes via Excel con validación previa | Media |
| 6 | **Historial de cambios** | Auditoría detallada de calificaciones y datos sensibles | Media |
| 7 | **Filtros avanzados** | Filtros combinados en todas las vistas de datos | Media |
| 8 | **Notificaciones in-app** | Sistema de alertas dentro de la plataforma (sin correo/SMS) | Media |
| 9 | **Tema oscuro/claro** | Selección de tema visual por usuario | Baja |
| 10 | **PWA (Progressive Web App)** | Instalable como app en dispositivos móviles | Baja |
| 11 | **Gestión de períodos variable** | Soportar colegios con 2, 3, 4, 5 o más períodos académicos | Alta |
| 12 | **Multi-sede** | Soportar instituciones con múltiples sedes | Media |

---

## 7. Plan de Desarrollo por Fases

### FASE 1: Fundamentos (Semanas 1-3)
**Objetivo**: Infraestructura base funcional con autenticación

| # | Tarea | Detalle |
|---|---|---|
| 1.1 | Configuración del proyecto backend | Inicializar Node.js + Express, estructura de carpetas, ESLint |
| 1.2 | Conexión MongoDB | Configurar Mongoose, connection pooling, variables de entorno |
| 1.3 | Modelos base | Institucion, Usuario, AnioAcademico con schemas Mongoose |
| 1.4 | Sistema de autenticación completo | Registro, login con JWT, selección de rol, middleware de auth |
| 1.5 | Sistema de autorización | Middleware por roles (7 roles), permisos por endpoint. El rol `dirNucleo` tiene escritura acotada solo a `/api/nucleo/*` |
| 1.6 | Sistema de bitácora | Logging automático de acciones sensibles |
| 1.7 | Configuración del proyecto frontend | React + Vite + Tailwind, estructura de carpetas, routing |
| 1.8 | Páginas públicas | Login, selección de colegio, cambio de contraseña, recuperación |
| 1.9 | Layout base por rol | Sidebar dinámico, Header, contenido, redirección por perfil |
| 1.10 | Despliegue inicial | Configuración VPS, Nginx, PM2, MongoDB, SSL |

**Entregable**: Sistema desplegado con login funcional, navegación base por rol y gestión de sesión.

---

### FASE 2: Gestión Académica Core (Semanas 4-7)
**Objetivo**: CRUD completo de la estructura académica y personas

| # | Tarea | Detalle |
|---|---|---|
| 2.1 | Gestión de Instituciones | CRUD completo, configuración, subida de imágenes, campo `nucleoId` |
| 2.1b | Gestión de Direcciones de Núcleo | CRUD de núcleos, asignación de colegios, flujo de auto-registro y aprobación |
| 2.2 | Gestión de Sedes | CRUD de sedes por institución |
| 2.3 | Años Académicos | CRUD, configuración de cronograma con períodos variables |
| 2.4 | Gestión de Áreas y Asignaturas | CRUD completo con ordenamiento |
| 2.5 | Gestión de Grupos | CRUD, asignación de docente director, capacidad |
| 2.6 | Gestión de Docentes | CRUD, asignación de carga académica, perfil |
| 2.7 | Gestión de Estudiantes | CRUD, asignación de acudientes, foto, cambio de grupo |
| 2.8 | Gestión de Acudientes | CRUD, relación con estudiantes |
| 2.9 | Matrículas | Nueva, renovación, traslado, cambio de grupo |
| 2.10 | Carga Académica | Asignación de docentes a asignaturas por grupo |
| 2.11 | Configuración del Sistema | Notas, niveles, convenciones, DANE, ICFES |
| 2.12 | Frontend: todas las páginas CRUD | Formularios, tablas, validaciones para todo lo anterior |

**Entregable**: Sistema con gestión completa de instituciones, personas y estructura académica.

---

### FASE 3: Calificaciones y Evaluación (Semanas 8-11)
**Objetivo**: Sistema de calificaciones completo con indicadores y actividades

| # | Tarea | Detalle |
|---|---|---|
| 3.1 | Gestión de Indicadores | CRUD por asignatura y periodo, carga masiva |
| 3.2 | Gestión de Actividades | CRUD, asignación a grupos, porcentajes |
| 3.3 | Calificación por Docente | Grid tipo Excel para calificar por grupo/asignatura/periodo |
| 3.4 | Calificación de Indicadores | Asignar notas a indicadores por estudiante |
| 3.5 | Calificación de Actividades | Asignar notas a actividades por estudiante |
| 3.6 | Recuperaciones | Gestión de notas de recuperación |
| 3.7 | Habilitaciones | Configuración y registro de habilitaciones |
| 3.8 | Cierre de período | Bloqueo de edición al cerrar período |
| 3.9 | Consulta de notas (Acudiente) | Ver notas de sus hijos con promedios |
| 3.10 | Consulta de notas (Estudiante) | Ver sus propias notas |
| 3.11 | Planillas de calificación | Generación de planillas PDF para impresión |
| 3.12 | Frontend: grids de calificación | Componentes interactivos tipo hoja de cálculo |

**Entregable**: Sistema de evaluación completo funcional para docentes, con consulta para acudientes y estudiantes.

---

### FASE 4: Observador y Seguimiento (Semanas 12-14)
**Objetivo**: Observador del estudiante, seguimiento disciplinario y académico

| # | Tarea | Detalle |
|---|---|---|
| 4.1 | Observador - Crear observaciones | Docente y coordinador pueden registrar observaciones |
| 4.2 | Observador - Seguimiento | Agregar seguimientos a observaciones existentes |
| 4.3 | Observador - Consulta por estudiante | Historial completo de observaciones |
| 4.4 | Observador - Consulta por área | Observaciones agrupadas por área/materia |
| 4.5 | Seguimiento académico | Vista de coordinador/rector para seguimiento de grupos |
| 4.6 | Excusas docentes | Registro, aprobación/rechazo de excusas |
| 4.7 | Informe de excusas | Reporte de excusas por período |
| 4.8 | Frontend: todas las páginas | Formularios, timelines, consultas |

**Entregable**: Módulo de observador y seguimiento completo.

---

### FASE 5: Reportes y Documentos (Semanas 15-19)
**Objetivo**: Generación de todos los reportes PDF y documentos

| # | Tarea | Detalle |
|---|---|---|
| 5.1 | Motor de reportes PDF | Configuración base con PDFKit o Puppeteer |
| 5.2 | Boletines (10 tipos) | Acumulativo, corto, descriptivo, preescolar, final, indicadores, etc. |
| 5.3 | Certificados | Individual y por grupo (múltiples formatos) |
| 5.4 | Constancias | 2 formatos |
| 5.5 | Carnets | Estudiantes, docentes, administrativos (con fotos) |
| 5.6 | Matrículas | Generación de contrato de matrícula |
| 5.7 | Informes periódicos | Resumen académico por período |
| 5.8 | Informes acumulativos | Acumulativo de notas y fallas |
| 5.9 | Estadísticas académicas | Áreas perdidas, evolución, cuadro de honor, rendimiento |
| 5.10 | Libro final | Generación del libro final de calificaciones |
| 5.11 | Listados varios | Listados personalizables por grupo/sede/estado |
| 5.12 | Cierre de año | Promoción masiva, generación de listados de promovidos/reprobados |
| 5.13 | Frontend: visor de reportes | Visor PDF, filtros de reportes, descarga masiva |
| 5.14 | Estadísticas y reportes para Dirección de Núcleo | Endpoints agregados multi-institución, páginas frontend del rol (`pages/nucleo/`) |

**Entregable**: Sistema completo de generación de documentos y reportes.

---

### FASE 6: Contabilidad (Semanas 20-22)
**Objetivo**: Módulo de gestión contable y pagos

| # | Tarea | Detalle |
|---|---|---|
| 6.1 | Conceptos contables | CRUD de conceptos de pago |
| 6.2 | Configuración contable | Configuración de pensiones y valores |
| 6.3 | Generación de pensiones | Generación masiva de pensiones por período |
| 6.4 | Registro de pagos | Recepción de pagos, aplicación de descuentos/recargos |
| 6.5 | Reportes contables | Recibos, pagos recibidos, saldos pendientes, novedades |
| 6.6 | Cartera | Informe de cartera por cobrar, mora |
| 6.7 | Frontend: módulo contable | Formularios, tablas, reportes |

**Entregable**: Módulo contable completo integrado.

---

### FASE 7: Módulos Especiales (Semanas 23-25)
**Objetivo**: Elecciones, comunicados, prematrícula

| # | Tarea | Detalle |
|---|---|---|
| 7.1 | Elecciones - Crear eventos | Configuración de eventos electorales |
| 7.2 | Elecciones - Candidatos | Registro de candidatos con propuestas |
| 7.3 | Elecciones - Permisos | Habilitar/deshabilitar grupos para votar |
| 7.4 | Elecciones - Votación | Proceso de votación por parte de estudiantes |
| 7.5 | Elecciones - Resultados | Conteo, estadísticas, abstención |
| 7.6 | Comunicados | Envío y recepción de comunicados internos |
| 7.7 | Prematrícula online | Formulario público para registro de nuevos estudiantes |
| 7.8 | Frontend: módulos especiales | Páginas de elecciones, comunicados, prematrícula |

**Entregable**: Módulos especiales completos.

---

### FASE 8: Mejoras, Optimización y Deploy Final (Semanas 26-28)
**Objetivo**: Optimización, testing, documentación y deploy productivo

| # | Tarea | Detalle |
|---|---|---|
| 8.1 | Dashboard por rol | KPIs, gráficos resumen para cada perfil |
| 8.2 | Importación masiva Excel | Carga de estudiantes/docentes desde archivo |
| 8.3 | Búsqueda global | Buscar desde cualquier pantalla |
| 8.4 | Responsive design | Ajustar todas las pantallas para móviles/tablets |
| 8.5 | Optimización de queries | Revisión de índices, queries lentas, paginación eficiente |
| 8.6 | Testing | Tests unitarios (Jest), tests de integración, tests E2E |
| 8.7 | Seguridad | Auditoría de seguridad, rate limiting, sanitización |
| 8.8 | Documentación | Documentación de API (Swagger/OpenAPI), manual de usuario |
| 8.9 | Backup automatizado | Script de backup MongoDB con rotación |
| 8.10 | Deploy productivo | Configuración final en VPS, monitoreo, SSL |

**Entregable**: Sistema completo, optimizado, documentado y desplegado en producción.

---

## 8. Consideraciones de Rendimiento

### 8.1 Escalabilidad (200 a 4000 estudiantes)
| Estrategia | Detalle |
|---|---|
| **Paginación server-side** | Todas las listas con paginación (no cargar todos los datos) |
| **Índices MongoDB** | Índices compuestos en las consultas más frecuentes |
| **Cache** | Cache en memoria para configuración del colegio y cronograma |
| **Lazy loading** | Carga diferida de componentes pesados en React |
| **Compresión** | gzip/brotli en Nginx para respuestas HTTP |
| **Connection pooling** | Mongoose configurado con pool de conexiones adecuado |

### 8.2 Configuración MongoDB sugerida
```javascript
// Para VPS con 2-4GB RAM
mongoose.connect(URI, {
  maxPoolSize: 10,        // Pool de conexiones
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

---

## 9. Consideraciones de Seguridad

| Aspecto | Implementación |
|---|---|
| **Contraseñas** | bcrypt con salt rounds >= 10 |
| **JWT** | Tokens con expiración (ej: 8h), refresh tokens |
| **Rate limiting** | express-rate-limit en login y endpoints sensibles |
| **Validación** | Validar TODA entrada del usuario (server-side) |
| **CORS** | Configurar orígenes permitidos estrictamente |
| **Helmet** | Headers de seguridad HTTP |
| **SQL/NoSQL Injection** | Sanitización de inputs, uso de Mongoose schemas |
| **XSS** | Sanitizar output, CSP headers |
| **Archivos** | Validar tipo y tamaño de archivos subidos |
| **Multi-tenant** | Verificar `institucionId` en cada query automáticamente. Para rol `dirNucleo`, verificar que las instituciones consultadas pertenecen a su `nucleoId` |

---

## 10. Mapeo de Migración: Pantalla Actual → Componente React

### Admin
| Pantalla Actual | Componente React Nuevo |
|---|---|
| `Admin/index.aspx` | `DashboardAdmin.jsx` |
| `Admin/Estudiantes.aspx` | `EstudiantesPage.jsx` |
| `Admin/Docentes.aspx` | `DocentesPage.jsx` |
| `Admin/AgregarAcudiente.aspx` | Modal dentro de `AcudientesPage.jsx` |
| `Admin/AgregarDocentes.aspx` | Modal dentro de `DocentesPage.jsx` |
| `Admin/agregarestudiantes.aspx` | Modal dentro de `EstudiantesPage.jsx` |
| `Admin/AgregarUsuario.aspx` | Modal dentro de `UsuariosPage.jsx` |
| `Admin/Areas.aspx` | `AreasPage.jsx` |
| `Admin/Grupos.aspx` | `GruposPage.jsx` |
| `Admin/cargaacademica.aspx` | `CargaAcademicaPage.jsx` |
| `Admin/Calificar.aspx` | `CalificarAdminPage.jsx` |
| `Admin/calificarindicador.aspx` | Dentro de `CalificarAdminPage.jsx` (tab) |
| `Admin/cargaindicadores.aspx` | Dentro de `IndicadoresPage.jsx` (importar) |
| `Admin/CargaAIndicadores.aspx` | Dentro de `IndicadoresPage.jsx` (asignar) |
| `Admin/configurarsistema.aspx` | `ConfiguracionPage.jsx` (tabs/wizard) |
| `Admin/configuracioncontable.aspx` | `ConfiguracionContablePage.jsx` |
| `Admin/Conceptocontable.aspx` | `ConceptosContablesPage.jsx` |
| `Admin/Cronograma.aspx` | `CronogramaPage.jsx` |
| `Admin/GenerarMatricula.aspx` | `MatriculasPage.jsx` |
| `Admin/generarboletin.aspx` | `GenerarBoletinPage.jsx` |
| `Admin/certificados.aspx` | `CertificadosPage.jsx` |
| `Admin/constancias.aspx` | `ConstanciasPage.jsx` |
| `Admin/generarcarnet.aspx` | `CarnetsPage.jsx` |
| `Admin/GenerarPension.aspx` | `GenerarPensionPage.jsx` |
| `Admin/GenerarOtros.aspx` | Dentro de contabilidad |
| `Admin/estadisticas.aspx` | `EstadisticasPage.jsx` |
| `Admin/candidatos.aspx` | Dentro de `EleccionesPage.jsx` |
| `Admin/eventoselectorales.aspx` | Dentro de `EleccionesPage.jsx` |
| `Admin/enviarcomunicado.aspx` | `ComunicadosPage.jsx` |
| `Admin/Bitacora.aspx` | `BitacoraPage.jsx` |
| `Admin/excusasDocentes.aspx` | `ExcusasPage.jsx` |
| `Admin/HabilitacionesA.aspx` | `HabilitacionesPage.jsx` |
| `Admin/Cambiogrupo.aspx` | `CambioGrupoPage.jsx` |
| `Admin/cambiotipopersona.aspx` | Acción dentro de gestión de usuarios |
| `Admin/carnetadministrativo.aspx` | Dentro de `CarnetsPage.jsx` |
| `Admin/carnetdocente.aspx` | Dentro de `CarnetsPage.jsx` |
| `Admin/cierredeano.aspx` | `CierreAnoPage.jsx` |
| `Admin/grupoespecialidad.aspx` | Dentro de `GruposPage.jsx` |
| `Admin/ForzarEliminacion.aspx` | Herramienta admin avanzada |
| `Admin/cambiocontrasena.aspx` | `CambioPasswordPage.jsx` (compartido) |

### Docente
| Pantalla Actual | Componente React Nuevo |
|---|---|
| `Docente/index.aspx` | `DashboardDocente.jsx` |
| `Docente/Calificar.aspx` | `CalificarPage.jsx` |
| `Docente/calificaractividad.aspx` | `CalificarActividadesPage.jsx` |
| `Docente/calificarindicadord.aspx` | `CalificarIndicadoresPage.jsx` |
| `Docente/Indicadores.aspx` | `IndicadoresPage.jsx` |
| `Docente/crearactividad.aspx` | Dentro de `ActividadesPage.jsx` (modal) |
| `Docente/Cargaacademicaactividades.aspx` | `CargaAcademicaPage.jsx` |
| `Docente/CargaAIndicadores.aspx` | Dentro de carga académica |
| `Docente/cargaindicadoresd.aspx` | Dentro de `IndicadoresPage.jsx` |
| `Docente/ObservadorEstudiante.aspx` | `ObservadorEstudiantePage.jsx` |
| `Docente/observacionesarea.aspx` | `ObservacionesAreaPage.jsx` |
| `Docente/Observacionesestudiante.aspx` | Dentro de observador |
| `Docente/PlanillaActividades.aspx` | `PlanillaActividadesPage.jsx` |
| `Docente/informesperiodicos.aspx` | `InformesPeriodicosPage.jsx` |
| `Docente/BoletinEstudianteD.aspx` | `BoletinEstudiantePage.jsx` |
| `Docente/Estadistica.aspx` | `EstadisticasDocentePage.jsx` |
| `Docente/Recuperaciones.aspx` | `RecuperacionesPage.jsx` |
| `Docente/Habilitaciones.aspx` | `HabilitacionesPage.jsx` |
| `Docente/ExcusasDocente.aspx` | `ExcusasPage.jsx` |
| `Docente/listadosvarios.aspx` | `ListadosVariosPage.jsx` |
| `Docente/Bitacora.aspx` | `BitacoraPage.jsx` |
| `Docente/VerCronograma.aspx` | `VerCronogramaPage.jsx` |

### Público
| Pantalla Actual | Componente React Nuevo |
|---|---|
| `public/previewlogin.aspx` | `LoginPage.jsx` (selector visual) |
| `public/login.aspx` | `LoginPage.jsx` (formulario) |
| `public/loginpre.aspx` | `LoginPage.jsx` (prematrícula) |
| `public/colegio.aspx` | `ColegioSelectPage.jsx` |
| `public/prematricula.aspx` | `PrematriculaPage.jsx` |
| `public/Prematriculas.aspx` | Listado de prematrículas (admin) |
| `public/editarprematricula.aspx` | Editar prematrícula |
| `public/password.aspx` | `PasswordRecoveryPage.jsx` |
| `public/estudianteacudiente.aspx` | Selector de hijo (acudiente con múltiples hijos) |

---

## 11. Estimación de Esfuerzo

| Fase | Duración Estimada | Prioridad |
|---|---|---|
| FASE 1: Fundamentos | 3 semanas | Crítica |
| FASE 2: Gestión Académica | 4 semanas | Crítica |
| FASE 3: Calificaciones | 4 semanas | Crítica |
| FASE 4: Observador | 3 semanas | Alta |
| FASE 5: Reportes | 5 semanas | Alta |
| FASE 6: Contabilidad | 3 semanas | Media |
| FASE 7: Módulos Especiales | 3 semanas | Media |
| FASE 8: Optimización | 3 semanas | Media |
| **TOTAL** | **~28 semanas (7 meses)** | |

> **Nota**: Esta estimación es para un desarrollador trabajando a tiempo completo. Con 2 desarrolladores se puede reducir a ~4-5 meses.

---

## 12. Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Complejidad de reportes PDF (10+ tipos de boletín) | Alta | Alto | Usar Puppeteer con plantillas HTML para mayor flexibilidad |
| Curva de aprendizaje del dominio (reglas de calificación) | Media | Alto | Documentar reglas de negocio antes de implementar |
| Rendimiento con instituciones grandes (4000 estudiantes) | Media | Alto | Pruebas de carga tempranas, índices desde el diseño |
| Migración de lógica en Stored Procedures | Alta | Medio | Documentar todos los SPs antes, reproducir lógica en services |
| Cambios de requisitos durante el desarrollo | Media | Medio | Metodología ágil, demos frecuentes con el cliente |
| Pérdida de datos en transición | Baja | Crítico | No migrar datos, sistema nuevo con datos frescos |

---

## 13. Checklist de Preparación

Antes de iniciar el desarrollo, completar:

- [ ] Acceso al VPS configurado (SSH, firewall)
- [ ] Dominio apuntando al VPS
- [ ] MongoDB instalado y configurado
- [ ] Node.js LTS instalado
- [ ] Repositorio Git creado para el nuevo proyecto
- [ ] Variables de entorno definidas (.env.example)
- [ ] Diseño visual (wireframes) de al menos las pantallas principales
- [ ] Documentar todas las reglas de negocio de calificación (aproximación, habilitaciones, promoción)
- [ ] Definir formatos exactos de boletines, certificados y constancias deseados
- [ ] Definir flujo de prematrícula completo
- [ ] Definir estructura de períodos (número variable por institución)

---

## 14. Seed Inicial — Arranque del Sistema

Antes de que cualquier usuario pueda ingresar, se deben crear manualmente los primeros registros en MongoDB. Esto se hace una sola vez con un script o desde la shell de MongoDB.

### Paso 1 — Crear la Dirección de Núcleo
Insertar un documento en la colección `DireccionesNucleo` con los datos del núcleo real (nombre, municipio, código, contacto). Anotar el `_id` generado.

### Paso 2 — Crear el usuario de la Dirección de Núcleo
Insertar un documento en `Usuarios` con:
- `tipoPerfil: "7"` (dirNucleo)
- `nucleoId`: el `_id` del paso anterior
- `institucionId: null`
- `credenciales.passwordHash`: hash bcrypt de la contraseña inicial
- `credenciales.debeCambiarPassword: true` para forzar cambio en el primer login

### Paso 3 — Verificar
Hacer login con ese usuario en la app. Desde la UI, la Dirección de Núcleo puede crear las instituciones y sus admins. A partir de ahí no se necesita más acceso directo a MongoDB.

> El proyecto debe incluir un archivo `server/src/seed/seedInicial.js` que automatice estos pasos y se ejecute con `node seed/seedInicial.js`. Recibe los datos por variables de entorno o argumento.

---

## 15. Comandos de Inicio Rápido (referencia futura)

```bash
# Backend
mkdir easynotes-v2 && cd easynotes-v2

mkdir server client
cd server
npm init -y
npm install express mongoose dotenv cors helmet bcryptjs jsonwebtoken express-validator winston morgan multer pdfkit
npm install -D nodemon jest supertest

# Frontend
cd ../client
npm create vite@latest . -- --template react
npm install react-router-dom axios zustand react-hook-form @hookform/resolvers zod
npm install @tanstack/react-table recharts lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

*Documento generado como plan de migración para EasyNotes.*
*No se realizaron cambios de código ni se creó ningún proyecto.*