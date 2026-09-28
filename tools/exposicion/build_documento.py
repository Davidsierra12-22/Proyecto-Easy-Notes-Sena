# -*- coding: utf-8 -*-
"""Aplica al plan de negocio las tres adiciones de la economia unitaria.

  1. Ficha economica de UN colegio (seccion 3.4.4, caja de proyeccion de ventas)
  2. Desglose del costo variable de $280.000 por colegio (seccion 4)
  3. Tabla de punto de equilibrio (seccion 4)

Uso:  python build_documento.py base.docx salida.docx
"""

import sys
from docx import Document
from docx_tools import _q
from docx_tools import (tabla, subtitulo, parrafo, buscar, insertar_antes,
                        insertar_despues, texto_de_parrafo, ANCHO_UTIL)

# ------------------------------------------------------------------ datos
PLAN_BASICO = 1_200_000
IMPLEMENTACION = 3_500_000
COSTO_VARIABLE = 280_000
SUSCRIPCION_TOTAL = 41_000_000
IMPLETACION_TOTAL = 70_000_000
INGRESO_TOTAL = 111_000_000
COSTO_TOTAL = 88_035_000
UTILIDAD = 22_965_000
N_CLIENTES = 20
COSTOS_FIJOS = 82_435_000
INGRESO_PROMEDIO = INGRESO_TOTAL // N_CLIENTES          # 5.550.000
CONTRIBUCION = INGRESO_PROMEDIO - COSTO_VARIABLE          # 5.270.000
ALUMNOS = 300

# ------------------------------------------------------------------ tablas
T_FICHA = [
    ['Concepto', 'Año 1', 'Año 2 en adelante'],
    ['Suscripción anual', '1.200.000', '1.200.000'],
    ['Implementación y migración de datos (pago único)', '3.500.000', '0'],
    ['Ingreso total por un colegio', '4.700.000', '1.200.000'],
    ['Costo variable de atender un colegio', '−280.000', '−280.000'],
    ['Margen de contribución por colegio', '4.420.000', '920.000'],
    ['Margen sobre el ingreso', '94,0 %', '76,7 %'],
    ['Precio medio por alumno al mes (300 alumnos)', '1.306', '333'],
    ['Costo variable por alumno al mes (300 alumnos)', '78', '333'],
]

T_COSTO_VAR = [
    ['Concepto', 'Valor anual', 'Base del cálculo'],
    ['Facturación electrónica ante la DIAN y recordatorios de pago', '72.000', '6.000 al mes'],
    ['Soporte técnico (tiempo del equipo asignado)', '96.000', '40 horas al año'],
    ['Almacenamiento de boletines, certificados y documentos', '48.000', '4.000 al mes'],
    ['Herramientas de soporte, mensajería y monitoreo', '36.000', '3.000 al mes'],
    ['Servicios de pago en línea y conciliación bancaria', '19.000', 'estimación del año'],
    ['Dominio .com y certificado SSL (prorrateado)', '9.000', '180.000 entre 20 colegios'],
    ['Costo variable total de un colegio', '280.000', '5.600.000 entre 20 colegios'],
]

_filas_eq = []
for n in range(14, 21):
    ingreso = INGRESO_PROMEDIO * n
    utilidad = ingreso - COSTO_VARIABLE * n - COSTOS_FIJOS
    signo = '+' if utilidad >= 0 else '−'
    _filas_eq.append([str(n), f'{ingreso:,}'.replace(',', '.'),
                      f'{signo}{abs(utilidad):,}'.replace(',', '.')])

T_EQUILIBRIO = [
    ['Colegios suscritos', 'Ingreso total del año', 'Utilidad estimada'],
] + _filas_eq


def economically_agrega_unidad(celda):
    """1. Ficha economica de un colegio, antes de 'Proyeccion de ventas del primer ano'."""
    ancla = buscar(celda, 'Proyección de ventas del primer año')
    nuevos = [
        subtitulo('Economía unitaria de un colegio'),
        parrafo('Toda la proyección de este plan se construye a partir de una única '
                'unidad de venta: un colegio. Los valores que siguen corresponden al '
                'Plan Básico, que es el de mayor volumen de la mezcla (11 de los 20 '
                'colegios del año 1) y el más representativo del mercado objetivo.'),
        tabla(T_FICHA, [4980, 2550, 2550], aligns=[None, 'right', 'right']),
        parrafo('El costo que asume el colegio se expresa mejor por alumno: un Plan '
                'Básico con 300 alumnos cuesta $4.000 al año por alumno, es decir $333 '
                'al mes. Durante el primer año, con la implementación incluida, el costo '
                'por alumno sube a $15.667 al año. La comparación relevante es que ese '
                'valor equivale a uno o dos meses del salario de un auxiliar '
                'administrativo, y el sistema libera entre 40 y 60 horas mensuales de '
                'trabajo de secretaría.'),
        parrafo('El punto más importante de esta tabla es la diferencia entre las dos '
                'columnas. El margen de contribución de un colegio cae de $4.420.000 '
                'en el año 1 a $920.000 en el año 2, porque la implementación se cobra '
                'una sola vez. Es decir, casi tres cuartas partes del ingreso del primer '
                'año (74 %) se concentran en ese primer contrato. Por eso la '
                'continuidad del plan '
                'depende tanto de cerrar colegios nuevos cada año como de retener los ya '
                'suscritos.'),
    ]
    insertar_antes(ancla, *nuevos)


