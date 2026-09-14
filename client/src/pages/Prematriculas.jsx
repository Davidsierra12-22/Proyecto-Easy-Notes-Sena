import { useEffect, useState } from 'react'
import { RefreshCw, CheckCircle2, XCircle, Eye } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

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
            <select value={filtro} onChange={(e) => setFiltro(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
              <option value="">Todas</option>
              <option value="pendiente">Pendientes</option>
              <option value="aprobada">Aprobadas</option>
              <option value="rechazada">Rechazadas</option>
              <option value="matriculada">Matriculadas</option>
            </select>
            <button onClick={cargar} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estudiante</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Documento</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Grado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acudiente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="px-4 py-8 text-center">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : datos.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No hay solicitudes</td></tr>
              ) : (
                datos.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.estudiante?.nombres} {p.estudiante?.apellidos}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{p.estudiante?.tipoDocumento} {p.estudiante?.documento}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Grado {p.gradoSolicitado}{p.grupoSolicitado ? ` (${p.grupoSolicitado})` : ''}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{p.acudiente?.nombres} {p.acudiente?.apellidos}<span className="text-gray-400 text-xs block">{p.acudiente?.parentesco}</span></td>
                    <td className="px-4 py-3">{estadoBadge(p.estado)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(p.createdAt).toLocaleDateString('es-CO')}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => setDetalle(p)} className="text-gray-600 hover:text-gray-800 text-sm font-medium mr-3 inline-flex items-center gap-1">
                        <Eye className="w-4 h-4" /> Ver
                      </button>
                      {puedeAprobar && p.estado === 'pendiente' && (
                        <>
                          <button onClick={() => aprobar(p)} className="text-emerald-600 hover:text-emerald-800 text-sm font-medium mr-3 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Aprobar
                          </button>
                          <button onClick={() => rechazar(p)} className="text-red-600 hover:text-red-800 text-sm font-medium inline-flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Rechazar
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

      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetalle(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Detalle de la solicitud</h2>
              <button onClick={() => setDetalle(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Estudiante</p>
                {[
                  ['Nombres', `${detalle.estudiante?.nombres} ${detalle.estudiante?.apellidos}`],
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
                  ['Nombres', `${detalle.acudiente?.nombres} ${detalle.acudiente?.apellidos}`],
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
          </div>
        </div>
      )}
    </div>
  )
}