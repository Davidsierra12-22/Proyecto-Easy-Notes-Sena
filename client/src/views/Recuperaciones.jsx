import { useEffect, useState } from 'react'
import { Search, CheckCircle2 } from 'lucide-react'
import { Select, MenuItem, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import api from '../services/api.service'

export default function Recuperaciones() {
  const [anios, setAnios] = useState([])
  const [grupos, setGrupos] = useState([])
  const [asignaturas, setAsignaturas] = useState([])
  const [filtros, setFiltros] = useState({})
  const [notaMinima, setNotaMinima] = useState(3.0)
  const [calificaciones, setCalificaciones] = useState([])
  const [cargado, setCargado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activas, setActivas] = useState({})
  const [valores, setValores] = useState({})
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [numeroPeriodos, setNumeroPeriodos] = useState(5)

  const cargarDependencias = async () => {
    try {
      const [resAnio, resGrupos, resAsig] = await Promise.all([
        api.get('/anios-academicos'),
        api.get('/grupos'),
        api.get('/asignaturas')
      ])
      setAnios(resAnio.data.data)
      setGrupos(resGrupos.data.data)
      setAsignaturas(resAsig.data.data)
      const activo = resAnio.data.data.find(a => a.estado === 'activo')
      if (activo) {
        setFiltros(prev => ({ ...prev, anioAcademicoId: activo._id }))
        setNotaMinima(activo.configuracion?.notaMinima ?? 3.0)
        if (activo.configuracion?.numeroPeriodos) setNumeroPeriodos(activo.configuracion.numeroPeriodos)
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar')
    }
  }

  useEffect(() => { cargarDependencias() }, [])

  const cambiarAnio = (id) => {
    setFiltros(prev => ({ ...prev, anioAcademicoId: id }))
    const a = anios.find(x => x._id === id)
    if (a) {
      setNotaMinima(a.configuracion?.notaMinima ?? 3.0)
      if (a.configuracion?.numeroPeriodos) setNumeroPeriodos(a.configuracion.numeroPeriodos)
    }
  }

  const cargarCalificaciones = async () => {
    if (!filtros.grupoId || !filtros.asignaturaId || !filtros.periodo) {
      setError('Selecciona grupo, asignatura y período')
      return
    }
    setLoading(true)
    setError('')
    setExito('')
    setCargado(false)
    try {
      const r = await api.get(`/calificaciones/grupo/${filtros.grupoId}/asignatura/${filtros.asignaturaId}/periodo/${filtros.periodo}`, {
        params: { anioAcademicoId: filtros.anioAcademicoId }
      })
      setCalificaciones(r.data.data)
      const v = {}
      const a = {}
      r.data.data.forEach(c => {
        v[c._id] = ''
        a[c._id] = false
      })
      setValores(v)
      setActivas(a)
      setCargado(true)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar calificaciones')
    } finally {
      setLoading(false)
    }
  }

  const seleccionarTipo = (id, tipo) => {
    setActivas(prev => ({ ...prev, [id]: true, [`${id}_tipo`]: tipo }))
  }

  const aplicar = async (c) => {
    const tipo = activas[`${c._id}_tipo`] || 'recuperacion'
    const nota = parseFloat(valores[c._id])
    if (isNaN(nota) || nota < 0 || nota > 5) {
      setError('Ingresa una nota válida entre 0 y 5')
      return
    }
    setProcesando(true)
    setError('')
    setExito('')
    try {
      const body = {
        calificacionId: c._id,
        anioAcademicoId: filtros.anioAcademicoId,
        periodo: Number(filtros.periodo)
      }
      if (tipo === 'habilitacion') {
        body.notaHabilitacion = nota
        await api.post('/calificaciones/habilitacion', body)
      } else {
        body.notaRecuperacion = nota
        await api.post('/calificaciones/recuperacion', body)
      }
      setExito(`Nota de ${tipo === 'habilitacion' ? 'habilitación' : 'recuperación'} aplicada (${nota})`)
      await cargarCalificaciones()
    } catch (e) {
      setError(e.response?.data?.message || 'Error al aplicar')
    } finally {
      setProcesando(false)
    }
  }

  const grupoLabel = (id) => grupos.find(g => g._id === id)?.nombre || '—'
  const asigLabel = (id) => asignaturas.find(a => a._id === id)?.nombre || '—'

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <h1 className="text-xl font-bold text-gray-900">Recuperaciones y Habilitaciones</h1>
        <p className="text-sm text-gray-500 mb-4">Aplica notas de recuperación o habilitación por período</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Año Académico</label>
            <Select value={filtros.anioAcademicoId || ''} onChange={(e) => cambiarAnio(e.target.value)} size="small" fullWidth displayEmpty>
              <MenuItem value="">Seleccionar...</MenuItem>
              {anios.map(a => <MenuItem key={a._id} value={a._id}>Año {a.anio}</MenuItem>)}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Grupo</label>
            <Select value={filtros.grupoId || ''} onChange={(e) => setFiltros({ ...filtros, grupoId: e.target.value })} size="small" fullWidth displayEmpty>
              <MenuItem value="">Seleccionar...</MenuItem>
              {grupos.map(g => <MenuItem key={g._id} value={g._id}>{g.nombre} (Grado {g.grado})</MenuItem>)}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Asignatura</label>
            <Select value={filtros.asignaturaId || ''} onChange={(e) => setFiltros({ ...filtros, asignaturaId: e.target.value })} size="small" fullWidth displayEmpty>
              <MenuItem value="">Seleccionar...</MenuItem>
              {asignaturas.map(a => <MenuItem key={a._id} value={a._id}>{a.nombre}</MenuItem>)}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Período</label>
            <Select value={filtros.periodo || ''} onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })} size="small" fullWidth displayEmpty>
              <MenuItem value="">Período...</MenuItem>
              {Array.from({ length: numeroPeriodos }, (_, i) => i + 1).map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={cargarCalificaciones} disabled={loading} variant="contained" color="primary" startIcon={<Search className="w-4 h-4" />}>
              Cargar
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Nota mínima para aprobar: <strong>{notaMinima}</strong></p>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mt-4">{error}</div>}
        {exito && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-3 py-2 mt-4">{exito}</div>}
      </div>

      {cargado && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">
              {grupoLabel(filtros.grupoId)} · {asigLabel(filtros.asignaturaId)} · Período {filtros.periodo}
            </h2>
            <span className="text-sm text-gray-500">{calificaciones.length} calificaciones</span>
          </div>
          <div className="overflow-x-auto">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Estudiante</TableCell>
                    <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap" align="center">Nota actual</TableCell>
                    <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap" align="center">Tipo</TableCell>
                    <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">Nota (0-5)</TableCell>
                    <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap" align="right">Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {calificaciones.map(c => {
                    const esBaja = c.nota != null && c.nota < notaMinima
                    return (
                      <TableRow key={c._id} hover>
                        <TableCell className="!text-sm !text-gray-900 !py-3 whitespace-nowrap">
                          {c.estudianteId ? `${c.estudianteId.nombres} ${c.estudianteId.apellidos}` : '—'}
                        </TableCell>
                        <TableCell className="!py-3" align="center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${esBaja ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {c.nota ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell className="!py-3">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="small"
                              variant={activas[`${c._id}_tipo`] === 'recuperacion' ? 'contained' : 'outlined'}
                              color="primary"
                              onClick={() => seleccionarTipo(c._id, 'recuperacion')}
                            >
                              Recuperación
                            </Button>
                            <Button
                              type="button"
                              size="small"
                              variant={activas[`${c._id}_tipo`] === 'habilitacion' ? 'contained' : 'outlined'}
                              color="warning"
                              onClick={() => seleccionarTipo(c._id, 'habilitacion')}
                            >
                              Habilitación
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="!py-3" sx={{ width: 128 }}>
                          <TextField
                            type="number"
                            size="small"
                            value={valores[c._id]}
                            onChange={(e) => setValores({ ...valores, [c._id]: e.target.value })}
                            disabled={!activas[c._id]}
                            placeholder="0.0"
                            slotProps={{ htmlInput: { step: '0.1', min: 0, max: 5 } }}
                            sx={{ width: 96 }}
                          />
                        </TableCell>
                        <TableCell className="!py-3" align="right">
                          {activas[c._id] && (
                            <Button
                              size="small"
                              onClick={() => aplicar(c)}
                              disabled={procesando}
                              startIcon={<CheckCircle2 className="w-4 h-4" />}
                              color="success"
                            >
                              Aplicar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </div>
      )}

      {cargado && calificaciones.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          No hay calificaciones registradas para esta selección. Primero registra notas en el módulo de Calificaciones.
        </div>
      )}
    </div>
  )
}
