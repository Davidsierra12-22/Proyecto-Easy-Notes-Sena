import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSede } from '../context/SedeContext'
import {
  LayoutDashboard, Users, GraduationCap, School, BookOpen, ClipboardList,
  CalendarDays, Calculator, FileText, MessageSquare, PawPrint, Stethoscope,
  CreditCard, Vote, Settings, LogOut, Bell, ChevronLeft, ChevronRight, Menu, X,
  Coins, RefreshCcw, Target, ClipboardCheck, Building, IdCard, FilePlus2, Trophy, ScrollText, User, Repeat, ChevronDown, Wallet, Clock
} from 'lucide-react'

const menuConfig = {
  super_admin: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/instituciones', icon: School, label: 'Colegios del Núcleo' },
    { to: '/nucleos', icon: Building, label: 'Núcleos' },
    { to: '/estadisticas', icon: Calculator, label: 'Estadísticas' }
  ],
  admin: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/usuarios', icon: Users, label: 'Usuarios' },
    { to: '/carnets', icon: IdCard, label: 'Carnets' },
    { to: '/anios-academicos', icon: CalendarDays, label: 'Años Académicos' },
    { to: '/areas', icon: BookOpen, label: 'Áreas' },
    { to: '/asignaturas', icon: BookOpen, label: 'Asignaturas' },
    { to: '/grupos', icon: GraduationCap, label: 'Grupos' },
    { to: '/carga-academica', icon: ClipboardCheck, label: 'Carga Académica' },
    { to: '/sedes', icon: Building, label: 'Sedes' },
    { to: '/matriculas', icon: ClipboardList, label: 'Matrículas' },
    { to: '/prematriculas', icon: FilePlus2, label: 'Prematrículas' },
    { to: '/calificaciones', icon: Calculator, label: 'Calificaciones' },
    { to: '/recuperaciones', icon: RefreshCcw, label: 'Recuperaciones' },
    { to: '/indicadores', icon: Target, label: 'Indicadores' },
    { to: '/actividades', icon: ClipboardCheck, label: 'Actividades' },
    { to: '/boletines', icon: FileText, label: 'Boletines' },
    { to: '/promocion', icon: Trophy, label: 'Promoción' },
    { to: '/certificados', icon: ScrollText, label: 'Certificados' },
    { to: '/conceptos-contables', icon: Coins, label: 'Conceptos' },
    { to: '/pagos', icon: CreditCard, label: 'Pagos' },
    { to: '/cartera', icon: Wallet, label: 'Cartera' },
    { to: '/comunicados', icon: MessageSquare, label: 'Comunicados' },
    { to: '/bitacora', icon: FileText, label: 'Bitácora' },
    { to: '/configuracion', icon: Settings, label: 'Configuración' }
  ],
  rector: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/usuarios', icon: Users, label: 'Usuarios' },
    { to: '/carnets', icon: IdCard, label: 'Carnets' },
    { to: '/anios-academicos', icon: CalendarDays, label: 'Años Académicos' },
    { to: '/areas', icon: BookOpen, label: 'Áreas' },
    { to: '/asignaturas', icon: BookOpen, label: 'Asignaturas' },
    { to: '/grupos', icon: GraduationCap, label: 'Grupos' },
    { to: '/sedes', icon: Building, label: 'Sedes' },
    { to: '/matriculas', icon: ClipboardList, label: 'Matrículas' },
    { to: '/prematriculas', icon: FilePlus2, label: 'Prematrículas' },
    { to: '/calificaciones', icon: Calculator, label: 'Calificaciones' },
    { to: '/recuperaciones', icon: RefreshCcw, label: 'Recuperaciones' },
    { to: '/indicadores', icon: Target, label: 'Indicadores' },
    { to: '/actividades', icon: ClipboardCheck, label: 'Actividades' },
    { to: '/boletines', icon: FileText, label: 'Boletines' },
    { to: '/promocion', icon: Trophy, label: 'Promoción' },
    { to: '/certificados', icon: ScrollText, label: 'Certificados' },
    { to: '/cartera', icon: Wallet, label: 'Cartera' },
    { to: '/bitacora', icon: FileText, label: 'Bitácora' }
  ],
  coordinador: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/anios-academicos', icon: CalendarDays, label: 'Años Académicos' },
    { to: '/areas', icon: BookOpen, label: 'Áreas' },
    { to: '/asignaturas', icon: BookOpen, label: 'Asignaturas' },
    { to: '/grupos', icon: GraduationCap, label: 'Grupos' },
    { to: '/sedes', icon: Building, label: 'Sedes' },
    { to: '/carnets', icon: IdCard, label: 'Carnets' },
    { to: '/matriculas', icon: ClipboardList, label: 'Matrículas' },
    { to: '/calificaciones', icon: Calculator, label: 'Calificaciones' },
    { to: '/recuperaciones', icon: RefreshCcw, label: 'Recuperaciones' },
    { to: '/indicadores', icon: Target, label: 'Indicadores' },
    { to: '/actividades', icon: ClipboardCheck, label: 'Actividades' },
    { to: '/boletines', icon: FileText, label: 'Boletines' },
    { to: '/promocion', icon: Trophy, label: 'Promoción' },
    { to: '/certificados', icon: ScrollText, label: 'Certificados' }
  ],
  docente: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/mis-clases', icon: BookOpen, label: 'Mis Clases' },
    { to: '/calificaciones', icon: Calculator, label: 'Calificaciones' },
    { to: '/actividades', icon: ClipboardCheck, label: 'Actividades' },
    { to: '/observador', icon: PawPrint, label: 'Observador' }
  ],
  estudiante: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/mis-notas', icon: Calculator, label: 'Mis Notas' },
    { to: '/boletines', icon: FileText, label: 'Boletines' },
    { to: '/horario', icon: CalendarDays, label: 'Horario' },
    { to: '/mis-excusas', icon: Stethoscope, label: 'Mis Excusas' }
  ],
  acudiente: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/mis-hijos', icon: GraduationCap, label: 'Mis Hijos' },
    { to: '/pagos', icon: CreditCard, label: 'Pagos' },
    { to: '/comunicados', icon: MessageSquare, label: 'Comunicados' }
  ],
  secretaria: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/usuarios', icon: Users, label: 'Usuarios' },
    { to: '/sedes', icon: Building, label: 'Sedes' },
    { to: '/anios-academicos', icon: CalendarDays, label: 'Años Académicos' },
    { to: '/areas', icon: BookOpen, label: 'Áreas' },
    { to: '/asignaturas', icon: BookOpen, label: 'Asignaturas' },
    { to: '/grupos', icon: GraduationCap, label: 'Grupos' },
    { to: '/carga-academica', icon: ClipboardCheck, label: 'Carga Académica' },
    { to: '/matriculas', icon: ClipboardList, label: 'Matrículas' },
    { to: '/prematriculas', icon: FilePlus2, label: 'Prematrículas' },
    { to: '/pagos', icon: CreditCard, label: 'Pagos' },
    { to: '/cartera', icon: Wallet, label: 'Cartera' },
    { to: '/conceptos-contables', icon: Coins, label: 'Conceptos' },
    { to: '/carnets', icon: IdCard, label: 'Carnets' },
    { to: '/certificados', icon: ScrollText, label: 'Certificados' }
  ]
}

