import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus, Search, ArrowLeft, School } from 'lucide-react'
import api from '../services/api'

const initialForm = {
  estudiante: { tipoDocumento: 'TI', fechaNacimiento: '', genero: '' },
  acudiente: { tipoDocumento: 'CC', parentesco: '' },
  gradoSolicitado: '',
  grupoSolicitado: ''
}

export default function PrematriculaOnline() {
  const [periodo, setPeriodo] = useState(null)
  const [cargado, setCargado] = useState(false)
  const [tab, setTab] = useState('formulario')
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [docConsulta, setDocConsulta] = useState('')
  const [estadoConsulta, setEstadoConsulta] = useState(null)

  useEffect(() => {
    api.get('/prematriculas/periodo')
      .then(r => setPeriodo(r.data.data))
      .catch(() => setPeriodo({ abierta: false, mensaje: 'Error consultando período' }))
      .finally(() => setCargado(true))
  }, [])

  const setE = (campo, valor) => setForm({ ...form, estudiante: { ...form.estudiante, [campo]: valor } })
  const setA = (campo, valor) => setForm({ ...form, acudiente: { ...form.acudiente, [campo]: valor } })

  const enviar = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMensaje('')
    try {
      const payload = {
        ...form,
        estudiante: {
          ...form.estudiante,
          documento: (form.estudiante.documento || '').trim(),
          nombres: (form.estudiante.nombres || '').trim(),
          apellidos: (form.estudiante.apellidos || '').trim()
        },
        acudiente: {
          ...form.acudiente,
          documento: (form.acudiente.documento || '').trim(),
          email: (form.acudiente.email || '').trim()
        }
      }
      await api.post('/prematriculas/solicitar', payload)
      setMensaje('Solicitud registrada. Anota tu número de documento para consultar el estado.')
      setForm(initialForm)
      setTab('estado')
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar la solicitud')
    } finally {
      setSaving(false)
    }
  }

  const consultar = async (e) => {
    e.preventDefault()
    setError('')
    setEstadoConsulta(null)
    try {
      const r = await api.get(`/prematriculas/estado/${docConsulta.trim()}`)
      setEstadoConsulta(r.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al consultar')
    }
  }

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
  const labelCls = "block text-xs font-medium text-gray-600 mb-1"

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-primary-600 text-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <School className="w-6 h-6" />
            <span className="font-bold">Prematrícula Online</span>
          </div>
          <Link to="/login" className="flex items-center gap-1 text-white/90 hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver al ingreso
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        {!cargado ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !periodo?.abierta ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full mx-auto flex items-center justify-center mb-4">
              <School className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Prematrícula cerrada</h1>
            <p className="text-gray-500 text-sm">
              Fuera del período de prematrícula establecido en el cronograma académico.
              Por favor contacta a la institución.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Formulario de prematrícula</h1>
                  <p className="text-sm text-gray-500">
                    Año {periodo.anio} · Período de prematrícula del {periodo.inicio ? new Date(periodo.inicio).toLocaleDateString('es-CO') : '—'} al {periodo.fin ? new Date(periodo.fin).toLocaleDateString('es-CO') : '—'}
                  </p>
                </div>
                <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={() => setTab('formulario')}
                    className={`px-4 py-2 text-sm font-medium flex items-center gap-1 ${tab === 'formulario' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <UserPlus className="w-4 h-4" /> Registrar
                  </button>
                  <button onClick={() => setTab('estado')}
                    className={`px-4 py-2 text-sm font-medium flex items-center gap-1 ${tab === 'estado' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Search className="w-4 h-4" /> Consultar estado
                  </button>
                </div>
              </div>

              {tab === 'formulario' && (
                <form onSubmit={enviar} className="mt-4 space-y-5">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2 border-b border-gray-100 pb-1">Datos del estudiante</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className={labelCls}>Tipo de documento</label>
                        <select value={form.estudiante.tipoDocumento} onChange={(e) => setE('tipoDocumento', e.target.value)} className={inputCls}>
                          <option value="RC">RC</option><option value="TI">TI</option><option value="CC">CC</option><option value="CE">CE</option><option value="PAS">PAS</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className={labelCls}>Número de documento <span className="text-red-500">*</span></label>
                        <input value={form.estudiante.documento} onChange={(e) => setE('documento', e.target.value)} required className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Nombres <span className="text-red-500">*</span></label>
                        <input value={form.estudiante.nombres} onChange={(e) => setE('nombres', e.target.value)} required className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Apellidos <span className="text-red-500">*</span></label>
                        <input value={form.estudiante.apellidos} onChange={(e) => setE('apellidos', e.target.value)} required className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Fecha de nacimiento</label>
                        <input type="date" value={form.estudiante.fechaNacimiento} onChange={(e) => setE('fechaNacimiento', e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Género</label>
                        <select value={form.estudiante.genero} onChange={(e) => setE('genero', e.target.value)} className={inputCls}>
                          <option value="">Seleccionar...</option>
                          <option value="M">Masculino</option>
                          <option value="F">Femenino</option>
                          <option value="O">Otro</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className={labelCls}>Dirección</label>
                        <input value={form.estudiante.direccion} onChange={(e) => setE('direccion', e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Teléfono</label>
                        <input value={form.estudiante.telefono} onChange={(e) => setE('telefono', e.target.value)} className={inputCls} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2 border-b border-gray-100 pb-1">Datos del acudiente</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className={labelCls}>Nombres <span className="text-red-500">*</span></label>
                        <input value={form.acudiente.nombres} onChange={(e) => setA('nombres', e.target.value)} required className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Apellidos <span className="text-red-500">*</span></label>
                        <input value={form.acudiente.apellidos} onChange={(e) => setA('apellidos', e.target.value)} required className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Parentesco</label>
                        <input value={form.acudiente.parentesco} onChange={(e) => setA('parentesco', e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Tipo de documento</label>
                        <select value={form.acudiente.tipoDocumento} onChange={(e) => setA('tipoDocumento', e.target.value)} className={inputCls}>
                          <option value="CC">CC</option><option value="CE">CE</option><option value="TI">TI</option><option value="PAS">PAS</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Número de documento</label>
                        <input value={form.acudiente.documento} onChange={(e) => setA('documento', e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Email</label>
                        <input type="email" value={form.acudiente.email} onChange={(e) => setA('email', e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Teléfono</label>
                        <input value={form.acudiente.telefono} onChange={(e) => setA('telefono', e.target.value)} className={inputCls} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2 border-b border-gray-100 pb-1">Grado a solicitar</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Grado <span className="text-red-500">*</span></label>
                        <select value={form.gradoSolicitado} onChange={(e) => setForm({ ...form, gradoSolicitado: e.target.value })} required className={inputCls}>
                          <option value="">Seleccionar grado...</option>
                          {[6, 7, 8, 9, 10, 11].map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Grupo solicitado</label>
                        <input value={form.grupoSolicitado} onChange={(e) => setForm({ ...form, grupoSolicitado: e.target.value })} placeholder="Ej: 601" className={inputCls} />
                      </div>
                    </div>
                  </div>

                  {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>}
                  {mensaje && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-3 py-2">{mensaje}</div>}

                  <button type="submit" disabled={saving}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-lg disabled:opacity-50">
                    {saving ? 'Enviando...' : 'Enviar solicitud de prematrícula'}
                  </button>
                </form>
              )}

              {tab === 'estado' && (
                <div className="mt-4">
                  <form onSubmit={consultar} className="flex gap-2">
                    <input value={docConsulta} onChange={(e) => setDocConsulta(e.target.value)} placeholder="Número de documento del estudiante" required className={inputCls} />
                    <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 shrink-0">
                      <Search className="w-4 h-4" /> Consultar
                    </button>
                  </form>

                  {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mt-3">{error}</div>}

                  {estadoConsulta && (
                    <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="font-semibold text-gray-900">{estadoConsulta.nombres}</p>
                      <p className="text-sm text-gray-600">Documento: {estadoConsulta.documento} · Año {estadoConsulta.anio}</p>
                      <p className="text-sm text-gray-600">Grado solicitado: {estadoConsulta.gradoSolicitado}{estadoConsulta.grupoSolicitado ? ` (${estadoConsulta.grupoSolicitado})` : ''}</p>
                      <p className="mt-2 inline-flex items-center gap-2">
                        <span className="text-xs text-gray-500 uppercase font-medium">Estado:</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          estadoConsulta.estado === 'matriculada' ? 'bg-emerald-100 text-emerald-700'
                          : estadoConsulta.estado === 'aprobada' ? 'bg-primary-100 text-primary-800'
                          : estadoConsulta.estado === 'rechazada' ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>{estadoConsulta.estado}</span>
                      </p>
                      {estadoConsulta.observaciones && <p className="text-xs text-gray-500 mt-2">{estadoConsulta.observaciones}</p>}
                      <p className="text-xs text-gray-400 mt-2">Solicitud del {new Date(estadoConsulta.createdAt).toLocaleDateString('es-CO')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-gray-400">
        Sistema integrado de matrículas EasyNotes
      </footer>
    </div>
  )
}