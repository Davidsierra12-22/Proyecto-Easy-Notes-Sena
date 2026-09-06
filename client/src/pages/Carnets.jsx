import { useEffect, useState } from 'react'
import { Printer, RefreshCw, School, UserRound } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Carnets() {
  const { usuario } = useAuth()
  const [anios, setAnios] = useState([])
  const [matriculas, setMatriculas] = useState([])
  const [personas, setPersonas] = useState([])
  const [institucion, setInstitucion] = useState(null)
  const [filtros, setFiltros] = useState({})
  const [personaSel, setPersonaSel] = useState(null)
  const [grupoSel, setGrupoSel] = useState(null)
  const [matPorusuario, setMatPorusuario] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const esEstudiante = usuario?.tipoPerfil === 'estudiante'
  const esAdmin = ['super_admin', 'admin', 'rector', 'coordinador', 'secretaria'].includes(usuario?.tipoPerfil)

  const cargarDependencias = async () => {
    setError('')
    try {
      const [resAnio, resInst] = await Promise.all([
        api.get('/anios-academicos'),
        api.get('/instituciones')
      ])
      setAnios(resAnio.data.data)
      const activo = resAnio.data.data.find(a => a.estado === 'activo')
      setFiltros(prev => ({ ...prev, anioAcademicoId: activo?._id || '' }))

      const miInst = resInst.data.data.find(i => i._id === usuario?.institucionId)
      setInstitucion(miInst || null)

      if (!esEstudiante) {
        const resMat = await api.get('/matriculas')
        setMatriculas(resMat.data.data)
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar datos')
    }
  }

  useEffect(() => { cargarDependencias() }, [])

  const cargarPersonas = async () => {
    if (!filtros.anioAcademicoId) {
      setError('Selecciona el año académico')
      return
    }
    setLoading(true)
    setError('')
    setPersonaSel(null)
    setGrupoSel(null)
    try {
      const res = await api.get(`/usuarios?tipoPerfil=${filtros.tipoPerfil}`)
      const usuarios = res.data.data
      if (filtros.tipoPerfil === 'estudiante') {
        const mat = matriculas.filter(m =>
          m.anioAcademicoId?._id === filtros.anioAcademicoId ||
          m.anioAcademicoId === filtros.anioAcademicoId
        )
        const enMatricula = new Map()
        mat.forEach(m => {
          const e = m.estudianteId
          if (e && e._id) enMatricula.set(e._id, { estudiante: e, grupo: m.grupoId })
        })
        const conMatricula = usuarios.filter(u => enMatricula.has(u._id))
        setPersonas(conMatricula)
        setMatPorusuario(enMatricula)
      } else {
        setPersonas(usuarios)
        setMatPorusuario(null)
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar personas')
      setPersonas([])
    } finally {
      setLoading(false)
    }
  }

  const seleccionar = (u) => {
    setPersonaSel(u)
    if (matPorusuario) {
      const entry = matPorusuario.get(u._id)
      setGrupoSel(entry ? entry.grupo : null)
    } else {
      setGrupoSel(null)
    }
  }

  const anio = anios.find(a => a._id === filtros.anioAcademicoId)
  const dane = institucion?.dane?.codigo

  if (esEstudiante) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
        Tu carnet es gestionado por la administración. Solicítalo a la secretaría.
      </div>
    )
  }

  if (!esAdmin) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
        No tienes permisos para generar carnets.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Carnets</h1>
            <p className="text-sm text-gray-500">Generar carnet institucional para imprimir</p>
          </div>
          <button onClick={cargarDependencias} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 self-start">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Año Académico</label>
            <select value={filtros.anioAcademicoId} onChange={(e) => setFiltros({ ...filtros, anioAcademicoId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
              <option value="">Seleccionar...</option>
              {anios.map(a => <option key={a._id} value={a._id}>Año {a.anio}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de persona</label>
            <select
              value={filtros.tipoPerfil}
              onChange={(e) => { setFiltros({ ...filtros, tipoPerfil: e.target.value }); setPersonas([]); setPersonaSel(null) }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
              <option value="">Seleccionar...</option>
              <option value="estudiante">Estudiante</option>
              <option value="docente">Docente</option>
              <option value="admin">Administrativo</option>
              <option value="secretaria">Secretaría</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={cargarPersonas} disabled={loading}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium w-full disabled:opacity-50">
              {loading ? 'Cargando...' : 'Cargar personas'}
            </button>
          </div>
        </div>

        {filtros.tipoPerfil && personas.length > 0 && (
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Selecciona la persona</label>
            <select value={personaSel?._id || ''} onChange={(e) => seleccionar(personas.find(p => p._id === e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm">
              <option value="">Seleccionar...</option>
              {personas.map(p => (
                <option key={p._id} value={p._id}>{p.nombres} {p.apellidos} - {p.documento}</option>
              ))}
            </select>
          </div>
        )}

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mt-4">{error}</div>}
        {!filtros.tipoPerfil && <p className="text-sm text-gray-500 mt-4">Selecciona año, tipo de persona y pulsa "Cargar personas".</p>}
      </div>

      {personaSel && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white print:bg-white print:text-black flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <School className="w-6 h-6 print:hidden" /> Carnet de {filtros.tipoPerfil}
            </h2>
            <button onClick={() => window.print()} className="text-white border border-white/60 rounded-lg px-3 py-1.5 text-sm flex items-center gap-1 print:hidden bg-white/10 hover:bg-white/20">
              <Printer className="w-4 h-4" /> Imprimir
            </button>
          </div>

          <div className="p-6 flex justify-center print:p-2">
            <div className="w-full max-w-sm rounded-2xl border-2 border-primary-600 overflow-hidden bg-white shadow-lg">
              <div className="bg-primary-600 text-white px-5 py-3 flex items-center justify-between">
                <span className="font-bold text-sm uppercase tracking-wide">{institucion?.nombre || 'Institución'}</span>
                {dane && <span className="text-xs opacity-90">DANE {dane}</span>}
              </div>
              <div className="px-5 py-5">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                    {personaSel.foto ? (
                      <img src={personaSel.foto} alt="foto" className="w-full h-full object-cover" />
                    ) : (
                      <UserRound className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-lg leading-tight">{personaSel.nombres} {personaSel.apellidos}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {personaSel.tipoDocumento || 'CC'} {personaSel.documento}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">{filtros.tipoPerfil}{filtros.tipoPerfil === 'estudiante' && grupoSel ? ` · Grado ${grupoSel.grado} · Grupo ${grupoSel.nombre}` : ''}</p>
                    {filtros.tipoPerfil === 'docente' && <p className="text-sm text-gray-600 capitalize">Docente</p>}
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-dashed border-gray-300 flex items-center justify-between text-xs text-gray-500">
                  <span>Año lectivo {anio?.anio || '—'}</span>
                  {institucion?.nit && <span>NIT {institucion.nit}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!personaSel && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          Selecciona una persona para generar su carnet.
        </div>
      )}
    </div>
  )
}
