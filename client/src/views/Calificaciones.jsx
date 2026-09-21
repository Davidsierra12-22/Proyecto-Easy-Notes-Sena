import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RefreshCw, Save, Search } from 'lucide-react'
import { TextField, Select, MenuItem, Button, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, FormControl, InputLabel } from '@mui/material'
import api from '../services/api.service'
import { useAuth } from '../store/Auth'
import { useSede } from '../store/General'

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

const desempeno = (n, niveles) => {
  if (n == null || isNaN(n)) return null
  const escala = (Array.isArray(niveles) && niveles.length ? niveles : ESCALA_DEFECTO)
    .filter(x => x.rangoMin != null && x.rangoMax != null && x.valor)
    .sort((a, b) => (b.rangoMin ?? 0) - (a.rangoMin ?? 0))
  const nivel = escala.find(x => n >= x.rangoMin && n <= x.rangoMax)
  if (!nivel) return null
  return { valor: nivel.valor, color: COLORES_ESCALA[nivel.valor] || 'bg-gray-100 text-gray-700' }
}

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
  const [loading, setLoading] = useState(false)
  const [cargado, setCargado] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [saving, setSaving] = useState(false)
  const [siee, setSiee] = useState({ notaMinima: 3, numeroPeriodos: 4, niveles: null })

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

  const filaVacia = () => ({ nota: '', recuperacion: '', habilitacion: '', observacion: '' })

  const cargarEstudiantes = async () => {
    if (!filtros.grupoId) return
    setLoading(true)
    setError('')
    setExito('')
    setCargado(false)
    try {
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
              f[cal.estudianteId._id] = {
                nota: cal.nota ?? '',
                recuperacion: cal.recuperacion ?? '',
                habilitacion: cal.habilitacion ?? '',
                observacion: cal.observacion || ''
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
  }, [autoCargar, filtros.periodo, filtros.grupoId, filtros.asignaturaId])

  const setCampo = (id, campo, valor) => {
    setFilas(prev => ({ ...prev, [id]: { ...(prev[id] || filaVacia()), [campo]: valor } }))
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
      }).filter(c => c.nota !== undefined || c.recuperacion !== undefined || c.habilitacion !== undefined || c.observacion)
      if (calificaciones.length === 0) {
        setError('Ingresa al menos una nota para guardar')
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

  const nombreGrupo = (id) => grupos.find(g => g._id === id)?.nombre || '—'
  const nombreAsig = (id) => asignaturas.find(a => a._id === id)?.nombre || '—'

  const InputNota = ({ valor, onChange, ligaBajo, extraClass }) => (
    <div className="relative">
      <TextField
        type="number"
        size="small"
        value={valor ?? ''}
        onChange={onChange}
        disabled={!puedeGestionar}
        placeholder="0.0"
        inputProps={{ step: 0.1, min: 0, max: 5, style: { textAlign: 'center' } }}
        sx={{ width: '100%', '& input[type=number]::-webkit-inner-spin-button': { opacity: 1 }, ...(extraClass === 'border-amber-300' ? { '& fieldset': { borderColor: '#fcd34d' } } : extraClass === 'border-red-300' ? { '& fieldset': { borderColor: '#fca5a5' } } : {}) }}
      />
      {ligaBajo}
    </div>
  )

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

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 my-4">{error}</div>}
        {exito && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-3 py-2 my-4">{exito}</div>}
      </div>

      {cargado && estudiantes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">
              {nombreGrupo(filtros.grupoId)} · {nombreAsig(filtros.asignaturaId)} · Período {filtros.periodo}
            </h2>
            <span className="text-sm text-gray-500">{estudiantes.length} estudiantes</span>
          </div>
          <form onSubmit={guardar}>
            <div className="overflow-x-auto">
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow className="bg-gray-50">
                      <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3 !text-left">Estudiante</TableCell>
                      <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3 !text-left">Documento</TableCell>
                      <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3 !w-20 !text-center">Nota (0-5)</TableCell>
                      <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3 !w-20 !text-center">Recuperación</TableCell>
                      <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3 !w-20 !text-center">Habilitación</TableCell>
                      <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3 !w-28 !text-center">Desempeño</TableCell>
                      <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3 !w-56 !text-left">Observaciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody className="bg-white">
                    {estudiantes.map(s => {
                      const f = filas[s._id] || filaVacia()
                      const notaNum = f.nota !== '' ? Number(f.nota) : NaN
                      const muestraRecup = !isNaN(notaNum) && notaNum < siee.notaMinima
                      const muestraHab = !isNaN(notaNum) && notaNum < siee.notaMinima && f.recuperacion !== '' && Number(f.recuperacion) < siee.notaMinima
                      const efectiva = f.habilitacion !== '' ? Number(f.habilitacion) : (f.recuperacion !== '' ? Number(f.recuperacion) : notaNum)
                      const d = desempeno(efectiva, siee.niveles)
                      return (
                        <TableRow key={s._id} hover>
                          <TableCell className="!px-4 !py-2.5 !text-sm !font-medium !text-gray-900">{s.nombres} {s.apellidos}</TableCell>
                          <TableCell className="!px-4 !py-2.5 !text-sm !text-gray-700">{s.documento}</TableCell>
                          <TableCell className="!px-4 !py-2.5">
                            <InputNota valor={f.nota} onChange={(e) => setCampo(s._id, 'nota', e.target.value)} />
                          </TableCell>
                          <TableCell className="!px-4 !py-2.5">
                            {muestraRecup ? (
                              <InputNota
                                valor={f.recuperacion}
                                onChange={(e) => setCampo(s._id, 'recuperacion', e.target.value)}
                                extraClass="border-amber-300"
                              />
                            ) : (
                              <span className="block text-center text-gray-300 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="!px-4 !py-2.5">
                            {muestraHab ? (
                              <InputNota
                                valor={f.habilitacion}
                                onChange={(e) => setCampo(s._id, 'habilitacion', e.target.value)}
                                extraClass="border-red-300"
                              />
                            ) : (
                              <span className="block text-center text-gray-300 text-sm">—</span>
                            )}
                          </TableCell>
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
              </p>
              {puedeGestionar && (
                <Button type="submit" variant="contained" color="primary" disabled={saving} startIcon={<Save className="w-4 h-4" />}>
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
    </div>
  )
}
