# -*- coding: utf-8 -*-
"""Las 17 diapositivas de la exposicion del plan de negocio EasyNotes v2.

Todas las cifras provienen del documento diligenciado (docs/PLAN DE NEGOCIO
BASICO 2026 - EasyNotes v2 (dilenciado).doc). La verificacion automatica de
terminos vive en verificar_deck.py.
"""

from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from deck_base import (nueva_slide, caja, parrafo, vinetas, titulo, pie, notas,
                       tabla, cifra, panel, EQUIPO, AZUL, AZUL_CLARO, GRIS,
                       GRIS_CLARO, BLANCO, VERDE, ROJO, FONDO)

DER = PP_ALIGN.RIGHT
CEN = PP_ALIGN.CENTER


# ------------------------------------------------------------------ 1
def s01_portada(prs):
    s = nueva_slide(prs)
    barra = s.shapes.add_shape(1, Inches(0), Inches(2.15), Inches(13.333), Inches(1.5))
    barra.fill.solid(); barra.fill.fore_color.rgb = AZUL
    barra.line.fill.background(); barra.shadow.inherit = False
    tfb = barra.text_frame
    tfb.vertical_anchor = MSO_ANCHOR.MIDDLE
    tfb.margin_left = Inches(0.6)
    parrafo(tfb, 'EasyNotes v2', size=44, bold=True, color=BLANCO, first=True,
            space_after=4)
    parrafo(tfb, 'Sistema web de gestión educativa como servicio por suscripción (SaaS)',
            size=18, color=BLANCO, space_after=0)

    tf = caja(s, Inches(0.6), Inches(3.95), Inches(12.1), Inches(2.2))
    parrafo(tf, 'Plan de Negocio Básico 2026', size=20, bold=True, color=GRIS,
            first=True, space_after=14)
    parrafo(tf, 'Aprendices:  ' + '   |   '.join(EQUIPO), size=14, color=GRIS,
            space_after=0)
    pie(s, 'Documento desarrollado a partir de la plantilla del SENA · '
           'la economía se presenta colegio por colegio')
    notas(s, 'MARTÍN', 'Presentamos el plan de negocio de EasyNotes v2, que es el mismo sistema '
             'que ya se venía trabajando, planteado ahora como empresa. Queremos '
             'mostrar que no queda en un ejercicio académico: es un negocio con '
             'mercado, precios, costos y proyección. Somos cinco: Martín, Sneyder, '
             'Yorman, Santiago y Andrés.')
    return s


# ------------------------------------------------------------------ 2
def s02_problema(prs):
    s = nueva_slide(prs)
    titulo(s, '1.3  JUSTIFICACIÓN', 'A qué responde el proyecto')
    vinetas(s, Inches(0.45), Inches(1.75), Inches(6.3), Inches(4.6), [
        'Registro de matrículas y notas en libros y planillas',
        'El flujo de matrícula tiene demasiados pasos',
        'Recuperación y habilitación difíciles de aplicar a mano',
        'No existe recordatorio automático de las pensiones',
        'Errores de cálculo y pérdida de información',
        'Una carga de trabajo que consume las horas de un auxiliar administrativo',
    ], size=17)
    panel(s, Inches(7.15), Inches(1.75), Inches(5.7), Inches(3.05), 'EL RESULTADO', [
        'Errores de nota que hay que corregir, reclamos que no se puede responder y '
        'pérdida de información. La institución no lo percibe, porque el costo cae en '
        'las horas de un auxiliar administrativo.',
    ], color=ROJO, size=14)
    tf = caja(s, Inches(7.15), Inches(5.05), Inches(5.7), Inches(1.5))
    parrafo(tf, 'No es un supuesto: es el análisis de causa y efecto (diagrama de '
                'Ishikawa) que el equipo realizó sobre el sistema real.',
            size=13, color=GRIS_CLARO, first=True)
    notas(s, 'MARTÍN', 'Antes de la solución, el problema. Estos seis puntos salen del análisis '
             'de causa y efecto que el equipo realizó sobre el sistema real. Las '
             'matrículas y las notas se registran en libros y planillas; el flujo de '
             'matrícula tiene demasiados pasos; las reglas de recuperación y '
             'habilitación son difíciles de aplicar a mano; y no existe recordatorio '
             'automático de las pensiones. El resultado son errores de cálculo, '
             'pérdida de información y una carga de trabajo que consume las horas de '
             'un auxiliar administrativo. Eso vamos a resolver.')
    return s


# ------------------------------------------------------------------ 3
def s03_solucion(prs):
    s = nueva_slide(prs)
    titulo(s, '1.1  DESCRIPCIÓN DEL PROYECTO',
           'La solución: una plataforma, dos componentes que hoy están separados')
    tf = caja(s, Inches(0.45), Inches(1.7), Inches(12.45), Inches(0.75))
    parrafo(tf, 'EasyNotes v2 integra en una sola licencia el componente académico y el '
                'contable, que normalmente viven en sistemas separados.',
            size=17, color=GRIS, first=True)
    tabla(s, Inches(0.45), Inches(2.55), Inches(6.1), Inches(1.7), [
        ['Componente ACADÉMICO'],
        ['Matrícula, calificaciones y asistencia'],
        ['Recuperaciones y habilitaciones'],
        ['Observador, promoción y certificados'],
        ['Boletines y reportes en PDF'],
    ], anchos=[1], size=13, alto_fila=0.3)
    tabla(s, Inches(6.9), Inches(2.55), Inches(6.0), Inches(1.7), [
        ['Componente CONTABLE y ADMINISTRATIVO'],
        ['Matrículas y cartera'],
        ['Pensiones'],
        ['Recordatorios de pago'],
        ['Comunicados con apoderados'],
    ], anchos=[1], size=13, alto_fila=0.3)
    tf = caja(s, Inches(0.45), Inches(4.5), Inches(12.45), Inches(1.1))
    parrafo(tf, 'Cuatro roles con permisos diferenciados', size=15, bold=True,
            color=AZUL, first=True, space_after=4)
    parrafo(tf, 'Administrador  ·  Docente  ·  Estudiante  ·  Acudiente      '
                '|      Bitácora de auditoría: usuario, fecha y hora de cada cambio',
            size=15, color=GRIS, space_after=0)
    pie(s, 'React + Vite + Material UI  ·  Node.js + Express  ·  MongoDB  ·  '
           'código abierto, sin licencias')
    notas(s, 'MARTÍN', 'Nuestra propuesta no es un módulo nuevo, es integrar. Hoy el académico y '
             'el contable están separados y esas dos bases de datos nunca se hablan. '
             'Nosotros las unimos: el colegio compra un solo sistema. Detrás hay '
             'cuatro roles con permisos diferenciados, así que cada persona ve solo lo '
             'que le corresponde, y bitácora de auditoría de quién hizo cada cambio y '
             'cuándo. Eso responde al problema de trazabilidad. Y todo es código '
             'abierto, así que no pagamos licencias, y eso es lo que permite el precio '
             'bajo.')
    return s


