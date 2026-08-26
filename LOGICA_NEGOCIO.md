# Documentación de Lógica de Negocio — EasyNotes v2

Este archivo debe completarse **antes de iniciar la Fase 3** del desarrollo.
La persona encargada de analizar los stored procedures del sistema actual debe llenar cada sección con las reglas exactas que encontró.

Los desarrolladores tomarán este documento como fuente de verdad para implementar los servicios del backend.

---

## Cómo usar este documento

1. Llenar cada sección con las reglas en español plano (no código)
2. Cuando el desarrollador implemente el servicio correspondiente, copia las reglas como comentario al inicio del archivo de servicio
3. Marcar cada sección con ✅ cuando esté documentada y verificada

---

## 1. Autenticación y sesión
**Servicio:** `server/src/services/authService.js`
**SPs de referencia:** `paFillLogin1`
**Estado:** ⬜ Pendiente

```
- ---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-AUTH-01 (MÉTODO DE ACCESO)
---------------------------------------------------------------------------
El acceso al sistema se realizará mediante el número de documento como 
usuario y una contraseña alfanumérica. El sistema debe validar los roles 
asignados (Admin, Docente, Estudiante, Acudiente) para mostrar el menú 
correspondiente.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-AUTH-02 (POLÍTICA DE CONTRASEÑA INICIAL)
---------------------------------------------------------------------------
Cuando el admin crea un nuevo usuario, el sistema asigna automáticamente 
como contraseña inicial el número de documento del usuario.
Ejemplo: documento 12345678 → contraseña inicial "12345678".
El admin puede imprimir o enviar por email las credenciales al usuario.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-AUTH-02B (PRIMER INGRESO - CAMBIO OBLIGATORIO)
---------------------------------------------------------------------------
Al iniciar sesión por primera vez con la contraseña genérica (documento),
el sistema obliga al usuario a cambiar la contraseña por una personal
antes de permitir cualquier otra funcionalidad. Sin este cambio, el 
usuario no puede acceder al sistema.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-AUTH-02C (ALMACENAMIENTO SEGURO)
---------------------------------------------------------------------------
Todas las contraseñas deben almacenarse encriptadas en la base de datos 
usando bcrypt con salt rounds >= 10. Nunca se almacenan en texto plano.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-AUTH-03 (GESTIÓN DE SESIÓN Y TIEMPO)
---------------------------------------------------------------------------
La sesión permanecerá activa por un máximo de 60 minutos de inactividad.
Tras este tiempo, el sistema debe cerrar la sesión automáticamente y
dirigir al usuario al Login para proteger los datos.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-AUTH-04 (RECUPERACIÓN DE CONTRASEÑA)
---------------------------------------------------------------------------
El usuario (estudiante, docente, etc.) puede recuperar su contraseña
ingresando su número de documento. El sistema envía un link al email
registrado con un token válido por tiempo limitado (ej: 1 hora).
El usuario establece su nueva contraseña sin intervención del admin.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
La sesión permanecerá activa por un máximo de 60 minutos de inactividad. 
Tras este tiempo, el sistema debe cerrar la sesión automáticamente y 
redirigir al usuario al Login para proteger los datos.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-AUTH-04 (RECUPERACIÓN DE CUENTA)
---------------------------------------------------------------------------
En caso de olvido de contraseña, el sistema permitirá el restablecimiento 
mediante un correo electrónico registrado o a través de la gestión directa 
del Administrador del colegio.
---------------------------------------------------------------------------
- 
- 
```

---

## 2. Cálculo de calificaciones ⚠️ CRÍTICO
**Servicio:** `server/src/services/calificacionService.js`
**Estado:** ✅ Completada y Verificada

