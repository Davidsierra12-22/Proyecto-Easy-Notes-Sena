import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, TextField, Select, MenuItem, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
  CircularProgress, Alert
} from '@mui/material'
import { Search, RefreshCw, ArrowLeft, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import CloseIcon from '@mui/icons-material/Close'
import api from '../../services/api.service'
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
  transformDatos,
  validate
}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtrosValores, setFiltrosValores] = useState(filtroInicial || {})
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
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
    setFieldErrors({})
  }

  const abrirEditar = (item) => {
    const inicial = {}
    campos.forEach(c => { inicial[c.name] = valorInicial(c, item[c.name]) })
    setForm(inicial)
    setEditing(item)
    setModal(true)
    setError('')
    setFieldErrors({})
  }

  const guardar = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})
    try {
      if (validate) {
        const errores = validate(form)
        if (errores && Object.keys(errores).length > 0) {
          setFieldErrors(errores)
          setSaving(false)
          return
        }
      }
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
      setError(e.response?.data?.message || 'Error al cambiar estado')
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <IconButton onClick={() => navigate(-1)} aria-label="Volver" title="Volver" color="inherit" size="small">
              <ArrowLeft className="w-5 h-5" />
            </IconButton>
            <h1 className="text-xl font-bold text-gray-900">{titulo}</h1>
          </div>
          <div className="flex items-center gap-2">
            {filtros && filtros.map(f => (
              <FormControl key={f.name} size="small">
                <Select
                  value={filtrosValores[f.name] || ''}
                  onChange={(e) => aplicarFiltro(f.name, e.target.value)}
                  displayEmpty
                  className="min-w-40 text-sm"
                >
                  <MenuItem value="">{f.label}: Todos</MenuItem>
                  {f.options.map(op => (
                    <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            ))}
            <TextField
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && cargar({}, 1)}
              placeholder="Buscar..."
              size="small"
              className="w-48 sm:w-64"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search className="w-4 h-4 text-gray-400" />
                    </InputAdornment>
                  )
                }
              }}
            />
            <IconButton
              onClick={() => { setBusqueda(''); setFiltrosValores({}); setTimeout(() => cargar({}, 1), 0) }}
              aria-label="Refrescar"
              title="Refrescar"
              color="inherit"
              size="small"
            >
              <RefreshCw className="w-4 h-4" />
            </IconButton>
            {puedeGestionar && (
              <Button
                onClick={abrirCrear}
                variant="contained"
                color="primary"
                className="!normal-case text-sm font-medium px-4 py-2"
              >
                + Nuevo
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Alert severity="error" className="mb-4">{error}</Alert>
        )}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow className="bg-gray-50">
                {columnas.map(col => (
                  <TableCell key={col.key} className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">
                    {col.label}
                  </TableCell>
                ))}
                {puedeGestionar && (
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider !text-right whitespace-nowrap">
                    Acciones
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columnas.length + 1} className="!text-center !py-8 !text-gray-500">
                    <CircularProgress size={24} className="!text-primary-600" />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columnas.length + 1} className="!text-center !py-8 !text-gray-500">
                    Sin registros
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item._id} hover>
                    {columnas.map(col => (
                      <TableCell key={col.key} className="!text-sm !text-gray-700 !py-3 whitespace-nowrap">
                        {col.render ? col.render(item) : (item[col.key] ?? '—')}
                      </TableCell>
                    ))}
                    {puedeGestionar && (
                      <TableCell className="!text-right !py-3 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {renderAcciones && renderAcciones(item)}
                          <IconButton
                            onClick={() => abrirEditar(item)}
                            aria-label="Editar"
                            title="Editar"
                            size="small"
                            className="!text-primary-600 hover:!text-primary-800 disabled:!opacity-40"
                            disabled={item._protegido}
                          >
                            <Pencil className="w-4 h-4" />
                          </IconButton>
                          {puedeDesactivar && (
                            <IconButton
                              onClick={() => cambiarEstado(item)}
                              aria-label={item.estado === 'activo' ? 'Desactivar' : 'Activar'}
                              title={item.estado === 'activo' ? 'Desactivar' : 'Activar'}
                              size="small"
                              className={
                                item.estado === 'activo'
                                  ? '!text-amber-600 hover:!text-amber-800 disabled:!opacity-40'
                                  : '!text-emerald-600 hover:!text-emerald-800 disabled:!opacity-40'
                              }
                              disabled={item._protegido}
                            >
                              {item.estado === 'activo' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                            </IconButton>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

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

      <Dialog open={modal} onClose={() => setModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="flex items-center justify-between pr-2">
          <span>{editing ? 'Editar registro' : 'Nuevo registro'}</span>
          <IconButton onClick={() => setModal(false)} aria-label="Cerrar modal" size="small">
            <CloseIcon className="w-5 h-5" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={guardar}>
          <DialogContent className="!pt-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {campos.map(campo => (
                <FormControl key={campo.name} fullWidth className={campo.colSpan === 2 ? 'col-span-2' : ''}>
                  {campo.type === 'multiSelect' ? (
                    <>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                        {(campo.getOptions ? campo.getOptions(form) : campo.options)?.map(op => (
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
                                if (fieldErrors[campo.name]) setFieldErrors(prev => ({ ...prev, [campo.name]: '' }))
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
                      {fieldErrors[campo.name] && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors[campo.name]}</p>
                      )}
                    </>
                  ) : campo.type === 'select' ? (
                    <>
                      <TextField
                        select
                        value={form[campo.name] || ''}
                        onChange={(e) => {
                          setForm({ ...form, [campo.name]: e.target.value })
                          if (fieldErrors[campo.name]) setFieldErrors(prev => ({ ...prev, [campo.name]: '' }))
                          const dependents = campos.filter(c => c.dependsOn === campo.name)
                          if (dependents.length) {
                            const patch = {}
                            dependents.forEach(d => { patch[d.name] = d.type === 'multiSelect' ? [] : '' })
                            setForm(prev => ({ ...prev, [campo.name]: e.target.value, ...patch }))
                          }
                        }}
                        label={campo.label}
                        fullWidth
                        error={Boolean(fieldErrors[campo.name])}
                      >
                        <MenuItem value="">Seleccionar...</MenuItem>
                        {campo.options?.map(op => (
                          <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
                        ))}
                      </TextField>
                      {fieldErrors[campo.name] && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors[campo.name]}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <TextField
                        type={campo.type || 'text'}
                        value={form[campo.name] || ''}
                        onChange={(e) => {
                          const v = e.target.value
                          setForm({ ...form, [campo.name]: campo.type === 'number' && v !== '' ? Number(v) : v })
                          if (fieldErrors[campo.name]) setFieldErrors(prev => ({ ...prev, [campo.name]: '' }))
                        }}
                        label={campo.label}
                        placeholder={campo.placeholder}
                        fullWidth
                        error={Boolean(fieldErrors[campo.name])}
                        slotProps={{
                          htmlInput: {
                            inputMode: campo.inputMode,
                            pattern: campo.pattern,
                            minLength: campo.minLength,
                            maxLength: campo.maxLength
                          },
                          ...(campo.type === 'date' ? { inputLabel: { shrink: true } } : {})
                        }}
                      />
                      {fieldErrors[campo.name] && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors[campo.name]}</p>
                      )}
                    </>
                  )}
                </FormControl>
              ))}
            </div>

            {error && (
              <Alert severity="error" className="mt-3">{error}</Alert>
            )}
          </DialogContent>
          <DialogActions className="!px-6 !pb-5">
            <Button onClick={() => setModal(false)} className="!text-gray-700 hover:!bg-gray-100">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={saving}>
              {saving ? 'Guardando...' : (editing ? 'Actualizar' : 'Crear')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  )
}