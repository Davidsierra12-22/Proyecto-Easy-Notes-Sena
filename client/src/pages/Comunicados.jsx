import { useEffect, useState } from 'react'
import { Plus, RefreshCw, Send, MailOpen, Mail, AlertCircle } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

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

  const cargar = async () => {
    setLoading(true)
    try {
      const r = await api.get('/comunicados')
      setEnviados(r.data.data)
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

  const yaLeido = (c) => c.leido?.some(l => l.usuarioId === usuario?.id)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h1 className="text-xl font-bold text-gray-900">Comunicados</h1>
          <div className="flex items-center gap-2">
            <button onClick={cargar} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <RefreshCw className="w-4 h-4" />
            </button>
            {puedeEnviar && (
              <button onClick={() => { setForm({ destinatarios: [{ rol: 'estudiante' }], prioridad: 'normal' }); setModal(true); setError('') }}
                className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2">
                <Plus className="w-4 h-4" /> Nuevo Comunicado
              </button>
            )}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
        {exito && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-3 py-2 mb-4">{exito}</div>}

        <div className="space-y-3">
          {loading ? (
            <div className="py-8 text-center"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
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
                    <button onClick={() => setDetalle(c)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Ver</button>
                    {!yaLeido(c) && (
                      <button onClick={() => marcarLeido(c)} className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center gap-1">
                        <MailOpen className="w-4 h-4" /> Leer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Nuevo Comunicado</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={enviar} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asunto <span className="text-red-500">*</span></label>
                <input type="text" value={form.asunto} onChange={(e) => setForm({ ...form, asunto: e.target.value })} required
                  placeholder="Asunto del comunicado" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje <span className="text-red-500">*</span></label>
                <textarea value={form.mensaje} onChange={(e) => setForm({ ...form, mensaje: e.target.value })} required rows="4"
                  placeholder="Contenido del comunicado..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                  <select value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                    <option value="normal">Normal</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destinatarios</label>
                <div className="space-y-2">
                  {form.destinatarios?.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select value={d.usuarioId ? 'usuario' : (d.grupoId ? 'grupo' : 'rol')}
                        onChange={(e) => {
                          const tipo = e.target.value
                          setDestinatario(i, 'tipo', tipo)
                          setForm(prev => {
                            const nuevos = [...prev.destinatarios]
                            nuevos[i] = tipo === 'rol' ? { rol: 'estudiante' } : tipo === 'grupo' ? { grupoId: '' } : { usuarioId: '' }
                            return { ...prev, destinatarios: nuevos }
                          })
                        }}
                        className="px-2 py-2 border border-gray-300 rounded-lg text-sm">
                        <option value="rol">Por rol</option>
                        <option value="grupo">Por grupo</option>
                        <option value="usuario">Usuario específico</option>
                      </select>
                      {d.tipo === 'grupo' || d.grupoId ? (
                        <select value={d.grupoId} onChange={(e) => setDestinatario(i, 'grupoId', e.target.value)}
                          className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm">
                          <option value="">Seleccionar grupo...</option>
                          {grupos.map(g => <option key={g._id} value={g._id}>{g.nombre} (Grado {g.grado})</option>)}
                        </select>
                      ) : d.tipo === 'usuario' || d.usuarioId ? (
                        <input type="text" placeholder="ID de usuario (opcional)" value={d.usuarioId || ''}
                          onChange={(e) => setDestinatario(i, 'usuarioId', e.target.value)}
                          className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                      ) : (
                        <select value={d.rol} onChange={(e) => setDestinatario(i, 'rol', e.target.value)}
                          className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm">
                          {ROLES_DESTINO.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      )}
                      <button type="button" onClick={() => quitarDestinatario(i)} className="text-red-500 hover:text-red-700 text-xl px-1">&times;</button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={agregarDestinatario} className="mt-2 text-sm text-primary-600 hover:text-primary-800 font-medium">+ Agregar destinatario</button>
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 flex items-center gap-1">
                  <Send className="w-4 h-4" /> {saving ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetalle(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{detalle.asunto}</h2>
              <button onClick={() => setDetalle(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-2">
                De: {detalle.remitenteId ? `${detalle.remitenteId.nombres} ${detalle.remitenteId.apellidos}` : '—'} · {new Date(detalle.fecha || detalle.createdAt).toLocaleString('es-CO')}
              </p>
              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-800">{detalle.mensaje}</div>
              {!yaLeido(detalle) && (
                <button onClick={() => { marcarLeido(detalle); setDetalle(null) }}
                  className="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg">
                  Marcar como leído
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
