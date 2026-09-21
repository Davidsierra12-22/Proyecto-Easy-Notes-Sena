import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, GraduationCap, CalendarDays, ArrowLeft } from 'lucide-react'
import { Button, IconButton, CircularProgress } from '@mui/material'
import api from '../services/api.service'
import { useAuth } from '../store/Auth'

export default function MisClases() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [cargas, setCargas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!usuario?._id) return
    api.get(`/carga-academica/docente/${usuario._id}`)
      .then(r => setCargas(r.data.data))
      .catch(e => setError(e.response?.data?.message || 'Error al cargar tus clases'))
      .finally(() => setLoading(false))
  }, [usuario?._id])

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex items-center gap-2">
          <IconButton
            onClick={() => navigate(-1)}
            aria-label="Volver"
            title="Volver"
            color="inherit"
            size="small"
          >
            <ArrowLeft className="w-5 h-5" />
          </IconButton>
          <h1 className="text-xl font-bold text-gray-900">Mis Clases</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Selecciona una clase para registrar calificaciones.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12 bg-white rounded-xl border border-gray-200">
          <CircularProgress size={32} className="!text-primary-600" />
        </div>
      ) : cargas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-sm text-gray-500">
          Aún no tienes clases asignadas en este año lectivo.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cargas.map(c => {
            const grupo = c.grupoId && typeof c.grupoId === 'object' ? c.grupoId : null
            const asig = c.asignaturaId && typeof c.asignaturaId === 'object' ? c.asignaturaId : null
            return (
              <div key={c._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col">
                <div className="w-11 h-11 rounded-lg bg-primary-50 flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {asig?.nombre || 'Asignatura'}
                </h3>
                <div className="mt-2 space-y-1 text-xs text-gray-500">
                  <p className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" />
                    {grupo?.nombre || 'Grupo'}
                    {grupo?.grado !== undefined && ` (Grado ${grupo.grado})`}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {grupo?.jornada || ''} · {c.horasSemanales ?? 4} h/sem
                  </p>
                </div>
                <Button
                  onClick={() => navigate(`/calificaciones?grupoId=${grupo?._id || c.grupoId}&asignaturaId=${asig?._id || c.asignaturaId}`)}
                  variant="contained"
                  color="primary"
                  fullWidth
                  className="mt-4"
                >
                  Calificar
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
