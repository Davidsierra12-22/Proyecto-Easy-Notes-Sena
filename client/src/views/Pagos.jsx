import { useEffect, useState } from 'react'
import { Plus, RefreshCw, Search, HandCoins, X } from 'lucide-react'
import { TextField, Select, MenuItem, Button, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel } from '@mui/material'
import api from '../services/api.service'
import { useAuth } from '../store/Auth'
import PaginationBar from '../components/Tables/PaginationBar'

const estadoBadge = (estado) => {
  const map = {
    pendiente: 'bg-amber-100 text-amber-700',
    pagado: 'bg-emerald-100 text-emerald-700',
    vencido: 'bg-red-100 text-red-700',
    anulado: 'bg-gray-100 text-gray-600'
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[estado] || 'bg-gray-100 text-gray-600'}`}>{estado}</span>
}

const METODOS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'consignacion', label: 'Consignación' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'otro', label: 'Otro' }
]

export default function Pagos() {
  const { usuario } = useAuth()
  const puedeGestionar = ['super_admin', 'admin', 'secretaria'].includes(usuario?.tipoPerfil)

  const [datos, setDatos] = useState([])
  const [conceptos, setConceptos] = useState([])
  const [estudiantes, setEstudiantes] = useState([])
  const [anios, setAnios] = useState([])
  const [filtroEstado, setFiltroEstado] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({})
  const [registrando, setRegistrando] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [paginacion, setPaginacion] = useState(null)

  const cargar = async (page = pagina) => {
    setLoading(true)
    try {
      const params = { page, limit: 50 }
      if (filtroEstado) params.estado = filtroEstado
      const r = await api.get('/pagos', { params })
      setDatos(r.data.data)
      setPaginacion(r.data.paginacion || null)
      setPagina(page)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar pagos')
    } finally {
      setLoading(false)
    }
  }

  const cargarDependencias = async () => {
    try {
      const [resConc, resEst, resAnio] = await Promise.all([
        api.get('/conceptos-contables'),
        api.get('/usuarios?tipoPerfil=estudiante'),
        api.get('/anios-academicos')
      ])
      setConceptos(resConc.data.data)
      setEstudiantes(resEst.data.data)
      setAnios(resAnio.data.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar dependencias')
    }
  }

  useEffect(() => {
    cargar()
    if (puedeGestionar) cargarDependencias()
  }, [])

  const concepto = (id) => conceptos.find(c => c._id === id)

  const onSelectConcepto = (id) => {
    const c = concepto(id)
    const valor = c?.valor || 0
    setForm({
      ...form,
      conceptoId: id,
      valor: valor,
      valorFinal: valor
    })
  }

  const recompute = (patch) => {
    const valor = Number(patch.valor ?? form.valor) || 0
    const descuento = Number(patch.descuento ?? form.descuento) || 0
    const recargo = Number(patch.recargo ?? form.recargo) || 0
    setForm({ ...form, ...patch, valorFinal: valor - descuento + recargo })
  }

  const crear = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/pagos', {
        anioAcademicoId: form.anioAcademicoId,
        estudianteId: form.estudianteId,
        conceptoId: form.conceptoId,
        valor: Number(form.valor),
        descuento: Number(form.descuento || 0),
        recargo: Number(form.recargo || 0),
        valorFinal: Number(form.valorFinal),
        fechaVencimiento: form.fechaVencimiento || new Date().toISOString(),
        observaciones: form.observaciones
      })
      setModal(false)
      await cargar()
      setExito('Pago generado correctamente')
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el pago')
    } finally {
      setSaving(false)
    }
  }

  const registrarPago = async (pago) => {
    const metodo = window.prompt(`Registrar pago de $${Number(pago.valorFinal).toLocaleString('es-CO')}\n\nMétodo de pago (${METODOS.map(m => m.value).join(', ')}):`, 'efectivo')
    if (!metodo) return
    setRegistrando(true)
    setError('')
    try {
      await api.put(`/pagos/${pago._id}/registrar-pago`, { metodoPago: metodo.toLowerCase() })
      await cargar()
      setExito('Pago registrado correctamente')
    } catch (e) {
      setError(e.response?.data?.message || 'Error al registrar pago')
    } finally {
      setRegistrando(false)
    }
  }

  const totalCartera = () => datos.filter(d => d.estado !== 'anulado').reduce((a, b) => a + b.valorFinal, 0)
  const totalPagado = () => datos.filter(d => d.estado === 'pagado').reduce((a, b) => a + b.valorFinal, 0)
  const totalPendiente = () => datos.filter(d => ['pendiente', 'vencido'].includes(d.estado)).reduce((a, b) => a + b.valorFinal, 0)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h1 className="text-xl font-bold text-gray-900">Pagos / Cartera</h1>
          <div className="flex items-center gap-2">
            <FormControl size="small" sx={{ minWidth: 176 }}>
              <InputLabel id="filtro-estado-label">Todos los estados</InputLabel>
              <Select labelId="filtro-estado-label" value={filtroEstado} onChange={(e) => { setFiltroEstado(e.target.value); setTimeout(() => cargar(1), 0) }} label="Todos los estados" startAdornment={<Search className="w-4 h-4 mr-1 text-gray-400" />}>
                <MenuItem value="">Todos los estados</MenuItem>
                <MenuItem value="pendiente">Pendientes</MenuItem>
                <MenuItem value="pagado">Pagados</MenuItem>
                <MenuItem value="vencido">Vencidos</MenuItem>
                <MenuItem value="anulado">Anulados</MenuItem>
              </Select>
            </FormControl>
            <IconButton onClick={cargar} aria-label="Recargar pagos" title="Recargar pagos" size="small">
              <RefreshCw className="w-4 h-4" />
            </IconButton>
            {puedeGestionar && (
              <Button variant="contained" color="primary" onClick={() => { setForm({}); setModal(true); setError('') }} startIcon={<Plus className="w-4 h-4" />}>
                Generar Pago
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-500 uppercase">Total cartera</p>
            <p className="text-2xl font-bold text-gray-900">${totalCartera().toLocaleString('es-CO')}</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
            <p className="text-xs text-emerald-600 uppercase">Recaudado</p>
            <p className="text-2xl font-bold text-emerald-700">${totalPagado().toLocaleString('es-CO')}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-xs text-red-600 uppercase">Pendiente</p>
            <p className="text-2xl font-bold text-red-700">${totalPendiente().toLocaleString('es-CO')}</p>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
        {exito && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-3 py-2 mb-4">{exito}</div>}

        <div className="overflow-x-auto">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3 !text-left">Estudiante</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3 !text-left">Concepto</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3 !text-right">Valor</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3 !text-right">Descto</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3 !text-right">Total</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3 !text-left">Vencimiento</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3 !text-left">Estado</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !px-4 !py-3 !text-right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody className="bg-white">
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="!px-4 !py-8 !text-center">
                    <CircularProgress size={24} className="!text-primary-600" />
                  </TableCell></TableRow>
                ) : datos.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="!px-4 !py-8 !text-center !text-gray-500">No hay pagos registrados</TableCell></TableRow>
                ) : datos.map((p) => (
                      <TableRow key={p._id}>
                      <TableCell className="!px-4 !py-3 !text-sm !font-medium !text-gray-900">
                        {p.estudianteId ? `${p.estudianteId.nombres || p.estudianteId.nombre || ''} ${p.estudianteId.apellidos || p.estudianteId.apellido || ''}` : '—'}
                      </TableCell>
                      <TableCell className="!px-4 !py-3 !text-sm !text-gray-700">{p.conceptoId?.nombre || '—'}</TableCell>
                      <TableCell className="!px-4 !py-3 !text-sm !text-right !text-gray-700">${Number(p.valor).toLocaleString('es-CO')}</TableCell>
                      <TableCell className="!px-4 !py-3 !text-sm !text-right !text-gray-700">{p.descuento ? `-$${Number(p.descuento).toLocaleString('es-CO')}` : '—'}</TableCell>
                      <TableCell className="!px-4 !py-3 !text-sm !text-right !font-bold !text-gray-900">${Number(p.valorFinal).toLocaleString('es-CO')}</TableCell>
                      <TableCell className="!px-4 !py-3 !text-sm !text-gray-500">{p.fechaVencimiento ? new Date(p.fechaVencimiento).toLocaleDateString('es-CO') : '—'}</TableCell>
                      <TableCell className="!px-4 !py-3">{estadoBadge(p.estado)}</TableCell>
                      <TableCell className="!px-4 !py-3 !text-right whitespace-nowrap">
                        {['pendiente', 'vencido'].includes(p.estado) && puedeGestionar && (
                          <Button onClick={() => registrarPago(p)} disabled={registrando} color="success" size="small" startIcon={<HandCoins className="w-4 h-4" />}>
                            Registrar pago
                          </Button>
                        )}
                        {p.estado === 'pagado' && <span className="text-sm text-emerald-600">Pagado</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          </TableContainer>
        </div>

        {paginacion && (
          <PaginationBar
            pagina={paginacion.pagina}
            total={paginacion.total}
            limite={paginacion.limite}
            totalPaginas={paginacion.totalPaginas}
            onCambio={(p) => cargar(p)}
          />
        )}
      </div>

      <Dialog open={modal} onClose={() => setModal(false)} fullWidth maxWidth="sm">
        <DialogTitle className="flex items-center justify-between pr-2">
          <span>Generar Pago</span>
          <IconButton onClick={() => { setModal(false); setError('') }} aria-label="Cerrar modal de pago" size="small">
            <X className="w-5 h-5" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={crear}>
          <DialogContent className="!pt-2">
            <div className="space-y-4">
              <FormControl size="small" fullWidth required>
                <InputLabel id="estudiante-label">Estudiante *</InputLabel>
                <Select labelId="estudiante-label" value={form.estudianteId} onChange={(e) => setForm({ ...form, estudianteId: e.target.value })} label="Estudiante *">
                  <MenuItem value="">Seleccionar...</MenuItem>
                  {estudiantes.map(s => <MenuItem key={s._id} value={s._id}>{s.nombres} {s.apellidos} - {s.documento}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth required>
                <InputLabel id="concepto-label">Concepto *</InputLabel>
                <Select labelId="concepto-label" value={form.conceptoId} onChange={(e) => onSelectConcepto(e.target.value)} label="Concepto *">
                  <MenuItem value="">Seleccionar...</MenuItem>
                  {conceptos.filter(c => c.estado === 'activo').map(c => <MenuItem key={c._id} value={c._id}>{c.nombre} - ${Number(c.valor).toLocaleString('es-CO')}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth required>
                <InputLabel id="anio-label">Año Académico *</InputLabel>
                <Select labelId="anio-label" value={form.anioAcademicoId} onChange={(e) => setForm({ ...form, anioAcademicoId: e.target.value })} label="Año Académico *">
                  <MenuItem value="">Seleccionar...</MenuItem>
                  {anios.map(a => <MenuItem key={a._id} value={a._id}>Año {a.anio}</MenuItem>)}
                </Select>
              </FormControl>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                  <TextField type="number" size="small" fullWidth value={form.valor} onChange={(e) => recompute({ valor: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descuento</label>
                  <TextField type="number" size="small" fullWidth value={form.descuento || 0} onChange={(e) => recompute({ descuento: e.target.value })} inputProps={{ min: 0 }} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recargo</label>
                  <TextField type="number" size="small" fullWidth value={form.recargo || 0} onChange={(e) => recompute({ recargo: e.target.value })} inputProps={{ min: 0 }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Final</label>
                <TextField type="number" size="small" fullWidth value={form.valorFinal} slotProps={{ input: { readOnly: true } }} sx={{ '& input': { fontWeight: 600, bgcolor: '#f9fafb' } }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de vencimiento</label>
                <TextField type="date" size="small" fullWidth value={form.fechaVencimiento ? form.fechaVencimiento.slice(0, 10) : ''} onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })} />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>}
            </div>
          </DialogContent>
          <DialogActions className="!px-6 !pb-5">
            <Button onClick={() => setModal(false)} className="!text-gray-700 hover:!bg-gray-100">Cancelar</Button>
            <Button type="submit" variant="contained" color="primary" disabled={saving}>
              {saving ? 'Generando...' : 'Generar Pago'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  )
}
