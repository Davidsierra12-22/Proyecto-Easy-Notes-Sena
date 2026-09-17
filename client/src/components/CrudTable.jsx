import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, RefreshCw, ArrowLeft, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '../services/api'
import PaginationBar from './PaginationBar'

const LIMITE = 50

/**
 * Componente base reutilizable para CRUD de entidades
 * @param {Object} props
 * - titulo: string
 * - baseURL: string (ruta de la API, ej: '/usuarios')
 * - columnas: [{ key, label, render? }]
 * - campos: definición de formulario [{ name, label, type, required?, options?, colSpan? }]
 * - rolesPermitidos: roles que pueden crear/editar/eliminar
 * - filtros: [{ name, label, options }] selectores de filtro (ej: Colegio, Rol)
 */
export default function CrudTable({
  titulo,
  baseURL,
  columnas,
  campos,
  puedeGestionar = true,
  puedeDesactivar = true,
  filtros,
  filtroInicial,
  refreshKey,
  parametrosForzados,
  onAfterSave,
  renderAcciones,
  transformDatos
}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtrosValores, setFiltrosValores] = useState(filtroInicial || {})
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [paginacion, setPaginacion] = useState(null)
  const navigate = useNavigate()

  const claveFuerza = JSON.stringify(parametrosForzados || {})
  useEffect(() => { cargar({}, 1) }, [refreshKey, claveFuerza])

  const cargar = async (override = {}, pg = pagina) => {
    setLoading(true)
    try {
      const params = { page: pg, limit: LIMITE }
      if (busqueda) params.q = busqueda
      Object.entries({ ...parametrosForzados, ...filtrosValores, ...override }).forEach(([k, v]) => {
        if (v) params[k] = v
      })
      const res = await api.get(baseURL, { params })
      setData(transformDatos ? transformDatos(res.data.data) : res.data.data)
      setPaginacion(res.data.paginacion || null)
      setPagina(pg)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltro = (name, valor) => {
    const nuevo = { ...filtrosValores, [name]: valor }
    setFiltrosValores(nuevo)
    cargar(nuevo, 1)
  }

  const valorInicial = (campo, val) => {
    if (campo.type === 'multiSelect') return Array.isArray(val) ? val : (campo.default || [])
    if (val === undefined || val === null) return ''
    if (campo.type === 'select' && typeof val === 'object' && val._id) return val._id
    if (campo.type === 'date') return String(val).slice(0, 10)
    return val
  }

  const abrirCrear = () => {
    const inicial = {}
    campos.forEach(c => { inicial[c.name] = valorInicial(c, c.default !== undefined ? c.default : '') })
    setForm(inicial)
    setEditing(null)
    setModal(true)
    setError('')
  }

  const abrirEditar = (item) => {
    const inicial = {}
    campos.forEach(c => { inicial[c.name] = valorInicial(c, item[c.name]) })
    setForm(inicial)
    setEditing(item)
    setModal(true)
    setError('')
  }

  const guardar = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      let creado = null
      const payload = { ...parametrosForzados, ...form }
      if (editing) {
        await api.put(`${baseURL}/${editing._id}`, payload)
      } else {
        const res = await api.post(baseURL, payload)
        creado = res.data.data
      }
      setModal(false)
      await cargar()
      if (onAfterSave) onAfterSave(creado)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const cambiarEstado = async (item) => {
    try {
      await api.put(`${baseURL}/${item._id}`, { estado: item.estado === 'activo' ? 'inactivo' : 'activo' })
      await cargar()
    } catch (e) {
      alert(e.response?.data?.message || 'Error al cambiar estado')
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              aria-label="Volver"
              title="Volver"
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">{titulo}</h1>
          </div>
          <div className="flex items-center gap-2">
            {filtros && filtros.map(f => (
              <select
                key={f.name}
                value={filtrosValores[f.name] || ''}
                onChange={(e) => aplicarFiltro(f.name, e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-700"
              >
                <option value="">{f.label}: Todos</option>
                {f.options.map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            ))}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && cargar({}, 1)}
                placeholder="Buscar..."
                className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-48 sm:w-64"
              />
            </div>
            <button
              onClick={() => { setBusqueda(''); setFiltrosValores({}); setTimeout(() => cargar({}, 1), 0) }}
              aria-label="Refrescar"
              title="Refrescar"
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {puedeGestionar && (
              <button
                onClick={abrirCrear}
                className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                + Nuevo
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                {columnas.map(col => (
                  <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {col.label}
                  </th>
                ))}
                {puedeGestionar && (
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={columnas.length + 1} className="px-4 py-8 text-center text-gray-500">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={columnas.length + 1} className="px-4 py-8 text-center text-gray-500">
                  Sin registros
                </td></tr>
              ) : (
                data.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    {columnas.map(col => (
                      <td key={col.key} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {col.render ? col.render(item) : (item[col.key] ?? '—')}
                      </td>
                    ))}
                    {puedeGestionar && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {renderAcciones && renderAcciones(item)}
                          <button
                            onClick={() => abrirEditar(item)}
                            aria-label="Editar"
                            title="Editar"
                            className="p-1.5 text-primary-600 hover:text-primary-800 rounded-lg hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={item._protegido}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {puedeDesactivar && (
                            <button
                              onClick={() => cambiarEstado(item)}
                              aria-label={item.estado === 'activo' ? 'Desactivar' : 'Activar'}
                              title={item.estado === 'activo' ? 'Desactivar' : 'Activar'}
                              className={`p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed ${
                                item.estado === 'activo' ? 'text-amber-600 hover:text-amber-800' : 'text-emerald-600 hover:text-emerald-800'
                              }`}
                              disabled={item._protegido}
                            >
                              {item.estado === 'activo' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {paginacion && (
          <PaginationBar
            pagina={paginacion.pagina}
            total={paginacion.total}
            limite={paginacion.limite}
            totalPaginas={paginacion.totalPaginas}
            onCambio={(p) => cargar({}, p)}
          />
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Editar registro' : 'Nuevo registro'}
              </h2>
              <button onClick={() => setModal(false)} aria-label="Cerrar modal" className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={guardar} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {campos.map(campo => (
                  <div key={campo.name} className={campo.colSpan === 2 ? 'col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {campo.label} {campo.required && <span className="text-red-500">*</span>}
                    </label>
                    {campo.type === 'multiSelect' ? (
                      <>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                          {campo.options?.map(op => (
                            <label key={op.value} className="flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={(form[campo.name] || []).includes(op.value)}
                                onChange={(e) => {
                                  const actual = form[campo.name] || []
                                  if (e.target.checked && campo.max && actual.length >= campo.max) return
                                  const nuevo = e.target.checked
                                    ? [...actual, op.value]
                                    : actual.filter(v => v !== op.value)
                                  setForm({ ...form, [campo.name]: nuevo })
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              {op.label}
                            </label>
                          ))}
                        </div>
                        {campo.hint && (
                          <p className="text-xs text-gray-400 mt-1.5">{campo.hint}</p>
                        )}
                      </>
                    ) : campo.type === 'select' ? (
                      <select
                        value={form[campo.name] || ''}
                        onChange={(e) => setForm({ ...form, [campo.name]: e.target.value })}
                        required={campo.required}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        {campo.options?.map(op => (
                          <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={campo.type || 'text'}
                        value={form[campo.name] || ''}
                        onChange={(e) => {
                          const v = e.target.value
                          setForm({ ...form, [campo.name]: campo.type === 'number' && v !== '' ? Number(v) : v })
                        }}
                        required={campo.required}
                        placeholder={campo.placeholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50"
                >
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
