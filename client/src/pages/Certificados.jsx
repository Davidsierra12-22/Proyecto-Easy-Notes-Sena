import { useEffect, useState } from 'react'
import { Printer, RefreshCw, School, ScrollText, Award } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Certificados() {
  const { usuario } = useAuth()
  const esEstudiante = usuario?.tipoPerfil === 'estudiante'

  const [anios, setAnios] = useState([])
  const [estudiantes, setEstudiantes] = useState([])
  const [matriculas, setMatriculas] = useState([])
  const [institucion, setInstitucion] = useState(null)
  const [filtros, setFiltros] = useState({})
  const [facultad, setFacultad] = useState({ estilo: 'certificado' }) // certificado | constancia
  const [estudianteSel, setEstudianteSel] = useState(null)
  const [grupoSel, setGrupoSel] = useState(null)
  const [boletin, setBoletin] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const cargarDependencias = async () => {
    setError('')
    try {
      const [resAnio, resEst, resMat, resInst] = await Promise.all([
        api.get('/anios-academicos'),
        api.get('/usuarios?tipoPerfil=estudiante'),
        api.get('/matriculas'),
        api.get('/instituciones')
      ])
      setAnios(resAnio.data.data)
      setEstudiantes(resEst.data.data)
      setMatriculas(resMat.data.data)
      setInstitucion(resInst.data.data.find(i => i._id === usuario?.institucionId) || null)
      const activo = resAnio.data.data.find(a => a.estado === 'activo')
      setFiltros(prev => ({ ...prev, anioAcademicoId: activo?._id || '' }))
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar')
    }
  }

  useEffect(() => { cargarDependencias() }, [])

  const generar = async (estudianteId) => {
    if (!filtros.anioAcademicoId) { setError('Selecciona el año académico'); return }
    setLoading(true)
    setError('')
    setEstudianteSel(null)
    setBoletin([])
    try {
      const est = estudiantes.find(s => s._id === estudianteId)
      if (!est) throw new Error('Estudiante no encontrado')
      const mat = matriculas.find(mm =>
        (mm.estudianteId?._id || mm.estudianteId) === estudianteId &&
        ((mm.anioAcademicoId?._id || mm.anioAcademicoId) === filtros.anioAcademicoId)
      )
      setGrupoSel(mat?.grupoId || null)
      const r = await api.get(`/calificaciones/estudiante/${estudianteId}/anio/${filtros.anioAcademicoId}`)
      setBoletin(r.data.data)
      setEstudianteSel(est)
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Error al generar certificado')
    } finally {
      setLoading(false)
    }
  }

  const promedio = () => {
    const notas = boletin.map(m => m.notaDefinitiva).filter(n => n != null)
    if (!notas.length) return null
    return Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10
  }

  const prom = promedio()
  const cuadroHonor = prom != null && prom >= 4.5
  const dane = institucion?.dane?.codigo
  const nombreEst = estudianteSel ? `${estudianteSel.nombres} ${estudianteSel.apellidos}` : ''
  const grado = grupoSel?.grado

  if (esEstudiante) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
        Los certificados son gestionados por la administración de la institución.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Certificados y Constancias</h1>
            <p className="text-sm text-gray-500">Documentos oficiales de estudio (BR-004 / IV-002)</p>
          </div>
          <button onClick={cargarDependencias} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Año Académico</label>
            <select value={filtros.anioAcademicoId} onChange={(e) => setFiltros({ ...filtros, anioAcademicoId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm bg-white">
              <option value="">Seleccionar...</option>
              {anios.map(a => <option key={a._id} value={a._id}>Año {a.anio}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Estudiante</label>
            <select value={filtros.estudianteId} onChange={(e) => setFiltros({ ...filtros, estudianteId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm bg-white">
              <option value="">Seleccionar...</option>
              {estudiantes.map(s => <option key={s._id} value={s._id}>{s.nombres} {s.apellidos} - {s.documento}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => filtros.estudianteId && generar(filtros.estudianteId)} disabled={!filtros.estudianteId || loading}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium w-full disabled:opacity-50">
              {loading ? 'Generando...' : 'Generar documento'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <label className="text-sm font-medium text-gray-700">Tipo de documento:</label>
          <button onClick={() => setFacultad({ estilo: 'certificado' })}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${facultad.estilo === 'certificado' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Certificado
          </button>
          <button onClick={() => setFacultad({ estilo: 'constancia' })}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${facultad.estilo === 'constancia' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Constancia
          </button>
          {cuadroHonor && (
            <span className="inline-flex items-center gap-1 text-amber-600 text-sm font-medium ml-auto">
              <Award className="w-4 h-4" /> Cuadro de Honor
            </span>
          )}
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mt-3">{error}</div>}
      </div>

      {estudianteSel && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white print:bg-white print:text-black flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ScrollText className="w-6 h-6 print:hidden" /> {facultad.estilo === 'certificado' ? 'Certificado de estudio' : 'Constancia de estudio'}
            </h2>
            <button onClick={() => window.print()} className="text-white border border-white/60 rounded-lg px-3 py-1.5 text-sm flex items-center gap-1 print:hidden bg-white/10 hover:bg-white/20">
              <Printer className="w-4 h-4" /> Imprimir
            </button>
          </div>

          <div className="p-6 lg:p-10">
            <div className="max-w-2xl mx-auto border-2 border-gray-200 rounded-lg p-6 lg:p-10 bg-white">
              <div className="text-center border-b border-gray-300 pb-6 mb-6">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full mx-auto mb-3 flex items-center justify-center print:hidden">
                  <School className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{institucion?.nombre || 'Institución Educativa'}</h2>
                <p className="text-sm text-gray-500">
                  Código DANE: {dane || '—'}{institucion?.nit ? ` · NIT ${institucion.nit}` : ''}
                </p>
              </div>

              <p className="text-center text-sm text-gray-600 leading-relaxed">
                El rector de la institución hace constar que el estudiante
              </p>
              <p className="text-center text-lg font-bold text-gray-900 my-2">{nombreEst}</p>
              <p className="text-center text-sm text-gray-600">
                identificado con {estudianteSel.tipoDocumento || 'CC'} N° <span className="font-semibold">{estudianteSel.documento}</span>
              </p>

              <p className="text-center text-sm text-gray-700 leading-relaxed mt-4">
                {(facultad.estilo === 'constancia' ? 'Se encuentra matriculado' : 'Cursó y aprobó')} el grado {grado} durante el año lectivo {anios.find(a => a._id === filtros.anioAcademicoId)?.anio || ''}
                {prom != null && (<> con un rendimiento académico de <span className="font-bold">{prom}</span></>)}.
              </p>

              {facultad.estilo === 'certificado' && boletin.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2 text-center">Valoración final por área</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                    {boletin.map(m => (
                      <p key={m.asignatura?._id || Math.random()} className="flex justify-between text-sm border-b border-gray-100 py-1">
                        <span className="text-gray-700">{m.asignatura?.nombre || 'Asignatura'}</span>
                        <span className="font-semibold text-gray-900">{m.notaDefinitiva ?? '—'}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {cuadroHonor && (
                <p className="mt-4 text-center text-sm font-semibold text-amber-600">Mención de honor por su destacado rendimiento académico (Cuadro de Honor)</p>
              )}

              <div className="mt-16 grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="border-t border-gray-400 pt-2">
                    <p className="text-sm font-semibold text-gray-800">Rector</p>
                    <p className="text-xs text-gray-500">{institucion?.nombre || 'Institución'}</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t border-gray-400 pt-2">
                    <p className="text-sm font-semibold text-gray-800">Secretaría Académica</p>
                    <p className="text-xs text-gray-500">Firma y sello</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!estudianteSel && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          Selecciona un estudiante para generar su certificado o constancia (también desde un grupo).
        </div>
      )}
    </div>
  )
}