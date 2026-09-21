import { useEffect, useState } from 'react'
import { RefreshCw, Search, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../services/api.service'
import { useAuth } from '../store/Auth'
import {
  Button, CircularProgress, FormControl, IconButton, InputLabel, MenuItem, Select,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField
} from '@mui/material'

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
              <Button onClick={limpiarBitacora} color="error" className="!normal-case text-sm font-medium !rounded-lg hover:!bg-red-50">
                <Trash2 className="w-4 h-4 mr-1" /> Limpiar
              </Button>
            )}
            <IconButton onClick={() => cargar(paginacion.pagina)} aria-label="Recargar bitacora" title="Recargar bitacora" className="!text-gray-500 hover:!text-gray-700 !rounded-lg" size="small">
              <RefreshCw className="w-4 h-4" />
            </IconButton>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <FormControl size="small" fullWidth>
            <InputLabel id="filtro-coleccion-label">Colección / Módulo</InputLabel>
            <Select
              labelId="filtro-coleccion-label"
              label="Colección / Módulo"
              value={filtros.coleccion}
              onChange={(e) => setFiltros({ ...filtros, coleccion: e.target.value })}
            >
              <MenuItem value="">Todas</MenuItem>
              {COLECCIONES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            type="date"
            label="Desde"
            value={filtros.fechaDesde}
            onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
            size="small"
            fullWidth
          />
          <TextField
            type="date"
            label="Hasta"
            value={filtros.fechaHasta}
            onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
            size="small"
            fullWidth
          />
          <TextField
            type="text"
            label="Buscar en detalle"
            value={filtros.buscar}
            onChange={(e) => setFiltros({ ...filtros, buscar: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros()}
            placeholder="Buscar..."
            size="small"
            fullWidth
          />
          <div className="flex items-end gap-2">
            <Button onClick={aplicarFiltros} variant="contained" color="primary" className="!normal-case text-sm !rounded-lg">
              <Search className="w-4 h-4 mr-1" /> Filtrar
            </Button>
            <Button onClick={limpiarFiltros} className="px-4 py-2 text-sm !text-gray-600 !bg-gray-100 hover:!bg-gray-200 !rounded-lg !normal-case">Limpiar</Button>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
        {exito && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-3 py-2 mb-4">{exito}</div>}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow className="bg-gray-50">
                {['Fecha', 'Usuario', 'Acción', 'Módulo', 'Detalle', 'IP'].map(h => (
                  <TableCell key={h} className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="!text-center !py-8">
                    <CircularProgress size={24} className="!text-primary-600" />
                  </TableCell>
                </TableRow>
              ) : datos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="!text-center !py-8 !text-gray-500">No hay registros de bitácora</TableCell>
                </TableRow>
              ) : (
                datos.map(b => (
                  <TableRow key={b._id} hover>
                    <TableCell className="!text-sm !text-gray-700 !py-3 whitespace-nowrap">{new Date(b.createdAt).toLocaleString('es-CO')}</TableCell>
                    <TableCell className="!text-sm !text-gray-700 !py-3">
                      {b.usuarioId?.nombres ? `${b.usuarioId.nombres} ${b.usuarioId.apellidos}` : (b.usuarioId ? '—' : 'Sistema')}
                    </TableCell>
                    <TableCell className="!py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                        {accionLabel(b.accion)}
                      </span>
                    </TableCell>
                    <TableCell className="!text-sm !text-gray-700 !py-3">{b.coleccion || '—'}</TableCell>
                    <TableCell className="!text-sm !text-gray-600 !py-3 max-w-md">{b.detalle || '—'}</TableCell>
                    <TableCell className="!text-sm !text-gray-500 !py-3">{b.direccionIp || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {paginacion.totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-500">
              Página {paginacion.pagina} de {paginacion.totalPaginas}
            </span>
            <div className="flex items-center gap-2">
              <IconButton onClick={() => cargar(paginacion.pagina - 1)} disabled={paginacion.pagina <= 1} aria-label="Página anterior" className="!text-gray-600 hover:!bg-gray-100 !rounded-lg disabled:!opacity-40" size="small">
                <ChevronLeft className="w-4 h-4" />
              </IconButton>
              <IconButton onClick={() => cargar(paginacion.pagina + 1)} disabled={paginacion.pagina >= paginacion.totalPaginas} aria-label="Página siguiente" className="!text-gray-600 hover:!bg-gray-100 !rounded-lg disabled:!opacity-40" size="small">
                <ChevronRight className="w-4 h-4" />
              </IconButton>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}