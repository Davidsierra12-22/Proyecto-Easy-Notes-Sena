import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RefreshCw, Save, Search, Plus, Pencil, Trash2 } from 'lucide-react'
import {
  TextField, Select, MenuItem, Button, IconButton, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions,
  ToggleButton, ToggleButtonGroup, CircularProgress
} from '@mui/material'
import api from '../services/api.service'
import { useAuth } from '../store/Auth'
import { useSede } from '../store/General'
import { notificar } from '../store/notificacionStore'
import ConfirmDialog from '../components/ConfirmDialog'

const ESCALA_DEFECTO = [
  { orden: 1, valor: 'Superior', rangoMin: 4.6, rangoMax: 5.0 },
  { orden: 2, valor: 'Alto', rangoMin: 4.0, rangoMax: 4.5 },
  { orden: 3, valor: 'Básico', rangoMin: 3.0, rangoMax: 3.9 },
  { orden: 4, valor: 'Bajo', rangoMin: 1.0, rangoMax: 2.9 }
]

const COLORES_ESCALA = {
  Superior: 'bg-emerald-100 text-emerald-700',
  Alto: 'bg-sky-100 text-sky-700',
  Básico: 'bg-amber-100 text-amber-700',
  Bajo: 'bg-red-100 text-red-700'
}

const TIPOS = [
  { value: 'tarea', label: 'Tarea' },
  { value: 'examen', label: 'Examen' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'proyecto', label: 'Proyecto' },
  { value: 'participacion', label: 'Participación' },
  { value: 'otro', label: 'Otro' }
]

const desempeno = (n, niveles) => {
  if (n == null || isNaN(n)) return null
  const escala = (Array.isArray(niveles) && niveles.length ? niveles : ESCALA_DEFECTO)
    .filter(x => x.rangoMin != null && x.rangoMax != null && x.valor)
    .sort((a, b) => (b.rangoMin ?? 0) - (a.rangoMin ?? 0))
  const nivel = escala.find(x => n >= x.rangoMin && n <= x.rangoMax)
  if (!nivel) return null
  return { valor: nivel.valor, color: COLORES_ESCALA[nivel.valor] || 'bg-gray-100 text-gray-700' }
}

const normalizarNotaInput = (valor) => {
  const limpio = String(valor ?? '').replace(',', '.').replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
  const [ent, dec] = limpio.split('.')
  const entLimpia = ent.slice(0, 1)
  return dec === undefined || limpio.endsWith('.') ? `${entLimpia}${limpio.endsWith('.') ? '.' : ''}` : `${entLimpia}.${dec.slice(0, 1)}`
}

const notaLimpia = (valor) => {
  if (valor === '' || valor == null) return ''
  const n = Number(valor)
  return !isNaN(n) && n >= 0 && n <= 5 ? String(n.toFixed(1)) : ''
}

const InputNota = ({ valor, onChange, ligaBajo, extraClass, disabled }) => (
  <div className="relative">
    <TextField
      size="small"
      value={valor ?? ''}
      onChange={(e) => onChange({ target: { value: e.target.value } })}
      onBlur={(e) => {
        const limpio = normalizarNotaInput(e.target.value)
        const n = limpio === '' ? NaN : Number(limpio)
        onChange({ target: { value: !isNaN(n) && n >= 0 && n <= 5 ? String(n.toFixed(1)) : '' } })
      }}
      disabled={disabled}
      placeholder="0.0"
      inputProps={{ inputMode: 'decimal', min: 0, max: 5, maxLength: 3, style: { textAlign: 'center' } }}
      sx={{ width: '100%', ...(extraClass === 'border-amber-300' ? { '& fieldset': { borderColor: '#fcd34d' } } : extraClass === 'border-red-300' ? { '& fieldset': { borderColor: '#fca5a5' } } : {}) }}
    />
    {ligaBajo}
  </div>
)

