# -*- coding: utf-8 -*-
"""Genera el guion de exposición en Word a partir de las notas del PPTX.

El documento sale en orden de diapositiva (1 a 17), que es el orden en que se
proyecta, e incluye al inicio la tabla de reparto.

Uso:  python build_guion.py [deck.pptx] [salida.docx]
"""
import re
import sys

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Pt, RGBColor, Cm

PPM = 135
PATRON = re.compile(r'^([A-ZÁÉÍÓÚÑ]+) \((?:(\d+)m )?(\d+)\s*s\)\.\s*(.*)$', re.S)

AZUL = RGBColor(0x1F, 0x4E, 0x79)
GRIS = RGBColor(0x40, 0x40, 0x40)
GRIS_CLARO = RGBColor(0x7F, 0x7F, 0x7F)


def titulo_de(slide):
    """Primer cuadro de texto en negrita y tamaño grande: el título de la slide."""
    mejor = None
    for sh in slide.shapes:
        if not sh.has_text_frame:
            continue
        for p in sh.text_frame.paragraphs:
            for r in p.runs:
                if r.font.size and r.font.size.pt >= 20 and r.text.strip():
                    if mejor is None:
                        mejor = r.text.strip()
    return mejor or ''


def seccion_de(slide):
    """Barra superior azul: el número de sección de la plantilla."""
    for sh in slide.shapes:
        if not sh.has_text_frame:
            continue
        if sh.top is not None and sh.top <= 0 and sh.height is not None \
                and sh.height <= Cm(1.2) and sh.text_frame.text.strip():
            return sh.text_frame.text.strip()
    return ''


def leer(pptx):
    from pptx import Presentation
    prs = Presentation(pptx)
    items = []
    for i, s in enumerate(prs.slides, 1):
        nota = s.notes_slide.notes_text_frame.text.strip()
        m = PATRON.match(nota)
        if not m:
            raise SystemExit(f'diapositiva {i}: la nota no empieza con '
                             f'"NOMBRE (Xm YYs).": {nota[:60]!r}')
        quien, mm, ss, cuerpo = m.group(1), m.group(2), m.group(3), m.group(4).strip()
        seg = (int(mm) * 60 if mm else 0) + int(ss)
        items.append({
            'n': i,
            'seccion': seccion_de(s),
            'titulo': titulo_de(s),
            'quien': quien,
            'seg': seg,
            'cuerpo': cuerpo,
            'pal': len(cuerpo.split()),
        })
    return items


def tiempo(seg):
    return f'{seg // 60} min {seg % 60:02d} s' if seg >= 60 else f'{seg} s'


def p(doc, texto='', size=11, bold=False, italic=False, color=None,
      align=None, space_before=0, space_after=6, left=0, first=False):
    par = doc.add_paragraph()
    if align is not None:
        par.alignment = align
    pf = par.paragraph_format
    pf.space_before = Pt(space_before)
    pf.space_after = Pt(space_after)
    if left:
        pf.left_indent = Cm(left)
    if first:
        pf.first_line_indent = Cm(0.0)
    if texto:
        r = par.add_run(texto)
        r.font.size = Pt(size)
        r.bold = bold
        r.italic = italic
        r.font.name = 'Calibri'
        if color is not None:
            r.font.color.rgb = color
    return par


