import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import {
  Users, UserPlus, GraduationCap, BookOpen, CreditCard,
  CalendarDays, Calculator, ClipboardList, FilePlus2, Trophy,
  ScrollText, RefreshCcw, Target, ClipboardCheck, Building, IdCard
} from 'lucide-react'

export default function Dashboard() {
  const { usuario } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarStats = async () => {
      try {
        const [matriculas, usuarios, grupos, asignaturas] = await Promise.all([
          api.get('/matriculas').catch(() => ({ data: { data: [] } })),
          api.get('/usuarios').catch(() => ({ data: { data: [] } })),
          api.get('/grupos').catch(() => ({ data: { data: [] } })),
          api.get('/asignaturas').catch(() => ({ data: { data: [] } }))
        ])
        setStats({
          matriculas: matriculas.data.data.length,
          usuarios: usuarios.data.data.length,
          grupos: grupos.data.data.length,
          asignaturas: asignaturas.data.data.length
        })
      } catch {
        setStats(null)
      } finally {
        setLoading(false)
      }
    }
    cargarStats()
  }, [])

  const rol = usuario?.tipoPerfil

  const cards = [
    { label: 'Matrículas Activas', value: stats?.matriculas, icon: UserPlus, color: 'bg-emerald-500' },
    { label: 'Usuarios', value: stats?.usuarios, icon: Users, color: 'bg-primary-500' },
    { label: 'Grupos', value: stats?.grupos, icon: GraduationCap, color: 'bg-cyan-600' },
    { label: 'Asignaturas', value: stats?.asignaturas, icon: BookOpen, color: 'bg-amber-500' }
  ]

  const accesosRapidos = [
    { label: 'Usuarios', icon: Users, to: '/usuarios', visible: ['super_admin', 'admin', 'rector'] },
    { label: 'Áreas', icon: BookOpen, to: '/areas', visible: ['super_admin', 'admin', 'rector', 'coordinador'] },
    { label: 'Asignaturas', icon: BookOpen, to: '/asignaturas', visible: ['super_admin', 'admin', 'rector', 'coordinador'] },
    { label: 'Grupos', icon: GraduationCap, to: '/grupos', visible: ['super_admin', 'admin', 'rector', 'coordinador'] },
    { label: 'Sedes', icon: Building, to: '/sedes', visible: ['super_admin', 'admin', 'rector', 'coordinador'] },
    { label: 'Años Académicos', icon: CalendarDays, to: '/anios-academicos', visible: ['super_admin', 'admin', 'rector', 'coordinador'] },
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
        <h1 className="text-xl font-bold text-gray-900">
          ¡Bienvenido, {usuario?.nombreCompleto || usuario?.nombres}!
        </h1>
        <p className="text-gray-600 mt-1">
          Sistema de Gestión Académica EasyNotes. Aquí puedes administrar toda la
          información académica de tu institución.
        </p>
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
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tu espacio</h2>
          <p className="text-gray-600">
            {rol === 'docente' && 'Consulta tus clases, calificaciones y actividades académicas.'}
            {rol === 'estudiante' && 'Consulta tus notas, boletines, horario y excusas.'}
            {rol === 'acudiente' && 'Sigue el rendimiento académico de tus hijos y gestiona pagos.'}
          </p>
        </div>
      )}
    </div>
  )
}
