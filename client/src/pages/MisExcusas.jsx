import { useEffect, useState } from 'react'
import { Plus, X, Stethoscope } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useEstudiante } from '../hooks/useEstudiante'

const estadoBadge = (estado) => {
  const map = {
    pendiente: 'bg-amber-100 text-amber-700',
    aprobada: 'bg-emerald-100 text-emerald-700',
    rechazada: 'bg-red-100 text-red-700'
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[estado] || 'bg-gray-100 text-gray-600'}`}>{estado}</span>
}

export default function MisExcusas() {
  const { usuario } = useAuth()
  const { matricula, loading: cargaMatricula } = useEstudiante()
  const [excusas, setExcusas] = useState([])
  const [docentes, setDocentes] = useState([])
  const [cargas, setCargas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const grupoId = matricula?.grupoId
  const anioId = matricula?.anioAcademicoId

  const cargarTodo = async () => {
    setLoading(true)
    setError('')
    try {
      const [resExc, resDoc] = await Promise.all([
        api.get('/excusas'),
        api.get('/usuarios?tipoPerfil=docente')
      ])
      setExcusas(resExc.data.data || [])
      setDocentes(resDoc.data.data || [])
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar excusas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarTodo() }, [])

  useEffect(() => {
    if (!grupoId) return
    api.get(`/carga-academica/grupo/${grupoId}`).then(r => setCargas(r.data.data || [])).catch(() => {})
  }, [grupoId])

  const misDocentes = []
  const vistos = new Set()
  cargas.forEach(c => {
    const id = String(c.docenteId)
    if (!vistos.has(id)) {
      vistos.add(id)
      const d = docentes.find(x => String(x._id) === id)
      if (d) misDocentes.push(d)
    }
  })

  const abrirCrear = () => {
    setForm({ fechaInicio: new Date().toISOString().slice(0, 10), fechaFin: new Date().toISOString().slice(0, 10), motivo: '', sinSoporte: true, soporteDocumental: '', docenteId: '' })
    setError('')
    setModal(true)
  }

  const crear = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/excusas', {
        ...form,
        anioAcademicoId: anioId,
        soporteDocumental: form.sinSoporte ? undefined : form.soporteDocumental
      })
      setModal(false)
      await cargarTodo()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear la excusa')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mis Excusas</h1>
              <p className="text-sm text-gray-500">Registra tus inasistencias ante tus docentes</p>
            </div>
          </div>
          <button onClick={abrirCrear} disabled={!anioId}
            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nueva Excusa
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

        {cargaMatricula || loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : excusas.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No tienes excusas registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Docente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Periodo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Motivo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Observaciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {excusas.map(x => (
                  <tr key={x._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {docentes.find(d => String(d._id) === String(x.docenteId))?.nombres || '—'} {docentes.find(d => String(d._id) === String(x.docenteId))?.apellidos || ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(x.fechaInicio).toLocaleDateString('es-CO')} → {new Date(x.fechaFin).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{x.motivo}</td>
                    <td className="px-4 py-3 text-sm">{estadoBadge(x.estado || 'pendiente')}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{x.observaciones || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Nueva excusa</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={crear} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Docente <span className="text-red-500">*</span></label>
                  <select value={form.docenteId || ''} onChange={(e) => setForm({ ...form, docenteId: e.target.value })} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                    <option value="">Seleccionar...</option>
                    {(misDocentes.length ? misDocentes : docentes).map(d => (
                      <option key={d._id} value={d._id}>{d.nombres} {d.apellidos}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio <span className="text-red-500">*</span></label>
                  <input type="date" value={form.fechaInicio || ''} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin <span className="text-red-500">*</span></label>
                  <input type="date" value={form.fechaFin || ''} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo <span className="text-red-500">*</span></label>
                  <textarea value={form.motivo || ''} onChange={(e) => setForm({ ...form, motivo: e.target.value })} required rows="3"
                    placeholder="Describe el motivo de la inasistencia"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={form.sinSoporte !== false}
                      onChange={(e) => setForm({ ...form, sinSoporte: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    No tengo soporte documental
                  </label>
                </div>
                {form.sinSoporte === false && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Soporte documental</label>
                    <input type="text" value={form.soporteDocumental || ''} onChange={(e) => setForm({ ...form, soporteDocumental: e.target.value })}
                      placeholder="URL o referencia del soporte"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}