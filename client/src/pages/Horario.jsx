import { useEffect, useState } from 'react'
import { CalendarDays, Clock } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useEstudiante } from '../hooks/useEstudiante'

const JORNADAS = {
  manana: 'Mañana',
  tarde: 'Tarde',
  noche: 'Noche',
  continua: 'Continua'
}

export default function Horario() {
  const { usuario } = useAuth()
  const { matricula, loading: cargaMatricula } = useEstudiante()
  const [cargas, setCargas] = useState([])
  const [docentes, setDocentes] = useState([])
  const [asignaturas, setAsignaturas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const grupoId = matricula?.grupoId

  useEffect(() => {
    if (!grupoId) return
    let activo = true
    const cargar = async () => {
      setLoading(true)
      setError('')
      try {
        const [resCargas, resDocentes, resAsig] = await Promise.all([
          api.get(`/carga-academica/grupo/${grupoId}`),
          api.get('/usuarios?tipoPerfil=docente'),
          api.get('/asignaturas')
        ])
        if (activo) {
          setCargas(resCargas.data.data || [])
          setDocentes(resDocentes.data.data || [])
          setAsignaturas(resAsig.data.data || [])
        }
      } catch (e) {
        if (activo) setError(e.response?.data?.message || 'No se pudo cargar el horario')
      } finally {
        if (activo) setLoading(false)
      }
    }
    cargar()
    return () => { activo = false }
  }, [grupoId])

  const docenteLabel = (id) => {
    const d = docentes.find(x => String(x._id) === String(id))
    return d ? `${d.nombres} ${d.apellidos}` : '—'
  }
  const asignaturaLabel = (id) => {
    const a = asignaturas.find(x => String(x._id) === String(id))
    return a ? a.nombre : 'Asignatura'
  }

  const grupo = matricula?.grupoId && typeof matricula.grupoId === 'object' ? matricula.grupoId : null

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mi Horario</h1>
            <p className="text-sm text-gray-500">Asignaturas y docentes de tu grupo</p>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

        {cargaMatricula || loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !matricula ? (
          <p className="text-center text-gray-500 py-12">Aún no tienes una matrícula activa.</p>
        ) : (
          <>
            {grupo && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-sm font-medium">
                  {grupo.nombre} · Grado {grupo.grado}
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium">
                  Jornada {JORNADAS[grupo.jornada] || grupo.jornada || '—'}
                </span>
              </div>
            )}

            {cargas.length === 0 ? (
              <p className="text-center text-gray-500 py-12">Tu grupo aún no tiene cargas académicas asignadas.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cargas.map(c => (
                  <div key={c._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                    <p className="font-semibold text-gray-900">{asignaturaLabel(c.asignaturaId)}</p>
                    <p className="text-sm text-gray-500 mt-1">{docenteLabel(c.docenteId)}</p>
                    <p className="text-xs text-gray-400 mt-2 inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {c.horasSemanales ?? 4} horas semanales
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}