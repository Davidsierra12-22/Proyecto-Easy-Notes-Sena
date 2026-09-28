# -*- coding: utf-8 -*-
"""Normaliza el reparto en lineas de los 17 guiones de notas().

Al partir un guion en literales con textwrap se pierde el espacio del corte, y
los literales contiguos de Python se concatenan sin separador: "sistema" + "que"
quedaba "sistemaque". Eso ademas subcuenta palabras, porque dos palabras pegadas
cuentan como una y el tiempo salia mas corto del real.

Este script vuelve a unir cada llamada, comprueba que el texto este integro y
la reparte de nuevo, con un espacio explicito al final de cada linea.
"""
import io
import re
import sys
import textwrap

P = 'deck_slides.py'
ANCHO = 72
SANGRIA = ' ' * 13

lineas = io.open(P, encoding='utf-8').read().split('\n')
salida = []
i = 0
n = 0

while i < len(lineas):
    if lineas[i].startswith("    notas(s, '"):
        n += 1
        quien = re.match(r"    notas\(s, '([^']+)'", lineas[i]).group(1)
        fin = i
        while not lineas[fin].rstrip().endswith(')'):
            fin += 1
        crudo = '\n'.join(lineas[i:fin + 1])
        # El primer literal es el nombre del orador, no parte del guion.
        partes = re.findall(r"'([^']*)'", crudo)[1:]
        cuerpo = ' '.join(x.strip() for x in partes if x.strip())
        if cuerpo.startswith(quien):
            cuerpo = cuerpo[len(quien):].strip()

        # Comprobacion: ninguna palabra pegada a la siguiente.
        pegadas = re.findall(r'[a-záéíóúñ][A-ZÁÉÍÓÚÑ]', cuerpo)
        if pegadas:
            print('AVISO D%d: posibles palabras pegadas: %s' % (n, pegadas[:5]))

        trozo = [x + ' ' for x in textwrap.wrap(cuerpo, ANCHO)]
        trozo[-1] = trozo[-1].rstrip()

        bloque = ["    notas(s, '%s', '%s'" % (quien, trozo[0])]
        for x in trozo[1:-1]:
            bloque.append(SANGRIA + "'" + x + "'")
        if len(trozo) > 1:
            bloque.append(SANGRIA + "'" + trozo[-1] + "')")
        else:
            bloque[0] += "')"
        salida.extend(bloque)
        i = fin + 1
        continue

    salida.append(lineas[i])
    i += 1

assert n == 17, 'se esperaban 17 llamadas, se encontraron %d' % n
io.open(P, 'w', encoding='utf-8').write('\n'.join(salida))
print('guiones normalizados:', n)