### 2.1 Nota final por período
```
---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-CAL-01 (MÉTODO GENERAL DE CÁLCULO)
---------------------------------------------------------------------------
El promedio se calcula en dos pasos: primero se promedian las actividades 
para sacar la nota del indicador, y luego se promedian los indicadores 
para sacar la nota final del periodo.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-CAL-02 (PESOS DE INDICADORES)
---------------------------------------------------------------------------
Los indicadores tendrán pesos porcentuales (%) individuales. El docente 
puede decidir, por ejemplo, que el "Saber" valga 40% y el "Hacer" 60%.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-CAL-03 (PESOS DE ACTIVIDADES)
---------------------------------------------------------------------------
Dentro de un indicador, todas las actividades valen lo mismo (promedio 
aritmético simple). El docente define cuántas actividades crear.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-CAL-04 (REDONDEO)
---------------------------------------------------------------------------
El sistema calculará con dos decimales, pero aproximará la nota final al 
decimal más cercano (ejemplo: de 3.45 a 3.5).
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-CAL-05 (NOTA MÍNIMA)
---------------------------------------------------------------------------
La nota mínima para pasar es 3.0, pero este valor puede ser cambiado por 
el administrador si el colegio usa una escala diferente.
---------------------------------------------------------------------------

```

### 2.2 Recuperaciones
```
---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-REC-01 (CONDICIÓN DE APLICACIÓN)
---------------------------------------------------------------------------
La recuperación aplica única y exclusivamente para los estudiantes que han 
reprobado el periodo (nota final inferior a 3.0). No se habilitará para 
estudiantes con notas aprobadas que deseen subir su promedio.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-REC-02 (EFECTO EN LA NOTA FINAL)
---------------------------------------------------------------------------
La nota obtenida en la recuperación reemplaza la nota final del periodo 
anterior, siempre que la nueva calificación sea superior. El sistema no 
promediará la recuperación con la nota reprobada.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-REC-03 (NOTA MÁXIMA ALCANZABLE)
---------------------------------------------------------------------------
La nota máxima que se puede registrar tras un proceso de recuperación es 
de 3.0. Independientemente de si el estudiante obtiene una calificación 
mayor en su examen, el sistema la ajustará al tope de aprobación.
---------------------------------------------------------------------------
```

### 2.3 Habilitaciones
```
---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-HAB-01 (RANGO DE APLICACIÓN)
---------------------------------------------------------------------------
La habilitación aplica únicamente para estudiantes cuya nota final anual 
se encuentre en el rango de 2.0 a 2.9. Estudiantes con notas inferiores 
a 2.0 reprueban automáticamente sin derecho a habilitar.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-HAB-02 (EFECTO EN EL PROMEDIO)
---------------------------------------------------------------------------
La nota obtenida en la habilitación reemplaza la nota final de la 
asignatura, siempre que sea aprobatoria. El sistema guardará el 
historial de la nota anterior por motivos de auditoría académica.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-HAB-03 (NOTA MÁXIMA DE HABILITACIÓN)
---------------------------------------------------------------------------
La calificación máxima que se puede asentar en el registro oficial tras 
una habilitación exitosa es de 3.0. Cualquier nota superior obtenida en 
la prueba será ajustada automáticamente a este límite.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-HAB-04 (PERIODICIDAD)
---------------------------------------------------------------------------
Las habilitaciones se realizan exclusivamente al finalizar el año escolar, 
una vez promediados todos los periodos. No existen procesos de 
habilitación por periodos individuales.
---------------------------------------------------------------------------
```

### 2.4 Nota acumulada (varios períodos)
```
---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-ACU-01 (PESO DE LOS PERIODOS)
---------------------------------------------------------------------------
Por defecto, todos los periodos académicos tendrán un peso equitativo (ej. 
si son 4 periodos, cada uno vale 25%). Sin embargo, el sistema permitirá 
al administrador configurar pesos distintos según el PEI del colegio.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-ACU-02 (CÁLCULO DINÁMICO DEL ACUMULADO)
---------------------------------------------------------------------------
El sistema calculará el promedio acumulado dividiendo la suma de las notas 
de los periodos cerrados entre el número total de periodos configurados 
para el año (2, 3, 4 o 5), garantizando la flexibilidad del software.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-ACU-03 (INTEGRACIÓN DE NOTAS ESPECIALES)
---------------------------------------------------------------------------
El acumulado anual tomará siempre la nota más reciente y vigente. Si un 
periodo fue recuperado o habilitado, el sistema usará esa nueva nota para 
recalcular el promedio acumulado de forma automática.
---------------------------------------------------------------------------
```

