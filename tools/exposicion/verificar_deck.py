# -*- coding: utf-8 -*-
"""Verificacion del deck contra el documento del plan de negocio.

Comprueba:
  1. Que ningun termino del deck sea ajeno al documento (atrapa inventos como OTTAGE)
  2. Que ninguna forma se pase del lienzo
  3. Que las tablas quepan en la diapositiva
  4. Que las cifras clave del deck existan en el documento
  5. Que las diapositivas tengan notas del orador

Uso: python verificar_deck.py
"""

import re
import subprocess
import sys
from pptx import Presentation

PPTX = ('/home/lenovot440/Escritorio/easynots-modelos/docs/'
        'PLAN DE NEGOCIO - EXPOSICION.pptx')
DOC = ('/home/lenovot440/Escritorio/easynots-modelos/docs/'
       'PLAN DE NEGOCIO BÁSICO 2026 - EasyNotes v2 (dilenciado).pdf')

# Andamiaje de la presentacion: palabras que no tienen que estar en el documento
# porque son titulos de diapositiva, conectores de discurso o rotulos de tabla.
ANDAMIAJE = {
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'que', 'para',
    'con', 'por', 'en', 'y', 'o', 'si', 'no', 'es', 'son', 'este', 'esta', 'se', 'su',
    'sus', 'como', 'más', 'menos', 'todo', 'toda', 'todos', 'todas', 'cada', 'al',
    'le', 'lo', 'nos', 'ya', 'año', 'años', 'colegio', 'colegios', 'plan', 'hola',
    'gracias', 'ustedes', 'pregunta', 'preguntas', 'respuesta', 'tiempo', 'parte',
    'equipo', 'siguiente', 'anterior', 'número', 'cifra', 'cifras', 'día', 'días',
    'vez', 'veces', 'forma', 'formas', 'punto', 'puntos', 'idea', 'cosas', 'gente',
    'mejor', 'queda', 'hace', 'viene', 'dar', 'sirve', 'pasa', 'casi', 'apenas',
    'solo', 'mismo', 'misma', 'nada', 'nadie', 'nunca', 'siempre', 'ahora', 'después',
    'antes', 'luego', 'bien', 'mal', 'tanto', 'muy', 'tan', 'poco', 'bastante',
    'medio', 'mitad', 'cinco', 'cuatro', 'tres', 'dos', 'uno', 'veinte', 'unidad',
    'unitaria', 'economia', 'equilibrio', 'contribucion', 'rector', 'directivos',
    # Roles de la audiencia y del sector: no son afirmaciones sobre el proyecto.
    'instructor', 'profesor', 'coordinador', 'secretaria', 'acudiente',
    'aprendiz', 'aprendices', 'docente', 'estudiante', 'padre', 'madre',
    # Pedidos del cierre: son peticiones al instructor, no afirmaciones del plan,
    # asi que por naturaleza no aparecen en el documento.
    'autorizacion', 'autorización', 'acompañamiento', 'validación', 'apoyo',
    'necesitamos',
    # Verbos auxiliares y三代: son función del español, no afirmaciones del plan.
    'puede', 'pueden', 'podemos', 'podrá', 'sena',
    'usted', 'paso', 'siguiente', 'atención', 'atencion', 'reparto', 'cierre',
}

# Nombres propios de los aprendices y del producto: validos aunque el documento
# los exprese con tildes que la normalizacion podria perder.
PROPIOS = ['martin', 'sneyder', 'yorman', 'santiago', 'andres', 'zapata', 'gomez',
           'avila', 'sierra', 'easynotes']

fallos = []


def fallo(msg):
    fallos.append(msg)
    print('  FALLA  ' + msg)


def ok(msg):
    print('  OK     ' + msg)


def norm(s):
    return re.sub(r'[^a-z0-9]', '', s.lower())


def texto_del_pdf(ruta):
    r = subprocess.run(['pdftotext', '-layout', ruta, '-'],
                       capture_output=True, text=True)
    return r.stdout


