import { useEffect, useState } from 'react'
import {
  CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material'
import { Calculator } from 'lucide-react'
import api from '../services/api.service'
import { useAuth } from '../store/Auth'
import { useEstudiante } from '../hooks/useEstudiante'

const notaColor = (n) => {
  if (n == null) return '!text-gray-400'
  return n >= 3 ? '!text-emerald-600 !font-semibold' : '!text-red-600 !font-semibold'
}

export default function MisNotas() {
  const { usuario } = useAuth()
  const { matricula, loading: cargaMatricula } = useEstudiante()
  const [materias, setMaterias] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [numeroPeriodos, setNumeroPeriodos] = useState(4)

  const anioId = matricula?.anioAcademicoId

  useEffect(() => {
    if (!anioId || !usuario?._id) return
    let activo = true
    const cargar = async () => {
      setLoading(true)
      setError('')
      try {
        const [resCalif, resAnio] = await Promise.all([
          api.get(`/calificaciones/estudiante/${usuario._id}/anio/${anioId}`),
          api.get('/anios-academicos')
        ])
        if (activo) {
          setMaterias(resCalif.data.data || [])
          const anio = resAnio.data.data.find(a => a._id === anioId)
          if (anio?.configuracion?.numeroPeriodos) setNumeroPeriodos(anio.configuracion.numeroPeriodos)
        }
      } catch (e) {
        if (activo) setError(e.response?.data?.message || 'No se pudieron cargar tus notas')
      } finally {
        if (activo) setLoading(false)
      }
    }
    cargar()
    return () => { activo = false }
  }, [anioId, usuario?._id])

  const periodos = Array.from({ length: numeroPeriodos }, (_, i) => i + 1)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mis Notas</h1>
            <p className="text-sm text-gray-500">Calificaciones de tu año académico actual</p>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

        {cargaMatricula || loading ? (
          <div className="flex justify-center py-12">
            <CircularProgress size={28} className="!text-primary-600" />
          </div>
        ) : !matricula ? (
          <p className="text-center text-gray-500 py-12">Aún no tienes una matrícula activa para consultar notas.</p>
        ) : materias.length === 0 ? (
          <p className="text-center text-gray-500 py-12">
            {error ? 'No se pudieron cargar tus notas. Vuelve a intentarlo en unos minutos.' : 'Todavía no hay calificaciones registradas para tus asignaturas.'}
          </p>
        ) : (
          <TableContainer className="overflow-x-auto">
            <Table size="small" className="min-w-full divide-y divide-gray-200">
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="!px-4 !py-3 !text-left !text-xs !font-semibold !text-gray-500 !uppercase">Asignatura</TableCell>
                  {periodos.map(p => (
                    <TableCell key={p} className="!px-4 !py-3 !text-center !text-xs !font-semibold !text-gray-500 !uppercase">Periodo {p}</TableCell>
                  ))}
                  <TableCell className="!px-4 !py-3 !text-center !text-xs !font-semibold !text-gray-500 !uppercase">Definitiva</TableCell>
                  <TableCell className="!px-4 !py-3 !text-left !text-xs !font-semibold !text-gray-500 !uppercase">Logro</TableCell>
                </TableRow>
              </TableHead>
              <TableBody className="bg-white divide-y divide-gray-200">
                {materias.map(m => {
                  const notaPeriodo = (p) => {
                    const reg = m.periodos.find(x => x.periodo === p)
                    if (!reg || reg.nota == null) return '—'
                    return reg.nota
                  }
                  return (
                    <TableRow key={m.asignatura?._id || m.asignatura} hover>
                      <TableCell className="!px-4 !py-3 !text-sm !font-medium !text-gray-900">
                        {m.asignatura?.nombre || 'Asignatura'}
                      </TableCell>
                      {periodos.map(p => (
                        <TableCell key={p} className={`!px-4 !py-3 !text-center !text-sm ${notaColor(notaPeriodo(p))}`}>
                          {notaPeriodo(p)}
                        </TableCell>
                      ))}
                      <TableCell className={`!px-4 !py-3 !text-center !text-sm ${notaColor(m.notaDefinitiva)}`}>
                        {m.notaDefinitiva ?? '—'}
                      </TableCell>
                      <TableCell className="!px-4 !py-3 !text-sm !text-gray-600">{m.logro || '—'}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>
    </div>
  )
}