import { useEffect, useState } from 'react'
import { Plus, RefreshCw, Pencil, Power, Search, CheckCircle2 } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const TIPOS = [
  { value: 'tarea', label: 'Tarea' },
  { value: 'examen', label: 'Examen' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'proyecto', label: 'Proyecto' },
  { value: 'participacion', label: 'Participación' },
  { value: 'otro', label: 'Otro' }
]

const tipoBadge = (tipo) => {
  const colores = {
    tarea: 'bg-primary-100 text-primary-800',
    examen: 'bg-red-100 text-red-700',
    quiz: 'bg-amber-100 text-amber-700',
    proyecto: 'bg-blue-100 text-blue-800',
    participacion: 'bg-emerald-100 text-emerald-700',
    otro: 'bg-gray-100 text-gray-700'
  }
  const t = TIPOS.find(x => x.value === tipo)
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colores[tipo] || 'bg-gray-100 text-gray-700'}`}>{t ? t.label : tipo}</span>
}

export default function Actividades() {
  const { usuario } = useAuth()
  const puedeGestionar = ['super_admin', 'admin', 'rector', 'coordinador', 'docente'].includes(usuario?.tipoPerfil)

  const [anios, setAnios] = useState([])
  const [grupos, setGrupos] = useState([])
  const [asignaturas, setAsignaturas] = useState([])
  const [indicadores, setIndicadores] = useState([])
  const [filtros, setFiltros] = useState({})
  const [actividades, setActividades] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ tipo: 'tarea', porcentaje: 0 })
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

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
      setError(e.response?.data?.message || 'Error al cargar')
    }
  }

  useEffect(() => { cargarDependencias() }, [])

  const cargarIndicadores = async () => {
    if (!filtros.asignaturaId || !filtros.periodo) return
    try {
      const r = await api.get(`/indicadores/asignatura/${filtros.asignaturaId}/periodo/${filtros.periodo}`)
      setIndicadores(r.data.data)
    } catch (e) { setIndicadores([]) }
  }

  useEffect(() => { cargarIndicadores() }, [filtros.asignaturaId, filtros.periodo])

  const cargar = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (filtros.anioAcademicoId) params.anioAcademicoId = filtros.anioAcademicoId
      if (filtros.grupoId) params.grupoId = filtros.grupoId
      if (filtros.asignaturaId) params.asignaturaId = filtros.asignaturaId
      if (filtros.periodo) params.periodo = filtros.periodo
      const r = await api.get('/actividades', { params })
      setActividades(r.data.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar actividades')
    } finally {
      setLoading(false)
    }
  }

  const abrirCrear = () => {
    setForm({ tipo: 'tarea', porcentaje: 0, anioAcademicoId: filtros.anioAcademicoId, grupoId: filtros.grupoId, asignaturaId: filtros.asignaturaId, periodo: filtros.periodo })
    setEditing(null)
    setModal(true)
    setError('')
  }

  const abrirEditar = (item) => {
    setForm({
      anioAcademicoId: item.anioAcademicoId,
      grupoId: item.grupoId,
      asignaturaId: item.asignaturaId,
      periodo: item.periodo,
      indicadorId: item.indicadorId?._id || item.indicadorId,
      titulo: item.titulo,
      descripcion: item.descripcion || '',
      tipo: item.tipo || 'tarea',
      porcentaje: item.porcentaje || 0,
      fechaLimite: item.fechaLimite ? item.fechaLimite.slice(0, 10) : ''
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
      const body = {
        ...form,
        periodo: Number(form.periodo),
        porcentaje: Number(form.porcentaje || 0)
      }
      if (body.fechaLimite) body.fechaLimite = new Date(body.fechaLimite).toISOString()
      else delete body.fechaLimite
      if (editing) {
        await api.put(`/actividades/${editing._id}`, body)
      } else {
        await api.post('/actividades', body)
      }
      setModal(false)
      await cargar()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const cambiarEstado = async (item) => {
    try {
      await api.put(`/actividades/${item._id}`, { estado: item.estado === 'activo' ? 'inactivo' : 'activo' })
      await cargar()
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cambiar estado')
    }
  }

  const cerrar = async (item) => {
    if (!window.confirm('¿Cerrar esta actividad? Ya no se podrá calificar.')) return
    try {
      await api.put(`/actividades/${item._id}`, { estado: 'cerrado' })
      await cargar()
    } catch (e) {
      alert(e.response?.data?.message || 'Error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h1 className="text-xl font-bold text-gray-900">Actividades Evaluativas</h1>
          <div className="flex items-center gap-2">
            <button onClick={cargar} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Año</label>
            <select value={filtros.anioAcademicoId} onChange={(e) => setFiltros({ ...filtros, anioAcademicoId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
              <option value="">Todas</option>
              {anios.map(a => <option key={a._id} value={a._id}>Año {a.anio}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Grupo</label>
            <select value={filtros.grupoId} onChange={(e) => setFiltros({ ...filtros, grupoId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
              <option value="">Todos</option>
              {grupos.map(g => <option key={g._id} value={g._id}>{g.nombre} (Grado {g.grado})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Asignatura</label>
            <select value={filtros.asignaturaId} onChange={(e) => setFiltros({ ...filtros, asignaturaId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
              <option value="">Todas</option>
              {asignaturas.map(a => <option key={a._id} value={a._id}>{a.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Período</label>
            <select value={filtros.periodo} onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
              <option value="">Todos</option>
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={cargar} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-1 text-sm">
              <Search className="w-4 h-4" /> Cargar
            </button>
            {puedeGestionar && filtros.asignaturaId && filtros.grupoId && filtros.periodo && (
              <button onClick={abrirCrear} className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm">
                <Plus className="w-4 h-4" /> Nueva
              </button>
            )}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Título</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Indicador</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">%</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">F. Límite</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="px-4 py-8 text-center"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : actividades.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No hay actividades</td></tr>
              ) : (
                actividades.map(a => (
                  <tr key={a._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{a.titulo}</td>
                    <td className="px-4 py-3">{tipoBadge(a.tipo)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {a.indicadorId ? (a.indicadorId.codigo ? `${a.indicadorId.codigo} - ` : '') + (a.indicadorId.descripcion || '') : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700">{a.porcentaje}%</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{a.fechaLimite ? new Date(a.fechaLimite).toLocaleDateString('es-CO') : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{a.estado}</span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {puedeGestionar && a.estado === 'activo' && (
                        <>
                          <button onClick={() => abrirEditar(a)} className="text-primary-600 hover:text-primary-800 text-sm font-medium mr-3 inline-flex items-center gap-1"><Pencil className="w-4 h-4" /> Editar</button>
                          <button onClick={() => cerrar(a)} className="text-amber-600 hover:text-amber-800 text-sm font-medium mr-3 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Cerrar</button>
                          <button onClick={() => cambiarEstado(a)} className="text-amber-600 hover:text-amber-800 text-sm font-medium inline-flex items-center gap-1"><Power className="w-4 h-4" /> Desactivar</button>
                        </>
                      )}
                      {puedeGestionar && a.estado === 'inactivo' && (
                        <button onClick={() => cambiarEstado(a)} className="text-emerald-600 hover:text-emerald-800 text-sm font-medium inline-flex items-center gap-1"><Power className="w-4 h-4" /> Activar</button>
                      )}
                      {a.estado !== 'activo' && a.estado !== 'inactivo' && <span className="text-sm text-gray-400">Cerrada</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Editar Actividad' : 'Nueva Actividad'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={guardar} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título <span className="text-red-500">*</span></label>
                <input type="text" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required
                  placeholder="Ej: Taller de fracciones" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Indicador <span className="text-red-500">*</span></label>
                <select value={form.indicadorId} onChange={(e) => setForm({ ...form, indicadorId: e.target.value })} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                  <option value="">Seleccionar indicador...</option>
                  {indicadores.map(i => <option key={i._id} value={i._id}>{i.codigo ? `${i.codigo} - ` : ''}{i.descripcion}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                    {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje (%)</label>
                  <input type="number" value={form.porcentaje} onChange={(e) => setForm({ ...form, porcentaje: e.target.value })} min="0" max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
                <input type="date" value={form.fechaLimite} onChange={(e) => setForm({ ...form, fechaLimite: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50">
                  {saving ? 'Guardando...' : (editing ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
