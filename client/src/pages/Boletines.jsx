import { useEffect, useState } from 'react'
import { Printer, RefreshCw, School } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const logroColor = (logro) => {
  if (!logro) return 'bg-gray-100 text-gray-700'
  if (logro.includes('Superior')) return 'bg-emerald-100 text-emerald-700'
  if (logro.includes('Alto')) return 'bg-primary-100 text-primary-800'
  if (logro.includes('Básico')) return 'bg-amber-100 text-amber-700'
  if (logro.includes('Bajo')) return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-700'
}

export default function Boletines() {
  const { usuario } = useAuth()
  const [anios, setAnios] = useState([])
  const [estudiantes, setEstudiantes] = useState([])
  const [filtros, setFiltros] = useState({})
  const [boletin, setBoletin] = useState([])
  const [estudianteSel, setEstudianteSel] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const esEstudiante = usuario?.tipoPerfil === 'estudiante'
  const esEstudianteSeleccion = esEstudiante || usuario?.tipoPerfil === 'acudiente'
  const puedeNavegar = ['super_admin', 'admin', 'rector', 'coordinador', 'secretaria', 'docente'].includes(usuario?.tipoPerfil)

  const cargarDependencias = async () => {
    try {
      const resAnio = await api.get('/anios-academicos')
      setAnios(resAnio.data.data)
      const activo = resAnio.data.data.find(a => a.estado === 'activo')
      setFiltros(prev => ({ ...prev, anioAcademicoId: activo?._id || '' }))

      if (!esEstudianteSeleccion) {
        const resEst = await api.get('/usuarios?tipoPerfil=estudiante')
        setEstudiantes(resEst.data.data)
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar')
    }
  }

  useEffect(() => { cargarDependencias() }, [])

  const cargarBoletin = async (e) => {
    if (e) e.preventDefault()
    if (!filtros.anioAcademicoId) {
      setError('Selecciona el año académico')
      return
    }
    setLoading(true)
    setError('')
    try {
      let estId = filtros.estudianteId
      if (esEstudiante) estId = usuario._id
      else if (esEstudianteSeleccion) estId = filtros.estudianteId

      if (!estId) {
        setError('Selecciona el estudiante')
        return
      }
      const r = await api.get(`/calificaciones/estudiante/${estId}/anio/${filtros.anioAcademicoId}`)
      setBoletin(r.data.data)
      if (!esEstudianteSeleccion) {
        const est = estudiantes.find(s => s._id === estId)
        setEstudianteSel(est || null)
      } else {
        setEstudianteSel(usuario)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar boletín')
      setBoletin([])
    } finally {
      setLoading(false)
    }
  }

  const promedio = () => {
    const notas = boletin.map(m => m.notaDefinitiva).filter(n => n != null)
    if (!notas.length) return null
    return Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Boletines</h1>
            <p className="text-sm text-gray-500">Notas definitivas por asignatura y logro alcanzado</p>
          </div>
          <button onClick={cargarDependencias} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 self-start">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={cargarBoletin} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Año Académico</label>
            <select value={filtros.anioAcademicoId} onChange={(e) => setFiltros({ ...filtros, anioAcademicoId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
              <option value="">Seleccionar...</option>
              {anios.map(a => <option key={a._id} value={a._id}>Año {a.anio}</option>)}
            </select>
          </div>
          {!esEstudianteSeleccion && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estudiante</label>
              <select value={filtros.estudianteId} onChange={(e) => setFiltros({ ...filtros, estudianteId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                <option value="">Seleccionar...</option>
                {estudiantes.map(s => <option key={s._id} value={s._id}>{s.nombres} {s.apellidos} - {s.documento}</option>)}
              </select>
            </div>
          )}
          <div className="flex items-end">
            <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              Generar Boletín
            </button>
          </div>
        </form>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mt-4">{error}</div>}
      </div>

      {boletin.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white print:bg-white print:text-black">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center print:hidden">
                  <School className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Boletín de Calificaciones</h2>
                  <p className="text-sm opacity-90">{estudianteSel ? `${estudianteSel.nombres} ${estudianteSel.apellidos}` : 'Estudiante'}</p>
                </div>
              </div>
              <button onClick={() => window.print()} className="text-white border border-white/60 rounded-lg px-3 py-1.5 text-sm flex items-center gap-1 print:hidden bg-white/10 hover:bg-white/20">
                <Printer className="w-4 h-4" /> Imprimir
              </button>
            </div>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-500 mb-4">
              Documento: {estudianteSel?.documento || '—'} · Año Acádemico seleccionado
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50 print:bg-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Asignatura</th>
                    {[1, 2, 3, 4, 5].map(p => (
                      <th key={p} className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">P{p}</th>
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Definitiva</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Logro</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {boletin.map(m => (
                    <tr key={m.asignatura?._id || Math.random()}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.asignatura?.nombre || 'Asignatura'}</td>
                      {[1, 2, 3, 4, 5].map(p => {
                        const per = m.periodos.find(x => x.periodo === p)
                        const val = per ? (per.habilitacion ?? per.recuperacion ?? per.nota) : null
                        return (
                          <td key={p} className="px-4 py-3 text-sm text-center text-gray-700">{val != null ? val : '—'}</td>
                        )
                      })}
                      <td className="px-4 py-3 text-sm text-center font-bold text-gray-900">{m.notaDefinitiva ?? '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        {m.logro && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${logroColor(m.logro)}`}>{m.logro}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <div className="bg-gray-50 rounded-lg px-4 py-3 text-right border border-gray-200">
                <p className="text-xs text-gray-500 uppercase">Promedio General</p>
                <p className="text-2xl font-bold text-primary-600">{promedio() ?? '—'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {boletin.length === 0 && !loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          Selecciona año y estudiante, luego pulsa "Generar Boletín".
        </div>
      )}
    </div>
  )
}
