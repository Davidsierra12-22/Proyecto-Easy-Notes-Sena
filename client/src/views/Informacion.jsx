import { useEffect, useState } from 'react'
import { Printer, RefreshCw, Trophy, Search } from 'lucide-react'
import {
  Button, FormControl, IconButton, MenuItem, Select,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material'
import api from '../services/api.service'
import { notificar } from '../store/notificacionStore'

const MEDALLAS = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function Informacion() {
  const [anios, setAnios] = useState([])
  const [filtros, setFiltros] = useState({ anioAcademicoId: '', periodo: 1, topN: 3 })
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const numeroPeriodos = anios.find(a => a._id === filtros.anioAcademicoId)?.configuracion?.numeroPeriodos || 4

  const cargarDependencias = async () => {
    setError('')
    try {
      const resAnio = await api.get('/anios-academicos')
      setAnios(resAnio.data.data)
      const activo = resAnio.data.data.find(a => a.estado === 'activo')
      setFiltros(prev => ({ ...prev, anioAcademicoId: activo?._id || '' }))
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar')
    }
  }

  useEffect(() => { cargarDependencias() }, [])

  const generar = async (e) => {
    if (e) e.preventDefault()
    if (!filtros.anioAcademicoId) {
      setError('Selecciona el año académico')
      return
    }
    setLoading(true)
    setError('')
    setData([])
    try {
      const params = new URLSearchParams({
        anioAcademicoId: filtros.anioAcademicoId,
        periodo: String(filtros.periodo),
        topN: String(filtros.topN)
      })
      const r = await api.get(`/informacion?${params.toString()}`)
      setData(r.data.data || [])
      if (!(r.data.data || []).length) notificar('No hay datos para los filtros seleccionados', 'warning')
    } catch (err) {
      setError(err.response?.data?.message || 'Error al generar la información')
    } finally {
      setLoading(false)
    }
  }

  const totalEstudiantes = data.reduce(
    (acc, g) => acc + g.grupos.reduce((a, gr) => a + gr.estudiantes.length, 0), 0
  )

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Información</h1>
            <p className="text-sm text-gray-500">Primeros puestos por curso según el promedio del período</p>
          </div>
          <IconButton onClick={cargarDependencias} aria-label="Recargar listas" title="Recargar listas" className="!text-gray-500 hover:!text-gray-700 hover:!bg-gray-100 self-start !p-2" size="small">
            <RefreshCw className="w-4 h-4" />
          </IconButton>
        </div>

        <form onSubmit={generar} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Año Académico</label>
            <FormControl fullWidth size="small">
              <Select value={filtros.anioAcademicoId} onChange={(e) => setFiltros({ ...filtros, anioAcademicoId: e.target.value })} displayEmpty className="text-sm">
                <MenuItem value="">Seleccionar...</MenuItem>
                {anios.map(a => <MenuItem key={a._id} value={a._id}>Año {a.anio}</MenuItem>)}
              </Select>
            </FormControl>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Período</label>
            <FormControl fullWidth size="small">
              <Select value={filtros.periodo} onChange={(e) => setFiltros({ ...filtros, periodo: Number(e.target.value) })} className="text-sm">
                {Array.from({ length: numeroPeriodos }, (_, i) => i + 1).map(p => (
                  <MenuItem key={p} value={p}>Período {p}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Primeros puestos</label>
            <FormControl fullWidth size="small">
              <Select value={filtros.topN} onChange={(e) => setFiltros({ ...filtros, topN: Number(e.target.value) })} className="text-sm">
                {[3, 5, 10].map(n => <MenuItem key={n} value={n}>{n} primeros</MenuItem>)}
                <MenuItem value={100}>Todos</MenuItem>
              </Select>
            </FormControl>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={loading} variant="contained" color="primary" fullWidth className="!normal-case !py-2.5 text-sm font-medium" startIcon={!loading && <Search className="w-4 h-4" />}>
              {loading ? 'Generando...' : 'Consultar'}
            </Button>
          </div>
        </form>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mt-4">{error}</div>}
      </div>

      {data.length > 0 && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:hidden">
            <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white flex items-center justify-between flex-wrap gap-4 print:bg-white print:text-black">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center print:hidden">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Información de primeros puestos</h2>
                  <p className="text-sm opacity-90">
                    Período {filtros.periodo} · {totalEstudiantes} estudiantes
                  </p>
                </div>
              </div>
              <Button onClick={() => window.print()} variant="outlined" className="!text-white !border-white/60 !bg-white/10 hover:!bg-white/20 !normal-case text-sm !px-3 !py-1.5 print:hidden" startIcon={<Printer className="w-4 h-4" />}>
                Imprimir
              </Button>
            </div>
          </div>

          {data.map(grado => (
            <div key={grado.gradoNumero} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary-600" />
                <h3 className="text-base font-bold text-gray-900">{grado.gradoNombre}</h3>
              </div>
              {grado.grupos.map(grupo => (
                <div key={grupo.grupoNombre} className="px-5 py-4 border-t border-gray-100 first:border-t-0">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Curso {grupo.grupoNombre}</p>
                  <TableContainer className="overflow-x-auto">
                    <Table size="small" className="min-w-full divide-y divide-gray-200">
                      <TableHead>
                        <TableRow className="bg-gray-50">
                          <TableCell className="!px-4 !py-2.5 !text-left !text-xs !font-semibold !text-gray-500 !uppercase w-16">Puesto</TableCell>
                          <TableCell className="!px-4 !py-2.5 !text-left !text-xs !font-semibold !text-gray-500 !uppercase">Estudiante</TableCell>
                          <TableCell className="!px-4 !py-2.5 !text-left !text-xs !font-semibold !text-gray-500 !uppercase">Documento</TableCell>
                          <TableCell className="!px-4 !py-2.5 !text-right !text-xs !font-semibold !text-gray-500 !uppercase">Promedio</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody className="bg-white divide-y divide-gray-200">
                        {grupo.estudiantes.map(est => (
                          <TableRow key={est.estudianteId} className={est.puesto === 1 ? '!bg-amber-50' : ''}>
                            <TableCell className="!px-4 !py-2.5 !text-sm">
                              <span className="flex items-center gap-1.5">
                                {MEDALLAS[est.puesto] && <span>{MEDALLAS[est.puesto]}</span>}
                                <span className={`font-semibold ${est.puesto === 1 ? 'text-amber-700' : 'text-gray-700'}`}>{est.puesto}</span>
                              </span>
                            </TableCell>
                            <TableCell className="!px-4 !py-2.5 !text-sm !font-medium !text-gray-900">{est.nombres} {est.apellidos}</TableCell>
                            <TableCell className="!px-4 !py-2.5 !text-sm !text-gray-600">{est.documento}</TableCell>
                            <TableCell className="!px-4 !py-2.5 !text-sm !text-right !font-bold !text-primary-700">{est.promedio.toFixed(1)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {!data.length && !loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          Selecciona año, período y número de puestos, luego pulsa "Consultar".
        </div>
      )}
    </div>
  )
}