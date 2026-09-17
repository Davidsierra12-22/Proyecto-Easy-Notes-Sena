# Reparto de trabajo — Frontend EasyNotes v2

Distribución del desarrollo del frontend en **5 personas**, en orden funcional
(desde el acceso/Login hasta el módulo de Dirección de Núcleo). Cada persona
construye un bloque completo y comparte el resultado en la rama `develop`.

- Rama de trabajo: `develop`
- Integración a `master`: solo por Pull Request (master está protegido)
- Verificación antes de entregar: `npm test` (backend, 82 tests), `npm run build` y `npm run lint` (frontend)

---

## Persona 1 · Acceso, identidad e infraestructura

Construye la base por la que pasa todo el sistema.

- **Cliente API** (`api.js`): integración con axios, token de autenticación y manejo de errores.
- **Autenticación** (`AuthContext`): login, logout, persistencia en localStorage, bandera de cambio de contraseña y roles múltiples.
- **Sede** (`SedeContext`): selector de sede de trabajo para los roles que lo requieren.
- **Layout**: menú lateral por rol (admin, rector, coordinador, docente, estudiante, acudiente, secretaría, Dirección de Núcleo), barra superior, notificaciones, cambio de perfil y cierre de sesión.
- **Reutilizables**: `CrudTable` (búsqueda, filtros, paginación, modal de edición) y `PaginationBar`.
- **Rutas** (`App.jsx`): rutas protegidas y carga perezosa de pantallas.
- **Flujo de entrada**: Login → RecuperarContraseña → RestablecerContraseña → CambiarContraseña → ElegirPerfil → Perfil.

Entregables: `Login`, `RecuperarPassword`, `RestablecerPassword`, `CambiarPassword`, `ElegirPerfil`, `Perfil`,
`Layout`, `CrudTable`, `PaginationBar`, `AuthContext`, `SedeContext`, `api.js`, `App.jsx`.

---

## Persona 2 · Maestro y estructura del colegio

Construye la administración de la base institucional.

- **Configuración**: periodos académicos, módulos activos y ajustes generales.
- **Usuarios**: alta/edición con asignación de rol, activar/bloquear y envío de credenciales.
- **Sedes**: registro y edición de sedes (ligado al selector de la barra).
- **Años Académicos**: crear, activar y cerrar el año lectivo.
- **Áreas** y **Asignaturas**: catálogo académico con créditos e indicadores.
- **Grupos**: grados con director de grupo y sede.

Entregables: `Configuracion`, `Usuarios`, `Sedes`, `AniosAcademicos`, `Areas`, `Asignaturas`, `Grupos`.

---

## Persona 3 · Gestión académica (planeación)

Construye el corazón operativo del colegio.

- **Carga Académica**: asignación de docentes y asignaturas por grupo-grado.
- **Matrículas**: inscribir, retirar y promover estudiantes.
- **Prematrículas**: revisar, aprobar o rechazar solicitudes.
- **Calificaciones**: carga de notas por periodo, registro masivo y acciones por docente.
- **Boletines**: generación y visualización por estudiante y por grupo.
- **Recuperaciones**: cálculo y registro.

Entregables: `CargaAcademica`, `Matriculas`, `Prematriculas`, `Calificaciones`, `Boletines`, `Recuperaciones`.

---

## Persona 4 · Académico de consulta (estudiantes y docentes)

Construye las vistas de uso diario de la comunidad educativa.

- **Promoción**: proceso de avance de grado.
- **Horario**: consulta del horario por estudiante y por curso.
- **Mis Clases** (docente): su carga y su grupo.
- **Mis Notas** y **Mis Excusas** (estudiante): consulta de notas e interposición/gestion de excusas.
- **Prematrícula Online**: formulario público para estudiantes nuevos.
- **Carnets**: generación del carnet estudiantil.
- **Actividades**: seguimiento de actividades por el docente (observador).

Entregables: `Promocion`, `Horario`, `MisClases`, `MisNotas`, `MisExcusas`, `PrematriculaOnline`, `Carnets`, `Actividades`.

---

## Persona 5 · Financiero, reportes y módulo núcleo

Construye la parte económica, de reportes y la Dirección de Núcleo.

- **Pagos**: registro de pagos, recargos y estados.
- **Cartera**: estado de cuenta de cada estudiante.
- **Conceptos Contables**: catálogo de conceptos.
- **Comunicados**: envío y marcado de leido.
- **Indicadores** y **Certificados**: reportes y documentos exportables.
- **Bitácora** y **Dashboard general**: auditoría y resumen.
- **Módulo Núcleo**: colegios del núcleo (crear colegio + admin inicial), CRUD de núcleos, estadísticas (KPI y comparativo) y dashboard de Dirección de Núcleo.

Entregables: `Pagos`, `Cartera`, `ConceptosContables`, `Comunicados`, `Indicadores`, `Certificados`,
`Bitacora`, `Dashboard`, `Instituciones`, `Nucleos`, `EstadisticasNucleo`.

---

## Orden de trabajo

1. Persona 1 termina primero su base (sin ella nadie puede trabajar).
2. En paralelo, Persona 2 → Persona 3 → Persona 4 → Persona 5 van desarrollando sus bloques.
3. Cada persona sube sus cambios con su cuenta de GitHub a la rama `develop`.
4. Verificación de cada bloque antes de integrar: tests, build y lint.
5. Cuando el frontend esté completo, se abre PR `develop → master` para revisión y merge.

## Estilo de commits

Para mantener el historial uniforme:

- `feat:` nueva funcionalidad o página. Ejemplo: `feat: página de Matrículas`
- `fix:` corrección de error. Ejemplo: `fix: trim del documento en login`
- `chore:` tareas internas o configuración.
- Mensajes en minúsculas, imperativo, cortos y en español.
- Un commit por cambio (página o funcionalidad), con `git add <archivo>` antes.

## Cuentas de GitHub

| Persona | Nombre | Correo | Estado |
|---|---|---|---|
| 1 | Martin | martineduardozapata0@gmail.com | Confirmada |
| 2 | Sneyder | sneyderdavier@gmail.com | Confirmada |
| 3 | Yorman | yormangogo@gmail.com | Confirmada |
| 4 | Avila | avilabarre68@gmail.com | Confirmada |
| 5 | Santiago | daviidsierra1422@gmail.com | Confirmada |

Cada persona configura su identidad en su equipo:

```
git config user.name  "Nombre"
git config user.email "correo@...com"
```