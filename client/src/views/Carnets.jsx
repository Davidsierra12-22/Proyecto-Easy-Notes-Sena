import { useEffect, useState } from 'react'
import { Printer, RefreshCw, School, UserRound, Layers, X } from 'lucide-react'
import { Select, MenuItem, IconButton, Button } from '@mui/material'
import api from '../services/api.service'
import { useAuth } from '../store/Auth'

function CarnetCard({ institucion, dane, persona, grupo, tipoPerfil, anio }) {
  return (
    <div className="carnet-imprimir w-full max-w-sm rounded-2xl border-2 border-primary-600 overflow-hidden bg-white shadow-lg mx-auto">
      <div className="bg-primary-600 text-white px-5 py-3 flex items-center gap-3">
        {institucion?.logo && (
          <img src={institucion.logo} alt="Logo"
            className="w-10 h-10 rounded-lg bg-white object-contain p-1 flex-shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm uppercase tracking-wide leading-tight">{institucion?.nombre || 'Institución'}</p>
          {dane && <p className="text-xs opacity-90 mt-0.5">DANE {dane}</p>}
        </div>
      </div>
      <div className="px-5 py-5">
        <div className="flex items-center gap-4">
          <div className="w-20 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
            {persona.foto ? (
              <img src={persona.foto} alt="foto" className="w-full h-full object-cover" />
            ) : (
              <UserRound className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-lg leading-tight">{persona.nombres} {persona.apellidos}</p>
            <p className="text-sm text-gray-600 mt-1">
              {persona.tipoDocumento || 'CC'} {persona.documento}
            </p>
            <p className="text-sm text-gray-600 capitalize">
              {tipoPerfil}
              {tipoPerfil === 'estudiante' && grupo ? ` · Grado ${grupo.grado} · Grupo ${grupo.nombre}` : ''}
            </p>
            {tipoPerfil === 'docente' && <p className="text-sm text-gray-600 capitalize">Docente</p>}
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-dashed border-gray-300 flex items-center justify-between text-xs text-gray-500">
          <span>Año lectivo {anio?.anio || '—'}</span>
          {institucion?.nit && <span>NIT {institucion.nit}</span>}
        </div>
      </div>
    </div>
  )
}

export default function Carnets() {
  const { usuario } = useAuth()
  const [anios, setAnios] = useState([])
  const [matriculas, setMatriculas] = useState([])
  const [personas, setPersonas] = useState([])
  const [institucion, setInstitucion] = useState(null)
  const [filtros, setFiltros] = useState({})
  const [gradoSel, setGradoSel] = useState('')
  const [personaSel, setPersonaSel] = useState(null)
  const [grupoSel, setGrupoSel] = useState(null)
  const [matPorusuario, setMatPorusuario] = useState(null)
  const [imprimirTodos, setImprimirTodos] = useState(false)
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

  const cambiarGrado = (valor) => {
    setGradoSel(valor)
    setImprimirTodos(false)
    setPersonaSel(null)
  }

  const gradosDeGrupos = [...new Set(
    matriculas
      .filter(m => (m.anioAcademicoId?._id === filtros.anioAcademicoId) || (m.anioAcademicoId === filtros.anioAcademicoId))
      .map(m => m.grupoId?.grado)
      .filter(g => g !== undefined && g !== null)
  )]
  const gradosConfigurados = (institucion?.configuracion?.grados || []).map(g => g.numero)
  const grados = [...new Set([...gradosConfigurados, ...gradosDeGrupos])].sort((a, b) => a - b)
  const nombreGrado = (num) => (institucion?.configuracion?.grados || []).find(g => g.numero === num)?.nombre

  const gruposDelAnio = [...new Map(
    matriculas
      .filter(m => (m.anioAcademicoId?._id === filtros.anioAcademicoId) || (m.anioAcademicoId === filtros.anioAcademicoId))
      .map(m => m.grupoId)
      .filter(Boolean)
      .map(g => [g._id, g])
  ).values()].sort((a, b) => (a.grado || 0) - (b.grado || 0) || String(a.nombre).localeCompare(String(b.nombre)))

  const cargarPersonas = async () => {
    if (!filtros.anioAcademicoId) {
      setError('Selecciona el año académico')
      return
    }
    setLoading(true)
    setError('')
    setPersonaSel(null)
    setGrupoSel(null)
    setImprimirTodos(false)
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
        const conMatricula = usuarios.filter(u => {
          const entry = enMatricula.get(u._id)
          if (!entry) return false
          if (gradoSel !== '' && gradoSel !== undefined) {
            return String(entry.grupo?.grado) === String(gradoSel)
          }
          if (filtros.grupoId && entry.grupo?._id !== filtros.grupoId) return false
          return true
        })
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
    setImprimirTodos(false)
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
          <IconButton onClick={cargarDependencias} aria-label="Recargar" title="Recargar" size="small" className="!text-gray-500 hover:!text-gray-700 self-start">
            <RefreshCw className="w-4 h-4" />
          </IconButton>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Año Académico</label>
            <Select value={filtros.anioAcademicoId} onChange={(e) => { setFiltros({ ...filtros, anioAcademicoId: e.target.value }); setImprimirTodos(false); setPersonaSel(null) }}
              size="small" fullWidth displayEmpty className="text-sm">
              <MenuItem value="">Seleccionar...</MenuItem>
              {anios.map(a => <MenuItem key={a._id} value={a._id}>Año {a.anio}</MenuItem>)}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de persona</label>
            <Select
              value={filtros.tipoPerfil || ''}
              onChange={(e) => { setFiltros({ ...filtros, tipoPerfil: e.target.value, grupoId: '' }); setGradoSel(''); setPersonas([]); setPersonaSel(null); setImprimirTodos(false) }}
              size="small" fullWidth displayEmpty className="text-sm">
              <MenuItem value="">Seleccionar...</MenuItem>
              <MenuItem value="estudiante">Estudiante</MenuItem>
              <MenuItem value="docente">Docente</MenuItem>
              <MenuItem value="admin">Administrativo</MenuItem>
              <MenuItem value="secretaria">Secretaría</MenuItem>
            </Select>
          </div>
          {filtros.tipoPerfil === 'estudiante' && grados.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Grado</label>
              <Select value={gradoSel} onChange={(e) => cambiarGrado(e.target.value)}
                size="small" fullWidth displayEmpty className="text-sm">
                <MenuItem value="">Todos los grados</MenuItem>
                {grados.map(g => (
                  <MenuItem key={g} value={g}>{nombreGrado(g) ? `${nombreGrado(g)} · Grado ${g}` : `Grado ${g}`}</MenuItem>
                ))}
              </Select>
            </div>
          )}
          {filtros.tipoPerfil === 'estudiante' && gruposDelAnio.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Grupo</label>
              <Select value={filtros.grupoId || ''} onChange={(e) => { setFiltros({ ...filtros, grupoId: e.target.value }); setImprimirTodos(false); setPersonaSel(null) }}
                size="small" fullWidth displayEmpty className="text-sm">
                <MenuItem value="">Todos los grupos</MenuItem>
                {gruposDelAnio.map(g => (
                  <MenuItem key={g._id} value={g._id}>{g.nombre}{g.jornada ? ` · ${g.jornada}` : ''}</MenuItem>
                ))}
              </Select>
            </div>
          )}
          <div className="flex items-end">
            <Button onClick={cargarPersonas} disabled={loading} variant="contained" color="primary" size="small" className="!normal-case !text-sm !font-medium w-full">
              {loading ? 'Cargando...' : 'Cargar personas'}
            </Button>
          </div>
        </div>

        {filtros.tipoPerfil && personas.length > 0 && !loading && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Selecciona la persona</label>
              <Select value={personaSel?._id || ''} onChange={(e) => seleccionar(personas.find(p => p._id === e.target.value))}
                size="small" fullWidth displayEmpty className="text-sm">
                <MenuItem value="">Seleccionar...</MenuItem>
                {personas.map(p => (
                  <MenuItem key={p._id} value={p._id}>{p.nombres} {p.apellidos} - {p.documento}</MenuItem>
                ))}
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={() => setImprimirTodos(true)} variant="contained" color="primary" size="small" className="!normal-case !text-sm !font-medium !py-2 !px-4" startIcon={<Layers className="w-4 h-4" />}>
                Imprimir todos ({personas.length})
              </Button>
            </div>
          </div>
        )}

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mt-4">{error}</div>}
        {!filtros.tipoPerfil && <p className="text-sm text-gray-500 mt-4">Selecciona año, tipo de persona y pulsa "Cargar personas".</p>}
      </div>

      {imprimirTodos && personas.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <School className="w-6 h-6" /> Carnets de {personas.length} {filtros.tipoPerfil}{gradoSel !== '' ? ` · Grado ${gradoSel}` : ''}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outlined" onClick={() => setImprimirTodos(false)} size="small" className="!text-white !border-white/60 !bg-white/10 hover:!bg-white/20 !py-1.5 !px-3 !text-sm !normal-case" startIcon={<X className="w-4 h-4" />}>
                Ver individual
              </Button>
              <Button variant="contained" onClick={() => window.print()} size="small" className="!bg-white/25 hover:!bg-white/40 !text-white !py-1.5 !px-3 !text-sm !normal-case" startIcon={<Printer className="w-4 h-4" />}>
                Imprimir todos
              </Button>
            </div>
          </div>
          <div className="print-area print-area-multiple p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {personas.map(p => {
              const entry = matPorusuario ? matPorusuario.get(p._id) : null
              return (
                <CarnetCard
                  key={p._id}
                  institucion={institucion}
                  dane={dane}
                  persona={p}
                  grupo={entry ? entry.grupo : null}
                  tipoPerfil={filtros.tipoPerfil}
                  anio={anio}
                />
              )
            })}
          </div>
        </div>
      )}

      {personaSel && !imprimirTodos && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <School className="w-6 h-6" /> Carnet de {filtros.tipoPerfil}
            </h2>
            <Button variant="outlined" onClick={() => window.print()} size="small" className="!text-white !border-white/60 !bg-white/10 hover:!bg-white/20 !py-1.5 !px-3 !text-sm !normal-case" startIcon={<Printer className="w-4 h-4" />}>
              Imprimir
            </Button>
          </div>
          <div className="print-area print-area-single p-6 flex justify-center">
            <CarnetCard
              institucion={institucion}
              dane={dane}
              persona={personaSel}
              grupo={grupoSel}
              tipoPerfil={filtros.tipoPerfil}
              anio={anio}
            />
          </div>
        </div>
      )}

      {!personaSel && !imprimirTodos && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          Selecciona una persona o imprime el listado completo por grado.
        </div>
      )}
    </div>
  )
}