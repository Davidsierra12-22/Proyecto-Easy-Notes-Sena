import { useEffect, useState } from 'react'
import { RefreshCw, Search, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const COLECCIONES = [
  'Usuarios', 'Areas', 'Asignaturas', 'Grupos', 'AnioAcademico', 'Matriculas',
  'Calificaciones', 'Pagos', 'ConceptosContables', 'Comunicados', 'Bitacora', 'Observador', 'Excusas'
]

const accionLabel = (accion) => {
  if (!accion) return '—'
  return accion.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function Bitacora() {
  const { usuario } = useAuth()
  const esAdmin = ['super_admin', 'admin'].includes(usuario?.tipoPerfil)

  const [datos, setDatos] = useState([])
  const [paginacion, setPaginacion] = useState({ pagina: 1, totalPaginas: 1, total: 0 })
  const [filtros, setFiltros] = useState({ coleccion: '', fechaDesde: '', fechaHasta: '', buscar: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  const cargar = async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 50 }
      if (filtros.coleccion) params.coleccion = filtros.coleccion
      if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde
      if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta
      if (filtros.buscar) params.buscar = filtros.buscar
      const r = await api.get('/bitacora', { params })
      setDatos(r.data.data)
      setPaginacion(r.data.paginacion)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar bitácora')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar(1) }, [])

  const aplicarFiltros = () => { setPaginacion(prev => ({ ...prev, pagina: 1 })); cargar(1) }
  const limpiarFiltros = () => {
    setFiltros({ coleccion: '', fechaDesde: '', fechaHasta: '', buscar: '' })
    cargar(1)
  }

  const limpiarBitacora = async () => {
    const meses = window.prompt('¿Borrar registros de bitácora anteriores a cuántos meses? (por defecto 3):', '3')
    if (meses === null) return
    if (!window.confirm(`¿Seguro que deseas eliminar todos los registros de bitácora anteriores a ${meses} meses?`)) return
    try {
      const r = await api.delete(`/bitacora/limpiar?meses=${meses}`)
      setExito(r.data.message)
      cargar(1)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al limpiar bitácora')
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bitácora del Sistema</h1>
            <p className="text-sm text-gray-500">Registro de acciones y auditoría · Total: {paginacion.total}</p>
          </div>
          <div className="flex items-center gap-2">
            {esAdmin && (
              <button onClick={limpiarBitacora}
                className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-2 rounded-lg hover:bg-red-50 flex items-center gap-1">
                <Trash2 className="w-4 h-4" /> Limpiar
              </button>
            )}
            <button onClick={() => cargar(paginacion.pagina)} aria-label="Recargar bitacora" title="Recargar bitacora" className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Colección / Módulo</label>
            <select value={filtros.coleccion} onChange={(e) => setFiltros({ ...filtros, coleccion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
              <option value="">Todas</option>
              {COLECCIONES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
            <input type="date" value={filtros.fechaDesde} onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
            <input type="date" value={filtros.fechaHasta} onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Buscar en detalle</label>
            <input type="text" value={filtros.buscar} onChange={(e) => setFiltros({ ...filtros, buscar: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros()}
              placeholder="Buscar..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={aplicarFiltros} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-1 text-sm">
              <Search className="w-4 h-4" /> Filtrar
            </button>
            <button onClick={limpiarFiltros} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Limpiar</button>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
        {exito && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-3 py-2 mb-4">{exito}</div>}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acción</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Módulo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Detalle</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">IP</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : datos.length === 0 ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">No hay registros de bitácora</td></tr>
              ) : (
                datos.map(b => (
                  <tr key={b._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{new Date(b.createdAt).toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {b.usuarioId?.nombres ? `${b.usuarioId.nombres} ${b.usuarioId.apellidos}` : (b.usuarioId ? '—' : 'Sistema')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                        {accionLabel(b.accion)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{b.coleccion || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-md">{b.detalle || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{b.direccionIp || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {paginacion.totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-500">
              Página {paginacion.pagina} de {paginacion.totalPaginas}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => cargar(paginacion.pagina - 1)} disabled={paginacion.pagina <= 1} aria-label="Página anterior"
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => cargar(paginacion.pagina + 1)} disabled={paginacion.pagina >= paginacion.totalPaginas} aria-label="Página siguiente"
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
