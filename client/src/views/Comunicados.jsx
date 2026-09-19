import { useEffect, useState } from 'react'
import { Plus, RefreshCw, Send, MailOpen, Mail, AlertCircle } from 'lucide-react'
import {
  Button, IconButton, TextField, Select, MenuItem, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel
} from '@mui/material'
import api from '../services/api.service'
import { useAuth } from '../store/Auth'
import PaginationBar from '../components/Tables/PaginationBar'

const ROLES_DESTINO = [
  { value: 'estudiante', label: 'Estudiantes' },
  { value: 'docente', label: 'Docentes' },
  { value: 'acudiente', label: 'Acudientes' },
  { value: 'admin', label: 'Administradores' },
  { value: 'rector', label: 'Rector' },
  { value: 'coordinador', label: 'Coordinadores' }
]

export default function Comunicados() {
  const { usuario } = useAuth()
  const puedeEnviar = ['super_admin', 'admin', 'rector', 'coordinador', 'docente', 'secretaria'].includes(usuario?.tipoPerfil)

  const [enviados, setEnviados] = useState([])
  const [grupos, setGrupos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ destinatarios: [{ rol: 'estudiante' }], prioridad: 'normal' })
  const [saving, setSaving] = useState(false)
  const [detalle, setDetalle] = useState(null)
  const [pagina, setPagina] = useState(1)
  const [paginacion, setPaginacion] = useState(null)

  const cargar = async (page = pagina) => {
    setLoading(true)
    try {
      const r = await api.get('/comunicados', { params: { page, limit: 50 } })
      setEnviados(r.data.data)
      setPaginacion(r.data.paginacion || null)
      setPagina(page)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar comunicados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
    if (puedeEnviar) api.get('/grupos').then(r => setGrupos(r.data.data)).catch(() => {})
  }, [])

  const agregarDestinatario = () => setForm({ ...form, destinatarios: [...form.destinatarios, { rol: 'estudiante' }] })
  const quitarDestinatario = (i) => setForm({ ...form, destinatarios: form.destinatarios.filter((_, idx) => idx !== i) })
  const setDestinatario = (i, campo, valor) => {
    const nuevos = [...form.destinatarios]
    nuevos[i] = { ...nuevos[i], [campo]: valor }
    setForm({ ...form, destinatarios: nuevos })
  }

  const enviar = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const destinatarios = form.destinatarios
        .filter(d => d.usuarioId || d.rol || d.grupoId)
        .map(d => ({
          ...(d.usuarioId ? { usuarioId: d.usuarioId } : { rol: d.rol || 'estudiante' }),
          ...(d.grupoId ? { grupoId: d.grupoId } : {})
        }))
      if (!destinatarios.length) {
        setError('Agrega al menos un destinatario (por rol, grupo o usuario)')
        return
      }
      await api.post('/comunicados', {
        asunto: form.asunto,
        mensaje: form.mensaje,
        prioridad: form.prioridad,
        destinatarios
      })
      setModal(false)
      await cargar()
      setExito('Comunicado enviado correctamente')
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar comunicado')
    } finally {
      setSaving(false)
    }
  }

  const marcarLeido = async (c) => {
    try {
      await api.put(`/comunicados/${c._id}/leer`)
      await cargar()
      setExito('Comunicado marcado como leído')
    } catch (e) {
      setError(e.response?.data?.message || 'Error al marcar leído')
    }
  }

  const yaLeido = (c) => c.leido?.some(l => l.usuarioId === usuario?._id)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h1 className="text-xl font-bold text-gray-900">Comunicados</h1>
          <div className="flex items-center gap-2">
            <IconButton onClick={cargar} aria-label="Recargar comunicados" title="Recargar comunicados" size="small">
              <RefreshCw className="w-4 h-4" />
            </IconButton>
            {puedeEnviar && (
              <Button onClick={() => { setForm({ destinatarios: [{ rol: 'estudiante' }], prioridad: 'normal' }); setModal(true); setError('') }}
                variant="contained" color="primary" startIcon={<Plus className="w-4 h-4" />}>
                Nuevo Comunicado
              </Button>
            )}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
        {exito && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-3 py-2 mb-4">{exito}</div>}

        <div className="space-y-3">
          {loading ? (
            <div className="py-8 text-center"><CircularProgress size={24} className="!text-primary-600" /></div>
          ) : enviados.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No hay comunicados</div>
          ) : (
            enviados.map(c => (
              <div key={c._id} className="border border-gray-200 rounded-xl p-4 hover:border-primary-200 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${c.prioridad === 'urgente' ? 'text-red-500' : 'text-primary-500'}`}>
                      {c.prioridad === 'urgente' ? <AlertCircle className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{c.asunto}</h3>
                        {c.prioridad === 'urgente' && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Urgente</span>
                        )}
                        {yaLeido(c) && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Leído</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">De: {c.remitenteId ? `${c.remitenteId.nombres} ${c.remitenteId.apellidos}` : '—'}</p>
                      <p className="text-xs text-gray-400">{new Date(c.fecha || c.createdAt).toLocaleString('es-CO')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-none">
                    <Button onClick={() => setDetalle(c)} size="small" className="!text-primary-600 hover:!text-primary-800 !normal-case !font-medium">Ver</Button>
                    {!yaLeido(c) && (
                      <Button onClick={() => marcarLeido(c)} size="small" className="!text-gray-600 hover:!text-gray-800 !normal-case !font-medium" startIcon={<MailOpen className="w-4 h-4" />}>
                        Leer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {paginacion && (
          <PaginationBar
            pagina={paginacion.pagina}
            total={paginacion.total}
            limite={paginacion.limite}
            totalPaginas={paginacion.totalPaginas}
            onCambio={(p) => cargar(p)}
          />
        )}
      </div>

      <Dialog open={modal} onClose={() => setModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="flex items-center justify-between pr-2">
          <span>Nuevo Comunicado</span>
          <IconButton onClick={() => setModal(false)} aria-label="Cerrar modal" size="small">
            <span className="text-xl">&times;</span>
          </IconButton>
        </DialogTitle>
        <form onSubmit={enviar}>
          <DialogContent className="!pt-2">
            <div className="space-y-4">
              <TextField type="text" value={form.asunto} onChange={(e) => setForm({ ...form, asunto: e.target.value })} required
                label="Asunto" placeholder="Asunto del comunicado" fullWidth size="small" />
              <TextField value={form.mensaje} onChange={(e) => setForm({ ...form, mensaje: e.target.value })} required
                label="Mensaje" placeholder="Contenido del comunicado..." multiline minRows={4} fullWidth size="small" />
              <div className="grid grid-cols-2 gap-4">
                <FormControl fullWidth size="small">
                  <InputLabel id="prioridad-label">Prioridad</InputLabel>
                  <Select labelId="prioridad-label" value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })} label="Prioridad">
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="urgente">Urgente</MenuItem>
                  </Select>
                </FormControl>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destinatarios</label>
                <div className="space-y-2">
                  {form.destinatarios?.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Select
                        value={d.usuarioId ? 'usuario' : (d.grupoId ? 'grupo' : 'rol')}
                        onChange={(e) => {
                          const tipo = e.target.value
                          setDestinatario(i, 'tipo', tipo)
                          setForm(prev => {
                            const nuevos = [...prev.destinatarios]
                            nuevos[i] = tipo === 'rol' ? { rol: 'estudiante' } : tipo === 'grupo' ? { grupoId: '' } : { usuarioId: '' }
                            return { ...prev, destinatarios: nuevos }
                          })
                        }}
                        size="small"
                        className="min-w-[140px] text-sm"
                      >
                        <MenuItem value="rol">Por rol</MenuItem>
                        <MenuItem value="grupo">Por grupo</MenuItem>
                        <MenuItem value="usuario">Usuario específico</MenuItem>
                      </Select>
                      {d.tipo === 'grupo' || d.grupoId ? (
                        <Select value={d.grupoId} onChange={(e) => setDestinatario(i, 'grupoId', e.target.value)}
                          displayEmpty size="small" className="flex-1 min-w-0 text-sm">
                          <MenuItem value="">Seleccionar grupo...</MenuItem>
                          {grupos.map(g => <MenuItem key={g._id} value={g._id}>{g.nombre} (Grado {g.grado})</MenuItem>)}
                        </Select>
                      ) : d.tipo === 'usuario' || d.usuarioId ? (
                        <TextField type="text" placeholder="ID de usuario (opcional)" value={d.usuarioId || ''}
                          onChange={(e) => setDestinatario(i, 'usuarioId', e.target.value)}
                          className="flex-1 min-w-0" size="small" />
                      ) : (
                        <Select value={d.rol} onChange={(e) => setDestinatario(i, 'rol', e.target.value)}
                          displayEmpty size="small" className="flex-1 min-w-0 text-sm">
                          {ROLES_DESTINO.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
                        </Select>
                      )}
                      <IconButton type="button" onClick={() => quitarDestinatario(i)} aria-label="Quitar destinatario" size="small" className="!text-red-500">
                        <span className="text-xl">&times;</span>
                      </IconButton>
                    </div>
                  ))}
                </div>
                <Button type="button" onClick={agregarDestinatario} size="small" className="!text-primary-600 hover:!text-primary-800 !normal-case !font-medium mt-2">+ Agregar destinatario</Button>
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>}
            </div>
          </DialogContent>
          <DialogActions className="!px-6 !pb-5">
            <Button onClick={() => setModal(false)} className="!text-gray-700 hover:!bg-gray-100">Cancelar</Button>
            <Button type="submit" variant="contained" color="primary" disabled={saving} startIcon={<Send className="w-4 h-4" />}>
              {saving ? 'Enviando...' : 'Enviar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={Boolean(detalle)} onClose={() => setDetalle(null)} maxWidth="sm" fullWidth>
        <DialogTitle className="flex items-center justify-between pr-2">
          <span className="truncate">{detalle?.asunto}</span>
          <IconButton onClick={() => setDetalle(null)} aria-label="Cerrar modal" size="small">
            <span className="text-xl">&times;</span>
          </IconButton>
        </DialogTitle>
        <DialogContent className="!pt-2">
          {detalle && (
            <>
              <p className="text-sm text-gray-500 mb-2">
                De: {detalle.remitenteId ? `${detalle.remitenteId.nombres} ${detalle.remitenteId.apellidos}` : '—'} · {new Date(detalle.fecha || detalle.createdAt).toLocaleString('es-CO')}
              </p>
              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-800">{detalle.mensaje}</div>
              {!yaLeido(detalle) && (
                <Button onClick={() => { marcarLeido(detalle); setDetalle(null) }}
                  variant="contained" color="primary" className="mt-4">
                  Marcar como leído
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}