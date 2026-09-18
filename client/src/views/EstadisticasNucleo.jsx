import { useEffect, useState } from 'react'
import { School, Users, GraduationCap, UserPlus, MapPin, Layers, Wallet, RefreshCw } from 'lucide-react'
import {
  IconButton, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material'
import api from '../services/api.service'

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
          <CircularProgress size={20} className="!text-primary-600" /> Cargando estadísticas...
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
          <IconButton onClick={cargar} aria-label="Recargar estadisticas" title="Recargar estadisticas" size="small" color="inherit">
            <RefreshCw className="w-4 h-4" />
          </IconButton>
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
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow className="bg-gray-50">
                  {COLUMNAS.map(c => (
                    <TableCell key={c.key} className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">
                      {c.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {comparativo.map(f => (
                  <TableRow key={f._id} hover>
                    <TableCell className="!font-medium !text-gray-900">{f.nombre}</TableCell>
                    <TableCell className="!text-gray-600">{f.estudiantes}</TableCell>
                    <TableCell className="!text-gray-600">{f.docentes}</TableCell>
                    <TableCell className="!text-gray-600">{f.matriculasActivas}</TableCell>
                    <TableCell className="!text-gray-600">{f.grupos}</TableCell>
                    <TableCell className="!text-gray-600">{f.sedes}</TableCell>
                    <TableCell className="!text-gray-600">{f.pagosPendientes}</TableCell>
                    <TableCell className="!text-gray-600">{formatoPesos(f.recaudado)}</TableCell>
                  </TableRow>
                ))}
                {comparativo.length > 0 && (
                  <TableRow className="bg-gray-50 font-semibold">
                    <TableCell className="!font-semibold !text-gray-900">Total</TableCell>
                    {totalFilas.map(c => (
                      <TableCell key={c.key} className="!font-semibold !text-gray-900">{totales[c.key]}</TableCell>
                    ))}
                    <TableCell className="!font-semibold !text-gray-900">{formatoPesos(recaudadoTotal)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {comparativo.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-gray-500">No hay colegios con datos para comparar.</p>
          )}
        </div>
      </div>
    </div>
  )
}
