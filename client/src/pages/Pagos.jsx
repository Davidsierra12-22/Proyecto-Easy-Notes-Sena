import { useEffect, useState } from 'react'
import { Plus, RefreshCw, Search, HandCoins, Printer } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import PaginationBar from '../components/PaginationBar'

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
  const estudiante = (id) => estudiantes.find(s => s._id === id)

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
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select value={filtroEstado} onChange={(e) => { setFiltroEstado(e.target.value); setTimeout(() => cargar(1), 0) }}
                className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 w-44">
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="pagado">Pagados</option>
                <option value="vencido">Vencidos</option>
                <option value="anulado">Anulados</option>
              </select>
            </div>
            <button onClick={cargar} aria-label="Recargar pagos" title="Recargar pagos" className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <RefreshCw className="w-4 h-4" />
            </button>
            {puedeGestionar && (
              <button onClick={() => { setForm({}); setModal(true); setError('') }}
                className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2">
                <Plus className="w-4 h-4" /> Generar Pago
              </button>
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
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estudiante</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Concepto</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Valor</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Descto</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vencimiento</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : datos.length === 0 ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">No hay pagos registrados</td></tr>
              ) : datos.map((p) => (
                    <tr key={p._id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {p.estudianteId ? `${p.estudianteId.nombres || p.estudianteId.nombre || ''} ${p.estudianteId.apellidos || p.estudianteId.apellido || ''}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{p.conceptoId?.nombre || '—'}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">${Number(p.valor).toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">{p.descuento ? `-$${Number(p.descuento).toLocaleString('es-CO')}` : '—'}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">${Number(p.valorFinal).toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.fechaVencimiento ? new Date(p.fechaVencimiento).toLocaleDateString('es-CO') : '—'}</td>
                    <td className="px-4 py-3">{estadoBadge(p.estado)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {['pendiente', 'vencido'].includes(p.estado) && puedeGestionar && (
                        <button onClick={() => registrarPago(p)} disabled={registrando}
                          className="text-emerald-600 hover:text-emerald-800 text-sm font-medium inline-flex items-center gap-1">
                          <HandCoins className="w-4 h-4" /> Registrar pago
                        </button>
                      )}
                      {p.estado === 'pagado' && <span className="text-sm text-emerald-600">Pagado</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
          </table>
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

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Generar Pago</h2>
              <button onClick={() => { setModal(false); setError('') }} aria-label="Cerrar modal de pago" className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={crear} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estudiante <span className="text-red-500">*</span></label>
                <select value={form.estudianteId} onChange={(e) => setForm({ ...form, estudianteId: e.target.value })} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                  <option value="">Seleccionar...</option>
                  {estudiantes.map(s => <option key={s._id} value={s._id}>{s.nombres} {s.apellidos} - {s.documento}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Concepto <span className="text-red-500">*</span></label>
                <select value={form.conceptoId} onChange={(e) => onSelectConcepto(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                  <option value="">Seleccionar...</option>
                  {conceptos.filter(c => c.estado === 'activo').map(c => <option key={c._id} value={c._id}>{c.nombre} - ${Number(c.valor).toLocaleString('es-CO')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año Académico <span className="text-red-500">*</span></label>
                <select value={form.anioAcademicoId} onChange={(e) => setForm({ ...form, anioAcademicoId: e.target.value })} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                  <option value="">Seleccionar...</option>
                  {anios.map(a => <option key={a._id} value={a._id}>Año {a.anio}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                  <input type="number" value={form.valor} onChange={(e) => recompute({ valor: e.target.value })} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descuento</label>
                  <input type="number" value={form.descuento || 0} onChange={(e) => recompute({ descuento: e.target.value })} min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recargo</label>
                  <input type="number" value={form.recargo || 0} onChange={(e) => recompute({ recargo: e.target.value })} min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Final</label>
                <input type="number" value={form.valorFinal} readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-semibold" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de vencimiento</label>
                <input type="date" value={form.fechaVencimiento ? form.fechaVencimiento.slice(0, 10) : ''}
                  onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50">
                  {saving ? 'Generando...' : 'Generar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
