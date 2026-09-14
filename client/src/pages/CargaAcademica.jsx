import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Filter, Search } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useSede } from '../context/SedeContext'

export default function CargaAcademica() {
  const { usuario } = useAuth()
  const { sedes, sedeId } = useSede()
  const [cargas, setCargas] = useState([])
  const [docentes, setDocentes] = useState([])
  const [asignaturas, setAsignaturas] = useState([])
  const [anios, setAnios] = useState([])
  const [grupos, setGrupos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroDocente, setFiltroDocente] = useState('')
  const [filtroGrupo, setFiltroGrupo] = useState('')
  const [filtroAnio, setFiltroAnio] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const puedeGestionar = ['super_admin', 'admin', 'secretaria'].includes(usuario?.tipoPerfil)
  const puedeEliminar = ['super_admin', 'admin'].includes(usuario?.tipoPerfil)

  const cargarTodo = async () => {
    setLoading(true)
    setError('')
    try {
      const paramsDoc = { tipoPerfil: 'docente' }
      if (sedeId) paramsDoc.sedeId = sedeId
      const [resCargas, resDocentes, resAsig, resAnios, resGrupos] = await Promise.all([
        api.get('/carga-academica', { params: sedeId ? { sedeId } : {} }),
        api.get('/usuarios', { params: paramsDoc }),
        api.get('/asignaturas'),
        api.get('/anios-academicos'),
        api.get('/grupos', { params: sedeId ? { sedeId } : {} })
      ])
      setCargas(resCargas.data.data)
      setDocentes(resDocentes.data.data)
      setAsignaturas(resAsig.data.data)
      setAnios(resAnios.data.data)
      setGrupos(resGrupos.data.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarTodo() }, [sedeId])

  const docenteLabel = (id) => {
    const d = docentes.find(x => String(x._id) === String(id))
    return d ? `${d.nombres} ${d.apellidos}` : '—'
  }
  const asignaturaLabel = (id) => {
    const a = asignaturas.find(x => String(x._id) === String(id))
    return a ? a.nombre : '—'
  }
  const grupoLabel = (id) => {
    const g = grupos.find(x => String(x._id) === String(id))
    if (!g) return '—'
    const s = sedes.find(x => String(x._id) === String(g.sedeId))
    return `${g.nombre} · Grado ${g.grado}${s ? ` · ${s.nombre}` : ''}`
  }
  const anioLabel = (id) => {
    const a = anios.find(x => String(x._id) === String(id))
    return a ? `Año ${a.anio}` : '—'
  }

  const visibles = cargas.filter(c => {
    if (filtroDocente && String(c.docenteId) !== filtroDocente) return false
    if (filtroGrupo && String(c.grupoId) !== filtroGrupo) return false
    if (filtroAnio && String(c.anioAcademicoId) !== filtroAnio) return false
    if (busqueda) {
      const texto = `${docenteLabel(c.docenteId)} ${asignaturaLabel(c.asignaturaId)} ${grupoLabel(c.grupoId)}`.toLowerCase()
      if (!texto.includes(busqueda.toLowerCase())) return false
    }
    return true
  })

  const abrirCrear = () => {
    setEditing(null)
    setForm({ horasSemanales: 4, puedeCalificar: true, estado: 'activo', anioAcademicoId: '' })
    setModal(true)
    setError('')
  }

  const abrirEditar = (c) => {
    setEditing(c)
    setForm({
      docenteId: c.docenteId,
      anioAcademicoId: c.anioAcademicoId,
      grupoId: c.grupoId,
      asignaturaId: c.asignaturaId,
      horasSemanales: c.horasSemanales ?? 4,
      puedeCalificar: c.puedeCalificar !== false,
      estado: c.estado || 'activo'
    })
    setModal(true)
    setError('')
  }

  const guardar = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await api.put(`/carga-academica/${editing._id}`, form)
      } else {
        await api.post('/carga-academica', form)
      }
      setModal(false)
      await cargarTodo()
    } catch (err) {
      const mensaje = err.response?.data?.message
      setError(mensaje && mensaje.includes('duplicate') ? 'Ese grupo ya tiene esa asignatura asignada' : (mensaje || 'Error al guardar'))
    } finally {
      setSaving(false)
    }
  }

  const eliminar = async (c) => {
    if (!confirm(`¿Eliminar la carga de ${docenteLabel(c.docenteId)} en ${grupoLabel(c.grupoId)}?`)) return
    try {
      await api.delete(`/carga-academica/${c._id}`)
      await cargarTodo()
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar')
    }
  }

  const gruposAnio = form.anioAcademicoId
    ? grupos.filter(g => String(g.anioAcademicoId) === form.anioAcademicoId)
    : grupos

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Carga Académica</h1>
            <p className="text-sm text-gray-500">Asigna profesores a asignaturas por grupo (grado) y año lectivo</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar..."
                className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 w-44 sm:w-56"
              />
            </div>
            {puedeGestionar && (
              <button onClick={abrirCrear}
                className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2">
                <Plus className="w-4 h-4" /> Nueva Carga
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={filtroDocente} onChange={(e) => setFiltroDocente(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-700">
            <option value="">Todos los profesores</option>
            {docentes.map(d => (
              <option key={d._id} value={d._id}>{d.nombres} {d.apellidos}</option>
            ))}
          </select>
          <select value={filtroGrupo} onChange={(e) => setFiltroGrupo(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-700">
            <option value="">Todos los grupos</option>
            {grupos.map(g => (
              <option key={g._id} value={g._id}>{g.nombre} · Grado {g.grado}</option>
            ))}
          </select>
          <select value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-700">
            <option value="">Todos los años</option>
            {anios.map(a => (
              <option key={a._id} value={a._id}>Año {a.anio}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500 ml-auto">{visibles.length} carga{visibles.length === 1 ? '' : 's'}</span>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Profesor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Asignatura</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Grupo / Grado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Año</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Horas sem.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="px-4 py-8 text-center">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : visibles.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  No hay cargas académicas registradas
                </td></tr>
              ) : (
                visibles.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{docenteLabel(c.docenteId)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{asignaturaLabel(c.asignaturaId)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{grupoLabel(c.grupoId)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{anioLabel(c.anioAcademicoId)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.horasSemanales ?? 4}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {puedeGestionar && (
                        <button onClick={() => abrirEditar(c)} className="text-primary-600 hover:text-primary-800 text-sm font-medium inline-flex items-center gap-1 mr-3">
                          <Pencil className="w-3.5 h-3.5" /> Editar
                        </button>
                      )}
                      {puedeEliminar && (
                        <button onClick={() => eliminar(c)} className="text-red-600 hover:text-red-800 text-sm font-medium inline-flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar
                        </button>
                      )}
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
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Editar carga' : 'Nueva carga académica'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={guardar} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profesor <span className="text-red-500">*</span></label>
                  <select value={form.docenteId || ''} onChange={(e) => setForm({ ...form, docenteId: e.target.value })} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                    <option value="">Seleccionar...</option>
                    {docentes.map(d => (
                      <option key={d._id} value={d._id}>{d.nombres} {d.apellidos}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Año Académico <span className="text-red-500">*</span></label>
                  <select value={form.anioAcademicoId || ''} onChange={(e) => setForm({ ...form, anioAcademicoId: e.target.value, grupoId: '' })} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                    <option value="">Seleccionar...</option>
                    {anios.map(a => (
                      <option key={a._id} value={a._id}>Año {a.anio}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grupo (grado) <span className="text-red-500">*</span></label>
                  <select value={form.grupoId || ''} onChange={(e) => setForm({ ...form, grupoId: e.target.value })} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                    <option value="">Seleccionar...</option>
                    {gruposAnio.map(g => (
                      <option key={g._id} value={g._id}>{g.nombre} · Grado {g.grado}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asignatura <span className="text-red-500">*</span></label>
                  <select value={form.asignaturaId || ''} onChange={(e) => setForm({ ...form, asignaturaId: e.target.value })} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                    <option value="">Seleccionar...</option>
                    {asignaturas.map(a => (
                      <option key={a._id} value={a._id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horas semanales</label>
                  <input type="number" min="1" max="40" value={form.horasSemanales ?? 4}
                    onChange={(e) => setForm({ ...form, horasSemanales: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select value={form.estado || 'activo'} onChange={(e) => setForm({ ...form, estado: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={form.puedeCalificar !== false}
                      onChange={(e) => setForm({ ...form, puedeCalificar: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    Puede calificar (la carga aparece en "Mis Clases")
                  </label>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50">
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