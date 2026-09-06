import { useState } from 'react'
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, GraduationCap, School, BookOpen, ClipboardList,
  CalendarDays, Calculator, FileText, MessageSquare, PawPrint, Stethoscope,
  CreditCard, Vote, Settings, LogOut, Bell, ChevronLeft, ChevronRight, Menu, X,
  Coins, RefreshCcw, Target, ClipboardCheck, Building, IdCard, FilePlus2, Trophy, ScrollText
} from 'lucide-react'

const menuConfig = {
  super_admin: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/usuarios', icon: Users, label: 'Usuarios' },
    { to: '/instituciones', icon: School, label: 'Instituciones' },
    { to: '/bitacora', icon: FileText, label: 'Bitácora' },
    { to: '/configuracion', icon: Settings, label: 'Configuración' }
  ],
  admin: [
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
    { to: '/conceptos-contables', icon: Coins, label: 'Conceptos' },
    { to: '/pagos', icon: CreditCard, label: 'Pagos' },
    { to: '/comunicados', icon: MessageSquare, label: 'Comunicados' },
    { to: '/bitacora', icon: FileText, label: 'Bitácora' }
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
    { to: '/matriculas', icon: ClipboardList, label: 'Matrículas' },
    { to: '/prematriculas', icon: FilePlus2, label: 'Prematrículas' },
    { to: '/pagos', icon: CreditCard, label: 'Pagos' },
    { to: '/conceptos-contables', icon: Coins, label: 'Conceptos' },
    { to: '/carnets', icon: IdCard, label: 'Carnets' },
    { to: '/certificados', icon: ScrollText, label: 'Certificados' }
  ]
}

const rolLabels = {
  super_admin: 'Super Admin',
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
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const menu = menuConfig[usuario?.tipoPerfil] || menuConfig.admin
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
              <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg truncate">EasyNotes</span>
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
                <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg">EasyNotes</span>
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
            <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {(usuario?.nombreCompleto || usuario?.nombres || 'U').charAt(0).toUpperCase()}
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
    </div>
  )
}
