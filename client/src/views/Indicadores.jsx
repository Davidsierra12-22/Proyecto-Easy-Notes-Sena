import { useEffect, useState } from 'react'
import { Plus, RefreshCw, Pencil, Power, Search } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, TextField, Select, MenuItem, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel
} from '@mui/material'
import api from '../services/api.service'
import { useAuth } from '../store/Auth'

export default function Indicadores() {
  const { usuario } = useAuth()
  const puedeGestionar = ['super_admin', 'admin', 'rector', 'coordinador', 'docente'].includes(usuario?.tipoPerfil)

  const [anios, setAnios] = useState([])
  const [asignaturas, setAsignaturas] = useState([])
  const [filtros, setFiltros] = useState({})
  const [indicadores, setIndicadores] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({})
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [numeroPeriodos, setNumeroPeriodos] = useState(5)

  const cargarDependencias = async () => {
    try {
      const [resAnio, resAsig] = await Promise.all([
        api.get('/anios-academicos'),
        api.get('/asignaturas')
      ])
      setAnios(resAnio.data.data)
      setAsignaturas(resAsig.data.data)
      const activo = resAnio.data.data.find(a => a.estado === 'activo')
      if (activo) {
        setFiltros(prev => ({ ...prev, anioAcademicoId: activo._id }))
        if (activo.configuracion?.numeroPeriodos) setNumeroPeriodos(activo.configuracion.numeroPeriodos)
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar')
    }
  }

  useEffect(() => { cargarDependencias() }, [])

  const cargar = async () => {
    if (!filtros.asignaturaId || !filtros.periodo) {
      setError('Selecciona asignatura y período')
      return
    }
    setLoading(true)
    setError('')
    try {
      const r = await api.get(`/indicadores/asignatura/${filtros.asignaturaId}/periodo/${filtros.periodo}`)
      setIndicadores(r.data.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar indicadores')
    } finally {
      setLoading(false)
    }
  }

  const abrirCrear = () => {
    setForm({ anioAcademicoId: filtros.anioAcademicoId, asignaturaId: filtros.asignaturaId, periodo: Number(filtros.periodo), peso: 0, orden: 0 })
    setEditing(null)
    setModal(true)
    setError('')
  }

  const abrirEditar = (item) => {
    setForm({
      anioAcademicoId: item.anioAcademicoId,
      asignaturaId: item.asignaturaId,
      periodo: item.periodo,
      codigo: item.codigo || '',
      descripcion: item.descripcion,
      peso: item.peso || 0,
      orden: item.orden || 0
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
      if (editing) {
        await api.put(`/indicadores/${editing._id}`, form)
      } else {
        await api.post('/indicadores', form)
      }
      setModal(false)
      await cargar()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const cambiarEstado = async (item) => {
    try {
      await api.put(`/indicadores/${item._id}`, { estado: item.estado === 'activo' ? 'inactivo' : 'activo' })
      await cargar()
    } catch (e) {
      alert(e.response?.data?.message || 'Error al cambiar estado')
    }
  }

  const nombreAsig = (id) => asignaturas.find(a => a._id === id)?.nombre || '—'

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h1 className="text-xl font-bold text-gray-900">Indicadores de Desempeño</h1>
          <div className="flex items-center gap-2">
            <IconButton onClick={cargar} aria-label="Recargar indicadores" title="Recargar indicadores" size="small">
              <RefreshCw className="w-4 h-4" />
            </IconButton>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <FormControl fullWidth size="small">
              <InputLabel id="anio-academico-label">Año Académico</InputLabel>
              <Select labelId="anio-academico-label" value={filtros.anioAcademicoId} onChange={(e) => setFiltros({ ...filtros, anioAcademicoId: e.target.value })} label="Año Académico">
                <MenuItem value="">Seleccionar...</MenuItem>
                {anios.map(a => <MenuItem key={a._id} value={a._id}>Año {a.anio}</MenuItem>)}
              </Select>
            </FormControl>
          </div>
          <div>
            <FormControl fullWidth size="small">
              <InputLabel id="asignatura-label">Asignatura</InputLabel>
              <Select labelId="asignatura-label" value={filtros.asignaturaId} onChange={(e) => setFiltros({ ...filtros, asignaturaId: e.target.value })} label="Asignatura">
                <MenuItem value="">Seleccionar...</MenuItem>
                {asignaturas.map(a => <MenuItem key={a._id} value={a._id}>{a.nombre}</MenuItem>)}
              </Select>
            </FormControl>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <FormControl fullWidth size="small">
                <InputLabel id="periodo-label">Período</InputLabel>
                <Select labelId="periodo-label" value={filtros.periodo} onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })} label="Período">
                  <MenuItem value="">Período...</MenuItem>
                  {Array.from({ length: numeroPeriodos }, (_, i) => i + 1).map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                </Select>
              </FormControl>
            </div>
            <Button onClick={cargar} variant="contained" color="primary" startIcon={<Search className="w-4 h-4" />}>Cargar</Button>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">
            {filtros.asignaturaId && filtros.periodo ? `${nombreAsig(filtros.asignaturaId)} · Período ${filtros.periodo}` : 'Selecciona los filtros'}
          </p>
          {puedeGestionar && filtros.asignaturaId && filtros.periodo && (
            <Button onClick={abrirCrear} variant="contained" color="primary" startIcon={<Plus className="w-4 h-4" />}>
              Nuevo Indicador
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider">Código</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider">Descripción</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider !text-center">Peso</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider !text-center">Orden</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider !text-right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="!text-center !py-8">
                      <CircularProgress size={24} className="!text-primary-600" />
                    </TableCell>
                  </TableRow>
                ) : indicadores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="!text-center !py-8 !text-gray-500">No hay indicadores para esta selección</TableCell>
                  </TableRow>
                ) : (
                  indicadores.map(i => (
                    <TableRow key={i._id} hover>
                      <TableCell className="!text-sm !font-medium !text-gray-900">
                        {i.codigo || '—'}
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${i.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{i.estado}</span>
                      </TableCell>
                      <TableCell className="!text-sm !text-gray-700">{i.descripcion}</TableCell>
                      <TableCell className="!text-sm !text-gray-700 !text-center">{i.peso ?? 0}%</TableCell>
                      <TableCell className="!text-sm !text-gray-700 !text-center">{i.orden || 0}</TableCell>
                      <TableCell className="!text-right whitespace-nowrap">
                        {puedeGestionar && (
                          <>
                            <Button onClick={() => abrirEditar(i)} size="small" className="!text-primary-600 hover:!text-primary-800 !normal-case !font-medium mr-3" startIcon={<Pencil className="w-4 h-4" />}>
                              Editar
                            </Button>
                            <Button onClick={() => cambiarEstado(i)} size="small" className={`!normal-case !font-medium ${
                              i.estado === 'activo' ? '!text-amber-600 hover:!text-amber-800' : '!text-emerald-600 hover:!text-emerald-800'
                            }`} startIcon={<Power className="w-4 h-4" />}>
                              {i.estado === 'activo' ? 'Desactivar' : 'Activar'}
                            </Button>
                          </>
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

      <Dialog open={modal} onClose={() => setModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="flex items-center justify-between pr-2">
          <span>{editing ? 'Editar Indicador' : 'Nuevo Indicador'}</span>
          <IconButton onClick={() => setModal(false)} aria-label="Cerrar modal" size="small">
            <span className="text-xl">&times;</span>
          </IconButton>
        </DialogTitle>
        <form onSubmit={guardar}>
          <DialogContent className="!pt-2">
            <div className="space-y-4">
              <TextField value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} required
                label="Descripción" placeholder="Ej: Resuelve problemas con números enteros" multiline minRows={3} fullWidth size="small" />
              <TextField type="text" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                label="Código" placeholder="Ej: MT-1-01" fullWidth size="small" />
              <div className="grid grid-cols-2 gap-4">
                <TextField type="number" value={form.peso} onChange={(e) => setForm({ ...form, peso: Number(e.target.value) })} min="0" max="100"
                  label="Peso (%)" fullWidth size="small" />
                <TextField type="number" value={form.orden} onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })} min="0"
                  label="Orden" fullWidth size="small" />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>}
            </div>
          </DialogContent>
          <DialogActions className="!px-6 !pb-5">
            <Button onClick={() => setModal(false)} className="!text-gray-700 hover:!bg-gray-100">Cancelar</Button>
            <Button type="submit" variant="contained" color="primary" disabled={saving}>
              {saving ? 'Guardando...' : (editing ? 'Actualizar' : 'Crear')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  )
}