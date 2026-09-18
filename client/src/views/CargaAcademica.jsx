import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Filter, Search } from 'lucide-react'
import {
  Select, MenuItem, FormControl, TextField, InputAdornment, IconButton,
  Checkbox, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress
} from '@mui/material'
import api from '../services/api.service'
import { useAuth } from '../store/Auth'
import { useSede } from '../store/General'

export default function CargaAcademica() {
  const { usuario } = useAuth()
  const { sedes, sedeId } = useSede()
  const [cargas, setCargas] = useState([])
  const [docentes, setDocentes] = useState([])
  const [asignaturas, setAsignaturas] = useState([])
  const [anios, setAnios] = useState([])
  const [grupos, setGrupos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroDocente, setFiltroDocente] = useState('')
  const [filtroGrupo, setFiltroGrupo] = useState('')
  const [filtroAnio, setFiltroAnio] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const puedeGestionar = ['super_admin', 'admin', 'secretaria'].includes(usuario?.tipoPerfil)
  const puedeEliminar = ['super_admin', 'admin'].includes(usuario?.tipoPerfil)

  const cargarTodo = async () => {
    setLoading(true)
    setError('')
    try {
      const paramsDoc = { tipoPerfil: 'docente' }
      if (sedeId) paramsDoc.sedeId = sedeId
      const [resCargas, resDocentes, resAsig, resAnios, resGrupos] = await Promise.all([
        api.get('/carga-academica', { params: sedeId ? { sedeId } : {} }),
        api.get('/usuarios', { params: paramsDoc }),
        api.get('/asignaturas'),
        api.get('/anios-academicos'),
        api.get('/grupos', { params: sedeId ? { sedeId } : {} })
      ])
      setCargas(resCargas.data.data)
      setDocentes(resDocentes.data.data)
      setAsignaturas(resAsig.data.data)
      setAnios(resAnios.data.data)
      setGrupos(resGrupos.data.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarTodo() }, [sedeId])

  const docenteLabel = (id) => {
    const d = docentes.find(x => String(x._id) === String(id))
    return d ? `${d.nombres} ${d.apellidos}` : '—'
  }
  const asignaturaLabel = (id) => {
    const a = asignaturas.find(x => String(x._id) === String(id))
    return a ? a.nombre : '—'
  }
  const grupoLabel = (id) => {
    const g = grupos.find(x => String(x._id) === String(id))
    if (!g) return '—'
    const s = sedes.find(x => String(x._id) === String(g.sedeId))
    return `${g.nombre} · Grado ${g.grado}${s ? ` · ${s.nombre}` : ''}`
  }
  const anioLabel = (id) => {
    const a = anios.find(x => String(x._id) === String(id))
    return a ? `Año ${a.anio}` : '—'
  }

  const visibles = cargas.filter(c => {
    if (filtroDocente && String(c.docenteId) !== filtroDocente) return false
    if (filtroGrupo && String(c.grupoId) !== filtroGrupo) return false
    if (filtroAnio && String(c.anioAcademicoId) !== filtroAnio) return false
    if (busqueda) {
      const texto = `${docenteLabel(c.docenteId)} ${asignaturaLabel(c.asignaturaId)} ${grupoLabel(c.grupoId)}`.toLowerCase()
      if (!texto.includes(busqueda.toLowerCase())) return false
    }
    return true
  })

  const abrirCrear = () => {
    setEditing(null)
    setForm({ horasSemanales: 4, puedeCalificar: true, estado: 'activo', anioAcademicoId: '' })
    setModal(true)
    setError('')
  }

  const abrirEditar = (c) => {
    setEditing(c)
    setForm({
      docenteId: c.docenteId,
      anioAcademicoId: c.anioAcademicoId,
      grupoId: c.grupoId,
      asignaturaId: c.asignaturaId,
      horasSemanales: c.horasSemanales ?? 4,
      puedeCalificar: c.puedeCalificar !== false,
      estado: c.estado || 'activo'
    })
    setModal(true)
    setError('')
  }

  const guardar = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await api.put(`/carga-academica/${editing._id}`, form)
      } else {
        await api.post('/carga-academica', form)
      }
      setModal(false)
      await cargarTodo()
    } catch (err) {
      const mensaje = err.response?.data?.message
      setError(mensaje && mensaje.includes('duplicate') ? 'Ese grupo ya tiene esa asignatura asignada' : (mensaje || 'Error al guardar'))
    } finally {
      setSaving(false)
    }
  }

  const eliminar = async (c) => {
    if (!confirm(`¿Eliminar la carga de ${docenteLabel(c.docenteId)} en ${grupoLabel(c.grupoId)}?`)) return
    try {
      await api.delete(`/carga-academica/${c._id}`)
      await cargarTodo()
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar')
    }
  }

  const gruposAnio = form.anioAcademicoId
    ? grupos.filter(g => String(g.anioAcademicoId) === form.anioAcademicoId)
    : grupos

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Carga Académica</h1>
            <p className="text-sm text-gray-500">Asigna profesores a asignaturas por grupo (grado) y año lectivo</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <TextField
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar..."
                size="small"
                className="w-44 sm:w-56"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search className="w-4 h-4 text-gray-400" />
                      </InputAdornment>
                    )
                  }
                }}
              />
            </div>
            {puedeGestionar && (
              <Button onClick={abrirCrear} variant="contained" color="primary" size="small" className="!normal-case !text-sm !font-medium !py-2 !px-4" startIcon={<Plus className="w-4 h-4" />}>
                Nueva Carga
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-400" />
          <FormControl size="small" className="min-w-40">
            <Select value={filtroDocente} onChange={(e) => setFiltroDocente(e.target.value)} displayEmpty className="text-sm">
              <MenuItem value="">Todos los profesores</MenuItem>
              {docentes.map(d => (
                <MenuItem key={d._id} value={d._id}>{d.nombres} {d.apellidos}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" className="min-w-40">
            <Select value={filtroGrupo} onChange={(e) => setFiltroGrupo(e.target.value)} displayEmpty className="text-sm">
              <MenuItem value="">Todos los grupos</MenuItem>
              {grupos.map(g => (
                <MenuItem key={g._id} value={g._id}>{g.nombre} · Grado {g.grado}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" className="min-w-40">
            <Select value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)} displayEmpty className="text-sm">
              <MenuItem value="">Todos los años</MenuItem>
              {anios.map(a => (
                <MenuItem key={a._id} value={a._id}>Año {a.anio}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <span className="text-sm text-gray-500 ml-auto">{visibles.length} carga{visibles.length === 1 ? '' : 's'}</span>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

        <div className="overflow-x-auto">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Profesor</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Asignatura</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Grupo / Grado</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Año</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Horas sem.</TableCell>
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
                ) : visibles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="!text-center !py-8 !text-gray-500">
                      No hay cargas académicas registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  visibles.map(c => (
                    <TableRow key={c._id} hover>
                      <TableCell className="!text-sm !font-medium !text-gray-900 !py-3">{docenteLabel(c.docenteId)}</TableCell>
                      <TableCell className="!text-sm !text-gray-700 !py-3">{asignaturaLabel(c.asignaturaId)}</TableCell>
                      <TableCell className="!text-sm !text-gray-700 !py-3">{grupoLabel(c.grupoId)}</TableCell>
                      <TableCell className="!text-sm !text-gray-700 !py-3">{anioLabel(c.anioAcademicoId)}</TableCell>
                      <TableCell className="!text-sm !text-gray-700 !py-3">{c.horasSemanales ?? 4}</TableCell>
                      <TableCell className="!text-sm !py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                          {c.estado}
                        </span>
                      </TableCell>
                      <TableCell className="!text-sm !py-3 !text-right whitespace-nowrap">
                        {puedeGestionar && (
                          <Button size="small" color="primary" onClick={() => abrirEditar(c)} className="!normal-case !text-sm !font-medium mr-3" startIcon={<Pencil className="w-3.5 h-3.5" />}>
                            Editar
                          </Button>
                        )}
                        {puedeEliminar && (
                          <Button size="small" color="error" onClick={() => eliminar(c)} className="!normal-case !text-sm !font-medium" startIcon={<Trash2 className="w-3.5 h-3.5" />}>
                            Eliminar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>

      <Dialog open={modal} onClose={() => setModal(false)} fullWidth maxWidth="sm">
        <DialogTitle className="flex items-center justify-between pr-2">
          <span>{editing ? 'Editar carga' : 'Nueva carga académica'}</span>
          <IconButton onClick={() => setModal(false)} aria-label="Cerrar modal" size="small">
            <X className="w-5 h-5" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={guardar}>
          <DialogContent className="!pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Profesor <span className="text-red-500">*</span></label>
                <FormControl fullWidth size="small">
                  <Select value={form.docenteId || ''} onChange={(e) => setForm({ ...form, docenteId: e.target.value })} required displayEmpty>
                    <MenuItem value="">Seleccionar...</MenuItem>
                    {docentes.map(d => (
                      <MenuItem key={d._id} value={d._id}>{d.nombres} {d.apellidos}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Año Académico <span className="text-red-500">*</span></label>
                <FormControl fullWidth size="small">
                  <Select value={form.anioAcademicoId || ''} onChange={(e) => setForm({ ...form, anioAcademicoId: e.target.value, grupoId: '' })} required displayEmpty>
                    <MenuItem value="">Seleccionar...</MenuItem>
                    {anios.map(a => (
                      <MenuItem key={a._id} value={a._id}>Año {a.anio}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo (grado) <span className="text-red-500">*</span></label>
                <FormControl fullWidth size="small">
                  <Select value={form.grupoId || ''} onChange={(e) => setForm({ ...form, grupoId: e.target.value })} required displayEmpty>
                    <MenuItem value="">Seleccionar...</MenuItem>
                    {gruposAnio.map(g => (
                      <MenuItem key={g._id} value={g._id}>{g.nombre} · Grado {g.grado}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asignatura <span className="text-red-500">*</span></label>
                <FormControl fullWidth size="small">
                  <Select value={form.asignaturaId || ''} onChange={(e) => setForm({ ...form, asignaturaId: e.target.value })} required displayEmpty>
                    <MenuItem value="">Seleccionar...</MenuItem>
                    {asignaturas.map(a => (
                      <MenuItem key={a._id} value={a._id}>{a.nombre}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horas semanales</label>
                <TextField type="number" size="small" fullWidth value={form.horasSemanales ?? 4}
                  onChange={(e) => setForm({ ...form, horasSemanales: e.target.value === '' ? '' : Number(e.target.value) })}
                  slotProps={{ htmlInput: { min: 1, max: 40 } }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <FormControl fullWidth size="small">
                  <Select value={form.estado || 'activo'} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                    <MenuItem value="activo">Activo</MenuItem>
                    <MenuItem value="inactivo">Inactivo</MenuItem>
                  </Select>
                </FormControl>
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <Checkbox checked={form.puedeCalificar !== false}
                    onChange={(e) => setForm({ ...form, puedeCalificar: e.target.checked })}
                    size="small" color="primary" className="!p-0.5" />
                  Puede calificar (la carga aparece en "Mis Clases")
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mt-4">{error}</div>
            )}
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