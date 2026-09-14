import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GraduationCap, LogOut, Shield, ClipboardList, School, Users, BookOpen, Home, BadgeCheck } from 'lucide-react'

const ROL_LABEL = {
  super_admin: 'Dirección de Núcleo',
  admin: 'Administrador',
  rector: 'Rector',
  coordinador: 'Coordinador',
  docente: 'Docente',
  estudiante: 'Estudiante',
  acudiente: 'Acudiente',
  secretaria: 'Secretaría'
}

const ROL_ICON = {
  super_admin: Shield,
  admin: Shield,
  rector: School,
  coordinador: ClipboardList,
  docente: BookOpen,
  estudiante: GraduationCap,
  acudiente: Users,
  secretaria: BadgeCheck
}

const ROL_DESC = {
  super_admin: 'Gestión de los colegios del núcleo',
  admin: 'Gestión de la institución',
  rector: 'Dirección y reportes institucionales',
  coordinador: 'Coordinación académica',
  docente: 'Calificación y seguimiento de estudiantes',
  estudiante: 'Notas, horarios y actividades',
  acudiente: 'Seguimiento académico de tus hijos',
  secretaria: 'Gestión administrativa y académica'
}

export default function ElegirPerfil() {
  const { usuario, cambiarPerfil, logout } = useAuth()
  const navigate = useNavigate()

  const roles = usuario?.roles && usuario.roles.length ? usuario.roles : (usuario ? [usuario.tipoPerfil] : [])

  const seleccionar = async (rol) => {
    if (rol === usuario.tipoPerfil) {
      navigate('/')
      return
    }
    try {
      await cambiarPerfil(rol)
      navigate('/')
    } catch (_) {
      // error ya está en el contexto
    }
  }

  if (!usuario) return null

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-4">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Selecciona tu perfil</h1>
            <p className="text-sm text-gray-500 mt-1">
              Hola {usuario.nombreCompleto || usuario.nombres}, tienes múltiples roles asignados. ¿Con cuál trabajas?
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roles.map(rol => {
              const Icon = ROL_ICON[rol] || BadgeCheck
              const activo = rol === usuario.tipoPerfil
              return (
                <button
                  key={rol}
                  onClick={() => seleccionar(rol)}
                  className={`p-4 rounded-xl border text-left transition-colors ${
                    activo
                      ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                      : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`p-2 rounded-lg shrink-0 ${activo ? 'bg-primary-600 text-white' : 'bg-primary-100 text-primary-700'}`}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <span>
                      <span className="block font-semibold text-gray-900">{ROL_LABEL[rol] || rol}</span>
                      <span className="block text-xs text-gray-500 mt-0.5">{ROL_DESC[rol] || ''}</span>
                      {activo && (
                        <span className="inline-block mt-1.5 text-xs font-medium text-primary-700">
                          Perfil actual
                        </span>
                      )}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex justify-center mt-6">
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}