---

## 3. Promoción y retención ⚠️ CRÍTICO
**Servicio:** `server/src/services/promocionService.js`
**Estado:** ✅ completada y verificada


```
---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-PRO-01 (CRITERIO DE REPROBACIÓN)
---------------------------------------------------------------------------
La reprobación del año escolar se calculará por el número de áreas 
perdidas. El sistema validará el estado final de cada área después de 
incluir las notas de habilitación.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-PRO-02 (LÍMITE DE ÁREAS REPROBADAS)
---------------------------------------------------------------------------
Un estudiante reprueba automáticamente el año si pierde 3 o más áreas. 
Este valor (el número de áreas) será configurable por el administrador 
desde los parámetros generales del sistema.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-PRO-03 (ÁREAS CRÍTICAS)
---------------------------------------------------------------------------
No existen áreas que reprueben el año de forma individual. La promoción 
depende exclusivamente del conteo total de áreas perdidas definido en 
la regla RN-PRO-02.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-PRO-04 (ASIGNACIÓN DE GRUPOS - REPITENTES)
---------------------------------------------------------------------------
El estudiante que repruebe el año será asignado automáticamente a un nuevo 
grupo del mismo grado en el periodo académico siguiente. Sus datos 
históricos quedarán ligados a su hoja de vida académica.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-PRO-05 (CIERRE DE AÑO Y MIGRACIÓN)
---------------------------------------------------------------------------
El cierre masivo copiará al nuevo año: datos básicos del estudiante, 
historial médico y acudientes. No se copiarán las notas del año anterior, 
generando un libro de calificaciones limpio para el nuevo ciclo.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-PRO-06 (ESTUDIANTES PROMOVIDOS)
---------------------------------------------------------------------------
Los estudiantes promovidos serán reasignados a los grupos del grado 
siguiente de forma automática. El administrador podrá realizar ajustes 
manuales en la distribución de los grupos antes de iniciar el primer periodo.
---------------------------------------------------------------------------
```

---

## 4. Boletines ⚠️ CRÍTICO
**Servicio:** `server/src/services/reporteService.js`
**Estado:** ✅ completada y verificada


```
---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-BOL-01 (TIPOS DE BOLETÍN Y CONTENIDO)
---------------------------------------------------------------------------
El sistema generará tres tipos de reportes:
1. Acumulativo: Muestra notas de todos los periodos cursados y promedio.
2. Corto: Resumen de notas finales del periodo actual sin detalles.
3. Descriptivo: Incluye el detalle de indicadores y observaciones.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-BOL-02 (JERARQUÍA Y ORDENAMIENTO)
---------------------------------------------------------------------------
Las áreas aparecerán en orden alfabético. Dentro de cada área, las 
asignaturas se listarán según la importancia configurada por la institución 
(ej. Matemáticas antes que Geometría).
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-BOL-03 (VISIBILIDAD DE INDICADORES)
---------------------------------------------------------------------------
Los indicadores de desempeño (Saber, Hacer, Ser) solo se mostrarán en el 
Boletín Descriptivo. En los demás formatos, solo aparecerá la nota final 
del área o asignatura para optimizar espacio.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-BOL-04 (REGISTRO DE RECUPERACIONES)
---------------------------------------------------------------------------
Tanto en el boletín de periodo como en el final, se mostrará la nota 
vigente. Si hubo recuperación, aparecerá un asterisco (*) indicando que la 
nota fue obtenida en un proceso de nivelación.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-BOL-05 (DIFERENCIA BOLETÍN FINAL VS PERIODO)
---------------------------------------------------------------------------
El boletín de periodo muestra el detalle del ciclo actual. El boletín final 
omite detalles de actividades y se centra en el promedio anual, el puesto 
ocupado y el veredicto de "Promovido" o "No Promovido".
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-BOL-06 (GENERACIÓN DE LOGROS AUTOMÁTICOS)
---------------------------------------------------------------------------
El sistema generará automáticamente un concepto cualitativo según la nota:
- 4.6 a 5.0: Desempeño Superior.
- 4.0 a 4.5: Desempeño Alto.
- 3.0 a 3.9: Desempeño Básico.
- 1.0 a 2.9: Desempeño Bajo.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-BOL-07 (ESTRUCTURA PREESCOLAR)
---------------------------------------------------------------------------
El boletín de preescolar sustituye las notas numéricas por una escala 
completamente cualitativa y descriptiva basada en dimensiones del 
desarrollo, cumpliendo con la normativa de educación inicial.
---------------------------------------------------------------------------
```

