import { useEffect, useState } from 'react'
import { Download, Printer, RefreshCw, School } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useSede } from '../context/SedeContext'

const TIPOS = [
  { valor: 'acumulativo', label: 'Acumulativo', conPeriodo: false },
  { valor: 'corto', label: 'Corto', conPeriodo: true },
  { valor: 'descriptivo', label: 'Descriptivo', conPeriodo: true },
  { valor: 'final', label: 'Final de año', conPeriodo: false },
  { valor: 'preescolar', label: 'Preescolar', conPeriodo: true }
]

const MAX_PERIODOS = 5

const logroColor = (logro) => {
  if (!logro) return 'bg-gray-100 text-gray-700'
  if (logro.includes('Superior')) return 'bg-emerald-100 text-emerald-700'
  if (logro.includes('Alto')) return 'bg-primary-100 text-primary-800'
  if (logro.includes('Básico')) return 'bg-amber-100 text-amber-700'
  if (logro.includes('Bajo')) return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-700'
}

const NombreAsignatura = ({ a }) => (
  <span className="text-sm font-medium text-gray-900">{a.asignatura?.nombre || a.nombre || 'Asignatura'}</span>
)

const TablaPeriodos = ({ asignaturas }) => {
  if (!asignaturas?.length) return null
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Asignatura</th>
            {Array.from({ length: MAX_PERIODOS }, (_, i) => i + 1).map(p => (
              <th key={p} className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">P{p}</th>
            ))}
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Definitiva</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Logro</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {asignaturas.map((m, i) => (
            <tr key={m.asignatura?._id || m.asignaturaId || i}>
              <td className="px-4 py-3"><NombreAsignatura a={m} /></td>
              {Array.from({ length: MAX_PERIODOS }, (_, j) => j + 1).map(p => {
                const per = (m.periodos || []).find(x => x.periodo === p)
                const val = per ? per.notaVigente : null
                return (
                  <td key={p} className="px-4 py-3 text-sm text-center text-gray-700">
                    {val != null ? `${val}${per?.recuperada ? '*' : ''}` : '—'}
                  </td>
                )
              })}
              <td className="px-4 py-3 text-sm text-center font-bold text-gray-900">
                {m.promedioAnual ?? m.notaDefinitiva ?? '—'}
              </td>
              <td className="px-4 py-3 text-sm">
                {(m.logroFinal || m.logro) && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${logroColor(m.logroFinal || m.logro)}`}>
                    {m.logroFinal || m.logro}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const TablaCorto = ({ asignaturas }) => {
  if (!asignaturas?.length) return null
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Asignatura</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Nota</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Logro</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Observación</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {asignaturas.map((m, i) => (
            <tr key={m.asignatura?._id || m.asignaturaId || i}>
              <td className="px-4 py-3"><NombreAsignatura a={m} /></td>
              <td className="px-4 py-3 text-sm text-center text-gray-700">
                {m.notaVigente != null ? `${m.notaVigente}${m.recuperada ? '*' : ''}` : '—'}
              </td>
              <td className="px-4 py-3 text-sm">
                {m.logro && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${logroColor(m.logro)}`}>{m.logro}</span>}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{m.observacion || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const TablaDescriptivo = ({ asignaturas }) => {
  if (!asignaturas?.length) return null
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Asignatura</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Nota</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Logro</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Indicadores</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Observación</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {asignaturas.map((m, i) => (
            <tr key={m.asignatura?._id || m.asignaturaId || i}>
              <td className="px-4 py-3"><NombreAsignatura a={m} /></td>
              <td className="px-4 py-3 text-sm text-center text-gray-700">
                {m.notaVigente != null ? `${m.notaVigente}${m.recuperada ? '*' : ''}` : '—'}
              </td>
              <td className="px-4 py-3 text-sm">
                {m.logro && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${logroColor(m.logro)}`}>{m.logro}</span>}
              </td>
              <td className="px-4 py-3 text-sm">
                {m.indicadores?.length ? (
                  <ul className="space-y-1">
                    {m.indicadores.map((ind, j) => (
                      <li key={j} className="flex items-start justify-between gap-4">
                        <span className="text-gray-600">{ind.indicador?.descripcion || ind.indicador?.codigo || 'Indicador'}</span>
                        <span className="font-medium text-gray-800">{ind.nota ?? '—'}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{m.observacion || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const TablaPreescolar = ({ asignaturas }) => {
  if (!asignaturas?.length) return null
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Asignatura</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Nivel</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Descripción</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Observación</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {asignaturas.map((m, i) => (
            <tr key={m.asignatura?._id || m.asignaturaId || i}>
              <td className="px-4 py-3"><NombreAsignatura a={m} /></td>
              <td className="px-4 py-3 text-sm text-center">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 text-primary-800 font-bold">{m.nivelCualitativo}</span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{m.descripcion}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{m.observacion || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Boletines() {
  const { usuario } = useAuth()
  const { sedeId } = useSede()
  const [anios, setAnios] = useState([])
  const [estudiantes, setEstudiantes] = useState([])
  const [filtros, setFiltros] = useState({ anioAcademicoId: '', estudianteId: '', tipo: 'acumulativo', periodo: 1 })
  const [boletin, setBoletin] = useState(null)
  const [estudianteSel, setEstudianteSel] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const esEstudiante = usuario?.tipoPerfil === 'estudiante'
  const esDocente = usuario?.tipoPerfil === 'docente'
  const puedeElegirEstudiante = !esEstudiante && !esDocente
  const esGenerador = ['admin', 'rector', 'coordinador', 'secretaria', 'docente', 'super_admin'].includes(usuario?.tipoPerfil)

  const tipoActual = TIPOS.find(t => t.valor === filtros.tipo) || TIPOS[0]

  const cargarDependencias = async () => {
    try {
      const resAnio = await api.get('/anios-academicos')
      setAnios(resAnio.data.data)
      const activo = resAnio.data.data.find(a => a.estado === 'activo')
      setFiltros(prev => ({ ...prev, anioAcademicoId: activo?._id || '' }))

      if (puedeElegirEstudiante) {
        const params = new URLSearchParams({ tipoPerfil: 'estudiante' })
        if (sedeId) params.set('sedeId', sedeId)
        const resEst = await api.get(`/usuarios?${params.toString()}`)
        setEstudiantes(resEst.data.data)
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar')
    }
  }

  useEffect(() => { cargarDependencias() }, [sedeId])

  const cargarBoletin = async (e) => {
    if (e) e.preventDefault()
    if (!filtros.anioAcademicoId) {
      setError('Selecciona el año académico')
      return
    }
    let estId = filtros.estudianteId
    if (esEstudiante) estId = usuario._id
    if (!estId) {
      setError('Selecciona el estudiante')
      return
    }
    setLoading(true)
    setError('')
    setBoletin(null)
    try {
      const base = `/boletines/${filtros.tipo}/${estId}/anio/${filtros.anioAcademicoId}`
      const url = tipoActual.conPeriodo ? `${base}/periodo/${filtros.periodo}` : base
      const r = await api.get(url)
      setBoletin(r.data.data)
      const est = estudiantes.find(s => s._id === estId)
      setEstudianteSel(est || usuario)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar boletín')
      setBoletin(null)
    } finally {
      setLoading(false)
    }
  }

  const promedioGeneral = () => {
    if (!boletin) return null
    if (boletin.resumen?.promedioGeneral != null) return boletin.resumen.promedioGeneral
    const promedios = (boletin.asignaturas || [])
      .map(a => a.promedioAnual ?? a.notaDefinitiva)
      .filter(n => n != null)
    if (!promedios.length) return null
    return Math.round((promedios.reduce((a, b) => a + b, 0) / promedios.length) * 10) / 10
  }

  const totalAsignaturas = boletin?.asignaturas?.length ?? 0
  const mostrarPromedio = ['acumulativo', 'final'].includes(filtros.tipo)

  const descargarPdf = async () => {
    if (!boletin) return
    try {
      const base = `/boletines/pdf/${filtros.tipo}/${filtros.estudianteId || usuario._id}/anio/${filtros.anioAcademicoId}`
      const url = tipoActual.conPeriodo ? `${base}/periodo/${filtros.periodo}` : base
      const r = await api.get(url, { responseType: 'blob' })
      const blobUrl = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `boletin-${filtros.tipo}.pdf`
      a.click()
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al descargar PDF')
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Boletines</h1>
            <p className="text-sm text-gray-500">Genera boletines acumulativo, corto, descriptivo, final o preescolar</p>
          </div>
          <button onClick={cargarDependencias} aria-label="Recargar listas" title="Recargar listas" className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 self-start">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={cargarBoletin} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de boletín</label>
            <select value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
              {TIPOS.map(t => <option key={t.valor} value={t.valor}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Año Académico</label>
            <select value={filtros.anioAcademicoId} onChange={(e) => setFiltros({ ...filtros, anioAcademicoId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
              <option value="">Seleccionar...</option>
              {anios.map(a => <option key={a._id} value={a._id}>Año {a.anio}</option>)}
            </select>
          </div>
          {puedeElegirEstudiante && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estudiante</label>
              <select value={filtros.estudianteId} onChange={(e) => setFiltros({ ...filtros, estudianteId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                <option value="">Seleccionar...</option>
                {estudiantes.map(s => <option key={s._id} value={s._id}>{s.nombres} {s.apellidos} - {s.documento}</option>)}
              </select>
            </div>
          )}
          {tipoActual.conPeriodo && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Periodo</label>
              <select value={filtros.periodo} onChange={(e) => setFiltros({ ...filtros, periodo: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
                {[1, 2, 3, 4, 5].map(p => <option key={p} value={p}>Periodo {p}</option>)}
              </select>
            </div>
          )}
          <div className="flex items-end">
            <button type="submit" disabled={loading}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 w-full">
              {loading ? 'Generando...' : 'Generar Boletín'}
            </button>
          </div>
        </form>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mt-4">{error}</div>}
      </div>

      {boletin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white print:bg-white print:text-black">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center print:hidden">
                  <School className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    Boletín {TIPOS.find(t => t.valor === boletin.tipo)?.label || boletin.tipo}
                  </h2>
                  <p className="text-sm opacity-90">{estudianteSel ? `${estudianteSel.nombres} ${estudianteSel.apellidos}` : 'Estudiante'}</p>
                </div>
              </div>
              <button onClick={descargarPdf} className="text-white border border-white/60 rounded-lg px-3 py-1.5 text-sm flex items-center gap-1 print:hidden bg-white/10 hover:bg-white/20">
                <Download className="w-4 h-4" /> Descargar PDF
              </button>
              <button onClick={() => window.print()} className="text-white border border-white/60 rounded-lg px-3 py-1.5 text-sm flex items-center gap-1 print:hidden bg-white/10 hover:bg-white/20">
                <Printer className="w-4 h-4" /> Imprimir
              </button>
            </div>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-500 mb-4">
              Documento: {estudianteSel?.documento || '—'} · {filtros.tipo === 'final' || filtros.tipo === 'acumulativo' ? 'Año completo' : `Periodo ${filtros.periodo}`}
            </p>

            {filtros.tipo === 'final' && boletin.resumen && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-3 text-center">
                  <p className="text-xs text-gray-500 uppercase">Promedio</p>
                  <p className="text-xl font-bold text-gray-900">{boletin.resumen.promedioGeneral ?? '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-3 text-center">
                  <p className="text-xs text-gray-500 uppercase">Asignaturas</p>
                  <p className="text-xl font-bold text-gray-900">{boletin.resumen.totalAsignaturas ?? '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-3 text-center">
                  <p className="text-xs text-gray-500 uppercase">Áreas perdidas</p>
                  <p className="text-xl font-bold text-gray-900">{boletin.resumen.areasPerdidas ?? '—'}</p>
                </div>
                <div className={`rounded-lg border px-4 py-3 text-center ${boletin.resumen.promovido ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                  <p className="text-xs text-gray-500 uppercase">Veredicto</p>
                  <p className={`text-xl font-bold ${boletin.resumen.promovido ? 'text-emerald-700' : 'text-red-700'}`}>
                    {boletin.resumen.promovido == null ? '—' : boletin.resumen.promovido ? 'Promovido' : 'No promovido'}
                  </p>
                </div>
              </div>
            )}

            {filtros.tipo === 'acumulativo' && <TablaPeriodos asignaturas={boletin.asignaturas} />}
            {filtros.tipo === 'final' && <TablaPeriodos asignaturas={boletin.asignaturas} />}
            {filtros.tipo === 'corto' && <TablaCorto asignaturas={boletin.asignaturas} />}
            {filtros.tipo === 'descriptivo' && <TablaDescriptivo asignaturas={boletin.asignaturas} />}
            {filtros.tipo === 'preescolar' && (
              <>
                <TablaPreescolar asignaturas={boletin.asignaturas} />
                {boletin.escalaCualitativa && (
                  <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Escala</p>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      {Object.entries(boletin.escalaCualitativa).map(([letra, desc]) => (
                        <span key={letra}><b className="text-gray-800">{letra}</b>: {desc}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {mostrarPromedio && (
              <div className="mt-4 flex justify-end">
                <div className="bg-gray-50 rounded-lg px-4 py-3 text-right border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase">Promedio General {esGenerador ? `(${totalAsignaturas} asignaturas)` : ''}</p>
                  <p className="text-2xl font-bold text-primary-600">{promedioGeneral() ?? '—'}</p>
                </div>
              </div>
            )}

            {(filtros.tipo === 'acumulativo' || filtros.tipo === 'corto' || filtros.tipo === 'descriptivo' || filtros.tipo === 'final') && (
              <p className="text-xs text-gray-400 mt-4">* Nota recuperada o habilitada</p>
            )}
          </div>
        </div>
      )}

      {!boletin && !loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          Selecciona tipo, año y estudiante, luego pulsa "Generar Boletín".
        </div>
      )}
    </div>
  )
}