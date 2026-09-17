import { useEffect, useState } from 'react'
import { School, Users, GraduationCap, UserPlus, MapPin, Layers, Wallet, Loader2, RefreshCw } from 'lucide-react'
import api from '../services/api'

const formatoPesos = (v) =>
  v == null ? '—' : `$${Number(v).toLocaleString('es-CO')}`

const KPI = ({ label, valor, icon: Icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{valor}</p>
      </div>
    </div>
  </div>
)

const COLUMNAS = [
  { key: 'nombre', label: 'Colegio' },
  { key: 'estudiantes', label: 'Estudiantes' },
  { key: 'docentes', label: 'Docentes' },
  { key: 'matriculasActivas', label: 'Matrículas Activas' },
  { key: 'grupos', label: 'Grupos' },
  { key: 'sedes', label: 'Sedes' },
  { key: 'pagosPendientes', label: 'Pagos Pendientes' },
  { key: 'recaudado', label: 'Recaudado' }
]

export default function EstadisticasNucleo() {
  const [resumen, setResumen] = useState(null)
  const [comparativo, setComparativo] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargar = async () => {
    setLoading(true)
    setError('')
    try {
      const [rResumen, rComparativo] = await Promise.all([
        api.get('/nucleo/estadisticas'),
        api.get('/nucleo/comparativo')
      ])
      setResumen(rResumen.data.data)
      setComparativo(rComparativo.data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar las estadísticas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" /> Cargando estadísticas...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>
    )
  }

  const totalFilas = COLUMNAS.slice(1).filter(c => c.key !== 'recaudado')
  const totales = totalFilas.reduce((acc, c) => {
    acc[c.key] = comparativo.reduce((s, f) => s + (f[c.key] || 0), 0)
    return acc
  }, {})
  const recaudadoTotal = comparativo.reduce((s, f) => s + (f.recaudado || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Estadísticas del Núcleo</h1>
            <p className="text-sm text-gray-500 mt-0.5">Indicadores agregados de todos los colegios del núcleo.</p>
          </div>
          <button onClick={cargar} aria-label="Recargar estadisticas" title="Recargar estadisticas" className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Colegios" valor={resumen?.colegios ?? 0} icon={School} color="bg-primary-500" />
        <KPI label="Estudiantes" valor={resumen?.estudiantes ?? 0} icon={Users} color="bg-cyan-600" />
        <KPI label="Docentes" valor={resumen?.docentes ?? 0} icon={GraduationCap} color="bg-amber-500" />
        <KPI label="Matrículas Activas" valor={resumen?.matriculasActivas ?? 0} icon={UserPlus} color="bg-emerald-500" />
        <KPI label="Sedes" valor={resumen?.sedes ?? 0} icon={MapPin} color="bg-violet-500" />
        <KPI label="Grupos" valor={resumen?.grupos ?? 0} icon={Layers} color="bg-blue-500" />
        <KPI label="Pagos Pendientes" valor={resumen?.pagosPendientes ?? 0} icon={Wallet} color="bg-rose-500" />
        <KPI label="Recaudado" valor={formatoPesos(resumen?.recaudado)} icon={Wallet} color="bg-emerald-600" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Comparativo entre colegios</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {COLUMNAS.map(c => (
                  <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {comparativo.map(f => (
                <tr key={f._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{f.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{f.estudiantes}</td>
                  <td className="px-4 py-3 text-gray-600">{f.docentes}</td>
                  <td className="px-4 py-3 text-gray-600">{f.matriculasActivas}</td>
                  <td className="px-4 py-3 text-gray-600">{f.grupos}</td>
                  <td className="px-4 py-3 text-gray-600">{f.sedes}</td>
                  <td className="px-4 py-3 text-gray-600">{f.pagosPendientes}</td>
                  <td className="px-4 py-3 text-gray-600">{formatoPesos(f.recaudado)}</td>
                </tr>
              ))}
              {comparativo.length > 0 && (
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-4 py-3 text-gray-900">Total</td>
                  {totalFilas.map(c => (
                    <td key={c.key} className="px-4 py-3 text-gray-900">{totales[c.key]}</td>
                  ))}
                  <td className="px-4 py-3 text-gray-900">{formatoPesos(recaudadoTotal)}</td>
                </tr>
              )}
            </tbody>
          </table>
          {comparativo.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-gray-500">No hay colegios con datos para comparar.</p>
          )}
        </div>
      </div>
    </div>
  )
}