def main():
    pptx = sys.argv[1] if len(sys.argv) > 1 else 'docs/PLAN DE NEGOCIO - EXPOSICION.pptx'
    salida = sys.argv[2] if len(sys.argv) > 2 else 'docs/GUION DE EXPOSICION.docx'
    items = leer(pptx)

    tot_seg = sum(i['seg'] for i in items)
    tot_pal = sum(i['pal'] for i in items)

    doc = Document()
    est = doc.styles['Normal']
    est.font.name = 'Calibri'
    est.font.size = Pt(11)
    for s in doc.sections:
        s.top_margin = s.bottom_margin = Cm(1.9)
        s.left_margin = s.right_margin = Cm(2.0)

    # ---------------------------------------------------------------- portada
    p(doc, 'GUION DE EXPOSICIÓN', size=20, bold=True, color=AZUL,
      align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    p(doc, 'EasyNotes v2  ·  Plan de negocio', size=13, color=GRIS,
      align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    p(doc, f'{len(items)} diapositivas  ·  {tot_pal} palabras  ·  '
           f'{tiempo(tot_seg)} de exposición a {PPM} palabras por minuto',
      size=10, color=GRIS_CLARO, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=14)

    # ------------------------------------------------------------- reparto
    p(doc, '1. Reparto', size=14, bold=True, color=AZUL, space_before=6, space_after=6)

    por_persona = {}
    orden = []
    for i in items:
        if i['quien'] not in por_persona:
            por_persona[i['quien']] = {'slides': [], 'seg': 0, 'pal': 0}
            orden.append(i['quien'])
        d = por_persona[i['quien']]
        d['slides'].append(i['n'])
        d['seg'] += i['seg']
        d['pal'] += i['pal']

    t = doc.add_table(rows=1, cols=5)
    t.style = 'Light Grid Accent 1'
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    cab = ['Orador', 'Diapositivas', 'Guion', 'Tiempo', '% del total']
    for c, txt in enumerate(cab):
        celda = t.rows[0].cells[c]
        celda.text = ''
        r = celda.paragraphs[0].add_run(txt)
        r.bold = True
        r.font.size = Pt(10)
    for q in orden:
        d = por_persona[q]
        fila = t.add_row().cells
        for c, txt in enumerate([q, ', '.join(map(str, d['slides'])),
                                 f'{d["pal"]} palabras', tiempo(d['seg']),
                                 f'{d["seg"] / tot_seg * 100:.1f} %']):
            fila[c].text = ''
            r = fila[c].paragraphs[0].add_run(txt)
            r.font.size = Pt(10)
    fila = t.add_row().cells
    for c, txt in enumerate(['TOTAL', f'1 a {len(items)}', f'{tot_pal} palabras',
                             tiempo(tot_seg), '100 %']):
        fila[c].text = ''
        r = fila[c].paragraphs[0].add_run(txt)
        r.bold = True
        r.font.size = Pt(10)

    p(doc, '', space_after=8)
    p(doc, 'El reparto sigue los cargos del plan: el gerente define la estrategia y '
           'los precios, ventas presenta el mercado y los canales, el área financiera '
           'la economía unitaria y la proyección, y el área operativa la ficha técnica, '
           'el cronograma, la implementación y el análisis de DOFA.',
      size=10, color=GRIS, space_after=4)

    # ------------------------------------------------------------- orden
    p(doc, '2. Orden de la exposición', size=14, bold=True, color=AZUL,
      space_before=10, space_after=6)

    t2 = doc.add_table(rows=1, cols=5)
    t2.style = 'Light Grid Accent 1'
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    for c, txt in enumerate(['#', 'Sección de la plantilla', 'Diapositiva',
                             'Orador', 'Tiempo']):
        celda = t2.rows[0].cells[c]
        celda.text = ''
        r = celda.paragraphs[0].add_run(txt)
        r.bold = True
        r.font.size = Pt(10)
    for i in items:
        fila = t2.add_row().cells
        vals = [str(i['n']), i['seccion'] or '—', i['titulo'], i['quien'],
                tiempo(i['seg'])]
        for c, txt in enumerate(vals):
            fila[c].text = ''
            r = fila[c].paragraphs[0].add_run(txt)
            r.font.size = Pt(10)

    # ------------------------------------------------------------- guiones
    doc.add_page_break()
    p(doc, '3. Guiones', size=14, bold=True, color=AZUL, space_after=4)
    p(doc, 'El texto de cada diapositiva es el que hay que leer. Entre paréntesis '
           'está el tiempo real de esa diapositiva, calculado sobre el texto.',
      size=10, italic=True, color=GRIS, space_after=10)

    actual = None
    for i in items:
        if i['quien'] != actual:
            actual = i['quien']
            p(doc, f'  {actual}', size=12, bold=True, color=AZUL,
              space_before=10, space_after=4)
        p(doc, f'Diapositiva {i["n"]} — {i["titulo"]}   ({tiempo(i["seg"])})',
          size=11, bold=True, color=GRIS, space_before=6, space_after=2)
        p(doc, i['cuerpo'], size=11, left=0.6, space_after=8, align=WD_ALIGN_PARAGRAPH.JUSTIFY)

    doc.add_paragraph()
    p(doc, 'Fin del guion. Duración total estimada: ' + tiempo(tot_seg) + '.',
      size=10, italic=True, color=GRIS_CLARO, align=WD_ALIGN_PARAGRAPH.CENTER)

    doc.save(salida)
    print('escrito:', salida)
    print(f'{len(items)} diapositivas, {tot_pal} palabras, {tiempo(tot_seg)}')


if __name__ == '__main__':
    main()
