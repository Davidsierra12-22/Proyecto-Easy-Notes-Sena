import { useEffect, useState } from 'react'
import { GraduationCap, Calculator, CalendarDays, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material'
import api from '../services/api.service'
import { useAuth } from '../store/Auth'

const notaColor = (n) => {
  if (n == null) return '!text-gray-400'
  return n >= 3 ? '!text-emerald-600 !font-semibold' : '!text-red-600 !font-semibold'
}

export default function MisHijos() {
  const { usuario } = useAuth()
  const [hijos, setHijos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandido, setExpandido] = useState(null)
  const [notasHijo, setNotasHijo] = useState({})
  const [cargandoNotas, setCargandoNotas] = useState(false)

  useEffect(() => {
    if (!usuario?._id) return
    api.get(`/usuarios/${usuario._id}`)
      .then(async (r) => {
        const user = r.data.data
        const hijosIds = (user.acudientes || []).map(a => a.estudianteId).filter(Boolean)
        if (hijosIds.length === 0) {
          // Buscar hijos donde el acudiente es este usuario
          const res = await api.get('/usuarios', { params: { tipoPerfil: 'estudiante' } })
          const todos = res.data.data || []
          const misHijos = todos.filter(est =>
            est.acudientes?.some(a => a.acudienteId === usuario._id || a.acudienteId?._id === usuario._id)
          )
          setHijos(misHijos)
        } else {
          const resHijos = await Promise.all(hijosIds.map(id => api.get(`/usuarios/${id}`).catch(() => null)))
          setHijos(resHijos.filter(Boolean).map(r => r.data.data))
        }
      })
      .catch(e => setError(e.response?.data?.message || 'Error al cargar hijos'))
      .finally(() => setLoading(false))
  }, [usuario?._id])

  useEffect(() => {
    if (hijos.length === 0) return
    const cargarNotas = async () => {
      setCargandoNotas(true)
      const notas = {}
      for (const hijo of hijos) {
        try {
          const resMat = await api.get('/matriculas', { params: { estudianteId: hijo._id } })
          const matriculas = resMat.data.data || []
          const matActiva = matriculas.find(m => m.estado === 'activa')
          if (matActiva) {
            const resAnio = await api.get('/anios-academicos')
            const anio = (resAnio.data.data || []).find(a => a._id === matActiva.anioAcademicoId)
            const numPeriodos = anio?.configuracion?.numeroPeriodos || 4
            const resCalif = await api.get(`/calificaciones/estudiante/${hijo._id}/anio/${matActiva.anioAcademicoId}`)
            notas[hijo._id] = {
              materias: resCalif.data.data || [],
              numPeriodos,
              grupo: matActiva.grupoId,
              matricula: matActiva
            }
          }
        } catch {}
      }
      setNotasHijo(notas)
      setCargandoNotas(false)
    }
    cargarNotas()
  }, [hijos])

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="p-2 rounded-lg bg-blue-50 text-blue-700"><GraduationCap className="w-5 h-5" /></span>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mis Hijos</h1>
            <p className="text-sm text-gray-500">Información académica de tus hijos</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><CircularProgress /></div>
        ) : hijos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No se encontraron hijos asociados a tu cuenta</p>
            <p className="text-sm text-gray-400 mt-1">Contacta a la secretaría para asociar tus hijos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {hijos.map((hijo) => {
              const info = notasHijo[hijo._id]
              return (
                <div key={hijo._id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandido(expandido === hijo._id ? null : hijo._id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                        {hijo.nombres?.[0]}{hijo.apellidos?.[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{hijo.nombres} {hijo.apellidos}</h3>
                        <p className="text-sm text-gray-500">
                          {hijo.tipoDocumento} {hijo.documento} • {info?.grupo?.nombre || 'Sin grupo'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {info && (
                        <span className="text-sm text-gray-500">
                          {info.materias.length} materias
                        </span>
                      )}
                      {expandido === hijo._id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>

                  {expandido === hijo._id && (
                    <div className="border-t border-gray-200 p-4">
                      {cargandoNotas ? (
                        <div className="flex justify-center py-4"><CircularProgress size={24} /></div>
                      ) : !info ? (
                        <p className="text-sm text-gray-500 text-center py-4">Sin matrícula activa</p>
                      ) : info.materias.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">Sin calificaciones registradas</p>
                      ) : (
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow className="bg-gray-50">
                                <TableCell className="!font-semibold !text-gray-500 !text-xs">Materia</TableCell>
                                {Array.from({ length: info.numPeriodos }, (_, i) => (
                                  <TableCell key={i} className="!font-semibold !text-gray-500 !text-xs text-center">
                                    P{i + 1}
                                  </TableCell>
                                ))}
                                <TableCell className="!font-semibold !text-gray-500 !text-xs text-center">Definitiva</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {info.materias.map((m, idx) => {
                                const promedio = m.notas?.length > 0
                                  ? (m.notas.reduce((s, n) => s + (n.valor || 0), 0) / m.notas.length).toFixed(1)
                                  : null
                                return (
                                  <TableRow key={idx} className="hover:bg-gray-50">
                                    <TableCell className="font-medium text-gray-900">{m.asignaturaId?.nombre || m.nombre || '—'}</TableCell>
                                    {Array.from({ length: info.numPeriodos }, (_, i) => {
                                      const nota = m.notas?.find(n => n.periodo === i + 1)
                                      return (
                                        <TableCell key={i} className="text-center">
                                          <span className={notaColor(nota?.valor)}>
                                            {nota?.valor != null ? nota.valor : '—'}
                                          </span>
                                        </TableCell>
                                      )
                                    })}
                                    <TableCell className="text-center">
                                      <span className={notaColor(promedio)}>
                                        {promedio != null ? promedio : '—'}
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}

                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="text-gray-500 flex items-center gap-1"><BookOpen className="w-4 h-4" /> Grupo</span>
                          <p className="font-semibold text-gray-900 mt-1">{info.grupo?.nombre || '—'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="text-gray-500 flex items-center gap-1"><CalendarDays className="w-4 h-4" /> Jornada</span>
                          <p className="font-semibold text-gray-900 mt-1 capitalize">{info.grupo?.jornada || '—'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