# ------------------------------------------------------------------ 4
def s04_objetivos(prs):
    s = nueva_slide(prs)
    titulo(s, '1.2  DEFINICIÓN DE OBJETIVOS', 'Objetivos')
    panel(s, Inches(0.45), Inches(1.65), Inches(12.45), Inches(1.15), 'OBJETIVO GENERAL', [
        'Consolidar EasyNotes v2 como un servicio web de suscripción de gestión '
        'académica, administrativa y contable para instituciones educativas de Colombia, '
        'como reemplazo verificable de los registros en libros y planillas.',
    ], size=14)
    tf = caja(s, Inches(0.45), Inches(3.0), Inches(12.45), Inches(0.35))
    parrafo(tf, 'OBJETIVOS ESPECÍFICOS', size=13, bold=True, color=AZUL, first=True)
    datos = [
        ['Mercado', 'Analizar el sector, definir precios por tamaño de institución y '
                    'alcanzar 20 colegios suscritos en el año 1'],
        ['Técnico', 'Estabilizar la plataforma, completar Observador y Elecciones, '
                    'la importación masiva desde Excel y el despliegue en producción'],
        ['Organizacional', 'Definir cargos y funciones por área, y reducir la carga de '
                           'soporte con manual y tutoriales'],
        ['Financiero', 'Generar $111.000.000 de ingresos con una utilidad estimada de '
                       '$22.965.000'],
        ['Social', 'Disminuir la carga administrativa y eliminar errores de cálculo de '
                   'notas con las reglas del Ministerio de Educación'],
    ]
    t = tabla(s, Inches(0.45), Inches(3.42), Inches(12.45), Inches(2.9), datos,
              anchos=[1.6, 8], size=13, header=False, alto_fila=0.52)
    for ri in range(len(datos)):
        for p in t.cell(ri, 0).text_frame.paragraphs:
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = AZUL
    notas(s, 'MARTÍN', 'El objetivo general es la versión de una frase de lo que queremos lograr '
             'en un año. Los específicos están agrupados por las cuatro dimensiones '
             'que pide la plantilla, más el social. De los específicos, fíjense en '
             'dos: 20 colegios suscritos y la utilidad. Esos son los números que '
             'validas al final. El resto son las condiciones para poder llegar a esos '
             'dos.')
    return s


# ------------------------------------------------------------------ 5
def s05_mercado(prs):
    s = nueva_slide(prs)
    titulo(s, '3.1  ANÁLISIS DEL MERCADO', 'El cliente objetivo')
    tf = caja(s, Inches(0.45), Inches(1.7), Inches(12.45), Inches(0.6))
    parrafo(tf, 'Mercado objetivo: instituciones privadas de Colombia con matrícula entre '
                '200 y 1.500 estudiantes, de básica primaria a media, una sola sede.',
            size=15, color=GRIS, first=True)
    tabla(s, Inches(0.45), Inches(2.5), Inches(12.45), Inches(2.0), [
        ['Perfil', 'Edad', 'Qué decide', 'Necesidad central'],
        ['Rector (decisor)', '45-65', 'Aprueba el presupuesto',
         'No perder los datos de sus estudiantes ni que el sistema falle'],
        ['Secretaría y docentes', '30-55', 'Uso diario del sistema',
         'No cambiar de rutina más de lo necesario'],
        ['Acudiente', '—', 'Solo consulta',
         'Ver notas y boletines desde el celular'],
    ], anchos=[2.2, 0.9, 2.4, 5], size=13, alto_fila=0.5)
    tf = caja(s, Inches(0.45), Inches(4.8), Inches(12.45), Inches(1.9))
    parrafo(tf, 'POR QUÉ SE DESCARTAN DOS SEGMENTOS', size=13, bold=True, color=AZUL,
            first=True, space_after=6)
    parrafo(tf, 'Menos de 200 estudiantes: no alcanza a cubrir la suscripción.   '
                'Colegios muy grandes y secretarías distritales: exigen licitaciones y '
                'requisitos que no podemos cumplir en el primer año.',
            size=15, color=GRIS, space_after=0)
    notas(s, 'YORMAN', 'El mercado objetivo lo definimos por tamaño, no por departamento: '
             'colegios de 200 a 1.500 estudiantes, de primaria a media, una sola sede. '
             'Lo importante es la última columna, la necesidad central de cada quien. '
             'Al rector lo que le asusta es que el sistema falle a mitad del período y '
             'se pierdan datos. Eso define cómo vendemos: primero garantizamos que no '
             'se pierde nada, después hablamos de precio. Y dejamos fuera segmentos a '
             'propósito: menos de 200 estudiantes no cubre el costo, y los muy grandes '
             'exigen licitaciones que el equipo no puede cumplir en el primer año.')
    return s