def derivar_proyeccion_de_la_unidad(celda):
    """Reescribe el cierre de la proyeccion para que se lea como 20 veces la unidad."""
    for texto, nuevo in [
        ('Durante el primer año se proyectan 20 instituciones suscritas y 20 '
         'implementaciones ejecutadas, para un total de 40 unidades de servicio. La '
         'distribución de la mezcla de planes es de 11 colegios en Plan Básico, 7 en '
         'Plan Intermedio y 2 en Plan Superior.',
         'La proyección del año se obtiene multiplicando la unidad económica por el '
         'número de clientes: 20 colegios, de los cuales 11 son Plan Básico, 7 son '
         'Plan Intermedio y 2 son Plan Superior, con 20 implementaciones ejecutadas, '
         'para un total de 40 unidades de servicio.'),
        ('La proyección es conservadora en el número de clientes y exigente en el '
         'valor: no se cuenta con renovaciones del año 2, ni con clientes de países '
         'vecinos, ni con módulos adicionales. El primer trimestre se considera de '
         'prueba y por eso no se proyecta ningún cierre.',
         'La proyección es conservadora en el número de clientes y exigente en el '
         'valor: no se cuenta con renovaciones del año 2, ni con clientes de países '
         'vecinos, ni con módulos adicionales. El primer trimestre se considera de '
         'prueba y por eso no se proyecta ningún cierre. La sensibilidad de esta '
         'proyección se analiza en la estructura de costos del primer año.'),
    ]:
        p = buscar(celda, texto[:48])
        for t in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
            t.text = nuevo
            break
        for t in list(p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'))[1:]:
            t.getparent().getparent().remove(t.getparent())


def agrega_desglose_costo_variable(celda):
    """2. Desglose de los $280.000, antes de la tabla de inversion inicial."""
    tablas = [t for t in celda._tc.iterchildren()
              if t.tag == '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tbl']
    ancla_tabla = tablas[0]
    ancla_tabla.addprevious(parrafo(
        'El costo variable de $280.000 por colegio equivale a $5.600.000 anuales para '
        'los 20 clientes, y es la cifra que sostiene el margen de la tabla anterior. '
        'Se desglosa a continuación para que pueda verificarse. No incluye el servidor '
        'en la nube, que ya está presupuestado dentro de la inversión inicial, ni la '
        'nómina del equipo, que es un costo fijo. Los rubros de facturación electrónica '
        'y de servicios de pago son estimaciones, construidas a partir de tarifas de '
        'mercado, y se actualizarán con la facturación real de los primeros clientes.'))
    ancla_tabla.addprevious(subtitulo('Desglose del costo variable de un colegio'))
    ancla_tabla.addprevious(tabla(T_COSTO_VAR, [5180, 1700, 3200], aligns=[None, 'right', None], total_row=True))


def agrega_punto_de_equilibrio(celda):
    """3. Punto de equilibrio, despues de la utilidad estimada."""
    tablas = [t for t in celda._tc.iterchildren() if t.tag == _q('tbl')]
    ancla = tablas[-1]          # despues de la tabla de inversion inicial
    nuevos = [
        parrafo('Para leer estas cifras conviene hacerlo colegio por colegio. El ingreso '
                'promedio por cliente, con la mezcla de planes del año 1, es de '
                '$5.550.000, y el costo variable de atenderlo es de $280.000; por lo '
                'tanto cada colegio deja un margen de contribución de $5.270.000. '
                'Contra unos costos fijos de $82.435.000 (nómina de $55.800.000, mezcla '
                'de mercado de $15.690.000 e inversión inicial de $10.945.000), el '
                'punto de equilibrio del proyecto es de 16 colegios suscritos.'),
        tabla(T_EQUILIBRIO, [3380, 3350, 3350], aligns=['center', 'right', 'right']),
        parrafo('La proyección de 20 colegios queda por encima del equilibrio, con un '
                'margen de seguridad de cuatro clientes, es decir del 20 %. Es un margen '
                'estrecho y por eso el plan pone tanto peso en la retención: cada '
                'renovación conserva $920.000 de margen sin esfuerzo comercial '
                'adicional.'),
        parrafo('Adicionalmente, el resultado depende de la mezcla de planes. Si los 20 '
                'colegios fueran del Plan Básico, la utilidad caería a $5.965.000, '
                'porque el Plan Superior aporta $3.600.000 más de margen por colegio: '
                '$4.520.000 frente a los $920.000 del Plan Básico. Por eso los siete '
                'colegios Intermedios y los dos Superiores no son un supuesto '
                'optimista, sino una condición del equilibrio.'),
    ]
    insertar_despues(ancla, *nuevos)


def main():
    src, dst = sys.argv[1], sys.argv[2]
    doc = Document(src)
    proyeccion = doc.tables[11].cell(0, 0)
    costos = doc.tables[12].cell(0, 0)

    economically_agrega_unidad(proyeccion)
    derivar_proyeccion_de_la_unidad(proyeccion)
    agrega_desglose_costo_variable(costos)
    agrega_punto_de_equilibrio(costos)

    doc.save(dst)
    print('escrito:', dst)


if __name__ == '__main__':
    main()
