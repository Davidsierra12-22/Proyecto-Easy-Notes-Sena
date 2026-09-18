import { useEffect, useState } from 'react'
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, Select, MenuItem, Dialog, DialogTitle, DialogContent,
  CircularProgress
} from '@mui/material'
import { RefreshCw, CheckCircle2, XCircle, Eye, X } from 'lucide-react'
import api from '../services/api.service'
import { useAuth } from '../store/Auth'

const estadoBadge = (estado) => {
  const map = {
    pendiente: 'bg-amber-100 text-amber-700',
    aprobada: 'bg-primary-100 text-primary-800',
    rechazada: 'bg-red-100 text-red-700',
    matriculada: 'bg-emerald-100 text-emerald-700'
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[estado] || 'bg-gray-100 text-gray-600'}`}>{estado}</span>
}

export default function Prematriculas() {
  const { usuario } = useAuth()
  const puedeAprobar = ['super_admin', 'admin'].includes(usuario?.tipoPerfil)

  const [datos, setDatos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [error, setError] = useState('')
  const [detalle, setDetalle] = useState(null)

  const cargar = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (filtro) params.estado = filtro
      const r = await api.get('/prematriculas', { params })
      setDatos(r.data.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [filtro])

  const aprobar = async (p) => {
    const obs = window.prompt(`Aprobar solicitud de ${p.estudiante?.nombres} ${p.estudiante?.apellidos}?\nObservaciones (opcional):`)
    if (obs === null) return
    try {
      const r = await api.put(`/prematriculas/${p._id}/aprobar`, { observaciones: obs || undefined })
      alert(r.data.message)
      await cargar()
    } catch (e) {
      alert(e.response?.data?.message || 'Error al aprobar')
    }
  }

  const rechazar = async (p) => {
    const obs = window.prompt(`Rechazar solicitud de ${p.estudiante?.nombres} ${p.estudiante?.apellidos}?\nMotivo:`)
    if (obs === null) return
    try {
      const r = await api.put(`/prematriculas/${p._id}/rechazar`, { observaciones: obs || undefined })
      alert(r.data.message)
      await cargar()
    } catch (e) {
      alert(e.response?.data?.message || 'Error al rechazar')
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Prematrículas</h1>
            <p className="text-sm text-gray-500">Solicitudes de prematrícula online recibidas por la institución</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filtro} onChange={(e) => setFiltro(e.target.value)}
              size="small"
              sx={{ bgcolor: '#ffffff', minWidth: 150, fontSize: '0.875rem', '& fieldset': { borderColor: '#e5e7eb' } }}>
              <MenuItem value="">Todas</MenuItem>
              <MenuItem value="pendiente">Pendientes</MenuItem>
              <MenuItem value="aprobada">Aprobadas</MenuItem>
              <MenuItem value="rechazada">Rechazadas</MenuItem>
              <MenuItem value="matriculada">Matriculadas</MenuItem>
            </Select>
            <IconButton onClick={cargar} aria-label="Recargar prematriculas" title="Recargar prematriculas" size="small"
              className="!text-gray-500 hover:!text-gray-700 hover:!bg-gray-100">
              <RefreshCw className="w-4 h-4" />
            </IconButton>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow className="bg-gray-50">
                <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Estudiante</TableCell>
                <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Documento</TableCell>
                <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Grado</TableCell>
                <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Acudiente</TableCell>
                <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Estado</TableCell>
                <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Fecha</TableCell>
                <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider !text-right whitespace-nowrap">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="!text-center !py-8 !text-gray-500">
                    <CircularProgress size={24} className="!text-primary-600" />
                  </TableCell>
                </TableRow>
              ) : datos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="!text-center !py-8 !text-gray-500">No hay solicitudes</TableCell>
                </TableRow>
              ) : (
                datos.map(p => (
                  <TableRow key={p._id} hover>
                    <TableCell className="!text-sm !font-medium !text-gray-900 !py-3">
                      {p.estudiante?.nombres ? `${p.estudiante.nombres} ${p.estudiante.apellidos}` : '—'}
                    </TableCell>
                    <TableCell className="!text-sm !text-gray-700 !py-3">{p.estudiante?.tipoDocumento} {p.estudiante?.documento}</TableCell>
                    <TableCell className="!text-sm !text-gray-700 !py-3">Grado {p.gradoSolicitado}{p.grupoSolicitado ? ` (${p.grupoSolicitado})` : ''}</TableCell>
                    <TableCell className="!text-sm !text-gray-700 !py-3">
                      {p.acudiente?.nombres ? `${p.acudiente.nombres} ${p.acudiente.apellidos}` : '—'}
                      <span className="text-gray-400 text-xs block">{p.acudiente?.parentesco}</span>
                    </TableCell>
                    <TableCell className="!py-3">{estadoBadge(p.estado)}</TableCell>
                    <TableCell className="!text-sm !text-gray-500 !py-3">{new Date(p.createdAt).toLocaleDateString('es-CO')}</TableCell>
                    <TableCell className="!py-3 !text-right whitespace-nowrap">
                      <Button onClick={() => setDetalle(p)} className="!text-gray-600 hover:!text-gray-800 !normal-case text-sm font-medium mr-3" size="small"
                        startIcon={<Eye className="w-4 h-4" />}>
                        Ver
                      </Button>
                      {puedeAprobar && p.estado === 'pendiente' && (
                        <>
                          <Button onClick={() => aprobar(p)} className="!text-emerald-600 hover:!text-emerald-800 !normal-case text-sm font-medium mr-3" size="small"
                            startIcon={<CheckCircle2 className="w-4 h-4" />}>
                            Aprobar
                          </Button>
                          <Button onClick={() => rechazar(p)} className="!text-red-600 hover:!text-red-800 !normal-case text-sm font-medium" size="small"
                            startIcon={<XCircle className="w-4 h-4" />}>
                            Rechazar
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {detalle && (
        <Dialog open onClose={() => setDetalle(null)} maxWidth="sm" fullWidth>
          <DialogTitle className="flex items-center justify-between pr-2">
            <span>Detalle de la solicitud</span>
            <IconButton onClick={() => setDetalle(null)} aria-label="Cerrar detalle" size="small">
              <X className="w-5 h-5" />
            </IconButton>
          </DialogTitle>
          <DialogContent className="!pt-2">
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Estudiante</p>
                {[
                  ['Nombres', detalle.estudiante?.nombres ? `${detalle.estudiante.nombres} ${detalle.estudiante.apellidos}` : '—'],
                  ['Documento', `${detalle.estudiante?.tipoDocumento} ${detalle.estudiante?.documento}`],
                  ['Fecha de nacimiento', detalle.estudiante?.fechaNacimiento ? new Date(detalle.estudiante.fechaNacimiento).toLocaleDateString('es-CO') : '—'],
                  ['Género', detalle.estudiante?.genero || '—'],
                  ['Dirección', detalle.estudiante?.direccion || '—'],
                  ['Teléfono', detalle.estudiante?.telefono || '—'],
                  ['Grado solicitado', `Grado ${detalle.gradoSolicitado}${detalle.grupoSolicitado ? ` (${detalle.grupoSolicitado})` : ''}`]
                ].map(([k, v]) => (
                  <p key={k} className="flex justify-between py-0.5 border-b border-gray-100"><span className="text-gray-500">{k}</span><span className="font-medium">{v}</span></p>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Acudiente</p>
                {[
                  ['Nombres', detalle.acudiente?.nombres ? `${detalle.acudiente.nombres} ${detalle.acudiente.apellidos}` : '—'],
                  ['Documento', detalle.acudiente?.tipoDocumento ? `${detalle.acudiente.tipoDocumento} ${detalle.acudiente.documento}` : '—'],
                  ['Parentesco', detalle.acudiente?.parentesco || '—'],
                  ['Email', detalle.acudiente?.email || '—'],
                  ['Teléfono', detalle.acudiente?.telefono || '—']
                ].map(([k, v]) => (
                  <p key={k} className="flex justify-between py-0.5 border-b border-gray-100"><span className="text-gray-500">{k}</span><span className="font-medium">{v}</span></p>
                ))}
              </div>
              {detalle.observaciones && (
                <p className="text-xs text-gray-600">Observaciones: {detalle.observaciones}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}