# ------------------------------------------------------------------ 6
def s06_competencia(prs):
    s = nueva_slide(prs)
    titulo(s, '3.2-3.3  ANÁLISIS DE LA COMPETENCIA', 'Comparación con la competencia')
    tabla(s, Inches(0.45), Inches(1.75), Inches(12.45), Inches(3.2), [
        ['Competidor', 'Precios', 'Fortalezas', 'Debilidades'],
        ['Sistema interno del colegio', 'Costo hundido, sin canon',
         'Ya integrado; no requiere migración',
         'Exige programador; sin soporte ni versión web'],
        ['Google Workspace for Education', 'Versión Education gratis',
         'Precio cero; uso conocido',
         'No aplica la norma escolar; notas sin control'],
        ['SaaS escolar de la región', 'Suscripción por institución o estudiante',
         'Soporte formal; referencias comprobables',
         'Cobra por estudiante; implementación costosa'],
        ['Papel y hoja de cálculo', '$0 en licencias',
         'Sin inversión ni capacitación', 'Errores de cálculo; sin trazabilidad'],
    ], anchos=[2.4, 2.1, 2.6, 3.4], size=12, alto_fila=0.62)
    panel(s, Inches(0.45), Inches(5.2), Inches(12.45), Inches(1.5),
          'NUESTRA VENTAJA COMPETITIVA', [
              'Precio fijo por institución (no por estudiante)  +  académico y contable '
              'en una sola licencia  +  sin costos de licencia, porque todo es código '
              'abierto.',
          ], size=15)
    notas(s, 'YORMAN', 'Estos son los cuatro modelos que evaluamos. El primero es al que '
             'realmente vamos a desplazar: el sistema propio de cada colegio. Ya está '
             'integrado y no hay que migrar, ese es su fuerte, pero para cambiar una '
             'sola cosa necesita un programador. El segundo es el rival de precio, '
             'Google gratis, que no sabe qué es una recuperación ni una promoción: las '
             'notas quedan en celdas sin validar. Nosotros cobramos entre 12 y 48 '
             'veces más, pero entregamos la lógica escolar completa. Y el cuarto no es '
             'una empresa, pero es la decisión real de la mayoría: seguir como '
             'estamos. A ese se le gana con trazabilidad y ahorro de tiempo, no con '
             'precio.')
    return s


# ------------------------------------------------------------------ 7
def s07_producto(prs):
    s = nueva_slide(prs)
    titulo(s, '3.4.1  CONCEPTO DEL PRODUCTO', 'El producto')
    t = tabla(s, Inches(0.45), Inches(1.75), Inches(12.45), Inches(3.9), [
        ['Ficha técnica', ''],
        ['Categoría', 'Software de gestión educativa SaaS, con alcance académico y contable integrado'],
        ['Tecnología', 'React, Vite y Material UI (frontend) · Node.js y Express (backend) · MongoDB'],
        ['Dispositivos', 'Computadora, tableta y celular (interfaz responsiva, funciona en el navegador)'],
        ['Roles y permisos', 'Administrador, Docente, Estudiante y Acudiente, con bitácora de auditoría'],
        ['Documentación', 'Manual de uso por rol y videos tutoriales'],
        ['Garantía', '6 meses sobre defectos de software, sin costo'],
        ['Soporte', 'Correo, mensajería y teléfono, de lunes a viernes. Tiempo de respuesta máximo: 4 horas hábiles'],
    ], anchos=[1.9, 8], size=13, alto_fila=0.47)
    t.cell(0, 0).merge(t.cell(0, 1))
    tf = caja(s, Inches(0.45), Inches(5.85), Inches(12.45), Inches(0.9))
    parrafo(tf, 'Fortalezas frente a la competencia:  integra académico y contable  ·  '
                'aplica solo las reglas del Ministerio  ·  boletines y certificados '
                'automáticos  ·  sin licencias.',
            size=14, bold=True, color=AZUL, first=True, space_after=0)
    notas(s, 'ANDRÉS', 'La ficha técnica, pero quiero destacar cuatro cosas. Primera: la '
             'interfaz es responsiva, así que el docente y el apoderado la usan bien '
             'desde el celular, sin que tengamos que desarrollar una aplicación '
             'aparte. Segunda: el soporte tiene un compromiso concreto, cuatro horas '
             'hábiles de respuesta. Si un docente no puede sacar notas el día de '
             'corte, el problema es grave, y la garantía es de seis meses. Tercera: no '
             'pagamos licencias de software, React, Node.js, Express y MongoDB son de '
             'código abierto, así que el costo depende del servicio que damos y no del '
             'volumen de usuarios. Y cuarta: no es una caja negra, entregamos manual '
             'de uso por rol y videos tutoriales, y funciona en Chrome, Edge y '
             'Firefox, en Windows, macOS y Linux. Y la pantalla no es la misma para '
             'todos: hay cuatro paneles de inicio, uno por rol. El docente ve sus '
             'grupos y sus pendientes de calificación, el administrador ve matrículas, '
             'pagos e indicadores, el estudiante ve sus notas y sus ausencias, y el '
             'acudiente ve el rendimiento de sus hijos.')
    return s


