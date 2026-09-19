import { useEffect, useState } from 'react'
import { Download, Printer, RefreshCw, School, ScrollText, Award } from 'lucide-react'
import { Select, MenuItem, Button, IconButton } from '@mui/material'
import api from '../services/api.service'
import { useAuth } from '../store/Auth'

export default function Certificados() {
  const { usuario } = useAuth()
  const esEstudiante = usuario?.tipoPerfil === 'estudiante'

  const [anios, setAnios] = useState([])
  const [estudiantes, setEstudiantes] = useState([])
  const [institucion, setInstitucion] = useState(null)
  const [filtros, setFiltros] = useState({})
  const [facultad, setFacultad] = useState({ estilo: 'certificado' }) // certificado | constancia
  const [doc, setDoc] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const cargarDependencias = async () => {
    setError('')
    try {
      const [resAnio, resEst, resInst] = await Promise.all([
        api.get('/anios-academicos'),
        api.get('/usuarios?tipoPerfil=estudiante'),
        api.get('/instituciones')
      ])
      setAnios(resAnio.data.data)
      setEstudiantes(resEst.data.data)
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
    setDoc(null)
    try {
      const r = await api.get(`/certificados/${estudianteId}/anio/${filtros.anioAcademicoId}`)
      setDoc(r.data.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al generar certificado')
    } finally {
      setLoading(false)
    }
  }

  const descargarPdf = async () => {
    try {
      const r = await api.get(`/certificados/${filtros.estudianteId}/anio/${filtros.anioAcademicoId}/pdf`, { responseType: 'blob' })
      const blobUrl = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = 'certificado-estudio.pdf'
      a.click()
      URL.revokeObjectURL(blobUrl)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al descargar PDF')
    }
  }

  if (esEstudiante) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
        Los certificados son gestionados por la administración de la institución.
      </div>
    )
  }

  const bodFalse = (val) => val == null || val === false

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Certificados y Constancias</h1>
            <p className="text-sm text-gray-500">Documentos oficiales de estudio (BR-004 / IV-002)</p>
          </div>
          <IconButton onClick={cargarDependencias} size="small" title="Refrescar">
            <RefreshCw className="w-4 h-4" />
          </IconButton>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Año Académico</label>
            <Select value={filtros.anioAcademicoId || ''} onChange={(e) => setFiltros({ ...filtros, anioAcademicoId: e.target.value })} size="small" fullWidth displayEmpty>
              <MenuItem value="">Seleccionar...</MenuItem>
              {anios.map(a => <MenuItem key={a._id} value={a._id}>Año {a.anio}</MenuItem>)}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Estudiante</label>
            <Select value={filtros.estudianteId || ''} onChange={(e) => setFiltros({ ...filtros, estudianteId: e.target.value })} size="small" fullWidth displayEmpty>
              <MenuItem value="">Seleccionar...</MenuItem>
              {estudiantes.map(s => <MenuItem key={s._id} value={s._id}>{s.nombres} {s.apellidos} - {s.documento}</MenuItem>)}
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={() => filtros.estudianteId && generar(filtros.estudianteId)} disabled={!filtros.estudianteId || loading} variant="contained" color="primary" fullWidth>
              {loading ? 'Generando...' : 'Generar documento'}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <label className="text-sm font-medium text-gray-700">Tipo de documento:</label>
          <Button onClick={() => setFacultad({ estilo: 'certificado' })} variant={facultad.estilo === 'certificado' ? 'contained' : 'outlined'} color="primary" size="small">
            Certificado
          </Button>
          <Button onClick={() => setFacultad({ estilo: 'constancia' })} variant={facultad.estilo === 'constancia' ? 'contained' : 'outlined'} color="primary" size="small">
            Constancia
          </Button>
          {doc?.promedioGeneral >= 4.5 && (
            <span className="inline-flex items-center gap-1 text-amber-600 text-sm font-medium ml-auto">
              <Award className="w-4 h-4" /> Cuadro de Honor
            </span>
          )}
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mt-3">{error}</div>}
      </div>

      {doc && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white print:bg-white print:text-black flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ScrollText className="w-6 h-6 print:hidden" /> {facultad.estilo === 'certificado' ? 'Certificado de estudio' : 'Constancia de estudio'}
            </h2>
            <div className="flex gap-2 print:hidden">
              <Button onClick={descargarPdf} variant="outlined" size="small" startIcon={<Download className="w-4 h-4" />}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.6)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.2)' } }}>
                Descargar PDF
              </Button>
              <Button onClick={() => window.print()} variant="outlined" size="small" startIcon={<Printer className="w-4 h-4" />}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.6)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.2)' } }}>
                Imprimir
              </Button>
            </div>
          </div>

          <div className="p-6 lg:p-10">
            <div className="max-w-2xl mx-auto border-2 border-gray-200 rounded-lg p-6 lg:p-10 bg-white">
              <div className="text-center border-b border-gray-300 pb-6 mb-6">
                {institucion?.logo ? (
                  <img src={institucion.logo} alt="Escudo" className="w-14 h-14 object-contain mx-auto mb-3" />
                ) : (
                  <div className="w-14 h-14 bg-primary-600 text-white rounded-full mx-auto mb-3 flex items-center justify-center print:hidden">
                    <School className="w-6 h-6" />
                  </div>
                )}
                <h2 className="text-xl font-bold text-gray-900">{doc.institucion?.nombre || institucion?.nombre || 'Institución Educativa'}</h2>
                <p className="text-sm text-gray-500">
                  {doc.institucion?.dane ? `Código DANE: ${doc.institucion.dane}` : ''}
                  {doc.institucion?.icfes ? ` · ICFES: ${doc.institucion.icfes}` : ''}
                  {institucion?.nit ? ` · NIT ${institucion.nit}` : ''}
                </p>
              </div>

              <p className="text-center text-sm text-gray-600 leading-relaxed">El rector de la institución hace constar que el estudiante</p>
              <p className="text-center text-lg font-bold text-gray-900 my-2">
                {doc.estudiante?.nombres ? `${doc.estudiante.nombres} ${doc.estudiante.apellidos}` : 'Estudiante'}
              </p>
              <p className="text-center text-sm text-gray-600">
                identificado con {doc.estudiante?.tipoDocumento || 'CC'} N°{' '}
                <span className="font-semibold">{doc.estudiante?.documento}</span>
              </p>

              <p className="text-center text-sm text-gray-700 leading-relaxed mt-4">
                {facultad.estilo === 'constancia' ? 'Se encuentra matriculado' : 'Cursó y aprobó'}{' '}
                el grado <b>{doc.grado}</b> durante el año lectivo{' '}
                <b>{anios.find(a => a._id === filtros.anioAcademicoId)?.anio || doc.anio}</b>
                {doc.promedioGeneral != null && (
                  <> con un rendimiento académico de <b>{doc.promedioGeneral}</b></>
                )}.
              </p>

              {facultad.estilo === 'certificado' && !bodFalse(doc.promovido) && (
                <div className="mt-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2 text-center">Resultado del año escolar</p>
                  <div className="flex justify-center gap-4 text-sm">
                    <span>Asignaturas: <b>{doc.asignaturas}</b></span>
                    <span>Áreas perdidas: <b>{doc.areasPerdidas}</b></span>
                    <span className="font-semibold text-emerald-700">PROMOVIDO</span>
                  </div>
                </div>
              )}

              {doc?.promedioGeneral >= 4.5 && (
                <p className="mt-4 text-center text-sm font-semibold text-amber-600">Mención de honor por su destacado rendimiento académico (Cuadro de Honor)</p>
              )}

              <div className="mt-16 grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="border-t border-gray-400 pt-2">
                    <p className="text-sm font-semibold text-gray-800">Rector</p>
                    <p className="text-xs text-gray-500">{doc.institucion?.nombre || 'Institución'}</p>
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

      {!doc && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          Selecciona un estudiante para generar su certificado o constancia.
        </div>
      )}
    </div>
  )
}
