import { useEffect, useState } from 'react'
import { Plus, RefreshCw, PlayCircle, XCircle, ArrowRight } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const estadoBadge = (estado) => {
  const map = {
    prematricula: 'bg-amber-100 text-amber-700',
    activo: 'bg-emerald-100 text-emerald-700',
    cerrado: 'bg-red-100 text-red-700'
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[estado] || 'bg-gray-100 text-gray-600'}`}>{estado}</span>
}

export default function AniosAcademicos() {
  const { usuario } = useAuth()
  const [datos, setDatos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ anio: new Date().getFullYear(), numeroPeriodos: 4, notaMinima: 3.0 })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const puedeGestionar = ['super_admin', 'admin', 'secretaria'].includes(usuario?.tipoPerfil)

  const cargar = async () => {
    setLoading(true)
    try {
      const r = await api.get('/anios-academicos')
      setDatos(r.data.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const crear = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/anios-academicos', {
        anio: Number(form.anio),
        configuracion: {
          numeroPeriodos: Number(form.numeroPeriodos),
          notaMinima: Number(form.notaMinima)
        }
      })
      setModal(false)
      await cargar()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear')
    } finally {
      setSaving(false)
    }
  }

  const accion = async (id, endpoint, msgOk) => {
    if (!window.confirm(msgOk)) return
    try {
      await api.put(`/anios-academicos/${id}/${endpoint}`)
      await cargar()
    } catch (e) {
      alert(e.response?.data?.message || 'Error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Años Académicos</h1>
            <p className="text-sm text-gray-500">Gestiona los ciclos lectivos de la institución</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={cargar} aria-label="Recargar años académicos" title="Recargar años académicos" className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <RefreshCw className="w-4 h-4" />
            </button>
            {puedeGestionar && (
              <button onClick={() => { setForm({ anio: new Date().getFullYear(), numeroPeriodos: 4, notaMinima: 3.0 }); setModal(true); setError('') }}
                className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2">
                <Plus className="w-4 h-4" /> Nuevo Año
              </button>
            )}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Año</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Períodos</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nota Mínima</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pierde Año</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : datos.length === 0 ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">Sin años académicos creados</td></tr>
              ) : (
                datos.map(a => (
                  <tr key={a._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{a.anio}</td>
                    <td className="px-4 py-3">{estadoBadge(a.estado)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{a.configuracion?.numeroPeriodos ?? 4}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{a.configuracion?.notaMinima ?? 3.0}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {a.configuracion?.numPerdidas != null
                        ? `${a.configuracion.numPerdidas} ${a.configuracion.pierdeAnoPor === 'areas' ? 'áreas' : 'materias'}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {a.estado !== 'activo' && (
                        <button onClick={() => accion(a._id, 'activar', `¿Activar el año ${a.anio} como año lectivo vigente?`)}
                          className="text-emerald-600 hover:text-emerald-800 text-sm font-medium mr-3 flex-none inline-flex items-center gap-1">
                          <PlayCircle className="w-4 h-4" /> Activar
                        </button>
                      )}
                      {a.estado === 'activo' && (
                        <button onClick={() => accion(a._id, 'cerrar', `¿Cerrar el año ${a.anio}?`)}
                          className="text-amber-600 hover:text-amber-800 text-sm font-medium mr-3 inline-flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Cerrar
                        </button>
                      )}
                      <button onClick={() => accion(a._id, 'cerrar-migracion', `¿Cerrar ${a.anio} y migrar estudiantes al siguiente año? Debes crear el año destino primero.`)}
                        className="text-primary-600 hover:text-primary-800 text-sm font-medium inline-flex items-center gap-1">
                        <ArrowRight className="w-4 h-4" /> Cerrar + Migrar
                      </button>
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
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Nuevo Año Académico</h2>
              <button onClick={() => setModal(false)} aria-label="Cerrar modal de año académico" className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={crear} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año lectivo</label>
                <input type="number" value={form.anio} onChange={(e) => setForm({ ...form, anio: e.target.value })} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de períodos</label>
                <select value={form.numeroPeriodos} onChange={(e) => setForm({ ...form, numeroPeriodos: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                  {[2, 3, 4, 5].map(n => <option key={n} value={n}>{n} períodos</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nota mínima para aprobar</label>
                <input type="number" step="0.1" min="1" max="5" value={form.notaMinima} onChange={(e) => setForm({ ...form, notaMinima: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50">
                  {saving ? 'Creando...' : 'Crear Año'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
