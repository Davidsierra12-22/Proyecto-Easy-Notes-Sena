import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../store/Auth'
import { useSede } from '../store/General'
import api from '../services/api.service'
import {
  Users, UserPlus, GraduationCap, BookOpen, CreditCard, School,
  CalendarDays, Calculator, ClipboardList, FilePlus2, Trophy,
  ScrollText, RefreshCcw, Target, ClipboardCheck, Building, IdCard, MapPin, Stethoscope
} from 'lucide-react'
import { CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'

export default function Dashboard() {
  const { usuario } = useAuth()
  const { sedes, sedeId, setSedeId, loading: loadingSedes } = useSede()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [estudianteInfo, setEstudianteInfo] = useState(null)
  const [colegios, setColegios] = useState([])

  useEffect(() => {
    if (usuario?.tipoPerfil !== 'estudiante') return
    let activo = true
    api.get('/matriculas').then(r => {
      const mias = (r.data.data || []).filter(m =>
        m.estudianteId && String(m.estudianteId._id) === String(usuario._id) && m.estado === 'activa'
      )
      const m = mias[0]
      if (activo) setEstudianteInfo(m ? { grupo: m.grupoId?.nombre, grado: m.grupoId?.grado } : null)
    }).catch(() => {})
    return () => { activo = false }
  }, [usuario?._id, usuario?.tipoPerfil])

  useEffect(() => {
    const cargarStats = async () => {
      try {
        if (usuario?.tipoPerfil === 'super_admin') {
          const [estadisticas, listado] = await Promise.all([
            api.get('/nucleo/estadisticas').catch(() => null),
            api.get('/nucleo/instituciones').catch(() => null)
          ])
          const e = estadisticas?.data?.data || {}
          setStats({
            colegios: e.colegios ?? null,
            estudiantes: e.estudiantes ?? null,
            docentes: e.docentes ?? null,
            matriculas: e.matriculasActivas ?? null,
            sedes: e.sedes ?? null,
            grupos: e.grupos ?? null
          })
          setColegios(listado?.data?.data || [])
        } else {
          const params = sedeId ? { sedeId } : {}
          const [matriculas, usuarios, grupos, asignaturas] = await Promise.all([
            api.get('/matriculas', { params }).catch(() => null),
            api.get('/usuarios', { params }).catch(() => null),
            api.get('/grupos', { params }).catch(() => null),
            api.get('/asignaturas', { params }).catch(() => null)
          ])
          setStats({
            matriculas: matriculas ? matriculas.data.data.length : null,
            usuarios: usuarios ? usuarios.data.data.length : null,
            grupos: grupos ? grupos.data.data.length : null,
            asignaturas: asignaturas ? asignaturas.data.data.length : null
          })
        }
      } catch {
        setStats(null)
      } finally {
        setLoading(false)
      }
    }
    cargarStats()
  }, [sedeId, usuario?.tipoPerfil])

  const rol = usuario?.tipoPerfil
  const requiereSede = ['admin', 'rector', 'coordinador', 'secretaria'].includes(rol)

  const rolEstudiante = rol === 'estudiante'

  if (requiereSede && !sedeId) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            {usuario?.institucion?.logo && (
              <img src={usuario.institucion.logo} alt="Logo" className="h-14 object-contain" />
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {usuario?.institucion?.nombre || 'Sistema de Gestión Académica EasyNotes'}
              </h1>
              <p className="text-gray-600 mt-1">Panel de administración de tu institución.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Selecciona una sede</h2>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            Elige la sede con la que vas a trabajar para acceder a todas las funciones.
          </p>

          {loadingSedes ? (
            <div className="flex justify-center py-8">
              <CircularProgress size={32} className="!text-primary-600" />
            </div>
          ) : sedes.length === 0 ? (
            <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-4 py-4">
              No hay sedes creadas todavía.{' '}
              <Link to="/sedes" className="text-primary-600 font-medium">Crear una sede</Link>
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sedes.map(s => (
                <button
                  key={s._id}
                  onClick={() => setSedeId(s._id)}
                  className="bg-white rounded-xl border border-gray-200 hover:border-primary-400 hover:shadow-md transition-all p-5 flex flex-col items-start text-left"
                >
                  <div className="w-11 h-11 rounded-lg bg-primary-50 flex items-center justify-center mb-3">
                    <Building className="w-5 h-5 text-primary-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 break-words">{s.nombre}</span>
                  {s.direccion && (
                    <span className="mt-1 text-xs text-gray-500 inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {s.direccion}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const cards = rol === 'super_admin'
    ? [
        { label: 'Colegios', value: stats?.colegios, icon: School, color: 'bg-primary-500' },
        { label: 'Estudiantes', value: stats?.estudiantes, icon: Users, color: 'bg-cyan-600' },
        { label: 'Docentes', value: stats?.docentes, icon: BookOpen, color: 'bg-amber-500' },
        { label: 'Matrículas Activas', value: stats?.matriculas, icon: UserPlus, color: 'bg-emerald-500' }
      ]
    : [
        { label: 'Matrículas Activas', value: stats?.matriculas, icon: UserPlus, color: 'bg-emerald-500' },
        { label: 'Usuarios', value: stats?.usuarios, icon: Users, color: 'bg-primary-500' },
        { label: 'Grupos', value: stats?.grupos, icon: GraduationCap, color: 'bg-cyan-600' },
        { label: 'Asignaturas', value: stats?.asignaturas, icon: BookOpen, color: 'bg-amber-500' }
      ]

  const estudianteCards = [
    { label: 'Grupo', detalle: estudianteInfo ? `${estudianteInfo.grupo} · Grado ${estudianteInfo.grado}` : 'Sin matrícula', icon: GraduationCap, color: 'bg-cyan-600', to: '/horario' },
    { label: 'Mis Notas', detalle: 'Ver calificaciones', icon: Calculator, color: 'bg-primary-500', to: '/mis-notas' },
    { label: 'Boletines', detalle: 'Consultar boletín', icon: ScrollText, color: 'bg-emerald-500', to: '/boletines' },
    { label: 'Mis Excusas', detalle: 'Registrar inasistencia', icon: Stethoscope, color: 'bg-amber-500', to: '/mis-excusas' }
  ]

  const accesosRapidos = [
    { label: 'Colegios del Núcleo', icon: School, to: '/instituciones', visible: ['super_admin'] },
    { label: 'Núcleos', icon: Building, to: '/nucleos', visible: ['super_admin'] },
    { label: 'Estadísticas', icon: Calculator, to: '/estadisticas', visible: ['super_admin'] },
    { label: 'Usuarios', icon: Users, to: '/usuarios', visible: ['admin', 'rector'] },
    { label: 'Sedes', icon: Building, to: '/sedes', visible: ['admin', 'rector', 'coordinador'] },
    { label: 'Años Académicos', icon: CalendarDays, to: '/anios-academicos', visible: ['admin', 'rector', 'coordinador'] },
    { label: 'Áreas', icon: BookOpen, to: '/areas', visible: ['admin', 'rector', 'coordinador'] },
    { label: 'Asignaturas', icon: BookOpen, to: '/asignaturas', visible: ['admin', 'rector', 'coordinador'] },
    { label: 'Grupos', icon: GraduationCap, to: '/grupos', visible: ['admin', 'rector', 'coordinador'] },
    { label: 'Matrículas', icon: ClipboardList, to: '/matriculas', visible: ['admin', 'rector', 'coordinador', 'secretaria'] },
    { label: 'Prematrículas', icon: FilePlus2, to: '/prematriculas', visible: ['admin', 'rector', 'secretaria'] },
    { label: 'Calificaciones', icon: Calculator, to: '/calificaciones', visible: ['admin', 'rector', 'coordinador', 'docente'] },
    { label: 'Recuperaciones', icon: RefreshCcw, to: '/recuperaciones', visible: ['admin', 'rector', 'coordinador'] },
    { label: 'Indicadores', icon: Target, to: '/indicadores', visible: ['admin', 'rector', 'coordinador', 'docente'] },
    { label: 'Actividades', icon: ClipboardCheck, to: '/actividades', visible: ['admin', 'rector', 'coordinador', 'docente'] },
    { label: 'Promoción', icon: Trophy, to: '/promocion', visible: ['admin', 'rector', 'coordinador'] },
    { label: 'Certificados', icon: ScrollText, to: '/certificados', visible: ['admin', 'rector', 'coordinador', 'secretaria'] },
    { label: 'Carnets', icon: IdCard, to: '/carnets', visible: ['admin', 'rector', 'coordinador', 'secretaria'] },
    { label: 'Pagos', icon: CreditCard, to: '/pagos', visible: ['admin', 'rector', 'secretaria', 'acudiente'] }
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center gap-4">
          {usuario?.institucion?.logo && (
            <img src={usuario.institucion.logo} alt="Logo" className="h-14 object-contain" />
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {usuario?.institucion?.nombre || 'Sistema de Gestión Académica EasyNotes'}
            </h1>
            <p className="text-gray-600 mt-1">
              {usuario?.institucion
                ? 'Panel de administración de tu institución.'
                : usuario?.tipoPerfil === 'super_admin'
                ? 'Dirección de Núcleo — supervisión de los colegios del núcleo.'
                : 'Sistema de gestión académica.'}
            </p>
          </div>
        </div>
      </div>

      {rol && ['admin', 'rector', 'coordinador', 'secretaria', 'super_admin'].includes(rol) ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
              <div key={card.label} className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? <span className="animate-pulse">•••</span> : (card.value ?? '—')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Accesos Rápidos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {accesosRapidos.filter(a => a.visible.includes(rol)).map((acc) => (
                <Link
                  key={acc.to}
                  to={acc.to}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-primary-50 hover:border-primary-200 border border-transparent transition-colors"
                >
                  <acc.icon className="w-6 h-6 text-primary-600" />
                  <span className="text-sm text-gray-700 text-center">{acc.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {rol === 'super_admin' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Colegios del Núcleo</h2>
                <Link to="/instituciones" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                  Gestionar colegios
                </Link>
              </div>
              {loading ? (
                <div className="flex justify-center py-8">
                  <CircularProgress size={32} className="!text-primary-600" />
                </div>
              ) : colegios.length === 0 ? (
                <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-4 py-4">
                  Aún no hay colegios registrados.{' '}
                  <Link to="/instituciones" className="text-primary-600 font-medium">Crear el primer colegio</Link>
                </p>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow className="bg-gray-50">
                        {['Colegio', 'Estudiantes', 'Docentes', 'Matrículas Activas', 'Grupos', 'Sedes'].map(h => (
                          <TableCell key={h} className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody className="divide-y divide-gray-100">
                      {colegios.map(c => (
                        <TableRow key={c._id} hover>
                          <TableCell className="!text-sm !py-3">
                            <p className="font-medium text-gray-900">{c.nombre}</p>
                            <p className="text-xs text-gray-500">NIT {c.nit} · {c.nucleoId?.nombre || 'Sin núcleo'}</p>
                          </TableCell>
                          <TableCell className="!text-sm !text-gray-600 !py-3 whitespace-nowrap">{c.estudiantes}</TableCell>
                          <TableCell className="!text-sm !text-gray-600 !py-3 whitespace-nowrap">{c.docentes}</TableCell>
                          <TableCell className="!text-sm !text-gray-600 !py-3 whitespace-nowrap">{c.matriculasActivas}</TableCell>
                          <TableCell className="!text-sm !text-gray-600 !py-3 whitespace-nowrap">{c.grupos}</TableCell>
                          <TableCell className="!text-sm !text-gray-600 !py-3 whitespace-nowrap">{c.sedes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </div>
          )}
        </>
      ) : rolEstudiante ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {estudianteCards.map((card) => (
              <Link key={card.label} to={card.to} className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all">
                <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center mb-3`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {card.nombre || card.detalle}
                </p>
              </Link>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tu espacio</h2>
            <p className="text-gray-600">
              Consulta tus notas, boletines, horario y excusas desde cualquiera de los accesos.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tu espacio</h2>
          <p className="text-gray-600">
            {rol === 'docente' && 'Consulta tus clases, calificaciones y actividades académicas.'}
            {rol === 'acudiente' && 'Sigue el rendimiento académico de tus hijos y gestiona pagos.'}
          </p>
        </div>
      )}
    </div>
  )
}
