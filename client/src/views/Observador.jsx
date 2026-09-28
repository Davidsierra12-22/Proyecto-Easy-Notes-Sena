import { useEffect, useState } from 'react'
import { PawPrint, Plus, Search, X, ArrowLeft, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import {
  Button, IconButton, TextField, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material'
import api from '../services/api.service'
import { useAuth } from '../store/Auth'

const TIPOS = [
  { value: 'disciplinario', label: 'Disciplinario', color: 'bg-red-100 text-red-700' },
  { value: 'academico', label: 'Académico', color: 'bg-blue-100 text-blue-700' },
  { value: 'convivencia', label: 'Convivencia', color: 'bg-green-100 text-green-700' }
]
const ESTADOS = { abierto: 'bg-amber-100 text-amber-700', cerrado: 'bg-gray-100 text-gray-600', seguimiento: 'bg-purple-100 text-purple-700' }
const CATEGORIAS = { positiva: 'bg-emerald-100 text-emerald-700', negativa: 'bg-red-100 text-red-700', neutra: 'bg-gray-100 text-gray-600' }
const GRAVEDADES = { baja: 'bg-green-100 text-green-700', media: 'bg-amber-100 text-amber-700', alta: 'bg-red-100 text-red-700' }

export default function Observador() {
  const { usuario } = useAuth()
  const [observaciones, setObservaciones] = useState([])
  const [estudiantes, setEstudiantes] = useState([])
  const [grupos, setGrupos] = useState([])
  const [anio, setAnio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ estudianteId: '', tipo: 'academico', descripcion: '', compromiso: '', categoria: 'neutra', gravedad: 'baja' })
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [expandido, setExpandido] = useState(null)
  const [seguimiento, setSeguimiento] = useState('')
  const [agregandoSeg, setAgregandoSeg] = useState(false)

  useEffect(() => {
    if (!usuario?.institucionId) return
    const cargar = async () => {
      setLoading(true)
      try {
        const [resAnio, resObs] = await Promise.all([
          api.get('/anios-academicos'),
          api.get('/observador')
        ])
        const anioActivo = resAnio.data.data.find(a => a.estado === 'activo')
        setAnio(anioActivo)
        setObservaciones(resObs.data.data || [])

        if (anioActivo) {
          const [resCarga, resGrupos] = await Promise.all([
            api.get(`/carga-academica/docente/${usuario._id}`),
            api.get('/grupos')
          ])
          const misGrupos = (resGrupos.data.data || []).filter(g =>
            resCarga.data.data.some(c => c.grupoId?._id === g._id || c.grupoId === g._id)
          )
          setGrupos(misGrupos)
          const estIds = new Set()
          const ests = []
          for (const g of misGrupos) {
            try {
              const res = await api.get(`/matriculas/grupo/${g._id}`)
              for (const m of (res.data.data || [])) {
                if (m.estudianteId?._id && !estIds.has(m.estudianteId._id)) {
                  estIds.add(m.estudianteId._id)
                  ests.push(m.estudianteId)
                }
              }
            } catch {}
          }
          setEstudiantes(ests)
        }
      } catch (e) {
        setError(e.response?.data?.message || 'Error al cargar datos')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [usuario?.institucionId, usuario?._id])

  const validar = (f) => {
    const e = {}
    if (!f.estudianteId) e.estudianteId = 'Seleccione un estudiante'
    if (!f.tipo) e.tipo = 'Seleccione un tipo'
    if (!f.descripcion?.trim()) e.descripcion = 'La descripción es obligatoria'
    return e
  }

  const guardar = async () => {
    const errores = validar(form)
    if (Object.keys(errores).length > 0) { setFieldErrors(errores); return }
    setSaving(true)
    try {
      await api.post('/observador', {
        ...form,
        anioAcademicoId: anio?._id,
        fecha: new Date().toISOString()
      })
      const res = await api.get('/observador')
      setObservaciones(res.data.data || [])
      setModal(false)
      setForm({ estudianteId: '', tipo: 'academico', descripcion: '', compromiso: '', categoria: 'neutra', gravedad: 'baja' })
      setFieldErrors({})
    } catch (e) {
      setError(e.response?.data?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const agregarSeguimiento = async (obsId) => {
    if (!seguimiento.trim()) return
    setAgregandoSeg(true)
    try {
      await api.post(`/observador/${obsId}/seguimiento`, { observacion: seguimiento })
      const res = await api.get('/observador')
      setObservaciones(res.data.data || [])
      setSeguimiento('')
      setExpandido(obsId)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al agregar seguimiento')
    } finally {
      setAgregandoSeg(false)
    }
  }

  const cerrarObservacion = async (obsId) => {
    try {
      await api.put(`/observador/${obsId}`, { estado: 'cerrado' })
      const res = await api.get('/observador')
      setObservaciones(res.data.data || [])
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cerrar')
    }
  }

  const filtradas = observaciones.filter(o => {
    const nombre = o.estudianteId?.nombres + ' ' + o.estudianteId?.apellidos || ''
    return nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
           o.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
  })

  const tipoInfo = (t) => TIPOS.find(x => x.value === t) || TIPOS[0]

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-purple-50 text-purple-700"><PawPrint className="w-5 h-5" /></span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Observador</h1>
              <p className="text-sm text-gray-500">Registro de observaciones de tus estudiantes</p>
            </div>
          </div>
          <Button
            onClick={() => { setModal(true); setFieldErrors({}) }}
            variant="contained"
            startIcon={<Plus className="w-4 h-4" />}
            className="!normal-case !bg-purple-600 hover:!bg-purple-700"
          >
            Nueva Observación
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm flex items-center justify-between">
            {error}
            <IconButton size="small" onClick={() => setError('')}><X className="w-4 h-4" /></IconButton>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <TextField
            size="small"
            placeholder="Buscar estudiante o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <Search className="w-4 h-4 text-gray-400 mr-2" />
              }
            }}
            className="flex-1"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><CircularProgress /></div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <PawPrint className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No hay observaciones registradas</p>
          </div>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="!font-semibold !text-gray-500 !text-xs">Estudiante</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs">Tipo</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs">Descripción</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs">Categoría</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs">Estado</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs">Fecha</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtradas.map((obs) => (
                  <>
                    <TableRow key={obs._id} className={`hover:bg-gray-50 ${obs.estado === 'cerrado' ? 'bg-gray-50' : ''}`}>
                      <TableCell>
                        <span className={`font-medium ${obs.estado === 'cerrado' ? 'text-gray-400' : 'text-gray-900'}`}>
                          {obs.estudianteId?.nombres} {obs.estudianteId?.apellidos}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipoInfo(obs.tipo).color}`}>
                          {tipoInfo(obs.tipo).label}
                        </span>
                      </TableCell>
                      <TableCell className={`max-w-xs truncate text-sm ${obs.estado === 'cerrado' ? 'text-gray-400' : 'text-gray-600'}`}>{obs.descripcion}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORIAS[obs.categoria]}`}>
                          {obs.categoria}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADOS[obs.estado]}`}>
                          {obs.estado}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(obs.fecha || obs.createdAt).toLocaleDateString('es-CO')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <IconButton
                            size="small"
                            onClick={() => setExpandido(expandido === obs._id ? null : obs._id)}
                            title="Ver seguimiento"
                          >
                            {expandido === obs._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </IconButton>
                          {obs.estado !== 'cerrado' && (
                            <Button
                              size="small"
                              onClick={() => cerrarObservacion(obs._id)}
                              className="!text-xs !normal-case !text-gray-600"
                            >
                              Cerrar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandido === obs._id && (
                      <TableRow key={`${obs._id}-detail`}>
                        <TableCell colSpan={7} className="!bg-gray-50 !p-4">
                          <div className="space-y-3">
                            {obs.compromiso && (
                              <div>
                                <span className="text-xs font-semibold text-gray-500">Compromiso:</span>
                                <p className="text-sm text-gray-700">{obs.compromiso}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-xs font-semibold text-gray-500">Seguimiento:</span>
                              {obs.seguimiento?.length > 0 ? (
                                <div className="mt-2 space-y-2">
                                  {obs.seguimiento.map((seg, i) => (
                                    <div key={i} className="bg-white p-2 rounded border border-gray-200 text-sm">
                                      <span className="text-gray-500">{new Date(seg.fecha).toLocaleDateString('es-CO')}</span>
                                      <p className="text-gray-700">{seg.observacion}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-400 mt-1">Sin seguimiento</p>
                              )}
                            </div>
                            {obs.estado !== 'cerrado' && (
                              <div className="flex gap-2">
                                <TextField
                                  size="small"
                                  placeholder="Agregar seguimiento..."
                                  value={expandido === obs._id ? seguimiento : ''}
                                  onChange={(e) => setSeguimiento(e.target.value)}
                                  className="flex-1"
                                  onKeyDown={(e) => { if (e.key === 'Enter') agregarSeguimiento(obs._id) }}
                                />
                                <Button
                                  variant="contained"
                                  size="small"
                                  disabled={agregandoSeg || !seguimiento.trim()}
                                  onClick={() => agregarSeguimiento(obs._id)}
                                  className="!normal-case"
                                >
                                  {agregandoSeg ? <CircularProgress size={16} /> : 'Agregar'}
                                </Button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>

      <Dialog open={modal} onClose={() => setModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="!font-bold">Nueva Observación</DialogTitle>
        <DialogContent className="space-y-4 pt-4">
          <FormControl size="small" fullWidth error={!!fieldErrors.estudianteId}>
            <InputLabel>Estudiante</InputLabel>
            <Select
              value={form.estudianteId}
              label="Estudiante"
              onChange={(e) => { setForm({ ...form, estudianteId: e.target.value }); if (fieldErrors.estudianteId) setFieldErrors(p => ({ ...p, estudianteId: '' })) }}
            >
              <MenuItem value="">Seleccionar...</MenuItem>
              {estudiantes.map(est => (
                <MenuItem key={est._id} value={est._id}>{est.nombres} {est.apellidos}</MenuItem>
              ))}
            </Select>
            {fieldErrors.estudianteId && <p className="text-xs text-red-500 mt-1">{fieldErrors.estudianteId}</p>}
          </FormControl>

          <div className="grid grid-cols-2 gap-3">
            <FormControl size="small" fullWidth error={!!fieldErrors.tipo}>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={form.tipo}
                label="Tipo"
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              >
                {TIPOS.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={form.categoria}
                label="Categoría"
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              >
                <MenuItem value="positiva">Positiva</MenuItem>
                <MenuItem value="negativa">Negativa</MenuItem>
                <MenuItem value="neutra">Neutra</MenuItem>
              </Select>
            </FormControl>
          </div>

          <FormControl size="small" fullWidth>
            <InputLabel>Gravedad</InputLabel>
            <Select
              value={form.gravedad}
              label="Gravedad"
              onChange={(e) => setForm({ ...form, gravedad: e.target.value })}
            >
              <MenuItem value="baja">Baja</MenuItem>
              <MenuItem value="media">Media</MenuItem>
              <MenuItem value="alta">Alta</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Descripción"
            multiline
            rows={3}
            fullWidth
            size="small"
            value={form.descripcion}
            onChange={(e) => { setForm({ ...form, descripcion: e.target.value }); if (fieldErrors.descripcion) setFieldErrors(p => ({ ...p, descripcion: '' })) }}
            error={!!fieldErrors.descripcion}
            helperText={fieldErrors.descripcion}
          />

          <TextField
            label="Compromiso (opcional)"
            multiline
            rows={2}
            fullWidth
            size="small"
            value={form.compromiso}
            onChange={(e) => setForm({ ...form, compromiso: e.target.value })}
          />
        </DialogContent>
        <DialogActions className="!px-6 !pb-4">
          <Button onClick={() => setModal(false)} className="!normal-case">Cancelar</Button>
          <Button
            variant="contained"
            onClick={guardar}
            disabled={saving}
            className="!normal-case !bg-purple-600 hover:!bg-purple-700"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
