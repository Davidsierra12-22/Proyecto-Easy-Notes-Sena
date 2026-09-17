import { useEffect, useState } from 'react'
import { RefreshCw, Wallet, Clock, CalendarClock, Users } from 'lucide-react'
import api from '../services/api'

const FormatMoney = ({ value }) => {
  const n = Number(value || 0)
  return (
    <span>$ {n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
  )
}

const estadoColor = (estado) => {
  if (estado === 'vencido') return 'bg-red-100 text-red-700'
  if (estado === 'pendiente') return 'bg-amber-100 text-amber-700'
  if (estado === 'pagado') return 'bg-emerald-100 text-emerald-700'
  return 'bg-gray-100 text-gray-700'
}

export default function Cartera() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cargar = async () => {
    setLoading(true)
    setError('')
    try {
      const r = await api.get('/pagos/cartera')
      setData(r.data.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar la cartera')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const resumen = data?.resumen || {}
  const estudiantes = data?.estudiantes || []

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reporte de Cartera</h1>
            <p className="text-sm text-gray-500">Deudas pendientes y vencidas por estudiante (RN-CONT-04)</p>
          </div>
          <button onClick={cargar} disabled={loading} aria-label="Recargar cartera" title="Recargar cartera"
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 self-start">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-red-500 uppercase font-medium">Total cartera</p>
              <p className="text-xl font-bold text-red-700"><FormatMoney value={resumen.totalCartera} /></p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-amber-500 uppercase font-medium">Estudiantes deudores</p>
              <p className="text-xl font-bold text-amber-700">{resumen.estudiantesDeudores ?? 0}</p>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">En mora</p>
              <p className="text-xl font-bold text-gray-700">{resumen.enMora ?? 0}</p>
            </div>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mt-4">{error}</div>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {!estudiantes.length && !loading && !error && (
          <div className="p-8 text-center text-gray-500">No hay deudas pendientes o vencidas.</div>
        )}
        {estudiantes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estudiante</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Documento</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total deuda</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Días mora</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Conceptos</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {estudiantes.map((e, i) => (
                  <tr key={e.estudiante?._id || i}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {e.estudiante?.nombres} {e.estudiante?.apellidos}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">{e.estudiante?.documento}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-red-700">
                      <FormatMoney value={e.totalDeuda} />
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {e.diasMora > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          <CalendarClock className="w-3.5 h-3.5" /> {e.diasMora}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ul className="space-y-1">
                        {e.conceptos.map((c, j) => (
                          <li key={j} className="flex items-center justify-between gap-4 text-sm">
                            <span className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor(c.estado)}`}>
                                {c.estado}
                              </span>
                              <span className="text-gray-700">{c.concepto}</span>
                              <span className="text-gray-400 text-xs">
                                {c.fechaVencimiento ? new Date(c.fechaVencimiento).toLocaleDateString('es-CO') : ''}
                              </span>
                            </span>
                            <span className="font-medium text-gray-800"><FormatMoney value={c.valor} /></span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}