---

## 5. Cronograma y períodos
**Servicio:** Lógica en controladores y middleware
**SPs de referencia:** `paFillCronograma`, `PaFillCronogramaprematricula`
**Estado:** ✅ Completada y Verificada

```
---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-CRO-01 (CONFIGURACIÓN DE PERÍODOS)
---------------------------------------------------------------------------
El sistema permitirá configurar un año lectivo con un mínimo de 2 períodos 
(semestral) y un máximo de 5 períodos. Esto se define al inicio del año 
escolar y no podrá ser modificado una vez se registren notas.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-CRO-02 (CALENDARIO DE RECUPERACIONES)
---------------------------------------------------------------------------
Cada período tendrá su propia fecha de inicio y fin para el registro de 
recuperaciones. Estas fechas son independientes para cada ciclo y deben 
ser habilitadas previamente por la administración.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-CRO-03 (RESTRICCIONES DE CIERRE)
---------------------------------------------------------------------------
Cuando un período está marcado como "Cerrado", el sistema bloqueará:
1. La creación de nuevas actividades evaluativas.
2. La modificación de notas existentes por parte del docente.
3. La generación de inasistencias para ese rango de fechas.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-CRO-04 (PERMISOS DE EDICIÓN POST-CIERRE)
---------------------------------------------------------------------------
El docente NO podrá editar notas una vez cerrado el período. Solo el 
Administrador tendrá un permiso especial de "Apertura Temporal" para 
permitir correcciones excepcionales bajo auditoría del sistema.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-CRO-05 (CRONOGRAMA DE PREMATRÍCULA)
---------------------------------------------------------------------------
El proceso de prematrícula tendrá fechas totalmente independientes al 
cronograma de clases. Podrá habilitarse de forma paralela al último 
período académico sin afectar el registro de calificaciones.
---------------------------------------------------------------------------?
```

---

## 6. Contabilidad
**Servicio:** `server/src/services/contabilidadService.js`
**Estado:**  ✅ Completada y Verificad (puede documentarse en Fase 6)

```
---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-CONT-01 (MÉTODOS DE GENERACIÓN)
---------------------------------------------------------------------------
El sistema permitirá la generación de cobros de pensión de tres formas:
1. Masivo por Grado: Para aplicar cobros generales a todos los grupos.
2. Por Grupo: Para cobros específicos de un salón.
3. Individual: Para cobros manuales o estudiantes con planes especiales.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-CONT-02 (CÁLCULO DE DESCUENTOS Y RECARGOS)
---------------------------------------------------------------------------
Los descuentos (por pronto pago) y recargos (por mora) serán porcentuales. 
El sistema calculará el valor automáticamente basándose en la "Fecha de 
Corte" definida en el cronograma financiero mensual.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-CONT-03 (CLASIFICACIÓN DE CONCEPTOS)
---------------------------------------------------------------------------
- Conceptos Obligatorios: Matrícula, Pensión y Seguro Estudiantil.
- Conceptos Opcionales: Transporte, Alimentación y Extracurriculares.
Cada estudiante tendrá un "Perfil de Cobro" donde se marcarán los 
conceptos opcionales que le correspondan.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-CONT-04 (POLÍTICA DE MORA)
---------------------------------------------------------------------------
Un estudiante entra en estado de "Mora" un día después de la fecha límite 
de pago. El sistema generará un reporte de cartera para administración, 
pero mantendrá activo el acceso del estudiante a la plataforma educativa.
---------------------------------------------------------------------------?
```