const rolLabels = {
  super_admin: 'Dirección de Núcleo',
  admin: 'Administrador',
  rector: 'Rector',
  coordinador: 'Coordinador',
  docente: 'Docente',
  estudiante: 'Estudiante',
  acudiente: 'Acudiente',
  secretaria: 'Secretaría'
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const [roleMenu, setRoleMenu] = useState(false)
  const { usuario, logout, cambiarPerfil } = useAuth()
  const { sedes, sedeId, setSedeId, cambiandoSede } = useSede()
  const navigate = useNavigate()

  const cambiarSede = (id) => {
    setSedeId(id)
    navigate('/')
  }

  const roles = usuario?.roles && usuario.roles.length ? usuario.roles : (usuario ? [usuario.tipoPerfil] : [])
  const multiplosRoles = roles.length > 1

  const requiereSede = ['admin', 'rector', 'coordinador', 'secretaria'].includes(usuario?.tipoPerfil)
  const sinSede = requiereSede && !sedeId

  useEffect(() => {
    if (sinSede) {
      navigate('/')
    }
  }, [sinSede])

  const cambiarRol = async (rol) => {
    if (rol === usuario?.tipoPerfil) return
    try {
      await cambiarPerfil(rol)
      navigate('/')
    } catch (_) { /* error en contexto */ }
  }

  const menu = sinSede
    ? (menuConfig[usuario?.tipoPerfil] || menuConfig.admin).filter(item => ['Sedes', 'Configuración'].includes(item.label))
    : (menuConfig[usuario?.tipoPerfil] || menuConfig.admin)
  const rolLabel = rolLabels[usuario?.tipoPerfil] || usuario?.tipoPerfil

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar desktop */}
      <aside
        className={`hidden lg:flex flex-col bg-slate-900 text-white transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="h-16 border-b border-slate-700 shrink-0 flex items-center justify-center px-2">
          {!collapsed && (
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-primary-600">
                {usuario?.institucion?.logo ? (
                  <img src={usuario.institucion.logo} alt="Logo" className="w-full h-full object-contain bg-white" />
                ) : (
                  <GraduationCap className="w-5 h-5 text-white" />
                )}
              </div>
              <span className="font-bold text-sm leading-tight truncate">
                {usuario?.institucion?.nombre || 'EasyNotes'}
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            className="shrink-0 p-1.5 rounded-lg text-gray-300 hover:bg-slate-800 hover:text-white"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 text-white flex flex-col">
            <div className="flex items-center justify-between px-4 h-16 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden bg-primary-600">
                  {usuario?.institucion?.logo ? (
                    <img src={usuario.institucion.logo} alt="Logo" className="w-full h-full object-contain bg-white" />
                  ) : (
                    <GraduationCap className="w-5 h-5 text-white" />
                  )}
                </div>
                <span className="font-bold text-sm leading-tight">{usuario?.institucion?.nombre || 'EasyNotes'}</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
              {menu.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-slate-800'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-gray-600 hover:text-gray-900">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="font-semibold text-gray-800">Panel de Control</h2>
          </div>

          <div className="flex items-center gap-3">
            {sedes.length > 0 && (
              <div className="relative hidden sm:block">
                <select
                  value={sedeId}
                  onChange={(e) => cambiarSede(e.target.value)}
                  className="flex items-center gap-2 pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer appearance-none"
                  title="Sede de trabajo"
                >
                  <option value="">Todas las sedes</option>
                  {sedes.map(s => (
                    <option key={s._id} value={s._id}>{s.nombre}</option>
                  ))}
                </select>
                <Building className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            )}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {multiplosRoles && (
              <div className="relative">
                <button
                  onClick={() => setRoleMenu(!roleMenu)}
                  className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg border border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 text-sm font-medium"
                  title="Cambiar de perfil"
                >
                  <Repeat className="w-4 h-4" />
                  <span className="hidden md:inline">{rolLabel}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${roleMenu ? 'rotate-180' : ''}`} />
                </button>

                {roleMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setRoleMenu(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-medium text-gray-500">Cambiar de perfil</p>
                      </div>
                      {roles.map(rol => {
                        const activo = rol === usuario?.tipoPerfil
                        return (
                          <button
                            key={rol}
                            onClick={() => { setRoleMenu(false); cambiarRol(rol) }}
                            className={`w-full flex items-center justify-between px-4 py-2 text-sm ${
                              activo ? 'text-primary-700 font-medium bg-primary-50' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {rolLabels[rol] || rol}
                            {activo && <span className="text-xs text-primary-600 font-medium">Activo</span>}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="relative">
              <button
                onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-semibold overflow-hidden">
                  {usuario?.foto ? (
                    <img src={usuario.foto} alt="Foto de perfil" className="w-full h-full object-cover" />
                  ) : (
                    (usuario?.nombreCompleto || usuario?.nombres || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-800 leading-tight">
                    {usuario?.nombreCompleto || usuario?.nombres}
                  </p>
                  <p className="text-xs text-gray-500">{rolLabel}</p>
                </div>
              </button>

              {userMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {usuario?.nombreCompleto || usuario?.nombres}
                      </p>
                      <p className="text-xs text-gray-500">{usuario?.email || ''}</p>
                    </div>
                    <button
                      onClick={() => { setUserMenu(false); navigate('/perfil') }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="w-4 h-4" /> Mi perfil
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" /> Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {cambiandoSede && (
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-700">Cambiando de sede...</p>
        </div>
      )}
    </div>
  )
}