# ------------------------------------------------------------------ 8
def s08_precios(prs):
    s = nueva_slide(prs)
    titulo(s, '3.4.2  ESTRATEGIAS DE PRECIO', 'Precios')
    tabla(s, Inches(0.45), Inches(1.7), Inches(12.45), Inches(2.0), [
        ['Plan', 'Estudiantes', 'Precio anual', 'Qué incluye'],
        ['Básico', 'Hasta 300', '$1.200.000',
         'Licencia de los 4 roles, hospedaje, soporte, actualizaciones y capacitación'],
        ['Intermedio', '301 a 800', '$2.600.000', 'Todo lo del plan Básico'],
        ['Superior', '801 a 1.500 o con varias sedes', '$4.800.000',
         'Todo lo del plan Intermedio'],
    ], anchos=[1.3, 1.9, 1.7, 6], size=13, alto_fila=0.5)
    panel(s, Inches(0.45), Inches(3.95), Inches(12.45), Inches(1.0),
          'Implementación y migración de datos:  $3.500.000  (pago único, obligatorio)',
          [], color=ROJO, size=15)
    tf = caja(s, Inches(0.45), Inches(5.2), Inches(12.45), Inches(1.6))
    parrafo(tf, 'DECISIÓN CENTRAL:  se cobra por INSTITUCIÓN, no por estudiante',
            size=14, bold=True, color=AZUL, first=True, space_after=6)
    parrafo(tf, 'La mayoría del mercado cobra por estudiante: la factura se vuelve '
                'impredecible para un colegio en crecimiento. Un precio fijo por '
                'institución: el colegio sabe lo que paga, aunque crezca.   ·   '
                'Pago: 50 % al firmar, '
                '50 % contra entrega; 5 % de descuento si paga el año completo.   ·   '
                'Prueba de 30 días incluida.',
            size=13.5, color=GRIS, space_after=0)
    notas(s, 'MARTÍN', 'Tres planes por tamaño de colegio. Y noten que no cobramos por '
             'estudiante, que es como cobra casi todo el mercado. Es deliberado: si '
             'cobramos por estudiante, la factura le crece al colegio cada vez que '
             'entra un alumno nuevo. Un precio fijo elimina esa fricción. La '
             'implementación son 3,5 millones, pago único y obligatorio, porque la '
             'migración de datos es lo más caro que hacemos. Si la metiéramos en la '
             'suscripción, el margen se nos deshace con los primeros tres clientes. '
             'Como referencia, atender un colegio nos cuesta 280 mil al año, así que '
             'cobramos entre cuatro y diecisiete veces eso.')
    return s


# ------------------------------------------------------------------ 9  (nueva)
def s09_economia_unitaria(prs):
    s = nueva_slide(prs)
    titulo(s, '3.4.4  ECONOMÍA UNITARIA', 'La economía de UN colegio')
    tf = caja(s, Inches(0.45), Inches(1.62), Inches(12.45), Inches(0.4))
    parrafo(tf, 'Plan Básico, colegio de 300 estudiantes. Toda la proyección se construye '
                'sobre esta unidad.', size=14, color=GRIS, first=True)
    tabla(s, Inches(0.45), Inches(2.1), Inches(7.6), Inches(3.3), [
        ['Concepto', 'Año 1', 'Año 2'],
        ['Suscripción anual', '$1.200.000', '$1.200.000'],
        ['Implementación (pago único)', '$3.500.000', '$0'],
        ['Ingreso por un colegio', '$4.700.000', '$1.200.000'],
        ['Costo variable', '−$280.000', '−$280.000'],
        ['Margen de contribución', '$4.420.000', '$920.000'],
        ['Precio medio por alumno al mes', '$1.306', '$333'],
    ], anchos=[3.2, 1.4, 1.4], size=12.5, alto_fila=0.44,
        aligns=[None, DER, DER])
    t = s.shapes[-1].table
    for ci in range(3):
        for p in t.cell(5, ci).text_frame.paragraphs:
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = AZUL

    panel(s, Inches(8.35), Inches(2.1), Inches(4.55), Inches(1.55),
          'LO QUE PAGA EL COLEGIO', [
              '$333 por alumno al mes. Equivale a uno o dos meses del salario de un '
              'auxiliar administrativo, y el sistema libera entre 40 y 60 horas '
              'mensuales de trabajo de secretaría.',
          ], size=13)
    panel(s, Inches(8.35), Inches(3.8), Inches(4.55), Inches(1.6),
          'EL MARGEN PARA NOSOTROS', [
              'Margen de contribución del 94 % sobre el ingreso. Sin licencias de '
              'software: el costo depende del servicio, no del volumen.',
          ], color=VERDE, size=13)
    panel(s, Inches(0.45), Inches(5.6), Inches(12.45), Inches(1.15),
          'EL PUNTO MÁS IMPORTANTE DE ESTA TABLA', [
              'El margen de un colegio cae de $4.420.000 en el año 1 a $920.000 en el '
              'año 2, porque la implementación se cobra una sola vez. Casi tres cuartas '
              'partes del ingreso del primer año se concentran en ese primer contrato.',
          ], color=ROJO, size=13.5)
    notas(s, 'SANTIAGO', 'Esta es la diapositiva que más importa. Todo el plan se construye sobre '
             'una sola unidad de venta: un colegio. Esta tabla es el Plan Básico, con '
             '300 alumnos. El año 1 nos deja cuatro millones setecientos de mil, de '
             'los cuales solo doscientos ochenta mil son costo variable: quedan cuatro '
             'millones cuatrocientos veinte mil de contribución. Ahora miren las dos '
             'columnas. El ingreso cae de 4,7 millones a 1,2 millones porque la '
             'implementación se cobra una sola vez, y el margen se desploma de 4,4 a '
             '920 mil. Eso es honestidad contable: casi tres cuartas partes del '
             'ingreso se concentran en el primer contrato: hay que cerrar colegios '
             'nuevos y retener. Y el precio: 333 pesos por alumno al mes, uno o dos '
             'meses del salario de un auxiliar, al que le liberamos entre 40 y 60 '
             'horas mensuales. Ese es el argumento de venta.')
    return s