---

## 7. Configuración del colegio
**SPs de referencia:** `paFillConfiguracion`, `paUdConfiguracion`, `paUdConvenciones1`, `paUdDaneColegio`
**Estado:** ✅ Completada y Verificad

```
---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-CONF-01 (PARÁMETROS DE IMPACTO ACADÉMICO)
---------------------------------------------------------------------------
El sistema permitirá configurar globalmente los parámetros que afectan el 
cálculo de notas, específicamente: el número de decimales (1 o 2), el 
umbral de aprobación (nota mínima) y el peso porcentual de cada período.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-CONF-02 (CONVENCIONES Y NIVELES)
---------------------------------------------------------------------------
Las convenciones (Ej: Excelente, Sobresaliente, Insuficiente) no son solo 
visuales. El sistema las utilizará para asignar automáticamente el rango 
cualitativo en el boletín basado en el resultado numérico obtenido.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-CONF-03 (DATOS LEGALES E IDENTIDAD)
---------------------------------------------------------------------------
El código DANE y el código ICFES son campos obligatorios en la configuración. 
Estos datos aparecerán automáticamente en el encabezado de todos los 
documentos oficiales: boletines, certificados de estudio y actas de grado.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-CONF-04 (PERSONALIZACIÓN DE LOGOS)
---------------------------------------------------------------------------
El sistema permitirá cargar el escudo de la institución y la firma del 
rector. Estos archivos se almacenarán en el servidor y se renderizarán 
en tiempo real al generar cualquier reporte en formato PDF.
---------------------------------------------------------------------------
```

---

## 8. Bitácora
**SP de referencia:** `g_Bitacora`
**Estado:** ✅ Completada y Verificad

```
---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-BIT-01 (ACCIONES DE REGISTRO OBLIGATORIO)
---------------------------------------------------------------------------
El sistema debe registrar de forma automática y obligatoria las siguientes 
acciones: inicio de sesión, cambio de contraseñas, eliminación de registros, 
apertura/cierre de periodos y cualquier modificación de notas o pagos.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-BIT-02 (TRAZABILIDAD DE CALIFICACIONES)
---------------------------------------------------------------------------
Para el caso específico de calificaciones, la bitácora debe almacenar 
obligatoriamente el "Estado Anterior" y el "Estado Nuevo". Esto permite 
saber exactamente qué nota había antes de una corrección o recuperación.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-BIT-03 (METADATOS DE AUDITORÍA)
---------------------------------------------------------------------------
Cada registro de la bitácora debe incluir: ID del usuario que realizó la 
acción, fecha y hora exacta (timestamp), dirección IP del dispositivo y 
una descripción breve del cambio realizado.
---------------------------------------------------------------------------

---------------------------------------------------------------------------
REGLA DE NEGOCIO: RN-BIT-04 (NIVELES DE ACCESO)
---------------------------------------------------------------------------
La visualización de la bitácora es restringida. Solo el Administrador del 
sistema y el Rector tendrán acceso a este módulo. Los coordinadores podrán 
solicitar reportes específicos, pero no ver la bitácora en tiempo real.
---------------------------------------------------------------------------
```

---

## Checklist de entrega

- [ ] Sección 2 — Calificaciones completada y verificada con el sistema actual
- [ ] Sección 3 — Promoción completada y verificada
- [ ] Sección 4 — Boletines completada + formatos actuales entregados como PDF/imagen
- [ ] Sección 5 — Cronograma completada
- [ ] Secciones 1, 6, 7, 8 — pueden completarse en paralelo con el desarrollo

> Las secciones 2, 3 y 4 son bloqueantes para la Fase 3 y 5 del desarrollo.
> Sin ellas, los desarrolladores no pueden implementar calificaciones ni reportes correctamente.
