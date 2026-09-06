import { useEffect, useState } from 'react'
import { RefreshCw, Search, CheckCircle2 } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Recuperaciones() {
  const { usuario } = useAuth()
  const puedeGestionar = ['super_admin', 'admin', 'rector', 'coordinador', 'docente'].includes(usuario?.tipoPerfil)

  const [anios, setAnios] = useState([])
  const [grupos, setGrupos] = useState([])
  const [asignaturas, setAsignaturas] = useState([])
  const [filtros, setFiltros] = useState({})
  const [notaMinima, setNotaMinima] = useState(3.0)
  const [calificaciones, setCalificaciones] = useState([])
  const [cargado, setCargado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activas, setActivas] = useState({})
  const [valores, setValores] = useState({})
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [procesando, setProcesando] = useState(false)

  const cargarDependencias = async () => {
    try {
      const [resAnio, resGrupos, resAsig] = await Promise.all([
        api.get('/anios-academicos'),
        api.get('/grupos'),
        api.get('/asignaturas')
      ])
      setAnios(resAnio.data.data)
      setGrupos(resGrupos.data.data)
      setAsignaturas(resAsig.data.data)
      const activo = resAnio.data.data.find(a => a.estado === 'activo')
      if (activo) {
        setFiltros(prev => ({ ...prev, anioAcademicoId: activo._id }))
        setNotaMinima(activo.configuracion?.notaMinima ?? 3.0)
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar')
    }
  }

  useEffect(() => { cargarDependencias() }, [])

  const cambiarAnio = (id) => {
    setFiltros(prev => ({ ...prev, anioAcademicoId: id }))
    const a = anios.find(x => x._id === id)
    if (a) setNotaMinima(a.configuracion?.notaMinima ?? 3.0)
  }

  const cargarCalificaciones = async () => {
    if (!filtros.grupoId || !filtros.asignaturaId || !filtros.periodo) {
      setError('Selecciona grupo, asignatura y período')
      return
    }
    setLoading(true)
    setError('')
    setExito('')
    setCargado(false)
    try {
      const r = await api.get(`/calificaciones/grupo/${filtros.grupoId}/asignatura/${filtros.asignaturaId}/periodo/${filtros.periodo}`, {
        params: { anioAcademicoId: filtros.anioAcademicoId }
      })
      setCalificaciones(r.data.data)
      const v = {}
      const a = {}
      r.data.data.forEach(c => {
        v[c._id] = ''
        a[c._id] = false
      })
      setValores(v)
      setActivas(a)
      setCargado(true)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar calificaciones')
    } finally {
      setLoading(false)
    }
  }

  const toggle = (id) => setActivas(prev => {
    const modelos = { recuperacion: false, habilitacion: false }
    return { ...prev, [id]: !prev[id] }
  })

  const seleccionarTipo = (id, tipo) => {
    setActivas(prev => ({ ...prev, [id]: true, [`${id}_tipo`]: tipo }))
  }

  const aplicar = async (c) => {
    const tipo = activas[`${c._id}_tipo`] || 'recuperacion'
    const nota = parseFloat(valores[c._id])
    if (isNaN(nota) || nota < 0 || nota > 5) {
      setError('Ingresa una nota válida entre 0 y 5')
      return
    }
    setProcesando(true)
    setError('')
    setExito('')
    try {
      const body = {
        calificacionId: c._id,
        anioAcademicoId: filtros.anioAcademicoId,
        periodo: Number(filtros.periodo)
      }
      if (tipo === 'habilitacion') {
        body.notaHabilitacion = nota
        await api.post('/calificaciones/habilitacion', body)
      } else {
        body.notaRecuperacion = nota
        await api.post('/calificaciones/recuperacion', body)
      }
      setExito(`Nota de ${tipo === 'habilitacion' ? 'habilitación' : 'recuperación'} aplicada (${nota})`)
      await cargarCalificaciones()
    } catch (e) {
      setError(e.response?.data?.message || 'Error al aplicar')
    } finally {
      setProcesando(false)
    }
  }

  const grupoLabel = (id) => grupos.find(g => g._id === id)?.nombre || '—'
  const asigLabel = (id) => asignaturas.find(a => a._id === id)?.nombre || '—'

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <h1 className="text-xl font-bold text-gray-900">Recuperaciones y Habilitaciones</h1>
        <p className="text-sm text-gray-500 mb-4">Aplica notas de recuperación o habilitación por período</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Año Académico</label>
            <select value={filtros.anioAcademicoId} onChange={(e) => cambiarAnio(e.target.value)}
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
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Asignatura</label>
            <select value={filtros.asignaturaId} onChange={(e) => setFiltros({ ...filtros, asignaturaId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
              <option value="">Seleccionar...</option>
              {asignaturas.map(a => <option key={a._id} value={a._id}>{a.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Período</label>
            <select value={filtros.periodo} onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
              <option value="">Período...</option>
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={cargarCalificaciones} disabled={loading}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-1 text-sm disabled:opacity-50">
              <Search className="w-4 h-4" /> Cargar
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Nota mínima para aprobar: <strong>{notaMinima}</strong></p>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mt-4">{error}</div>}
        {exito && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-3 py-2 mt-4">{exito}</div>}
      </div>

      {cargado && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">
              {grupoLabel(filtros.grupoId)} · {asigLabel(filtros.asignaturaId)} · Período {filtros.periodo}
            </h2>
            <span className="text-sm text-gray-500">{calificaciones.length} calificaciones</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estudiante</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Nota actual</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nota (0-5)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {calificaciones.map(c => {
                  const esBaja = c.nota != null && c.nota < notaMinima
                  return (
                    <tr key={c._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {c.estudianteId ? `${c.estudianteId.nombres} ${c.estudianteId.apellidos}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${esBaja ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {c.nota ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button type="button"
                            onClick={() => seleccionarTipo(c._id, 'recuperacion')}
                            className={`px-2 py-1 text-xs rounded-lg border ${activas[`${c._id}_tipo`] === 'recuperacion' ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                            Recuperación
                          </button>
                          <button type="button"
                            onClick={() => seleccionarTipo(c._id, 'habilitacion')}
                            className={`px-2 py-1 text-xs rounded-lg border ${activas[`${c._id}_tipo`] === 'habilitacion' ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                            Habilitación
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 w-32">
                        <input type="number" step="0.1" min="0" max="5" value={valores[c._id]}
                          onChange={(e) => setValores({ ...valores, [c._id]: e.target.value })}
                          disabled={!activas[c._id]}
                          placeholder="0.0" className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {activas[c._id] && (
                          <button onClick={() => aplicar(c)} disabled={procesando}
                            className="text-emerald-600 hover:text-emerald-800 text-sm font-medium inline-flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Aplicar
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {cargado && calificaciones.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          No hay calificaciones registradas para esta selección. Primero registra notas en el módulo de Calificaciones.
        </div>
      )}
    </div>
  )
}
