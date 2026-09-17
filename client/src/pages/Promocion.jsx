import { useEffect, useState } from 'react'
import { RefreshCw, Search, Printer, FileBarChart } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Promocion() {
  const { usuario } = useAuth()
  const puedeGestionar = ['super_admin', 'admin', 'secretaria'].includes(usuario?.tipoPerfil)
  const puedeCerrar = ['super_admin', 'admin'].includes(usuario?.tipoPerfil)

  const [anios, setAnios] = useState([])
  const [grupos, setGrupos] = useState([])
  const [filtros, setFiltros] = useState({})
  const [matriculas, setMatriculas] = useState([])
  const [evaluaciones, setEvaluaciones] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [aniosDestino, setAniosDestino] = useState([])
  const [anioDestino, setAnioDestino] = useState('')
  const [cerrando, setCerrando] = useState(false)

  const cargarDependencias = async () => {
    try {
      const [resAnio, resGrupos] = await Promise.all([
        api.get('/anios-academicos'),
        api.get('/grupos')
      ])
      setAnios(resAnio.data.data)
      setGrupos(resGrupos.data.data)
      const activo = resAnio.data.data.find(a => a.estado === 'activo')
      setFiltros(prev => ({ ...prev, anioAcademicoId: activo?._id || '' }))
      setAniosDestino(resAnio.data.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar')
    }
  }

  useEffect(() => { cargarDependencias() }, [])

  const cargar = async () => {
    if (!filtros.grupoId) { setError('Selecciona un grupo'); return }
    if (!filtros.anioAcademicoId) { setError('Selecciona el año académico'); return }
    setLoading(true)
    setError('')
    setEvaluaciones({})
    try {
      const r = await api.get(`/matriculas/grupo/${filtros.grupoId}`, {
        params: { anioAcademicoId: filtros.anioAcademicoId }
      })
      setMatriculas(r.data.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  const evaluar = async (m) => {
    setError('')
    try {
      const r = await api.post('/matriculas/evaluar-promocion', {
        estudianteId: m.estudianteId?._id || m.estudianteId,
        anioAcademicoId: filtros.anioAcademicoId
      })
      setEvaluaciones(prev => ({ ...prev, [m._id]: r.data.data }))
    } catch (e) {
      setError(e.response?.data?.message || 'Error al evaluar')
    }
  }

  const evaluarTodo = async () => {
    setError('')
    const acc = {}
    for (const m of matriculas) {
      try {
        const r = await api.post('/matriculas/evaluar-promocion', {
          estudianteId: m.estudianteId?._id || m.estudianteId,
          anioAcademicoId: filtros.anioAcademicoId
        })
        acc[m._id] = r.data.data
      } catch (e) { setError(e.response?.data?.message || 'Error al evaluar grupo') }
    }
    setEvaluaciones(acc)
  }

  const promoverManual = async (m, reprobar) => {
    const nombreEst = m.estudianteId?.nombres ? `${m.estudianteId.nombres} ${m.estudianteId.apellidos}` : 'un estudiante'
    if (!window.confirm(`¿Promover manualmente a ${nombreEst}?`)) return
    const obs = window.prompt('Justificación (consejo académico):')
    if (obs === null) return
    try {
      await api.put(`/matriculas/${m._id}/promover`, { promovido: !reprobar, observaciones: obs })
      setError('')
      alert(reprobar ? 'Estudiante marcado como repitente' : 'Estudiante promovido manualmente')
      await cargar()
    } catch (e) {
      alert(e.response?.data?.message || 'Error')
    }
  }

  const cerrarAnio = async () => {
    if (!anioDestino) { setError('Selecciona el año destino'); return }
    if (!window.confirm('¿Ejecutar el cierre del año académico? Se migrarán los estudiantes al año destino según su promoción.')) return
    setCerrando(true)
    setError('')
    try {
      const r = await api.post('/matriculas/cerrar-anio', {
        anioOrigenId: filtros.anioAcademicoId,
        anioDestinoId: anioDestino
      })
      alert(`${r.data.message}: ${r.data.data.estudiantesCopiados} migrados (${r.data.data.promovidos} promovidos, ${r.data.data.repitentes} repitentes)`)
      setAnioDestino('')
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cerrar año')
    } finally {
      setCerrando(false)
    }
  }

  const promedioGeneral = (evaluacion) => {
    const promedios = (evaluacion?.detalle || []).map(d => d.promedio).filter(n => n != null)
    if (!promedios.length) return null
    return Math.round((promedios.reduce((a, b) => a + b, 0) / promedios.length) * 10) / 10
  }

  const totalPromovidos = matriculas.filter(m => evaluaciones[m._id]?.promovido !== false).length

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Promoción Académica</h1>
            <p className="text-sm text-gray-500">Evaluación de promoción, promoción manual y cierre de año (RN-PRO)</p>
          </div>
          <button onClick={cargarDependencias} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Año Académico</label>
            <select value={filtros.anioAcademicoId} onChange={(e) => setFiltros({ ...filtros, anioAcademicoId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
              <option value="">Seleccionar...</option>
              {anios.map(a => <option key={a._id} value={a._id}>Año {a.anio}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Grupo</label>
            <select value={filtros.grupoId} onChange={(e) => setFiltros({ ...filtros, grupoId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
              <option value="">Seleccionar...</option>
              {grupos.map(g => <option key={g._id} value={g._id}>{g.nombre} (Grado {g.grado})</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={cargar} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1">
              <Search className="w-4 h-4" /> Cargar grupo
            </button>
          </div>
          {puedeGestionar && matriculas.length > 0 && (
            <div className="flex items-end justify-end gap-2">
              <button onClick={evaluarTodo} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1">
                <FileBarChart className="w-4 h-4" /> Evaluar grupo
              </button>
              <button onClick={() => window.print()} className="px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm flex items-center gap-1 print:hidden">
                <Printer className="w-4 h-4" /> Imprimir
              </button>
            </div>
          )}
        </div>

        {puedeCerrar && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-wrap items-end gap-2 mt-2 print:hidden">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Cierre de año: año destino</label>
              <select value={anioDestino} onChange={(e) => setAnioDestino(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm bg-white">
                <option value="">Seleccionar año destino...</option>
                {aniosDestino.filter(a => a._id !== filtros.anioAcademicoId).map(a => <option key={a._id} value={a._id}>Año {a.anio}</option>)}
              </select>
            </div>
            <button onClick={cerrarAnio} disabled={cerrando}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {cerrando ? 'Cerrando...' : 'Ejecutar cierre de año (PY-002)'}
            </button>
          </div>
        )}

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mt-3">{error}</div>}
      </div>

      {matriculas.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:border-0">
          <div className="p-4 lg:p-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white print:bg-white print:text-black">
            <h2 className="text-lg font-bold">Reporte de promoción del grupo</h2>
            <p className="text-sm opacity-90">Promovidos: {totalPromovidos} · Total: {matriculas.length}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50 print:bg-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estudiante</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Documento</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Promedio</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Áreas perdidas</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase print:hidden">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="6" className="px-4 py-8 text-center"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                ) : (
                  matriculas.map(m => {
                    const ev = evaluaciones[m._id]
                    return (
                      <tr key={m._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.estudianteId?.nombres ? `${m.estudianteId.nombres} ${m.estudianteId.apellidos}` : '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{m.estudianteId?.documento || '—'}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">{ev ? (promedioGeneral(ev) ?? '—') : '—'}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">{ev ? `${ev.areasPerdidas}/${ev.umbral}` : '—'}</td>
                        <td className="px-4 py-3 text-center">
                          {ev ? (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ev.promovido ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {ev.promovido ? 'Promovido' : 'Reprobado'}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap print:hidden">
                          {puedeGestionar && (
                            <>
                              <button onClick={() => evaluar(m)} className="text-primary-600 hover:text-primary-800 text-sm font-medium mr-3">Evaluar</button>
                              <button onClick={() => promoverManual(m, false)} className="text-emerald-600 hover:text-emerald-800 text-sm font-medium mr-3">Promover</button>
                              <button onClick={() => promoverManual(m, true)} className="text-red-600 hover:text-red-800 text-sm font-medium">Reprobar</button>
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {matriculas.length === 0 && !loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          Selecciona un año y un grupo para evaluar la promoción.
        </div>
      )}
    </div>
  )
}