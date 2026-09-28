import { useEffect, useState } from 'react'
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, TextField, Select, MenuItem, Checkbox, OutlinedInput,
  InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress
} from '@mui/material'
import {
  Plus, Search, LogOut, TrendingUp, TrendingDown, UserCheck, ArrowLeftRight, X
} from 'lucide-react'
import api from '../services/api.service'
import { useAuth } from '../store/Auth'
import { useSede } from '../store/General'
import { notificar } from '../store/notificacionStore'
import PaginationBar from '../components/Tables/PaginationBar'
import ConfirmDialog from '../components/ConfirmDialog'
import PromptDialog from '../components/PromptDialog'

const estadoBadge = (estado) => {
  const map = {
    activa: 'bg-emerald-100 text-emerald-700',
    retirada: 'bg-red-100 text-red-700',
    trasladada: 'bg-amber-100 text-amber-700',
    graduado: 'bg-primary-100 text-primary-800'
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[estado] || 'bg-gray-100 text-gray-600'}`}>{estado}</span>
}

const tipoLabel = {
  nueva: 'Nueva',
  renovacion: 'Renovación',
  traslado: 'Traslado',
  promovido: 'Promovido'
}

export default function Matriculas() {
  const { usuario } = useAuth()
  const { sedes, sedeId } = useSede()
  const [datos, setDatos] = useState([])
  const [estudiantes, setEstudiantes] = useState([])
  const [anios, setAnios] = useState([])
  const [grupos, setGrupos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroGrupo, setFiltroGrupo] = useState('')
  const [pagina, setPagina] = useState(1)
  const [paginacion, setPaginacion] = useState(null)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ tipoMatricula: 'nueva' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [seleccion, setSeleccion] = useState([])
  const [modalGrupo, setModalGrupo] = useState(false)
  const [formGrupo, setFormGrupo] = useState({})
  const [soloMatricula, setSoloMatricula] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [modalRetiro, setModalRetiro] = useState(false)
  const [retiroMatricula, setRetiroMatricula] = useState(null)
  const [retirando, setRetirando] = useState(false)
  const [confirmPromover, setConfirmPromover] = useState(null)
  const [promoviendo, setPromoviendo] = useState(false)

  const puedeGestionar = ['super_admin', 'admin', 'secretaria'].includes(usuario?.tipoPerfil)

  const validateMatricula = () => {
    const errs = {}
    if (!form.anioAcademicoId) errs.anioAcademicoId = 'Este campo es obligatorio'
    if (!form.estudianteId) errs.estudianteId = 'Este campo es obligatorio'
    if (!form.grupoId) errs.grupoId = 'Este campo es obligatorio'
    if (!form.fechaMatricula) errs.fechaMatricula = 'Este campo es obligatorio'
    return errs
  }

  const validateGrupo = () => {
    const errs = {}
    if (!formGrupo.grupoId) errs.grupoId = 'Este campo es obligatorio'
    return errs
  }

  const visibles = datos

  const toggleSelect = (id) => {
    setSeleccion(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const abrirCambio = (m = null) => {
    setSoloMatricula(m)
    setFormGrupo({ grupoId: '', fechaCambio: new Date().toISOString().slice(0, 10), observaciones: '' })
    setModalGrupo(true)
    setError('')
  }

  const aplicarCambio = async (e) => {
    e.preventDefault()
    const errs = validateGrupo()
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }
    setFieldErrors({})
    setSaving(true)
    setError('')
    try {
      const ids = soloMatricula ? [soloMatricula._id] : seleccion
      const r = await api.post('/matriculas/cambio-grupo', {
        ids,
        grupoId: formGrupo.grupoId,
        fechaCambio: formGrupo.fechaCambio || undefined,
        observaciones: formGrupo.observaciones || undefined
      })
      notificar(r.data.message)
      setModalGrupo(false)
      setSeleccion([])
      setSoloMatricula(null)
      await cargarMatriculas()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar de grupo')
    } finally {
      setSaving(false)
    }
  }

  const cargarMatriculas = async (page = pagina) => {
    setLoading(true)
    try {
      const params = { page, limit: 50 }
      if (busqueda) params.estado = busqueda
      if (sedeId) params.sedeId = sedeId
      if (filtroGrupo) params.grupoId = filtroGrupo
      const r = await api.get('/matriculas', { params })
      setDatos(r.data.data)
      setPaginacion(r.data.paginacion || null)
      setPagina(page)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  const cargarDependencias = async () => {
    try {
      const [resEst, resAnio, resGrupo] = await Promise.all([
        api.get('/usuarios?tipoPerfil=estudiante'),
        api.get('/anios-academicos'),
        api.get('/grupos')
      ])
      setEstudiantes(resEst.data.data)
      setAnios(resAnio.data.data)
      setGrupos(resGrupo.data.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar dependencias')
    }
  }

  useEffect(() => {
    cargarMatriculas(1)
    cargarDependencias()
  }, [sedeId])

  const crear = async (e) => {
    e.preventDefault()
    const errs = validateMatricula()
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }
    setFieldErrors({})
    setSaving(true)
    setError('')
    try {
      await api.post('/matriculas', {
        anioAcademicoId: form.anioAcademicoId,
        estudianteId: form.estudianteId,
        grupoId: form.grupoId,
        tipoMatricula: form.tipoMatricula,
        fechaMatricula: form.fechaMatricula || new Date().toISOString(),
        observaciones: form.observaciones
      })
      setModal(false)
      await cargarMatriculas()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear matrícula')
    } finally {
      setSaving(false)
    }
  }

  const retirar = async (obs, m) => {
    setRetirando(true)
    try {
      await api.put(`/matriculas/${m._id}/retirar`, { observaciones: obs })
      await cargarMatriculas()
      setModalRetiro(false)
      setRetiroMatricula(null)
      notificar('Estudiante retirado', 'success')
    } catch (e) {
      notificar(e.response?.data?.message || 'Error al retirar', 'error')
    } finally {
      setRetirando(false)
    }
  }

  const pedirPromover = (m) => setConfirmPromover({ m, tipo: 'promover' })

  const ejecutarPromocion = async (m, tipo) => {
    setPromoviendo(true)
    try {
      await api.put(`/matriculas/${m._id}/promover`, { promovido: tipo === 'promover' })
      await cargarMatriculas()
      setConfirmPromover(null)
      notificar(tipo === 'promover' ? 'Estudiante promovido al siguiente grado' : 'Estudiante marcado como repitente', 'success')
    } catch (e) {
      setConfirmPromover(null)
      notificar(e.response?.data?.message || e.response?.data?.data?.message || 'Error al actualizar', 'error')
    } finally {
      setPromoviendo(false)
    }
  }

  const estudianteLabel = (m) => {
    const e = m.estudianteId
    if (!e) return '—'
    return `${e.nombres} ${e.apellidos}`
  }

  const grupoLabel = (m) => {
    const g = m.grupoId
    if (!g) return '—'
    return typeof g === 'string' ? g : `${g.nombre} (Grado ${g.grado})`
  }

  const sedeLabel = (m) => {
    const g = typeof m.grupoId === 'object' ? m.grupoId : grupos.find(x => x._id === m.grupoId)
    if (!g) return '—'
    const s = sedes.find(x => x._id === g.sedeId)
    return s?.nombre || '—'
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Matrículas</h1>
            <p className="text-sm text-gray-500">Inscripción de estudiantes a grupos por año lectivo</p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setTimeout(() => cargarMatriculas(1), 0) }}
              input={<OutlinedInput startAdornment={<InputAdornment position="start"><Search className="w-4 h-4 text-gray-400" /></InputAdornment>} />}
              size="small"
              sx={{ bgcolor: '#ffffff', minWidth: 170, fontSize: '0.875rem', '& fieldset': { borderColor: '#e5e7eb' } }}
            >
              <MenuItem value="">Todos los estados</MenuItem>
              <MenuItem value="activa">Activas</MenuItem>
              <MenuItem value="retirada">Retiradas</MenuItem>
              <MenuItem value="graduado">Graduados</MenuItem>
            </Select>
            <Select
              value={filtroGrupo}
              onChange={(e) => { setFiltroGrupo(e.target.value); setTimeout(() => cargarMatriculas(1), 0) }}
              size="small"
              sx={{ bgcolor: '#ffffff', minWidth: 170, fontSize: '0.875rem', '& fieldset': { borderColor: '#e5e7eb' } }}
            >
              <MenuItem value="">Todos los grupos</MenuItem>
              {grupos.map(g => (
                <MenuItem key={g._id} value={g._id}>{g.nombre}{g.jornada ? ` · ${g.jornada}` : ''} (Grado {g.grado})</MenuItem>
              ))}
            </Select>
            {puedeGestionar && seleccion.length > 0 && (
              <Button
                onClick={() => abrirCambio()}
                variant="contained"
                className="!bg-amber-600 hover:!bg-amber-700 !normal-case text-sm font-medium px-4 py-2"
                startIcon={<ArrowLeftRight className="w-4 h-4" />}
              >
                Cambiar grupo ({seleccion.length})
              </Button>
            )}
            {puedeGestionar && (
              <Button
                onClick={() => { setForm({ tipoMatricula: 'nueva' }); setModal(true); setError('') }}
                variant="contained"
                color="primary"
                className="!normal-case text-sm font-medium px-4 py-2"
                startIcon={<Plus className="w-4 h-4" />}
              >
                Nueva Matrícula
              </Button>
            )}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow className="bg-gray-50">
                <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap !w-10">
                  {puedeGestionar && <Checkbox size="small" color="primary"
                    checked={seleccion.length > 0 && datos.filter(m => m.estado === 'activa').length === seleccion.length}
                    onChange={(e) => {
                      if (e.target.checked) setSeleccion(datos.filter(m => m.estado === 'activa').map(m => m._id))
                      else setSeleccion([])
                    }} />}
                </TableCell>
                <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Estudiante</TableCell>
                <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Documento</TableCell>
                <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Sede</TableCell>
                <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Grupo</TableCell>
                <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Tipo</TableCell>
                <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Estado</TableCell>
                <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Fecha</TableCell>
                <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider !text-right whitespace-nowrap">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="!text-center !py-8 !text-gray-500">
                    <CircularProgress size={24} className="!text-primary-600" />
                  </TableCell>
                </TableRow>
              ) : datos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="!text-center !py-8 !text-gray-500">No hay matrículas registradas</TableCell>
                </TableRow>
              ) : visibles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="!text-center !py-8 !text-gray-500">No hay estudiantes para el grupo seleccionado</TableCell>
                </TableRow>
              ) : (
                visibles.map(m => (
                  <TableRow key={m._id} hover className={m.estado !== 'activa' ? 'bg-gray-50' : ''}>
                    <TableCell className="!py-3">
                      {m.estado === 'activa' && puedeGestionar && (
                        <Checkbox size="small" color="primary" checked={seleccion.includes(m._id)} onChange={() => toggleSelect(m._id)} />
                      )}
                    </TableCell>
                    <TableCell className={`!text-sm !font-medium !py-3 ${m.estado !== 'activa' ? '!text-gray-400' : '!text-gray-900'}`}>{estudianteLabel(m)}</TableCell>
                    <TableCell className="!text-sm !text-gray-700 !py-3">{m.estudianteId?.documento || '—'}</TableCell>
                    <TableCell className="!text-sm !text-gray-700 !py-3">{sedeLabel(m)}</TableCell>
                    <TableCell className="!text-sm !text-gray-700 !py-3">{grupoLabel(m)}</TableCell>
                    <TableCell className="!text-sm !text-gray-700 !py-3">{tipoLabel[m.tipoMatricula] || m.tipoMatricula}</TableCell>
                    <TableCell className="!py-3">{estadoBadge(m.estado)}</TableCell>
                    <TableCell className="!text-sm !text-gray-500 !py-3">{new Date(m.fechaMatricula).toLocaleDateString('es-CO')}</TableCell>
                    <TableCell className="!py-3 !text-right whitespace-nowrap">
                      {m.estado === 'activa' && (
                        <>
                          <Button onClick={() => abrirCambio(m)} title="Cambiar de grupo"
                            className="!text-amber-600 hover:!text-amber-800 !normal-case text-sm font-medium mr-2" size="small"
                            startIcon={<ArrowLeftRight className="w-4 h-4" />}>
                            Grupo
                          </Button>
                          <Button onClick={() => pedirPromover(m)} title="Promover al siguiente grado"
                            className="!text-emerald-600 hover:!text-emerald-800 !normal-case text-sm font-medium mr-2" size="small"
                            startIcon={<TrendingUp className="w-4 h-4" />}>
                            Promover
                          </Button>
                          <Button onClick={() => setConfirmPromover({ m, tipo: 'repitente' })} title="Marcar como repitente"
                            className="!text-amber-600 hover:!text-amber-800 !normal-case text-sm font-medium mr-2" size="small"
                            startIcon={<TrendingDown className="w-4 h-4" />}>
                            Repite
                          </Button>
                          <Button onClick={() => { setRetiroMatricula(m); setRetiroObs(''); setModalRetiro(true) }} title="Retirar estudiante"
                            className="!text-red-600 hover:!text-red-800 !normal-case text-sm font-medium" size="small"
                            startIcon={<LogOut className="w-4 h-4" />}>
                            Retirar
                          </Button>
                        </>
                      )}
                      {m.estado === 'retirada' && (
                        <span className="text-sm text-gray-400">Retirado</span>
                      )}
                      {m.promovido === true && (
                        <span className="text-sm text-emerald-600 inline-flex items-center gap-1"><UserCheck className="w-4 h-4" /> Promovido</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {paginacion && (
          <PaginationBar
            pagina={paginacion.pagina}
            total={paginacion.total}
            limite={paginacion.limite}
            totalPaginas={paginacion.totalPaginas}
            onCambio={(p) => cargarMatriculas(p)}
          />
        )}
      </div>

      <Dialog open={modal} onClose={() => setModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="flex items-center justify-between pr-2">
          <span>Nueva Matrícula</span>
          <IconButton onClick={() => { setModal(false); setError('') }} aria-label="Cerrar modal de matricula" size="small">
            <X className="w-5 h-5" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={crear}>
          <DialogContent className="!pt-2 !pb-0">
            <div className="space-y-4">
              <div>
                <TextField select label="Año Académico" value={form.anioAcademicoId}
                  onChange={(e) => { setForm({ ...form, anioAcademicoId: e.target.value }); if (fieldErrors.anioAcademicoId) setFieldErrors(prev => ({ ...prev, anioAcademicoId: '' })) }} fullWidth>
                  <MenuItem value="">Seleccionar año...</MenuItem>
                  {anios.map(a => <MenuItem key={a._id} value={a._id}>Año {a.anio} ({a.estado})</MenuItem>)}
                </TextField>
                {fieldErrors.anioAcademicoId && <p className="text-xs text-red-500 mt-1">{fieldErrors.anioAcademicoId}</p>}
              </div>
              <div>
                <TextField select label="Estudiante" value={form.estudianteId}
                  onChange={(e) => { setForm({ ...form, estudianteId: e.target.value }); if (fieldErrors.estudianteId) setFieldErrors(prev => ({ ...prev, estudianteId: '' })) }} fullWidth>
                  <MenuItem value="">Seleccionar estudiante...</MenuItem>
                  {estudiantes.map(s => <MenuItem key={s._id} value={s._id}>{s.nombres} {s.apellidos} - {s.documento}</MenuItem>)}
                </TextField>
                {fieldErrors.estudianteId && <p className="text-xs text-red-500 mt-1">{fieldErrors.estudianteId}</p>}
              </div>
              <div>
                <TextField select label="Grupo" value={form.grupoId}
                  onChange={(e) => { setForm({ ...form, grupoId: e.target.value }); if (fieldErrors.grupoId) setFieldErrors(prev => ({ ...prev, grupoId: '' })) }} fullWidth>
                  <MenuItem value="">Seleccionar grupo...</MenuItem>
                  {grupos.map(g => <MenuItem key={g._id} value={g._id}>{g.nombre} (Grado {g.grado})</MenuItem>)}
                </TextField>
                {fieldErrors.grupoId && <p className="text-xs text-red-500 mt-1">{fieldErrors.grupoId}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <TextField select label="Tipo de Matrícula" value={form.tipoMatricula}
                    onChange={(e) => setForm({ ...form, tipoMatricula: e.target.value })} fullWidth>
                    {Object.entries(tipoLabel).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                  </TextField>
                </div>
                <div>
                  <TextField type="date" label="Fecha" value={form.fechaMatricula ? form.fechaMatricula.slice(0, 10) : ''}
                    onChange={(e) => { setForm({ ...form, fechaMatricula: e.target.value }); if (fieldErrors.fechaMatricula) setFieldErrors(prev => ({ ...prev, fechaMatricula: '' })) }} fullWidth
                    slotProps={{ inputLabel: { shrink: true } }} />
                  {fieldErrors.fechaMatricula && <p className="text-xs text-red-500 mt-1">{fieldErrors.fechaMatricula}</p>}
                </div>
              </div>
              <div>
                <TextField label="Observaciones" value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })} multiline minRows={2} fullWidth />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>}
            </div>
          </DialogContent>
          <DialogActions className="!px-6 !pb-5">
            <Button onClick={() => setModal(false)} className="!text-gray-700 hover:!bg-gray-100">Cancelar</Button>
            <Button type="submit" variant="contained" color="primary" disabled={saving}>
              {saving ? 'Creando...' : 'Crear Matrícula'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={modalGrupo} onClose={() => setModalGrupo(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="flex items-center justify-between pr-2">
          <span>Cambiar de grupo (MT-002)</span>
          <IconButton onClick={() => { setModalGrupo(false); setError('') }} aria-label="Cerrar modal de cambio de grupo" size="small">
            <X className="w-5 h-5" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={aplicarCambio}>
          <DialogContent className="!pt-2 !pb-0">
            <div className="space-y-4">
              <div className="text-sm font-medium text-gray-700">
                {soloMatricula
                  ? `Estudiante: ${soloMatricula.estudianteId?.nombres} ${soloMatricula.estudianteId?.apellidos}`
                  : `Estudiantes seleccionados: ${seleccion.length}`}
              </div>
              <div>
                <TextField select label="Grupo destino" value={formGrupo.grupoId}
                  onChange={(e) => { setFormGrupo({ ...formGrupo, grupoId: e.target.value }); if (fieldErrors.grupoId) setFieldErrors(prev => ({ ...prev, grupoId: '' })) }} fullWidth>
                  <MenuItem value="">Seleccionar grupo...</MenuItem>
                  {grupos.map(g => <MenuItem key={g._id} value={g._id}>{g.nombre} (Grado {g.grado})</MenuItem>)}
                </TextField>
                {fieldErrors.grupoId && <p className="text-xs text-red-500 mt-1">{fieldErrors.grupoId}</p>}
              </div>
              <div>
                <TextField type="date" label="Fecha del cambio" value={formGrupo.fechaCambio}
                  onChange={(e) => setFormGrupo({ ...formGrupo, fechaCambio: e.target.value })} fullWidth
                  slotProps={{ inputLabel: { shrink: true } }} />
              </div>
              <div>
                <TextField label="Observaciones" value={formGrupo.observaciones}
                  onChange={(e) => setFormGrupo({ ...formGrupo, observaciones: e.target.value })} multiline minRows={2} fullWidth />
              </div>
              <p className="text-xs text-gray-500">Las calificaciones del estudiante se conservan en el nuevo grupo y se notifica al director del grupo destino.</p>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>}
            </div>
          </DialogContent>
          <DialogActions className="!px-6 !pb-5">
            <Button onClick={() => setModalGrupo(false)} className="!text-gray-700 hover:!bg-gray-100">Cancelar</Button>
            <Button type="submit" variant="contained" color="primary" disabled={saving}>
              {saving ? 'Aplicando...' : 'Aplicar cambio'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <PromptDialog
        open={modalRetiro}
        title="Retirar estudiante"
        message={`¿Retirar a ${retiroMatricula?.estudianteId?.nombres || ''} ${retiroMatricula?.estudianteId?.apellidos || ''}?`}
        label="Motivo de retiro"
        confirmText="Retirar"
        cancelText="Cancelar"
        color="error"
        required
        loading={retirando}
        placeholder="Motivo de retiro"
        onCancel={() => { setModalRetiro(false); setRetiroMatricula(null) }}
        onConfirm={(obs) => retirar(obs, retiroMatricula) }
      />

      <ConfirmDialog
        open={!!confirmPromover}
        title={confirmPromover?.tipo === 'promover' ? 'Promover estudiante' : 'Marcar como repitente'}
        message={confirmPromover?.m
          ? `¿${confirmPromover.tipo === 'promover' ? 'Promover al siguiente grado a' : 'Marcar como NO promovido (repitente) a'} ${confirmPromover.m.estudianteId?.nombres || ''} ${confirmPromover.m.estudianteId?.apellidos || ''}?`
          : ''}
        confirmText={confirmPromover?.tipo === 'promover' ? 'Promover' : 'Marcar como repitente'}
        cancelText="Cancelar"
        color="primary"
        loading={promoviendo}
        onCancel={() => setConfirmPromover(null)}
        onConfirm={() => confirmPromover && ejecutarPromocion(confirmPromover.m, confirmPromover.tipo)}
      />
    </div>
  )
}