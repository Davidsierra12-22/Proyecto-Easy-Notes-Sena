# -*- coding: utf-8 -*-
"""Utilidades para editar el plan de negocio replicando el formato de la plantilla SENA.

Formato verificado sobre el documento diligenciado:
  - Encabezado de tabla : Arial 8pt (sz 16), negrita, sombreado D9D9D9, borde single sz 4
  - Cuerpo de tabla     : Arial 8pt (sz 16), borde single sz 4
  - Subtitulo de bloque : Arial 9pt (sz 18), negrita, spacing before 120 after 0
  - Parrafo de prosa    : Arial 9pt (sz 18), justificado, spacing before 0 after 60
  - Tabla               : ancho 5000 pct, centrada, layout fijo, margenes de celda 70 dxa
  - Ancho util de la caja: 10080 dxa
"""

import copy
from lxml import etree

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
NS = ('xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"')
ANCHO_UTIL = 10080


def _q(tag):
    return f'{W}{tag}'


def _el(xml):
    return etree.fromstring(f'<w:wrap {NS}>{xml}</w:wrap>')[0]


def _borders():
    return ('<w:tcBorders>'
            '<w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
            '<w:start w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
            '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
            '<w:end w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
            '</w:tcBorders>')


def _run(texto, sz=16, bold=False):
    b = '<w:b/>' if bold else '<w:b w:val="false"/>'
    return (f'<w:r><w:rPr><w:rFonts w:cs="Arial" w:ascii="Arial" w:hAnsi="Arial"/>'
            f'{b}<w:i w:val="false"/><w:sz w:val="{sz}"/></w:rPr>'
            f'<w:t xml:space="preserve">{texto}</w:t></w:r>')


def _celda(texto, ancho, bold=False, header=False, align=None, sz=16):
    jc = f'<w:jc w:val="{align}"/>' if align else ''
    shd = '<w:shd w:fill="D9D9D9" w:val="clear"/>' if header else ''
    return (f'<w:tc><w:tcPr><w:tcW w:w="{ancho}" w:type="dxa"/>{_borders()}{shd}</w:tcPr>'
            f'<w:p><w:pPr><w:pStyle w:val="Normal"/>'
            f'<w:spacing w:before="0" w:after="20"/>{jc}'
            f'<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>'
            f'{"<w:b/>" if bold else "<w:b w:val=\"false\"/>"}'
            f'<w:i w:val="false"/><w:sz w:val="{sz}"/></w:rPr></w:pPr>'
            f'{_run(texto, sz, bold)}</w:p></w:tc>')


def tabla(datos, anchos, aligns=None, sz=16, header=True, total_row=False):
    """Construye un elemento <w:tbl> con el formato de las tablas del documento.

    datos  : lista de filas (la primera es encabezado si header=True)
    anchos : lista de anchos en dxa, deben sumar 10080
    aligns : lista opcional de 'left'|'center'|'right' por columna
    """
    assert sum(anchos) == ANCHO_UTIL, f"los anchos suman {sum(anchos)}, se exige {ANCHO_UTIL}"
    aligns = aligns or [None] * len(anchos)
    grid = ''.join(f'<w:gridCol w:w="{a}"/>' for a in anchos)
    rows = []
    for ri, fila in enumerate(datos):
        es_header = header and ri == 0
        es_total = total_row and ri == len(datos) - 1
        celdas = []
        for ci, val in enumerate(fila):
            al = aligns[ci]
            if al is None:
                al = 'right' if ri > 0 and _es_numero(val) else None
            celdas.append(_celda(str(val), anchos[ci], bold=es_header or es_total,
                                 header=es_header, align=al, sz=sz))
        trpr = '<w:trPr><w:tblHeader/></w:trPr>' if es_header else ''
        rows.append(f'<w:tr>{trpr}{"".join(celdas)}</w:tr>')
    return _el(
        '<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:jc w:val="center"/>'
        '<w:tblInd w:w="0" w:type="dxa"/><w:tblLayout w:type="fixed"/>'
        '<w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:start w:w="70" w:type="dxa"/>'
        '<w:bottom w:w="0" w:type="dxa"/><w:end w:w="70" w:type="dxa"/></w:tblCellMar>'
        '</w:tblPr>'
        f'<w:tblGrid>{grid}</w:tblGrid>{"".join(rows)}</w:tbl>')


def _es_numero(v):
    v = str(v).strip()
    if not v:
        return False
    return v[0] in '$-+−0123456789'


def subtitulo(texto):
    """Subtitulo de bloque: 9pt negrita, antes 120 despues 0."""
    return _el(
        '<w:p><w:pPr><w:pStyle w:val="Normal"/>'
        '<w:spacing w:before="120" w:after="0"/><w:jc w:val="both"/>'
        '<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/>'
        '<w:i w:val="false"/><w:sz w:val="18"/></w:rPr></w:pPr>'
        f'{_run(texto, 18, True)}</w:p>')


def parrafo(texto, sz=18, bold=False, before=0, after=60, jc='both'):
    """Parrafo de prosa: 9pt, justificado."""
    return _el(
        f'<w:p><w:pPr><w:pStyle w:val="Normal"/>'
        f'<w:spacing w:before="{before}" w:after="{after}"/>'
        f'<w:jc w:val="{jc}"/>'
        f'<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>'
        f'{"<w:b/>" if bold else "<w:b w:val=\"false\"/>"}'
        f'<w:i w:val="false"/><w:sz w:val="{sz}"/></w:rPr></w:pPr>'
        f'{_run(texto, sz, bold)}</w:p>')


def parrafos_de(celda):
    """Devuelve los elementos <w:p> hijos directos de una celda."""
    return [ch for ch in celda._tc.iterchildren() if ch.tag == _q('p')]


def tablas_de(celda):
    return [ch for ch in celda._tc.iterchildren() if ch.tag == _q('tbl')]


def texto_de_parrafo(p):
    return ''.join(t.text or '' for t in p.iter(_q('t')))


def buscar(celda, texto_inicio):
    """Localiza el parrafo de la celda que empieza con texto_inicio."""
    for p in parrafos_de(celda):
        if texto_de_parrafo(p).strip().startswith(texto_inicio):
            return p
    raise LookupError(f'no se encontro parrafo que empiece con: {texto_inicio!r}')


def insertar_antes(ancla, *nuevos):
    for n in nuevos:
        ancla.addprevious(n)


def insertar_despues(ancla, *nuevos):
    ref = ancla
    for n in nuevos:
        ref.addnext(n)
        ref = n
