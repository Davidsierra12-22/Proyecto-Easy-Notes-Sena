import { useEffect, useState } from 'react'
import { Plus, RefreshCw, PlayCircle, XCircle, ArrowRight } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, TextField, MenuItem, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material'
import api from '../services/api.service'
import { useAuth } from '../store/Auth'

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
            <IconButton onClick={cargar} aria-label="Recargar años académicos" title="Recargar años académicos" size="small">
              <RefreshCw className="w-4 h-4" />
            </IconButton>
            {puedeGestionar && (
              <Button onClick={() => { setForm({ anio: new Date().getFullYear(), numeroPeriodos: 4, notaMinima: 3.0 }); setModal(true); setError('') }}
                variant="contained" color="primary" startIcon={<Plus className="w-4 h-4" />}>
                Nuevo Año
              </Button>
            )}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

        <div className="overflow-x-auto">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider">Año</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider">Estado</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider">Períodos</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider">Nota Mínima</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider">Pierde Año</TableCell>
                  <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider !text-right">Acciones</TableCell>
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
                    <TableCell colSpan={6} className="!text-center !py-8 !text-gray-500">Sin años académicos creados</TableCell>
                  </TableRow>
                ) : (
                  datos.map(a => (
                    <TableRow key={a._id} hover>
                      <TableCell className="!text-sm !font-medium !text-gray-900">{a.anio}</TableCell>
                      <TableCell>{estadoBadge(a.estado)}</TableCell>
                      <TableCell className="!text-sm !text-gray-700">{a.configuracion?.numeroPeriodos ?? 4}</TableCell>
                      <TableCell className="!text-sm !text-gray-700">{a.configuracion?.notaMinima ?? 3.0}</TableCell>
                      <TableCell className="!text-sm !text-gray-700">
                        {a.configuracion?.numPerdidas != null
                          ? `${a.configuracion.numPerdidas} ${a.configuracion.pierdeAnoPor === 'areas' ? 'áreas' : 'materias'}`
                          : '—'}
                      </TableCell>
                      <TableCell className="!text-right whitespace-nowrap">
                        {a.estado !== 'activo' && (
                          <Button onClick={() => accion(a._id, 'activar', `¿Activar el año ${a.anio} como año lectivo vigente?`)}
                            size="small" className="!text-emerald-600 hover:!text-emerald-800 !normal-case !font-medium mr-3" startIcon={<PlayCircle className="w-4 h-4" />}>
                            Activar
                          </Button>
                        )}
                        {a.estado === 'activo' && (
                          <Button onClick={() => accion(a._id, 'cerrar', `¿Cerrar el año ${a.anio}?`)}
                            size="small" className="!text-amber-600 hover:!text-amber-800 !normal-case !font-medium mr-3" startIcon={<XCircle className="w-4 h-4" />}>
                            Cerrar
                          </Button>
                        )}
                        <Button onClick={() => accion(a._id, 'cerrar-migracion', `¿Cerrar ${a.anio} y migrar estudiantes al siguiente año? Debes crear el año destino primero.`)}
                          size="small" className="!text-primary-600 hover:!text-primary-800 !normal-case !font-medium" startIcon={<ArrowRight className="w-4 h-4" />}>
                          Cerrar + Migrar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>

      <Dialog open={modal} onClose={() => setModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="flex items-center justify-between pr-2">
          <span>Nuevo Año Académico</span>
          <IconButton onClick={() => setModal(false)} aria-label="Cerrar modal de año académico" size="small">
            <span className="text-xl">&times;</span>
          </IconButton>
        </DialogTitle>
        <form onSubmit={crear}>
          <DialogContent className="!pt-2">
            <div className="space-y-4">
              <TextField type="number" value={form.anio} onChange={(e) => setForm({ ...form, anio: e.target.value })} required
                label="Año lectivo" fullWidth size="small" />
              <TextField
                select
                value={form.numeroPeriodos}
                onChange={(e) => setForm({ ...form, numeroPeriodos: e.target.value })}
                label="Número de períodos"
                fullWidth
                size="small"
              >
                {[2, 3, 4, 5].map(n => <MenuItem key={n} value={n}>{n} períodos</MenuItem>)}
              </TextField>
              <TextField type="number" step="0.1" min="1" max="5" value={form.notaMinima} onChange={(e) => setForm({ ...form, notaMinima: e.target.value })}
                label="Nota mínima para aprobar" fullWidth size="small" />
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>}
            </div>
          </DialogContent>
          <DialogActions className="!px-6 !pb-5">
            <Button onClick={() => setModal(false)} className="!text-gray-700 hover:!bg-gray-100">Cancelar</Button>
            <Button type="submit" variant="contained" color="primary" disabled={saving}>
              {saving ? 'Creando...' : 'Crear Año'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  )
}
