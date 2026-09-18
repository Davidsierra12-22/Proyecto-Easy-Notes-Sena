import { useEffect, useState } from 'react'
import { Plus, RefreshCw, Pencil, Power, Search, CheckCircle2, X } from 'lucide-react'
import {
  Select, MenuItem, FormControl, TextField, IconButton, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress
} from '@mui/material'
import api from '../services/api.service'
import { useAuth } from '../store/Auth'

const TIPOS = [
  { value: 'tarea', label: 'Tarea' },
  { value: 'examen', label: 'Examen' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'proyecto', label: 'Proyecto' },
  { value: 'participacion', label: 'Participación' },
  { value: 'otro', label: 'Otro' }
]

const tipoBadge = (tipo) => {
  const colores = {
    tarea: 'bg-primary-100 text-primary-800',
    examen: 'bg-red-100 text-red-700',
    quiz: 'bg-amber-100 text-amber-700',
    proyecto: 'bg-blue-100 text-blue-800',
    participacion: 'bg-emerald-100 text-emerald-700',
    otro: 'bg-gray-100 text-gray-700'
  }
  const t = TIPOS.find(x => x.value === tipo)
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colores[tipo] || 'bg-gray-100 text-gray-700'}`}>{t ? t.label : tipo}</span>
}

export default function Actividades() {
  const { usuario } = useAuth()
  const puedeGestionar = ['super_admin', 'admin', 'rector', 'coordinador', 'docente'].includes(usuario?.tipoPerfil)

  const [anios, setAnios] = useState([])
  const [grupos, setGrupos] = useState([])
  const [asignaturas, setAsignaturas] = useState([])
  const [indicadores, setIndicadores] = useState([])
  const [filtros, setFiltros] = useState({})
  const [actividades, setActividades] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ tipo: 'tarea', porcentaje: 0 })
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const cargarDependencias = async () => {
    try {
      const [resAnio, resGrupos, resAsig] = await Promise.all([
        api.get('/anios-academicos'),
        api.get('/grupos'),
        api.get('/asignaturas')
      ])
      setAnios(resAnio.data.data)
      setGrupos(resGrupos.data.data)
      setAsignaturas(resAsig.data.data)
      const activo = resAnio.data.data.find(a => a.estado === 'activo')
      if (activo) setFiltros(prev => ({ ...prev, anioAcademicoId: activo._id }))
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar')
    }
  }

  useEffect(() => { cargarDependencias() }, [])

  const cargarIndicadores = async () => {
    if (!filtros.asignaturaId || !filtros.periodo) return
    try {
      const r = await api.get(`/indicadores/asignatura/${filtros.asignaturaId}/periodo/${filtros.periodo}`)
      setIndicadores(r.data.data)
    } catch { setIndicadores([]) }
  }

  useEffect(() => { cargarIndicadores() }, [filtros.asignaturaId, filtros.periodo])

  const cargar = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (filtros.anioAcademicoId) params.anioAcademicoId = filtros.anioAcademicoId
      if (filtros.grupoId) params.grupoId = filtros.grupoId
      if (filtros.asignaturaId) params.asignaturaId = filtros.asignaturaId
      if (filtros.periodo) params.periodo = filtros.periodo
      const r = await api.get('/actividades', { params })
      setActividades(r.data.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar actividades')
    } finally {
      setLoading(false)
    }
  }

  const abrirCrear = () => {
    setForm({ tipo: 'tarea', porcentaje: 0, anioAcademicoId: filtros.anioAcademicoId, grupoId: filtros.grupoId, asignaturaId: filtros.asignaturaId, periodo: filtros.periodo })
    setEditing(null)
    setModal(true)
    setError('')
  }

  const abrirEditar = (item) => {
    setForm({
      anioAcademicoId: item.anioAcademicoId,
      grupoId: item.grupoId,
      asignaturaId: item.asignaturaId,
      periodo: item.periodo,
      indicadorId: item.indicadorId?._id || item.indicadorId,
      titulo: item.titulo,
      descripcion: item.descripcion || '',
      tipo: item.tipo || 'tarea',
      porcentaje: item.porcentaje || 0,
      fechaLimite: item.fechaLimite ? item.fechaLimite.slice(0, 10) : ''
    })
    setEditing(item)
    setModal(true)
    setError('')
  }

  const guardar = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const body = {
        ...form,
        periodo: Number(form.periodo),
        porcentaje: Number(form.porcentaje || 0)
      }
      if (body.fechaLimite) body.fechaLimite = new Date(body.fechaLimite).toISOString()
      else delete body.fechaLimite
      if (editing) {
        await api.put(`/actividades/${editing._id}`, body)
      } else {
        await api.post('/actividades', body)
      }
      setModal(false)
      await cargar()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const cambiarEstado = async (item) => {
    try {
      await api.put(`/actividades/${item._id}`, { estado: item.estado === 'activo' ? 'inactivo' : 'activo' })
      await cargar()
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cambiar estado')
    }
  }

  const cerrar = async (item) => {
    if (!window.confirm('¿Cerrar esta actividad? Ya no se podrá calificar.')) return
    try {
      await api.put(`/actividades/${item._id}`, { estado: 'cerrado' })
      await cargar()
    } catch (e) {
      alert(e.response?.data?.message || 'Error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h1 className="text-xl font-bold text-gray-900">Actividades Evaluativas</h1>
          <div className="flex items-center gap-2">
            <IconButton onClick={cargar} aria-label="Recargar actividades" title="Recargar actividades" size="small" className="!text-gray-500 hover:!text-gray-700">
              <RefreshCw className="w-4 h-4" />
            </IconButton>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Año</label>
            <Select value={filtros.anioAcademicoId || ''} onChange={(e) => setFiltros({ ...filtros, anioAcademicoId: e.target.value })}
              size="small" fullWidth displayEmpty className="text-sm">
              <MenuItem value="">Todas</MenuItem>
              {anios.map(a => <MenuItem key={a._id} value={a._id}>Año {a.anio}</MenuItem>)}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Grupo</label>
            <Select value={filtros.grupoId || ''} onChange={(e) => setFiltros({ ...filtros, grupoId: e.target.value })}
              size="small" fullWidth displayEmpty className="text-sm">
              <MenuItem value="">Todos</MenuItem>
              {grupos.map(g => <MenuItem key={g._id} value={g._id}>{g.nombre} (Grado {g.grado})</MenuItem>)}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Asignatura</label>
            <Select value={filtros.asignaturaId || ''} onChange={(e) => setFiltros({ ...filtros, asignaturaId: e.target.value })}
              size="small" fullWidth displayEmpty className="text-sm">
              <MenuItem value="">Todas</MenuItem>
              {asignaturas.map(a => <MenuItem key={a._id} value={a._id}>{a.nombre}</MenuItem>)}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Período</label>
            <Select value={filtros.periodo || ''} onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}
              size="small" fullWidth displayEmpty className="text-sm">
              <MenuItem value="">Todos</MenuItem>
              {[1, 2, 3, 4, 5].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={cargar} variant="contained" color="primary" size="small" className="!normal-case !text-sm !font-medium !py-2 !px-4" startIcon={<Search className="w-4 h-4" />}>
              Cargar
            </Button>
            {puedeGestionar && filtros.asignaturaId && filtros.grupoId && filtros.periodo && (
              <Button onClick={abrirCrear} variant="contained" color="primary" size="small" className="!normal-case !text-sm !font-medium !py-2 !px-3" startIcon={<Plus className="w-4 h-4" />}>
                Nueva
              </Button>
            )}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

        <div className="overflow-x-auto">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Título</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Tipo</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Indicador</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider !text-center whitespace-nowrap">%</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">F. Límite</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Estado</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider !text-right whitespace-nowrap">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="!text-center !py-8">
                      <CircularProgress size={24} className="!text-primary-600" />
                    </TableCell>
                  </TableRow>
                ) : actividades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="!text-center !py-8 !text-gray-500">
                      No hay actividades
                    </TableCell>
                  </TableRow>
                ) : (
                  actividades.map(a => (
                    <TableRow key={a._id} hover>
                      <TableCell className="!text-sm !font-medium !text-gray-900 !py-3">{a.titulo}</TableCell>
                      <TableCell className="!py-3">{tipoBadge(a.tipo)}</TableCell>
                      <TableCell className="!text-sm !text-gray-700 !py-3">
                        {a.indicadorId ? (a.indicadorId.codigo ? `${a.indicadorId.codigo} - ` : '') + (a.indicadorId.descripcion || '') : '—'}
                      </TableCell>
                      <TableCell className="!text-sm !text-center !text-gray-700 !py-3">{a.porcentaje}%</TableCell>
                      <TableCell className="!text-sm !text-gray-500 !py-3">{a.fechaLimite ? new Date(a.fechaLimite).toLocaleDateString('es-CO') : '—'}</TableCell>
                      <TableCell className="!py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{a.estado}</span>
                      </TableCell>
                      <TableCell className="!py-3 !text-right whitespace-nowrap">
                        {puedeGestionar && a.estado === 'activo' && (
                          <>
                            <Button size="small" color="primary" onClick={() => abrirEditar(a)} className="!normal-case !text-sm !font-medium mr-3" startIcon={<Pencil className="w-4 h-4" />}>Editar</Button>
                            <Button size="small" color="warning" onClick={() => cerrar(a)} className="!normal-case !text-sm !font-medium mr-3" startIcon={<CheckCircle2 className="w-4 h-4" />}>Cerrar</Button>
                            <Button size="small" color="warning" onClick={() => cambiarEstado(a)} className="!normal-case !text-sm !font-medium" startIcon={<Power className="w-4 h-4" />}>Desactivar</Button>
                          </>
                        )}
                        {puedeGestionar && a.estado === 'inactivo' && (
                          <Button size="small" color="success" onClick={() => cambiarEstado(a)} className="!normal-case !text-sm !font-medium" startIcon={<Power className="w-4 h-4" />}>Activar</Button>
                        )}
                        {a.estado !== 'activo' && a.estado !== 'inactivo' && <span className="text-sm text-gray-400">Cerrada</span>}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>

      <Dialog open={modal} onClose={() => { setModal(false); setError('') }} fullWidth maxWidth="sm">
        <DialogTitle className="flex items-center justify-between pr-2">
          <span>{editing ? 'Editar Actividad' : 'Nueva Actividad'}</span>
          <IconButton onClick={() => { setModal(false); setError('') }} aria-label="Cerrar modal de actividad" size="small">
            <X className="w-5 h-5" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={guardar}>
          <DialogContent className="!pt-2">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título <span className="text-red-500">*</span></label>
                <TextField value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required
                  placeholder="Ej: Taller de fracciones" fullWidth size="small" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Indicador <span className="text-red-500">*</span></label>
                <FormControl fullWidth size="small">
                  <Select value={form.indicadorId || ''} onChange={(e) => setForm({ ...form, indicadorId: e.target.value })} required displayEmpty>
                    <MenuItem value="">Seleccionar indicador...</MenuItem>
                    {indicadores.map(i => <MenuItem key={i._id} value={i._id}>{i.codigo ? `${i.codigo} - ` : ''}{i.descripcion}</MenuItem>)}
                  </Select>
                </FormControl>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <TextField value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} multiline minRows={2} fullWidth size="small" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <FormControl fullWidth size="small">
                    <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                      {TIPOS.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje (%)</label>
                  <TextField type="number" value={form.porcentaje} onChange={(e) => setForm({ ...form, porcentaje: e.target.value })} fullWidth size="small"
                    slotProps={{ htmlInput: { min: 0, max: 100 } }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
                <TextField type="date" value={form.fechaLimite} onChange={(e) => setForm({ ...form, fechaLimite: e.target.value })} fullWidth size="small" />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>}
            </div>
          </DialogContent>
          <DialogActions className="!px-6 !pb-5">
            <Button onClick={() => setModal(false)} className="!text-gray-700 hover:!bg-gray-100">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={saving}>
              {saving ? 'Guardando...' : (editing ? 'Actualizar' : 'Crear')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  )
}