import { useEffect, useState } from 'react'
import { RefreshCw, Save, Search } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Calificaciones() {
  const { usuario } = useAuth()
  const [anios, setAnios] = useState([])
  const [grupos, setGrupos] = useState([])
  const [asignaturas, setAsignaturas] = useState([])
  const [filtros, setFiltros] = useState({})
  const [estudiantes, setEstudiantes] = useState([])
  const [notas, setNotas] = useState({})
  const [loading, setLoading] = useState(false)
  const [cargado, setCargado] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [saving, setSaving] = useState(false)

  const esDocente = usuario?.tipoPerfil === 'docente'
  const puedeGestionar = ['super_admin', 'admin', 'rector', 'coordinador', 'docente', 'secretaria'].includes(usuario?.tipoPerfil)

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
      if (activo) setFiltros(prev => ({ ...prev, anioAcademicoId: activo._id }))
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar dependencias')
    }
  }

  useEffect(() => { cargarDependencias() }, [])

  const cargarEstudiantes = async () => {
    if (!filtros.grupoId) return
    setLoading(true)
    setError('')
    setExito('')
    setCargado(false)
    try {
      const r = await api.get(`/matriculas/grupo/${filtros.grupoId}`, { params: { anioAcademicoId: filtros.anioAcademicoId } })
      setEstudiantes(r.data.data.map(m => m.estudianteId).filter(Boolean))
      const n = {}
      // Cargar notas existentes si hay
      if (filtros.asignaturaId && filtros.periodo) {
        try {
          const rn = await api.get(`/calificaciones/grupo/${filtros.grupoId}/asignatura/${filtros.asignaturaId}/periodo/${filtros.periodo}`, {
            params: { anioAcademicoId: filtros.anioAcademicoId }
          })
          for (const cal of rn.data.data) {
            if (cal.estudianteId?._id) n[cal.estudianteId._id] = cal.nota ?? ''
          }
        } catch (e) { /* sin notas previas */ }
      }
      setNotas(n)
      setCargado(true)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar estudiantes del grupo')
    } finally {
      setLoading(false)
    }
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!filtros.grupoId || !filtros.asignaturaId || !filtros.periodo) {
      setError('Selecciona grupo, asignatura y período')
      return
    }
    setSaving(true)
    setError('')
    setExito('')
    try {
      const calificaciones = estudiantes.map(s => ({
        estudianteId: s._id,
        nota: notas[s._id] !== undefined && notas[s._id] !== '' ? Number(notas[s._id]) : undefined
      })).filter(c => c.nota !== undefined)
      const r = await api.post('/calificaciones/masivo', {
        grupoId: filtros.grupoId,
        asignaturaId: filtros.asignaturaId,
        periodo: Number(filtros.periodo),
        anioAcademicoId: filtros.anioAcademicoId,
        calificaciones
      })
      setExito(r.data.message)
      await cargarEstudiantes()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar notas')
    } finally {
      setSaving(false)
    }
  }

  const nombreGrupo = (id) => grupos.find(g => g._id === id)?.nombre || '—'
  const nombreAsig = (id) => asignaturas.find(a => a._id === id)?.nombre || '—'

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Calificaciones</h1>
            <p className="text-sm text-gray-500">Registro de notas por grupo, asignatura y período</p>
          </div>
          <button onClick={cargarDependencias} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 self-start">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Año Académico</label>
            <select value={filtros.anioAcademicoId} onChange={(e) => setFiltros({ ...filtros, anioAcademicoId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
              <option value="">Seleccionar...</option>
              {anios.map(a => <option key={a._id} value={a._id}>Año {a.anio} ({a.estado})</option>)}
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
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Período</label>
              <select value={filtros.periodo} onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                <option value="">Período...</option>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button onClick={cargarEstudiantes} disabled={!filtros.grupoId}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-1 text-sm">
              <Search className="w-4 h-4" /> Cargar
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 my-4">{error}</div>}
        {exito && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-3 py-2 my-4">{exito}</div>}
      </div>

      {cargado && estudiantes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">
              {nombreGrupo(filtros.grupoId)} · {nombreAsig(filtros.asignaturaId)} · Período {filtros.periodo}
            </h2>
            <span className="text-sm text-gray-500">{estudiantes.length} estudiantes</span>
          </div>
          <form onSubmit={guardar}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estudiante</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Documento</th>
                    <th className="px-4 py-3 w-40 text-left text-xs font-semibold text-gray-500 uppercase">Nota (0-5)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {estudiantes.map(s => (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{s.nombres} {s.apellidos}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-700">{s.documento}</td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number" step="0.1" min="0" max="5"
                          value={notas[s._id] ?? ''}
                          onChange={(e) => setNotas({ ...notas, [s._id]: e.target.value })}
                          disabled={!puedeGestionar}
                          className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                          placeholder="0.0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {puedeGestionar && (
              <div className="px-4 py-3 border-t border-gray-200 flex justify-end">
                <button type="submit" disabled={saving}
                  className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
                  <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar Calificaciones'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {cargado && estudiantes.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          El grupo seleccionado no tiene estudiantes matriculados.
        </div>
      )}
    </div>
  )
}