# ------------------------------------------------------------------ 10
def s10_canales(prs):
    s = nueva_slide(prs)
    titulo(s, '3.4  ESTRATEGIAS DE MERCADO',
           'Presupuesto de mezcla de mercado  ·  $15.690.000 al año')
    tabla(s, Inches(0.45), Inches(1.75), Inches(12.45), Inches(3.3), [
        ['Canal', 'Por qué', 'Costo'],
        ['1. Digital', 'Sitio con demo en línea, video de 3 min y campañas segmentadas a '
                       'directivos. Más del 80 % busca en línea antes de agendar cita',
         '$4.380.000'],
        ['2. Eventos y visitas', '3 ferias del sector y 24 visitas con demostración en '
                                  'sitio. La compra de software escolar exige hablar con el rector',
         '$6.480.000'],
        ['3. Marca e impreso', 'Logo, brochure, tarjetas, pendón y material POP. Cada visita '
                               'deja huella física verificable', '$4.830.000'],
    ], anchos=[1.7, 6.5, 1.4], size=12.5, alto_fila=1.0)
    tf = caja(s, Inches(0.45), Inches(5.3), Inches(12.45), Inches(1.4))
    parrafo(tf, 'El 14 % de los ingresos proyectados. El canal 1 permite medir el costo '
                'por visita; el canal 2 no, pero es el que cierra: en software escolar se '
                'compra por confianza.',
            size=14, color=GRIS, first=True, space_after=0)
    notas(s, 'YORMAN', 'Tres canales. El digital lo justificamos porque más del 80 % de los '
             'directivos buscan en línea antes de agendar una cita, y porque permite '
             'medir el costo por visita. Pero el que cierra es el segundo: en software '
             'escolar no se compra por comparación técnica, se compra por confianza, y '
             'esa confianza se construye en persona con el rector y con la secretaría '
             'académica. Por eso casi la mitad de la mezcla son eventos y visitas. Son '
             '15,7 millones, el 14 % de lo que proyectamos vender.')
    return s