def main():
    doc_txt = texto_del_pdf(DOC)
    doc_norm = norm(doc_txt)
    doc_palabras = {w.lower() for w in re.findall(r'[A-Za-zÁÉÍÓÚÑáéíóúñ]{4,}', doc_txt)}
    doc_palabras |= {w[:-1] for w in doc_palabras if w.endswith('s')}

    prs = Presentation(PPTX)
    inch = lambda v: v / 914400
    SW, SH = prs.slide_width, prs.slide_height
    n_slides = len(prs.slides._sldIdLst)

    # ---------------------------------------------------------------- 1
    print('=' * 70)
    print('1) TERMINOS DEL DECK QUE NO EXISTEN EN EL DOCUMENTO')
    print('=' * 70)
    textos = []
    for i, s in enumerate(prs.slides, 1):
        for sh in s.shapes:
            if sh.has_text_frame and sh.text_frame.text.strip():
                textos.append((i, sh.text_frame.text))
            if sh.has_table:
                for r in sh.table.rows:
                    for c in r.cells:
                        if c.text.strip():
                            textos.append((i, c.text))

    léxicos = []
    for i, txt in textos:
        for w in re.findall(r'[A-Za-zÁÉÍÓÚÑáéíóúñ]{4,}', txt):
            lw = w.lower()
            if lw in ANDAMIAJE or (lw.endswith('s') and lw[:-1] in ANDAMIAJE):
                continue
            if lw in doc_palabras or (lw.endswith('s') and lw[:-1] in doc_palabras):
                continue
            if norm(lw) in doc_norm:
                continue
            if lw in PROPIOS or norm(lw) in [norm(p) for p in PROPIOS]:
                continue
            léxicos.append((i, w))
    if léxicos:
        for i, w in sorted(set(léxicos)):
            fallo(f'diapositiva {i}: "{w}" no existe en el documento')
    else:
        ok('ningún término del deck es ajeno al documento')

    # ---------------------------------------------------------------- 2
    print()
    print('=' * 70)
    print('2) GEOMETRIA DE LAS FORMAS')
    print('=' * 70)
    fuera = 0
    for i, s in enumerate(prs.slides, 1):
        for sh in s.shapes:
            if sh.left is None:
                continue
            r, b = sh.left + sh.width, sh.top + sh.height
            if sh.left < 0 or sh.top < 0 or r > SW or b > SH:
                fallo(f'diapositiva {i}: forma fuera del lienzo '
                      f'(derecha {inch(r):.2f}in, abajo {inch(b):.2f}in)')
                fuera += 1
    if not fuera:
        ok('todas las formas caben en 13.33 x 7.5 in')

    # ---------------------------------------------------------------- 3
    print()
    print('=' * 70)
    print('3) ALTURA DE LAS TABLAS')
    print('=' * 70)
    overflow = 0
    for i, s in enumerate(prs.slides, 1):
        for sh in s.shapes:
            if not sh.has_table:
                continue
            t = sh.table
            top, h = inch(sh.top), 0.0
            for row in t.rows:
                fs = max([r.font.size.pt for c in row.cells
                          for p in c.text_frame.paragraphs for r in p.runs
                          if r.font.size] or [12])
                need = 1
                for ci, c in enumerate(row.cells):
                    ancho = inch(t.columns[ci].width)
                    chars = max(4, int((ancho - 0.14) * 144.0 / fs))
                    need = max(need, -(-len(c.text) // chars))
                h += max(inch(row.height), need * fs * 1.25 / 72.0 + 0.08)
            if top + h > 7.05:
                fallo(f'diapositiva {i}: tabla de {len(t.rows)} filas alcanza '
                      f'{top + h:.2f}in y el limite es 7.05in')
                overflow += 1
    if not overflow:
        ok('todas las tablas caben en la diapositiva')

    # ---------------------------------------------------------------- 4
    print()
    print('=' * 70)
    print('4) CIFRAS CLAVE DEL DECK PRESENTES EN EL DOCUMENTO')
    print('=' * 70)
    clave = ['111.000.000', '88.035.000', '22.965.000', '10.945.000', '55.800.000',
             '15.690.000', '5.600.000', '41.000.000', '70.000.000', '3.500.000',
             '1.200.000', '2.600.000', '4.800.000', '280.000', '5.270.000',
             '82.435.000', '4.700.000', '4.420.000', '920.000', '20,7']
    faltan = [c for c in clave if c not in doc_txt]
    for f in faltan:
        fallo(f'la cifra {f} aparece en el deck pero no en el documento')
    if not faltan:
        ok(f'las {len(clave)} cifras clave del deck están en el documento')

    # ---------------------------------------------------------------- 5
    print()
    print('=' * 70)
    print('5) NOTAS DEL ORADOR')
    print('=' * 70)
    sin = [i for i, s in enumerate(prs.slides, 1)
           if not s.has_notes_slide
           or not s.notes_slide.notes_text_frame.text.strip()]
    if sin:
        fallo(f'diapositivas sin guion: {sin}')
    else:
        total = sum(len(s.notes_slide.notes_text_frame.text.split()) for s in prs.slides)
        ok(f'las {n_slides} diapositivas tienen guion: {total} palabras, '
           f'~{round(total / 135)} min a 135 palabras/min')

    # ---------------------------------------------------------------- 6
    print()
    print('=' * 70)
    print('6) INTEGRIDAD DEL TEXTO (DIAPOSITIVAS Y NOTAS)')
    print('=' * 70)
    # Caracteres admitidos: espás +punctuación típica de un deck en español.
    admitidos = set(
        u'\u00c0\u00c1\u00c2\u00c3\u00c4\u00c5\u00c6\u00c7\u00c8\u00c9\u00ca\u00cb\u00cc\u00cd'
        u'\u00ce\u00cf\u00d1\u00d2\u00d3\u00d4\u00d5\u00d6\u00d7\u00d8\u00d9\u00da\u00db\u00dc'
        u'\u00dd\u00de\u00df'
        u'\u00e0\u00e1\u00e2\u00e3\u00e4\u00e5\u00e6\u00e7\u00e8\u00e9\u00ea\u00eb\u00ec\u00ed'
        u'\u00ee\u00ef\u00f1\u00f2\u00f3\u00f4\u00f5\u00f6\u00f7\u00f8\u00f9\u00fa\u00fb\u00fc'
        u'\u00fd\u00ff\u00bf'
        u'\u00ab\u00bb\u00b7\u2013\u2014\u2018\u2019\u201c\u201d\u2026\u2022\u00a1\u00bf\u2212'
    )

    def texto_de(i, s, con_notas):
        partes = []
        for sh in s.shapes:
            if sh.has_text_frame and sh.text_frame.text.strip():
                partes.append(sh.text_frame.text)
            if sh.has_table:
                for r in sh.table.rows:
                    for c in r.cells:
                        if c.text.strip():
                            partes.append(c.text)
        if con_notas and s.has_notes_slide:
            partes.append(s.notes_slide.notes_text_frame.text)
        return ' '.join(partes)

    Sospechosos = 0
    for i, s in enumerate(prs.slides, 1):
        for donde, txt in (('diapositiva', texto_de(i, s, False)),
                           ('notas', texto_de(i, s, True))):
            malos = sorted({c for c in txt if ord(c) > 127 and c not in admitidos})
            if malos:
                Sospechosos += 1
                fallo(u'diapositiva %d (%s): caracteres corruptos %s'
                      % (i, donde, ' '.join('%s(U+%04X)' % (c, ord(c)) for c in malos)))
    if not Sospechosos:
        ok('sin caracteres corruptos en diapositivas ni en notas del orador')

    print()
    print('=' * 70)
    print('RESULTADO: ' + ('TODO CORRECTO' if not fallos else f'{len(fallos)} FALLAS'))
    print('=' * 70)
    return 1 if fallos else 0


if __name__ == '__main__':
    sys.exit(main())
