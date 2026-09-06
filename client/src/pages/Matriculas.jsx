import { useEffect, useState } from 'react'
import { Plus, RefreshCw, Search, LogOut, TrendingUp, TrendingDown, UserCheck, ArrowLeftRight } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const estadoBadge = (estado) => {
  const map = {
    activa: 'bg-emerald-100 text-emerald-700',
    retirada: 'bg-red-100 text-red-700',
    trasladada: 'bg-amber-100 text-amber-700',
    graduado: 'bg-primary-100 text-primary-800'
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[estado] || 'bg-gray-100 text-gray-600'}`}>{estado}</span>
}

const tipoLabel = {
  nueva: 'Nueva',
  renovacion: 'Renovación',
  traslado: 'Traslado',
  promovido: 'Promovido'
}

export default function Matriculas() {
  const { usuario } = useAuth()
  const [datos, setDatos] = useState([])
  const [estudiantes, setEstudiantes] = useState([])
  const [anios, setAnios] = useState([])
  const [grupos, setGrupos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ tipoMatricula: 'nueva' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [seleccion, setSeleccion] = useState([])
  const [modalGrupo, setModalGrupo] = useState(false)
  const [formGrupo, setFormGrupo] = useState({})
  const [soloMatricula, setSoloMatricula] = useState(null)

  const puedeGestionar = ['super_admin', 'admin', 'rector', 'coordinador', 'secretaria'].includes(usuario?.tipoPerfil)

  const toggleSelect = (id) => {
    setSeleccion(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const abrirCambio = (m = null) => {
    setSoloMatricula(m)
    setFormGrupo({ grupoId: '', fechaCambio: new Date().toISOString().slice(0, 10), observaciones: '' })
    setModalGrupo(true)
    setError('')
  }

  const aplicarCambio = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const ids = soloMatricula ? [soloMatricula._id] : seleccion
      const r = await api.post('/matriculas/cambio-grupo', {
        ids,
        grupoId: formGrupo.grupoId,
        fechaCambio: formGrupo.fechaCambio || undefined,
        observaciones: formGrupo.observaciones || undefined
      })
      alert(r.data.message)
      setModalGrupo(false)
      setSeleccion([])
      setSoloMatricula(null)
      await cargarMatriculas()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar de grupo')
    } finally {
      setSaving(false)
    }
  }

  const cargarMatriculas = async () => {
    setLoading(true)
    try {
      const params = {}
      if (busqueda) params.estado = busqueda
      const r = await api.get('/matriculas', { params })
      setDatos(r.data.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  const cargarDependencias = async () => {
    try {
      const [resEst, resAnio, resGrupo] = await Promise.all([
        api.get('/usuarios?tipoPerfil=estudiante'),
        api.get('/anios-academicos'),
        api.get('/grupos')
      ])
      setEstudiantes(resEst.data.data)
      setAnios(resAnio.data.data)
      setGrupos(resGrupo.data.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar dependencias')
    }
  }

  useEffect(() => {
    cargarMatriculas()
    cargarDependencias()
  }, [])

  const crear = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/matriculas', {
        anioAcademicoId: form.anioAcademicoId,
        estudianteId: form.estudianteId,
        grupoId: form.grupoId,
        tipoMatricula: form.tipoMatricula,
        fechaMatricula: form.fechaMatricula || new Date().toISOString(),
        observaciones: form.observaciones
      })
      setModal(false)
      await cargarMatriculas()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear matrícula')
    } finally {
      setSaving(false)
    }
  }

  const retirar = async (m) => {
    const obs = window.prompt('Motivo de retiro:')
    if (obs === null) return
    try {
      await api.put(`/matriculas/${m._id}/retirar`, { observaciones: obs })
      await cargarMatriculas()
    } catch (e) {
      alert(e.response?.data?.message || 'Error al retirar')
    }
  }

  const promover = async (m) => {
    if (!window.confirm(`¿Promover a ${m.estudianteId?.nombres} ${m.estudianteId?.apellidos} al siguiente grado?`)) return
    try {
      await api.put(`/matriculas/${m._id}/promover`, { promovido: true })
      await cargarMatriculas()
    } catch (e) {
      alert(e.response?.data?.message || e.response?.data?.data?.message || 'Error al promover')
    }
  }

  const nomPromover = async (m) => {
    if (!window.confirm(`¿Marcar a ${m.estudianteId?.nombres} ${m.estudianteId?.apellidos} como NO promovido (repitente)?`)) return
    try {
      await api.put(`/matriculas/${m._id}/promover`, { promovido: false })
      await cargarMatriculas()
    } catch (e) {
      alert(e.response?.data?.message || 'Error')
    }
  }

  const estudianteLabel = (m) => {
    const e = m.estudianteId
    if (!e) return '—'
    return `${e.nombres} ${e.apellidos}`
  }

  const grupoLabel = (m) => {
    const g = m.grupoId
    if (!g) return '—'
    return typeof g === 'string' ? g : `${g.nombre} (Grado ${g.grado})`
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Matrículas</h1>
            <p className="text-sm text-gray-500">Inscripción de estudiantes a grupos por año lectivo</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setTimeout(cargarMatriculas, 0) }}
                className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos los estados</option>
                <option value="activa">Activas</option>
                <option value="retirada">Retiradas</option>
                <option value="graduado">Graduados</option>
              </select>
            </div>
            <button onClick={cargarMatriculas} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <RefreshCw className="w-4 h-4" />
            </button>
            {puedeGestionar && seleccion.length > 0 && (
              <button onClick={() => abrirCambio()}
                className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4" /> Cambiar grupo ({seleccion.length})
              </button>
            )}
            {puedeGestionar && (
              <button onClick={() => { setForm({ tipoMatricula: 'nueva' }); setModal(true); setError('') }}
                className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2">
                <Plus className="w-4 h-4" /> Nueva Matrícula
              </button>
            )}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 w-10">{puedeGestionar && <input type="checkbox" className="accent-primary-600"
                  checked={seleccion.length > 0 && datos.filter(m => m.estado === 'activa').length === seleccion.length}
                  onChange={(e) => {
                    if (e.target.checked) setSeleccion(datos.filter(m => m.estado === 'activa').map(m => m._id))
                    else setSeleccion([])
                  }} />}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estudiante</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Documento</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Grupo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : datos.length === 0 ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">No hay matrículas registradas</td></tr>
              ) : (
                datos.map(m => (
                  <tr key={m._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{m.estado === 'activa' && puedeGestionar && (
                      <input type="checkbox" className="accent-primary-600" checked={seleccion.includes(m._id)} onChange={() => toggleSelect(m._id)} />
                    )}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{estudianteLabel(m)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{m.estudianteId?.documento || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{grupoLabel(m)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{tipoLabel[m.tipoMatricula] || m.tipoMatricula}</td>
                    <td className="px-4 py-3">{estadoBadge(m.estado)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(m.fechaMatricula).toLocaleDateString('es-CO')}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {m.estado === 'activa' && (
                        <>
                          <button onClick={() => abrirCambio(m)} title="Cambiar de grupo"
                            className="text-amber-600 hover:text-amber-800 text-sm font-medium mr-2 inline-flex items-center gap-1">
                            <ArrowLeftRight className="w-4 h-4" /> Grupo
                          </button>
                          <button onClick={() => promover(m)} title="Promover al siguiente grado"
                            className="text-emerald-600 hover:text-emerald-800 text-sm font-medium mr-2 inline-flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" /> Promover
                          </button>
                          <button onClick={nomPromover} title="Marcar como repitente"
                            className="text-amber-600 hover:text-amber-800 text-sm font-medium mr-2 inline-flex items-center gap-1">
                            <TrendingDown className="w-4 h-4" /> Repite
                          </button>
                          <button onClick={() => retirar(m)} title="Retirar estudiante"
                            className="text-red-600 hover:text-red-800 text-sm font-medium inline-flex items-center gap-1">
                            <LogOut className="w-4 h-4" /> Retirar
                          </button>
                        </>
                      )}
                      {m.estado === 'retirada' && (
                        <span className="text-sm text-gray-400">Retirado</span>
                      )}
                      {m.promovido === true && (
                        <span className="text-sm text-emerald-600 inline-flex items-center gap-1"><UserCheck className="w-4 h-4" /> Promovido</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Nueva Matrícula</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={crear} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año Académico <span className="text-red-500">*</span></label>
                <select value={form.anioAcademicoId} onChange={(e) => setForm({ ...form, anioAcademicoId: e.target.value })} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                  <option value="">Seleccionar año...</option>
                  {anios.map(a => <option key={a._id} value={a._id}>Año {a.anio} ({a.estado})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estudiante <span className="text-red-500">*</span></label>
                <select value={form.estudianteId} onChange={(e) => setForm({ ...form, estudianteId: e.target.value })} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                  <option value="">Seleccionar estudiante...</option>
                  {estudiantes.map(s => <option key={s._id} value={s._id}>{s.nombres} {s.apellidos} - {s.documento}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo <span className="text-red-500">*</span></label>
                <select value={form.grupoId} onChange={(e) => setForm({ ...form, grupoId: e.target.value })} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                  <option value="">Seleccionar grupo...</option>
                  {grupos.map(g => <option key={g._id} value={g._id}>{g.nombre} (Grado {g.grado})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Matrícula</label>
                  <select value={form.tipoMatricula} onChange={(e) => setForm({ ...form, tipoMatricula: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                    {Object.entries(tipoLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input type="date" value={form.fechaMatricula ? form.fechaMatricula.slice(0,10) : ''}
                    onChange={(e) => setForm({ ...form, fechaMatricula: e.target.value })} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" rows="2" />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50">
                  {saving ? 'Creando...' : 'Crear Matrícula'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    {modalGrupo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalGrupo(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Cambiar de grupo (MT-002)</h2>
              <button onClick={() => setModalGrupo(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={aplicarCambio} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {soloMatricula
                    ? `Estudiante: ${soloMatricula.estudianteId?.nombres} ${soloMatricula.estudianteId?.apellidos}`
                    : `Estudiantes seleccionados: ${seleccion.length}`}
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo destino <span className="text-red-500">*</span></label>
                <select value={formGrupo.grupoId} onChange={(e) => setFormGrupo({ ...formGrupo, grupoId: e.target.value })} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                  <option value="">Seleccionar grupo...</option>
                  {grupos.map(g => <option key={g._id} value={g._id}>{g.nombre} (Grado {g.grado})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del cambio</label>
                <input type="date" value={formGrupo.fechaCambio} onChange={(e) => setFormGrupo({ ...formGrupo, fechaCambio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea value={formGrupo.observaciones} onChange={(e) => setFormGrupo({ ...formGrupo, observaciones: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" rows="2" />
              </div>
              <p className="text-xs text-gray-500">Las calificaciones del estudiante se conservan en el nuevo grupo y se notifica al director del grupo destino.</p>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalGrupo(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50">
                  {saving ? 'Aplicando...' : 'Aplicar cambio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