export default function Calificaciones() {
  const { usuario } = useAuth()
  const { sedeId } = useSede()
  const [searchParams] = useSearchParams()
  const [anios, setAnios] = useState([])
  const [grupos, setGrupos] = useState([])
  const [asignaturas, setAsignaturas] = useState([])
  const [filtros, setFiltros] = useState({
    grupoId: searchParams.get('grupoId') || '',
    asignaturaId: searchParams.get('asignaturaId') || '',
    periodo: searchParams.get('periodo') || ''
  })
  const [estudiantes, setEstudiantes] = useState([])
  const [filas, setFilas] = useState({})
  const [columnas, setColumnas] = useState([])
  const [modo, setModo] = useState('notas')
  const [loading, setLoading] = useState(false)
  const [cargado, setCargado] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [saving, setSaving] = useState(false)
  const [siee, setSiee] = useState({ notaMinima: 3, numeroPeriodos: 4, niveles: null })
  const [dialogoColumna, setDialogoColumna] = useState(false)
  const [formColumna, setFormColumna] = useState({ titulo: '', tipo: 'tarea', porcentaje: 0 })
  const [editandoColumna, setEditandoColumna] = useState(null)
  const [eliminandoColumna, setEliminandoColumna] = useState(null)

  const esDocente = usuario?.tipoPerfil === 'docente'
  const puedeGestionar = ['super_admin', 'admin', 'rector', 'coordinador', 'docente', 'secretaria'].includes(usuario?.tipoPerfil)

  const cargarDependencias = async () => {
    try {
      const [resAnio, resGrupos, resAsig] = await Promise.all([
        api.get('/anios-academicos'),
        api.get('/grupos', { params: sedeId ? { sedeId } : {} }),
        api.get('/asignaturas', { params: sedeId ? { sedeId } : {} })
      ])
      setAnios(resAnio.data.data)
      setGrupos(resGrupos.data.data)
      setAsignaturas(resAsig.data.data)
      const activo = resAnio.data.data.find(a => a.estado === 'activo')
      if (activo) setFiltros(prev => ({ ...prev, anioAcademicoId: activo._id }))
      if (usuario?.institucionId) {
        try {
          const rc = await api.get(`/instituciones/${usuario.institucionId}/configuracion`)
          const c = rc.data.data || {}
          setSiee({
            notaMinima: c.notaMinima ?? 3,
            numeroPeriodos: c.numeroPeriodos ?? 4,
            niveles: c.niveles?.length ? c.niveles : null
          })
        } catch { /* usa valores por defecto */ }
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar dependencias')
    }
  }

  useEffect(() => { cargarDependencias() }, [sedeId])

  const filaVacia = () => ({ nota: '', recuperacion: '', habilitacion: '', observacion: '', celdas: {} })

  const cargarColumnas = async (grupoId, asignaturaId, periodo) => {
    if (!grupoId || !asignaturaId || !periodo) return
    try {
      const r = await api.get('/actividades', {
        params: { grupoId, asignaturaId, periodo, anioAcademicoId: filtros.anioAcademicoId, estado: 'activo' }
      })
      const cols = (r.data.data || [])
        .filter(a => a.indicadorId?.descripcion === 'Actividades' || !a.indicadorId)
        .sort((a, b) => a.createdAt < b.createdAt ? 1 : -1)
      setColumnas(cols)
    } catch {
      setColumnas([])
    }
  }

  const cargarEstudiantes = async () => {
    if (!filtros.grupoId) return
    setLoading(true)
    setError('')
    setExito('')
    setCargado(false)
    try {
      if (modo === 'plantilla') {
        await cargarColumnas(filtros.grupoId, filtros.asignaturaId, filtros.periodo)
      }
      const r = await api.get(`/matriculas/grupo/${filtros.grupoId}`, { params: { anioAcademicoId: filtros.anioAcademicoId } })
      setEstudiantes(r.data.data.map(m => m.estudianteId).filter(Boolean))
      const f = {}
      r.data.data.forEach(m => { if (m.estudianteId?._id) f[m.estudianteId._id] = filaVacia() })
      if (filtros.asignaturaId && filtros.periodo) {
        try {
          const rn = await api.get(`/calificaciones/grupo/${filtros.grupoId}/asignatura/${filtros.asignaturaId}/periodo/${filtros.periodo}`, {
            params: { anioAcademicoId: filtros.anioAcademicoId }
          })
          for (const cal of rn.data.data) {
            if (cal.estudianteId?._id) {
              const celdas = {}
              ;(cal.actividades || []).forEach(act => {
                if (act.actividadId?._id) celdas[act.actividadId._id] = notaLimpia(act.nota)
              })
              f[cal.estudianteId._id] = {
                nota: cal.nota != null ? notaLimpia(cal.nota) : '',
                recuperacion: cal.recuperacion != null ? notaLimpia(cal.recuperacion) : '',
                habilitacion: cal.habilitacion != null ? notaLimpia(cal.habilitacion) : '',
                observacion: cal.observacion || '',
                celdas
              }
            }
          }
        } catch { /* sin notas previas */ }
      }
      setFilas(f)
      setCargado(true)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar estudiantes del grupo')
    } finally {
      setLoading(false)
    }
  }

  const autoCargar = filtros.grupoId && filtros.asignaturaId && filtros.anioAcademicoId

  useEffect(() => {
    if (autoCargar && !filtros.periodo) {
      setFiltros(f => ({ ...f, periodo: '1' }))
      return
    }
    if (autoCargar && filtros.periodo) cargarEstudiantes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCargar, filtros.periodo, filtros.grupoId, filtros.asignaturaId, modo])

  const setCampo = (id, campo, valor) => {
    setFilas(prev => ({ ...prev, [id]: { ...(prev[id] || filaVacia()), [campo]: valor } }))
  }

  const setCelda = (id, actividadId, valor) => {
    setFilas(prev => {
      const f = prev[id] || filaVacia()
      return { ...prev, [id]: { ...f, celdas: { ...(f.celdas || {}), [actividadId]: normalizarNotaInput(valor) } } }
    })
  }

  const promedioCeldas = (celdas) => {
    if (!columnas.length) return ''
    let suma = 0
    let sumaPct = 0
    for (const col of columnas) {
      const v = celdas?.[col._id]
      if (v !== undefined && v !== '' && !isNaN(Number(v))) {
        const pct = col.porcentaje != null ? Number(col.porcentaje) : 0
        suma += Number(v) * pct
        sumaPct += pct
      }
    }
    if (sumaPct <= 0) {
      const notas = Object.entries(celdas || {}).filter(([, v]) => v !== '' && !isNaN(Number(v))).map(([, v]) => Number(v))
      return notas.length ? Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10 : ''
    }
    return Math.round((suma / sumaPct) * 10) / 10
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!filtros.grupoId || !filtros.asignaturaId || !filtros.periodo) {
      setError('Selecciona grupo, asignatura y período')
      return
    }
    setSaving(true)
    setError('')
    setExito('')
    try {
      const num = (v) => (v !== undefined && v !== null && v !== '' ? Number(v) : undefined)
      const calificaciones = estudiantes.map(s => {
        const f = filas[s._id] || filaVacia()
        if (modo === 'plantilla') {
          const actividades = columnas
            .map(col => {
              const v = f.celdas?.[col._id]
              if (v === undefined || v === '' || isNaN(Number(v))) return null
              return { actividadId: col._id, nota: Number(v) }
            })
            .filter(Boolean)
          const observacion = f.observacion?.trim() || undefined
          const item = { estudianteId: s._id, actividades }
          if (observacion) item.observacion = observacion
          return item
        }
        const nota = num(f.nota)
        const recuperacion = num(f.recuperacion)
        const habilitacion = num(f.habilitacion)
        const observacion = f.observacion?.trim() || undefined
        const item = { estudianteId: s._id }
        if (nota !== undefined) item.nota = nota
        if (recuperacion !== undefined) item.recuperacion = recuperacion
        if (habilitacion !== undefined) item.habilitacion = habilitacion
        if (observacion) item.observacion = observacion
        return item
      }).filter(c => (modo === 'plantilla' ? c.actividades?.length || c.observacion : c.nota !== undefined || c.recuperacion !== undefined || c.habilitacion !== undefined || c.observacion))
      if (calificaciones.length === 0) {
        setError(modo === 'plantilla' ? 'Ingresa al menos una nota en la plantilla para guardar' : 'Ingresa al menos una nota para guardar')
        return
      }
      const r = await api.post('/calificaciones/masivo', {
        grupoId: filtros.grupoId,
        asignaturaId: filtros.asignaturaId,
        periodo: Number(filtros.periodo),
        anioAcademicoId: filtros.anioAcademicoId,
        calificaciones
      })
      if (r.data.data.errores?.length) {
        setExito(`${r.data.data.actualizadas} guardadas, ${r.data.data.errores.length} con errores`)
      } else {
        setExito(r.data.message)
      }
      await cargarEstudiantes()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar notas')
    } finally {
      setSaving(false)
    }
  }

  const abrirNuevaColumna = () => {
    setEditandoColumna(null)
    setFormColumna({ titulo: '', tipo: 'tarea', porcentaje: 0 })
    setDialogoColumna(true)
  }

  const abrirEditarColumna = (col) => {
    setEditandoColumna(col)
    setFormColumna({ titulo: col.titulo, tipo: col.tipo || 'tarea', porcentaje: col.porcentaje ?? 0 })
    setDialogoColumna(true)
  }

  const guardarColumna = async () => {
    if (!formColumna.titulo?.trim()) {
      notificar('El nombre de la celda es obligatorio', 'error')
      return
    }
    const porcentaje = Number(formColumna.porcentaje) || 0
    if (porcentaje < 0 || porcentaje > 100) {
      notificar('El porcentaje debe estar entre 0 y 100', 'error')
      return
    }
    const sumaActual = columnas
      .filter(c => !editandoColumna || c._id !== editandoColumna._id)
      .reduce((acc, c) => acc + (Number(c.porcentaje) || 0), 0)
    if (sumaActual + porcentaje > 100) {
      notificar(`El total no puede pasar del 100% (ya hay ${sumaActual}% asignado)`, 'error')
      return
    }
    const payload = {
      anioAcademicoId: filtros.anioAcademicoId,
      grupoId: filtros.grupoId,
      asignaturaId: filtros.asignaturaId,
      periodo: Number(filtros.periodo),
      titulo: formColumna.titulo.trim(),
      tipo: formColumna.tipo,
      porcentaje
    }
    try {
      if (editandoColumna) {
        await api.put(`/actividades/${editandoColumna._id}`, { ...payload, titulo: payload.titulo, tipo: payload.tipo, porcentaje: payload.porcentaje })
      } else {
        await api.post('/actividades', payload)
      }
      setDialogoColumna(false)
      await cargarColumnas(filtros.grupoId, filtros.asignaturaId, filtros.periodo)
      await cargarEstudiantes()
    } catch (err) {
      notificar(err.response?.data?.message || 'Error al guardar la celda', 'error')
    }
  }

  const eliminarColumna = async () => {
    try {
      await api.delete(`/actividades/${eliminandoColumna._id}`)
      notificar('Celda eliminada', 'success')
      setEliminandoColumna(null)
      setFilas(prev => {
        const next = { ...prev }
        Object.keys(next).forEach(id => {
          const celdas = { ...(next[id].celdas || {}) }
          delete celdas[eliminandoColumna._id]
          next[id] = { ...next[id], celdas }
        })
        return next
      })
      await cargarColumnas(filtros.grupoId, filtros.asignaturaId, filtros.periodo)
    } catch (err) {
      notificar(err.response?.data?.message || 'Error al eliminar la celda', 'error')
    }
  }

  const nombreGrupo = (id) => grupos.find(g => g._id === id)?.nombre || '—'
  const nombreAsig = (id) => asignaturas.find(a => a._id === id)?.nombre || '—'

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Calificaciones</h1>
            <p className="text-sm text-gray-500">Registro de notas, recuperaciones, habilitaciones y desempeños por período</p>
          </div>
          <IconButton onClick={cargarDependencias} aria-label="Recargar listas" title="Recargar listas" size="small" className="self-start">
            <RefreshCw className="w-4 h-4" />
          </IconButton>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <FormControl size="small" fullWidth>
            <InputLabel id="anio-label">Año Académico</InputLabel>
            <Select labelId="anio-label" value={filtros.anioAcademicoId} onChange={(e) => setFiltros({ ...filtros, anioAcademicoId: e.target.value })} label="Año Académico">
              <MenuItem value="">Seleccionar...</MenuItem>
              {anios.map(a => <MenuItem key={a._id} value={a._id}>Año {a.anio} ({a.estado})</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel id="grupo-label">Grupo</InputLabel>
            <Select labelId="grupo-label" value={filtros.grupoId} onChange={(e) => setFiltros({ ...filtros, grupoId: e.target.value })} label="Grupo">
              <MenuItem value="">Seleccionar...</MenuItem>
              {grupos.map(g => <MenuItem key={g._id} value={g._id}>{g.nombre} (Grado {g.grado})</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel id="asig-label">Asignatura</InputLabel>
            <Select labelId="asig-label" value={filtros.asignaturaId} onChange={(e) => setFiltros({ ...filtros, asignaturaId: e.target.value })} label="Asignatura">
              <MenuItem value="">Seleccionar...</MenuItem>
              {asignaturas.map(a => <MenuItem key={a._id} value={a._id}>{a.nombre}</MenuItem>)}
            </Select>
          </FormControl>
          <div className="flex items-end gap-2">
            <FormControl size="small" fullWidth>
              <InputLabel id="periodo-label">Período</InputLabel>
              <Select labelId="periodo-label" value={filtros.periodo} onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })} label="Período">
                <MenuItem value="">Período...</MenuItem>
                {Array.from({ length: siee.numeroPeriodos || 4 }, (_, i) => i + 1).map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="contained" color="primary" onClick={cargarEstudiantes} disabled={!filtros.grupoId} startIcon={<Search className="w-4 h-4" />}>
              Cargar
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <ToggleButtonGroup
            size="small"
            value={modo}
            exclusive
            onChange={(_, v) => v && setModo(v)}
            aria-label="Modo de calificación"
          >
            <ToggleButton value="notas">Notas directas</ToggleButton>
            <ToggleButton value="plantilla">Plantilla</ToggleButton>
          </ToggleButtonGroup>
          {modo === 'plantilla' && puedeGestionar && (
            <Button size="small" variant="outlined" color="primary" startIcon={<Plus className="w-4 h-4" />} onClick={abrirNuevaColumna}>
              Nueva celda
            </Button>
          )}
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 my-4">{error}</div>}
        {exito && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-3 py-2 my-4">{exito}</div>}
      </div>

      {cargado && estudiantes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">
              {nombreGrupo(filtros.grupoId)} · {nombreAsig(filtros.asignaturaId)} · Período {filtros.periodo}
              {modo === 'plantilla' && <span className="ml-2 text-xs font-normal text-gray-500">· Plantilla</span>}
            </h2>
            <div className="flex items-center gap-3">
              {modo === 'plantilla' && columnas.length > 0 && (
                <span className="text-xs text-gray-500">
                  {columnas.reduce((acc, c) => acc + (Number(c.porcentaje) || 0), 0)}% en {columnas.length} celdas
                </span>
              )}
              <span className="text-sm text-gray-500">{estudiantes.length} estudiantes</span>
            </div>
          </div>
          <form onSubmit={guardar}>
            <div className="overflow-x-auto">
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow className="bg-gray-50">
                      <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3 !text-left">Estudiante</TableCell>
                      <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3 !text-left">Documento</TableCell>
                      {modo === 'plantilla' ? (
                        columnas.length ? columnas.map(col => (
                          <TableCell key={col._id} className="!font-semibold !text-gray-500 !text-xs !uppercase !px-2 !py-3 !min-w-[130px]">
                            <div className="flex flex-col items-center gap-1">
                              <span className="leading-tight text-center">{col.titulo}</span>
                              <span className="text-[10px] font-normal text-gray-400">{(Number(col.porcentaje) || 0)}%</span>
                              {puedeGestionar && (
                                <span className="flex items-center gap-0.5">
                                  <IconButton size="small" onClick={() => abrirEditarColumna(col)} title="Editar nombre/%">
                                    <Pencil className="w-3 h-3" />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => setEliminandoColumna(col)} title="Eliminar celda">
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                  </IconButton>
                                </span>
                              )}
                            </div>
                          </TableCell>
                        )) : (
                          <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3">
                            <span className="text-gray-400 font-normal normal-case">Sin celdas definidas. Haz clic en "Nueva celda".</span>
                          </TableCell>
                        )
                      ) : (
                        <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3 !w-32 !text-center">Nota (0-5)</TableCell>
                      )}
                      {modo === 'plantilla' && columnas.length > 0 && (
                        <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3 !w-24 !text-center">Nota (promedio)</TableCell>
                      )}
                      {modo !== 'plantilla' && (
                        <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3 !w-24 !text-center">Recuperación</TableCell>
                      )}
                      {modo !== 'plantilla' && (
                        <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3 !w-24 !text-center">Habilitación</TableCell>
                      )}
                      <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3 !w-28 !text-center">Desempeño</TableCell>
                      <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3 !w-56 !text-left">Observaciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody className="bg-white">
                    {estudiantes.map(s => {
                      const f = filas[s._id] || filaVacia()
                      const notaNum = modo === 'plantilla'
                        ? (promedioCeldas(f.celdas) === '' ? NaN : Number(promedioCeldas(f.celdas)))
                        : (f.nota !== '' ? Number(f.nota) : NaN)
                      const muestraRecup = modo !== 'plantilla' && !isNaN(notaNum) && notaNum < siee.notaMinima
                      const muestraHab = modo !== 'plantilla' && !isNaN(notaNum) && notaNum < siee.notaMinima && f.recuperacion !== '' && Number(f.recuperacion) < siee.notaMinima
                      const efectiva = f.habilitacion !== '' ? Number(f.habilitacion) : (f.recuperacion !== '' ? Number(f.recuperacion) : notaNum)
                      const d = desempeno(efectiva, siee.niveles)
                      return (
                        <TableRow key={s._id} hover>
                          <TableCell className="!px-4 !py-2.5 !text-sm !font-medium !text-gray-900">{s.nombres} {s.apellidos}</TableCell>
                          <TableCell className="!px-4 !py-2.5 !text-sm !text-gray-700">{s.documento}</TableCell>
                          {modo === 'plantilla' ? (
                            columnas.length ? columnas.map(col => (
                              <TableCell key={col._id} className="!px-2 !py-2.5">
                                <InputNota
                                  valor={f.celdas?.[col._id] ?? ''}
                                  onChange={(e) => setCelda(s._id, col._id, e.target.value)}
                                  disabled={!puedeGestionar}
                                />
                              </TableCell>
                            )) : (
                              <TableCell className="!px-4 !py-2.5 !text-sm !text-gray-400">—</TableCell>
                            )
                          ) : (
                            <TableCell className="!px-4 !py-2.5">
                              <InputNota valor={f.nota} onChange={(e) => setCampo(s._id, 'nota', e.target.value)} disabled={!puedeGestionar} />
                            </TableCell>
                          )}
                          {modo === 'plantilla' && columnas.length > 0 && (
                            <TableCell className="!px-4 !py-2.5 !text-center">
                              {promedioCeldas(f.celdas) !== '' ? (
                                <span className="text-base font-bold text-gray-900">{Number(promedioCeldas(f.celdas)).toFixed(1)}</span>
                              ) : (
                                <span className="text-gray-300 text-sm">—</span>
                              )}
                            </TableCell>
                          )}
                          {modo !== 'plantilla' && (
                            <TableCell className="!px-4 !py-2.5">
                              {muestraRecup ? (
                                <InputNota
                                  valor={f.recuperacion}
                                  onChange={(e) => setCampo(s._id, 'recuperacion', e.target.value)}
                                  extraClass="border-amber-300"
                                  disabled={!puedeGestionar}
                                />
                              ) : (
                                <span className="block text-center text-gray-300 text-sm">—</span>
                              )}
                            </TableCell>
                          )}
                          {modo !== 'plantilla' && (
                            <TableCell className="!px-4 !py-2.5">
                              {muestraHab ? (
                                <InputNota
                                  valor={f.habilitacion}
                                  onChange={(e) => setCampo(s._id, 'habilitacion', e.target.value)}
                                  extraClass="border-red-300"
                                  disabled={!puedeGestionar}
                                />
                              ) : (
                                <span className="block text-center text-gray-300 text-sm">—</span>
                              )}
                            </TableCell>
                          )}
                          <TableCell className="!px-4 !py-2.5 !text-center">
                            {d ? (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.color}`}>{d.valor}</span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="!px-4 !py-2.5">
                            <TextField
                              size="small"
                              fullWidth
                              value={f.observacion || ''}
                              onChange={(e) => setCampo(s._id, 'observacion', e.target.value)}
                              disabled={!puedeGestionar}
                              placeholder="Observación"
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Escala de desempeños: {(siee.niveles || ESCALA_DEFECTO)
                  .filter(x => x.rangoMin != null && x.rangoMax != null)
                  .sort((a, b) => (b.rangoMin ?? 0) - (a.rangoMin ?? 0))
                  .map(x => `${x.valor} ${x.rangoMin}-${x.rangoMax}`)
                  .join(' · ')}
                {modo === 'plantilla' && ' · La Nota = promedio ponderado de las celdas'}
              </p>
              {puedeGestionar && (
                <Button type="submit" variant="contained" color="primary" disabled={saving} startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Save className="w-4 h-4" />}>
                  {saving ? 'Guardando...' : 'Guardar Calificaciones'}
                </Button>
              )}
            </div>
          </form>
        </div>
      )}

      {cargado && estudiantes.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          El grupo seleccionado no tiene estudiantes matriculados.
        </div>
      )}

      <Dialog open={dialogoColumna} onClose={() => setDialogoColumna(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editandoColumna ? 'Editar celda de la plantilla' : 'Nueva celda de la plantilla'}</DialogTitle>
        <DialogContent className="space-y-3 pt-3!">
          <TextField
            size="small"
            fullWidth
            label="Nombre de la celda"
            value={formColumna.titulo}
            onChange={(e) => setFormColumna({ ...formColumna, titulo: e.target.value })}
            placeholder="Ej: Taller 1, Quiz, Examen"
            autoFocus
          />
          <FormControl size="small" fullWidth>
            <InputLabel id="tipo-celda-label">Tipo</InputLabel>
            <Select labelId="tipo-celda-label" value={formColumna.tipo} onChange={(e) => setFormColumna({ ...formColumna, tipo: e.target.value })} label="Tipo">
              {TIPOS.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            size="small"
            fullWidth
            label="Porcentaje (%)"
            type="number"
            value={formColumna.porcentaje}
            onChange={(e) => {
              const v = e.target.value
              const n = Number(v)
              if (v === '' || isNaN(n)) { setFormColumna({ ...formColumna, porcentaje: v }); return }
              setFormColumna({ ...formColumna, porcentaje: n > 100 ? 100 : n < 0 ? 0 : n })
            }}
            inputProps={{ min: 0, max: 100, step: 1 }}
            helperText="Peso de esta celda al calcular el promedio. Máximo 100%."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoColumna(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" color="primary" onClick={guardarColumna} disabled={saving}>
            {editandoColumna ? 'Guardar cambios' : 'Crear celda'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!eliminandoColumna}
        title="¿Eliminar esta celda?"
        message={`Se eliminará "${eliminandoColumna?.titulo}" y sus notas de todos los estudiantes. Esta acción no se puede deshacer.`}
        loading={saving}
        onClose={() => setEliminandoColumna(null)}
        onConfirm={eliminarColumna}
      />
    </div>
  )
}