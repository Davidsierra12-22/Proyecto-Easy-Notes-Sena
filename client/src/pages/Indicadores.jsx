import { useEffect, useState } from 'react'
import { Plus, RefreshCw, Pencil, Power, Search } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Indicadores() {
  const { usuario } = useAuth()
  const puedeGestionar = ['super_admin', 'admin', 'rector', 'coordinador', 'docente'].includes(usuario?.tipoPerfil)

  const [anios, setAnios] = useState([])
  const [asignaturas, setAsignaturas] = useState([])
  const [filtros, setFiltros] = useState({})
  const [indicadores, setIndicadores] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({})
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const cargarDependencias = async () => {
    try {
      const [resAnio, resAsig] = await Promise.all([
        api.get('/anios-academicos'),
        api.get('/asignaturas')
      ])
      setAnios(resAnio.data.data)
      setAsignaturas(resAsig.data.data)
      const activo = resAnio.data.data.find(a => a.estado === 'activo')
      if (activo) setFiltros(prev => ({ ...prev, anioAcademicoId: activo._id }))
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar')
    }
  }

  useEffect(() => { cargarDependencias() }, [])

  const cargar = async () => {
    if (!filtros.asignaturaId || !filtros.periodo) {
      setError('Selecciona asignatura y período')
      return
    }
    setLoading(true)
    setError('')
    try {
      const r = await api.get(`/indicadores/asignatura/${filtros.asignaturaId}/periodo/${filtros.periodo}`)
      setIndicadores(r.data.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar indicadores')
    } finally {
      setLoading(false)
    }
  }

  const abrirCrear = () => {
    setForm({ anioAcademicoId: filtros.anioAcademicoId, asignaturaId: filtros.asignaturaId, periodo: Number(filtros.periodo), peso: 0, orden: 0 })
    setEditing(null)
    setModal(true)
    setError('')
  }

  const abrirEditar = (item) => {
    setForm({
      anioAcademicoId: item.anioAcademicoId,
      asignaturaId: item.asignaturaId,
      periodo: item.periodo,
      codigo: item.codigo || '',
      descripcion: item.descripcion,
      peso: item.peso || 0,
      orden: item.orden || 0
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
      if (editing) {
        await api.put(`/indicadores/${editing._id}`, form)
      } else {
        await api.post('/indicadores', form)
      }
      setModal(false)
      await cargar()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const cambiarEstado = async (item) => {
    try {
      await api.put(`/indicadores/${item._id}`, { estado: item.estado === 'activo' ? 'inactivo' : 'activo' })
      await cargar()
    } catch (e) {
      alert(e.response?.data?.message || 'Error al cambiar estado')
    }
  }

  const nombreAsig = (id) => asignaturas.find(a => a._id === id)?.nombre || '—'

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h1 className="text-xl font-bold text-gray-900">Indicadores de Desempeño</h1>
          <div className="flex items-center gap-2">
            <button onClick={cargar} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Año Académico</label>
            <select value={filtros.anioAcademicoId} onChange={(e) => setFiltros({ ...filtros, anioAcademicoId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
              <option value="">Seleccionar...</option>
              {anios.map(a => <option key={a._id} value={a._id}>Año {a.anio}</option>)}
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
            <button onClick={cargar} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-1 text-sm">
              <Search className="w-4 h-4" /> Cargar
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">
            {filtros.asignaturaId && filtros.periodo ? `${nombreAsig(filtros.asignaturaId)} · Período ${filtros.periodo}` : 'Selecciona los filtros'}
          </p>
          {puedeGestionar && filtros.asignaturaId && filtros.periodo && (
            <button onClick={abrirCrear} className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nuevo Indicador
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Peso</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Orden</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : indicadores.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500">No hay indicadores para esta selección</td></tr>
              ) : (
                indicadores.map(i => (
                  <tr key={i._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {i.codigo || '—'}
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${i.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{i.estado}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{i.descripcion}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700">{i.peso ?? 0}%</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700">{i.orden || 0}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {puedeGestionar && (
                        <>
                          <button onClick={() => abrirEditar(i)} className="text-primary-600 hover:text-primary-800 text-sm font-medium mr-3 inline-flex items-center gap-1">
                            <Pencil className="w-4 h-4" /> Editar
                          </button>
                          <button onClick={() => cambiarEstado(i)} className={`text-sm font-medium inline-flex items-center gap-1 ${
                            i.estado === 'activo' ? 'text-amber-600 hover:text-amber-800' : 'text-emerald-600 hover:text-emerald-800'
                          }`}>
                            <Power className="w-4 h-4" /> {i.estado === 'activo' ? 'Desactivar' : 'Activar'}
                          </button>
                        </>
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
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Editar Indicador' : 'Nuevo Indicador'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={guardar} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción <span className="text-red-500">*</span></label>
                <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} required rows="3"
                  placeholder="Ej: Resuelve problemas con números enteros" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                <input type="text" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  placeholder="Ej: MT-1-01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Peso (%)</label>
                  <input type="number" value={form.peso} onChange={(e) => setForm({ ...form, peso: Number(e.target.value) })} min="0" max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                  <input type="number" value={form.orden} onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })} min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
                </div>
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