# ------------------------------------------------------------------ 11
def s11_proyeccion(prs):
    s = nueva_slide(prs)
    titulo(s, '3.4.4  PROYECCIÓN DE VENTAS', 'La proyección: 20 veces esa unidad')
    tabla(s, Inches(0.45), Inches(1.7), Inches(12.45), Inches(1.5), [
        ['Producto / servicio', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12', 'Año 1'],
        ['A. Suscripción anual (contratos)', '0', '1', '1', '2', '2', '2', '2', '2', '2', '2', '2', '2', '20'],
        ['B. Implementación y migración', '0', '1', '2', '1', '2', '1', '2', '2', '2', '2', '2', '2', '20'],
    ], anchos=[3.4] + [0.72] * 13, size=11, alto_fila=0.34)

    cifra(s, Inches(0.45), Inches(3.4), Inches(2.95), '$41.000.000',
          '20 suscripciones\n11 Básico · 7 Intermedio · 2 Superior')
    cifra(s, Inches(3.62), Inches(3.4), Inches(2.95), '$70.000.000',
          '20 implementaciones\n$3.500.000 cada una', color=AZUL_CLARO)
    cifra(s, Inches(6.79), Inches(3.4), Inches(2.95), '$111.000.000',
          'Ingreso total del año 1', color=VERDE)
    cifra(s, Inches(9.96), Inches(3.4), Inches(2.94), '0',
          'Cierres en el primer mes', color=GRIS_CLARO)

    tf = caja(s, Inches(0.45), Inches(4.95), Inches(12.45), Inches(1.8))
    parrafo(tf, 'Proyección conservadora: no incluye renovaciones del año 2, ni clientes '
                'de otros países, ni módulos adicionales. El primer trimestre es de '
                'prueba, por eso el mes 1 es cero.',
            size=14, color=GRIS, first=True, space_after=4)
    parrafo(tf, 'Supuesto de mezcla: 11 colegios en Plan Básico, 7 en Intermedio y 2 en '
                'Superior. Esta mezcla define el punto de equilibrio.',
            size=14, color=GRIS, space_after=0)
    notas(s, 'SANTIAGO', 'La proyección mes a mes del año 1. Dos servicios: la suscripción y la '
             'implementación, con un mes de desfase porque la migración se ejecuta '
             'después de firmar. El mes uno es cero, y es deliberado: el primer '
             'trimestre es de prueba. De abajo: 20 suscripciones dan 41 millones con '
             'la mezcla de planes, y 20 implementaciones dan 70 millones. Total, 111 '
             'millones, que son 20 veces la unidad de un colegio. Y es conservador: no '
             'incluye renovaciones del año 2, ni los colegios de Ecuador y Perú, ni '
             'módulos nuevos. Si salimos bien, esto es el piso, no el techo.')
    return s


# ------------------------------------------------------------------ 12
def s12_gantt(prs):
    s = nueva_slide(prs)
    titulo(s, '2  PLAN OPERATIVO', 'Plan operativo a 12 meses')
    tabla(s, Inches(0.45), Inches(1.7), Inches(12.45), Inches(4.0), [
        ['Actividad', 'Fechas', 'Responsables'],
        ['Fase 1. Estabilización y deuda técnica', 'Mes 1 - Mes 2', 'Martín · Santiago'],
        ['Fase 2. Módulos con servicio listo sin pantalla: Observador y Elecciones',
         'Mes 2 - Mes 4', 'Yorman · Andrés'],
        ['Fase 3. Reportes e impresión en PDF', 'Mes 3 - Mes 5', 'Sneyder'],
        ['Importación masiva desde Excel y CSV, con validación de duplicados',
         'Mes 3 - Mes 5', 'Martín · Andrés'],
        ['Fase 4. Documentación y entrega: manual, tutoriales y datos de demostración',
         'Mes 5 - Mes 6', 'Todo el equipo'],
        ['Fase 5. Despliegue en producción: nube, base de datos, HTTPS y respaldos',
         'Mes 5 - Mes 7', 'Sneyder'],
        ['Piloto con dos colegios asociados', 'Mes 6 - Mes 8', 'Yorman · Santiago'],
        ['Comercialización y soporte del año 1', 'Mes 6 - Mes 12', 'Martín · Yorman'],
    ], anchos=[6.4, 1.8, 2.3], size=12.5, alto_fila=0.44)
    tf = caja(s, Inches(0.45), Inches(5.85), Inches(12.45), Inches(0.9))
    parrafo(tf, 'Las cinco fases van de estabilización a despliegue en producción. La '
                'comercialización va del mes 6 al mes 12: no se comercializa antes de '
                'tener el producto estable.', size=14, bold=True, color=AZUL, first=True, space_after=0)
    notas(s, 'ANDRÉS', 'Este es el cronograma real, con las cinco fases del plan, sus meses y '
             'sus responsables: estabilización y deuda técnica, del mes 1 al 2; '
             'módulos con servicio listo y sin pantalla, del 2 al 4; reportes e '
             'impresión, del 3 al 5; documentación y entrega, del 5 al 6, que es de '
             'todo el equipo; y despliegue en producción, del 5 al 7. Después viene el '
             'piloto con dos colegios asociados, del mes 6 al 8, y la comercialización '
             'con soporte, del 6 al 12. Noten el orden, porque es una decisión: '
             'primero estabilizamos, después ampliamos, y no comercializamos antes de '
             'tener el producto estable. El mayor riesgo no es técnico, es que el '
             'colegio no adopte el sistema. Si vendemos antes de estar estables, el '
             'primer cliente nos desfalla y perdemos la referencia. Cada actividad '
             'tiene responsable asignado, así que no hay zona gris. Y el piloto es con '
             'colegios asociados, no con clientes nuevos: así validamos la migración '
             'con datos reales sin arriesgar la referencia comercial.')
    return s


# ------------------------------------------------------------------ 13
def s13_operacion(prs):
    s = nueva_slide(prs)
    titulo(s, '4.1  OPERACIÓN', 'El proceso, paso a paso')
    tabla(s, Inches(0.45), Inches(1.7), Inches(12.45), Inches(4.35), [
        ['Etapa', 'Qué pasa'],
        ['1. Prospección y contacto',
         'Cita con el rector y la secretaría académica, y demostración en sitio con datos de '
         'ejemplo, sin compromiso'],
        ['2. Diagnóstico y propuesta',
         'Inventario de información del colegio y propuesta económica con el plan que '
         'corresponde a su tamaño'],
        ['3. Suscripción y anticipo',
         'Firma del contrato, anticipo, número de cliente y espacio del colegio en la plataforma'],
        ['4. Parametrización',
         'Logotipo, años académicos, escala de calificación, reglas de recuperación y '
         'habilitación, cargos y usuarios con su rol'],
        ['5. Migración y carga de datos',
         'Importación desde el sistema anterior o archivos Excel y CSV; se valida que no '
         'queden duplicados ni campos incompletos'],
        ['6. Capacitación',
         'Dos jornadas: una para el personal administrativo y otra para docentes y apoderados, '
         'más manual y videos tutoriales'],
        ['7. Puesta en marcha',
         'Período de prueba de 30 días con acompañamiento diario y validación del primer ciclo '
         'completo de calificaciones y boletines'],
        ['8. Operación y soporte',
         'Soporte por correo, mensajería y teléfono en horario de oficina, con respaldos '
         'automáticos diarios'],
        ['9. Seguimiento y mejora',
         'Una vez al mes se revisa el uso, las solicitudes van a la hoja de ruta y se priorizan los ajustes'],
        ['10. Renovación',
         'Suscripción siguiente con descuento por pronto pago y ampliación de módulos o usuarios'],
    ], anchos=[3.3, 9.15], size=11, alto_fila=0.38)
    tf = caja(s, Inches(0.45), Inches(6.15), Inches(12.45), Inches(0.7))
    parrafo(tf, 'Dos etapas deciden el resultado: la 5, la principal barrera de entrada, '
                'y la 7, el período de prueba de 30 días.',
            size=14, bold=True, color=ROJO, first=True, space_after=0)
    notas(s, 'SNEYDER', 'Este es el proceso, de la visita comercial hasta la operación sostenida. '
             'Quiero señalar dos etapas. La 5, la migración: es la principal barrera '
             'de entrada y la primera causa de abandono del servicio. Si importamos '
             'mal los datos, con duplicados o campos incompletos, el colegio pierde '
             'confianza y se va. Por eso la validamos antes de darla por terminada. Y '
             'la 7, la puesta en marcha: activamos un período de prueba de treinta '
             'días con acompañamiento diario y validamos el primer ciclo completo de '
             'calificaciones y boletines. El colegio ve un ciclo académico completo '
             'antes de renovar, así que no paga hasta ver que funciona. Y la etapa 10 '
             'ya está pensada: la renovación se factura al terminar el año, con '
             'descuento por pronto pago.')
    return s


# ------------------------------------------------------------------ 14
def s14_numeros(prs):
    s = nueva_slide(prs)
    titulo(s, 'Costos, ingresos y punto de equilibrio', '16 colegios suscritos')
    tf = caja(s, Inches(0.45), Inches(1.6), Inches(12.45), Inches(0.75))
    parrafo(tf, 'Cada colegio deja $5.270.000 de margen de contribución. Contra $82.435.000 '
                'de costos fijos, el equilibrio cae en 16 colegios suscritos.',
            size=15, color=GRIS, first=True)
    tabla(s, Inches(0.45), Inches(2.35), Inches(6.6), Inches(3.3), [
        ['Colegios', 'Ingreso del año', 'Utilidad'],
        ['14', '$77.700.000', '−$8.655.000'],
        ['15', '$83.250.000', '−$3.385.000'],
        ['16', '$88.800.000', '+$1.885.000'],
        ['17', '$94.350.000', '+$7.155.000'],
        ['18', '$99.900.000', '+$12.425.000'],
        ['19', '$105.450.000', '+$17.695.000'],
        ['20', '$111.000.000', '+$22.965.000'],
    ], anchos=[1.5, 2.3, 2.1], size=12.5, alto_fila=0.4,
        aligns=[CEN, DER, DER])
    t = s.shapes[-1].table
    for ci in range(3):
        c = t.cell(3, ci)
        c.fill.solid()
        c.fill.fore_color.rgb = AZUL_CLARO
        for p in c.text_frame.paragraphs:
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = BLANCO

    panel(s, Inches(7.35), Inches(2.35), Inches(5.55), Inches(1.5),
          'EL RUBRO MÁS RELEVANTE DEL COSTO', [
              'La nómina son $55.800.000 de los $88.035.000 de costos: el 63 %. Es un '
              'desarrollador y un comercial a medio tiempo, más 5 aprendices con un '
              'estipendio de apoyo.',
          ], color=ROJO, size=12.5)
    panel(s, Inches(7.35), Inches(4.0), Inches(5.55), Inches(1.65),
          'EL RIESGO REAL', [
              'El caso base son 20 colegios: solo 4 por encima del equilibrio. Si los 20 '
              'fueran Plan Básico, la utilidad caería a $5.965.000. Por eso la mezcla de '
              'planes no es un supuesto: es una condición del equilibrio.',
          ], color=AZUL, size=12.5)
    pie(s, 'Costos e ingresos estimados: toda cifra del plan es una estimación. '
           'Inversión inicial: $10.945.000.')
    notas(s, 'SANTIAGO', 'Esta es la diapositiva que responde cómo sabemos que el negocio '
             'funciona. Cada colegio deja cinco millones doscientos setenta mil de '
             'margen. Contra ochenta y dos millones cuatrocientos treinta y cinco mil '
             'de costos fijos, el equilibrio cae en dieciséis colegios. En catorce '
             'estamos perdiendo ocho millones; en veinte, que es lo que proyectamos, '
             'ganamos veintitrés. Ahora la parte honesta: proyectamos veinte colegios, '
             'solo cuatro por encima del equilibrio, un margen de seguridad del veinte '
             'por ciento, y es estrecho. Si los veinte fueran del Plan Básico, la '
             'utilidad caería a seis millones. La mezcla de planes no es un supuesto '
             'optimista, es una condición. Y la cifra que más nos van a cuestionar es '
             'la nómina: cincuenta y cinco millones ochocientos mil, el sesenta y tres '
             'por ciento de todos los costos. Preferimos ser prudentes y no pintar el '
             'panorama más bonito de lo que es.')
    return s


# ------------------------------------------------------------------ 15
def s15_dofa(prs):
    s = nueva_slide(prs)
    titulo(s, '5.1  ESTRATEGIA ORGANIZACIONAL', 'Análisis DOFA')
    tabla(s, Inches(0.45), Inches(1.7), Inches(6.1), Inches(2.2), [
        ['Debilidades', 'Fortalezas'],
        ['Producto joven, sin historial de clientes ni referencias',
         'Cobertura completa del ciclo escolar en una sola plataforma'],
        ['Depende de una base de datos y de conexión en el colegio',
         'Cuatro roles con permisos y bitácora de auditoría'],
        ['Sin aplicación móvil nativa: se accede desde el navegador',
         'Arquitectura propia y de código abierto, sin licencias'],
        ['Equipo de cinco personas, sin presupuesto para soporte',
         'Costo operativo bajo: un solo servidor'],
    ], anchos=[3, 3], size=11, alto_fila=0.5)
    tabla(s, Inches(6.9), Inches(1.7), Inches(6.0), Inches(2.2), [
        ['Oportunidades', 'Amenazas'],
        ['Normativa del MEN en cambio permanente',
         'Competencia de sistemas ya instalados y consolidados'],
        ['Bajo nivel de digitalización: aún con libros y planillas',
         'Resistencia al cambio de directivos y docentes'],
        ['Tendencia a boletines en línea y comunicación con apoderados',
         'Cambios normativos exigen desarrollo sin ingreso adicional'],
        ['Posible ampliación a otros países de la región',
         'La licencia de software es de los primeros gastos que se recortan'],
    ], anchos=[3, 3], size=11, alto_fila=0.5)
    panel(s, Inches(0.45), Inches(4.2), Inches(12.45), Inches(2.3),
          'PLAN DE MITIGACIÓN DEL RIESGO PRINCIPAL', [
              'La amenaza real es la resistencia al cambio, no la competencia técnica. Por '
              'eso el plan NO comercializa hasta el mes 6: antes están la capacitación por '
              'rol, el manual, los tutoriales y el piloto con dos colegios. El soporte técnico '
              'cubre la parte técnica y el acompañamiento diario cubre la otra.',
          ], size=15)
    notas(s, 'SNEYDER', 'El DOFA, y quiero ser honesto con las debilidades. La más grande no es '
             'técnica: es que somos un producto joven, sin historial de clientes ni '
             'referencias verificables que presentar. Eso nos va a pesar al pedir la '
             'primera venta. La amenaza más seria tampoco es un competidor: es la '
             'resistencia al cambio de los directivos y la baja competencia digital '
             'del personal administrativo. Por eso el plan no comercializa hasta el '
             'mes seis: primero están la capacitación por rol, el manual, los '
             'tutoriales y el piloto con dos colegios. Y no somos ingenuos con el '
             'presupuesto institucional: la licencia de software es de los primeros '
             'gastos que se recortan.')
    return s


# ------------------------------------------------------------------ 16
def s16_impacto(prs):
    s = nueva_slide(prs)
    titulo(s, '6.1  METAS SOCIALES DEL PROYECTO', 'Impacto')
    panel(s, Inches(0.45), Inches(1.7), Inches(4.0), Inches(4.6), 'ECONÓMICO', [
        '•  $111.000.000 de ingresos y $22.965.000 de utilidad en el primer año',
        '•  2 empleos directos desde el mes 6: un desarrollador y un comercial',
        '•  20 instituciones y cerca de 4.000 estudiantes atendidos en el año 1',
        '•  Ahorro de 40 a 60 horas mensuales de trabajo administrativo por colegio, sin '
        'contratar personal adicional',
    ], size=12)
    panel(s, Inches(4.67), Inches(1.7), Inches(4.0), Inches(4.6), 'SOCIAL', [
        '•  Centraliza y protege la información académica de cerca de 4.000 estudiantes',
        '•  Bitácora de auditoría que deja registro de quién hizo cada cambio y cuándo',
        '•  Reduce los errores en el cálculo de notas al aplicar automáticamente las reglas '
        'del Ministerio',
        '•  El apoderado consulta el rendimiento de su hijo desde cualquier dispositivo',
        '•  Capacita al personal de los colegios en herramientas digitales',
    ], color=VERDE, size=12)
    panel(s, Inches(8.89), Inches(1.7), Inches(4.0), Inches(4.6), 'AMBIENTAL', [
        '•  Boletines y certificados en PDF: unos 3.600 pliegos menos al año por colegio, '
        'cerca de 7 resmas',
        '•  Reduce la impresión de planillas: la consulta y el filtrado se hacen en pantalla',
        '•  El soporte por vía remota disminuye los desplazamientos del equipo a las '
        'instituciones',
        '•  Un solo servidor en la nube: huella de carbono baja',
        '•  Plan de mitigación: doble cara en materiales propios y separación de residuos '
        'electrónicos',
    ], color=AZUL_CLARO, size=12)
    notas(s, 'SNEYDER', 'El impacto en los tres planos que pide la plantilla. Económico: los '
             'números que ya vimos, más el ahorro que genera el cliente: cuarenta a '
             'sesenta horas mensuales de trabajo administrativo por colegio, más de '
             'mil cien horas al año de un auxiliar, sin contratar a nadie más. Social: '
             'se centraliza y protege la información de cuatro mil estudiantes, con '
             'bitácora de quién hizo cada cambio, se reducen los errores de nota '
             'aplicando automáticamente las reglas del Ministerio, y el apoderado deja '
             'de pedirle el cuaderno al hijo. Ambiental: unos tres mil seiscientos '
             'pliegos menos al año por colegio, unas siete resmas, y el soporte por '
             'vía remota nos evita desplazamientos. Nada de esto es decorativo: es lo '
             'que justifica que el proyecto sea más que un software.')
    return s


def s17_cierre(prs):
    s = nueva_slide(prs)
    titulo(s, None, 'Cierre')
    tf = caja(s, Inches(0.45), Inches(1.5), Inches(12.45), Inches(1.6))
    parrafo(tf, 'EasyNotes v2 es un sistema que ya existe, con su plan de negocio:',
            size=20, color=GRIS, first=True, space_after=8)
    parrafo(tf, 'se comercializa como servicio por suscripción, integra lo que estaba en '
                'sistemas separados y aplica las reglas del Ministerio por sí solo.',
            size=20, bold=True, color=AZUL, space_after=0)
    vinetas(s, Inches(0.45), Inches(3.35), Inches(7.4), Inches(2.6), [
        'Mercado con baja digitalización: colegios que aún trabajan con libros y planillas',
        '20 colegios y cerca de 4.000 estudiantes en el año 1',
        '$111 M de ingresos y 20,7 % de margen',
        'Equilibrio en 16 colegios: con la mitad de la meta ya hay utilidad',
        'Sin licencias de software: el costo depende del servicio, no del volumen',
    ], size=15)
    b = s.shapes.add_shape(1, Inches(8.2), Inches(3.3), Inches(4.7), Inches(2.5))
    b.fill.solid(); b.fill.fore_color.rgb = AZUL
    b.line.fill.background(); b.shadow.inherit = False
    tf = b.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = Inches(0.2)
    tf.margin_top = Inches(0.2)
    parrafo(tf, '¿QUÉ NECESITAMOS?', size=13, bold=True, color=BLANCO, first=True,
            space_after=8)
    parrafo(tf, '1. Autorización para el piloto con dos colegios asociados', size=13,
            color=BLANCO, space_after=6)
    parrafo(tf, '2. Acompañamiento del instructor en las visitas comerciales', size=13,
            color=BLANCO, space_after=6)
    parrafo(tf, '3. Validación de los costos y la proyección de ventas del plan', size=13,
            color=BLANCO, space_after=0)
    pie(s, 'EasyNotes v2  ·  Martín Zapata · Sneyder Gómez · Yorman Gómez · '
           'Santiago Sierra · Andrés Avila')
    notas(s, 'YORMAN', 'Para cerrar, la idea en una frase: este sistema ya existía, lo que '
             'hicimos fue demostrar que también puede ser un negocio. Hay mercado, hay '
             'números y hay margen, y el equilibrio está en 16 colegios, así que con '
             'la mitad de la meta de 20 ya estamos en números negros. Terminamos con '
             'lo que pedimos: autorización para arrancar el piloto con dos colegios, '
             'acompañamiento en las visitas comerciales, y que el instructor valide '
             'las cifras financieras, que como dijimos son estimaciones. Gracias.')
    return s
