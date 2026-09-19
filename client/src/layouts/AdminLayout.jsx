import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  AppBar, Toolbar, IconButton, Drawer, Box, List, ListItemButton,
  ListItemIcon, ListItemText, Typography, Menu, MenuItem, Avatar,
  Select, OutlinedInput, InputAdornment, CircularProgress, Badge
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import {
  LayoutDashboard, Users, GraduationCap, School, BookOpen, ClipboardList,
  CalendarDays, Calculator, FileText, MessageSquare, PawPrint, Stethoscope,
  CreditCard, Settings, LogOut, Bell, ChevronLeft, ChevronRight, Menu as MenuIcon, X,
  Coins, RefreshCcw, Target, ClipboardCheck, Building, IdCard, FilePlus2, Trophy, ScrollText, User, Repeat, ChevronDown, Wallet
} from 'lucide-react'
import { useAuth } from '../store/Auth'
import { useSede } from '../store/General'

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

const DRAWER_COLLAPSED = 80
const DRAWER_FULL = 256

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [roleMenuEl, setRoleMenuEl] = useState(null)
  const [userMenuEl, setUserMenuEl] = useState(null)
  const { usuario, logout, cambiarPerfil } = useAuth()
  const { sedes, sedeId, setSedeId, cambiandoSede } = useSede()
  const navigate = useNavigate()
  const theme = useTheme()

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

  const logo = (compacto = false) => (
    <>
      {!compacto && (
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-primary-600">
            {usuario?.institucion?.logo ? (
              <img src={usuario.institucion.logo} alt="Logo" className="w-full h-full object-contain bg-white" />
            ) : (
              <GraduationCap className="w-5 h-5 text-white" />
            )}
          </div>
          <Typography className="!font-bold !text-sm leading-tight truncate">
            {usuario?.institucion?.nombre || 'EasyNotes'}
          </Typography>
        </div>
      )}
    </>
  )

  const renderMenu = (cerrarMobile = false) => (
    <List sx={{ p: 1, flex: 1, overflowY: 'auto' }}>
      {menu.map((item, i) => (
        <ListItemButton
          key={item.to}
          component={NavLink}
          to={item.to}
          end={item.to === '/'}
          onClick={() => cerrarMobile && setMobileOpen(false)}
          title={collapsed ? item.label : undefined}
          sx={{
            borderRadius: '8px',
            mt: i === 0 ? 0 : 0.5,
            color: '#d1d5db',
            '&.active': { bgcolor: 'primary.600', color: '#fff', '&:hover': { bgcolor: 'primary.600' } },
            '&:hover': { bgcolor: '#1e293b', color: '#fff' },
            justifyContent: collapsed ? 'center' : 'flex-start'
          }}
        >
          <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, mr: collapsed ? 0 : 1, color: 'inherit' }}>
            <item.icon className="w-5 h-5 shrink-0" />
          </ListItemIcon>
          {!collapsed && <ListItemText primary={item.label} slotProps={{ primary: { color: 'inherit', fontSize: '0.875rem' } }} />}
        </ListItemButton>
      ))}
    </List>
  )

  const appBar = (
    <AppBar
      position="static"
      color="inherit"
      elevation={0}
      sx={{
        bgcolor: '#fff',
        borderBottom: '1px solid #e5e7eb',
        zIndex: 'auto',
        backgroundImage: 'none'
      }}
    >
      <Toolbar sx={{ minHeight: '72px !important', px: { xs: 2, lg: 3 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton sx={{ display: { lg: 'none' }, color: '#4b5563' }} onClick={() => setMobileOpen(true)} edge="start">
            <MenuIcon className="w-6 h-6" />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937' }}>Panel de Control</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {sedes.length > 0 && (
            <Box className="hidden sm:block">
              <Select
                value={sedeId}
                onChange={(e) => cambiarSede(e.target.value)}
                input={<OutlinedInput startAdornment={<InputAdornment position="start"><Building className="w-4 h-4 text-gray-400" /></InputAdornment>} />}
                size="small"
                sx={{
                  bgcolor: '#f9fafb',
                  minWidth: 160,
                  fontSize: '0.875rem',
                  '& fieldset': { borderColor: '#e5e7eb' }
                }}
                title="Sede de trabajo"
              >
                <MenuItem value="">Todas las sedes</MenuItem>
                {sedes.map(s => (
                  <MenuItem key={s._id} value={s._id}>{s.nombre}</MenuItem>
                ))}
              </Select>
            </Box>
          )}

          <IconButton className="!text-gray-500" size="small">
            <Badge variant="dot" color="error" overlap="circular">
              <Bell className="w-5 h-5" />
            </Badge>
          </IconButton>

          {multiplosRoles && (
            <>
              <ButtonMenu
                onClick={(e) => setRoleMenuEl(e.currentTarget)}
                color="primary"
                variant="outlined"
                className="!border-primary-200 !bg-primary-50 !text-primary-700 !normal-case"
                title="Cambiar de perfil"
              >
                <Repeat className="w-4 h-4" />
                <span className="hidden md:inline mx-1">{rolLabel}</span>
                <ChevronDown className="w-4 h-4" />
              </ButtonMenu>
              <Menu
                anchorEl={roleMenuEl}
                open={Boolean(roleMenuEl)}
                onClose={() => setRoleMenuEl(null)}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box className="!px-4 !py-2 !border-b !border-gray-100">
                  <Typography className="!text-xs !font-medium !text-gray-500">Cambiar de perfil</Typography>
                </Box>
                {roles.map(rol => {
                  const activo = rol === usuario?.tipoPerfil
                  return (
                    <MenuItem
                      key={rol}
                      onClick={() => { setRoleMenuEl(null); cambiarRol(rol) }}
                      selected={activo}
                      className="!text-sm"
                    >
                      <Box className="!flex !items-center !justify-between !w-full">
                        <span>{rolLabels[rol] || rol}</span>
                        {activo && <span className="!text-xs !text-primary-600 !font-medium">Activo</span>}
                      </Box>
                    </MenuItem>
                  )
                })}
              </Menu>
            </>
          )}

          <IconButton
            onClick={(e) => setUserMenuEl(e.currentTarget)}
            className="!hover:bg-gray-100"
          >
            <Avatar className="!bg-primary-600 !text-white !w-8 !h-8 !text-sm !font-semibold">
              {usuario?.foto ? (
                <img src={usuario.foto} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                (usuario?.nombreCompleto || usuario?.nombres || 'U').charAt(0).toUpperCase()
              )}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={userMenuEl}
            open={Boolean(userMenuEl)}
            onClose={() => setUserMenuEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{ paper: { sx: { width: 192 } } }}
          >
            <Box className="!px-4 !py-2 !border-b !border-gray-100">
              <Typography className="!text-sm !font-medium !text-gray-800 truncate">
                {usuario?.nombreCompleto || usuario?.nombres}
              </Typography>
              <Typography className="!text-xs !text-gray-500">
                {usuario?.email || usuario?.documento || ''}
              </Typography>
            </Box>
            <MenuItem onClick={() => { setUserMenuEl(null); navigate('/perfil') }}>
              <User className="w-4 h-4 mr-2" /> Mi perfil
            </MenuItem>
            <MenuItem onClick={() => { setUserMenuEl(null); handleLogout() }} className="!text-red-600">
              <LogOut className="w-4 h-4 mr-2" /> Cerrar sesión
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  )

  return (
    <Box className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar desktop */}
      <Drawer
        variant="permanent"
        className="hidden lg:block"
        open
        sx={{
          width: collapsed ? DRAWER_COLLAPSED : DRAWER_FULL,
          display: { xs: 'none', lg: 'block' },
          '& .MuiDrawer-paper': {
            bgcolor: '#0f172a',
            color: '#fff',
            width: collapsed ? DRAWER_COLLAPSED : DRAWER_FULL,
            transition: 'width 0.3s',
            overflowX: 'hidden',
            overflowY: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            border: 'none',
            boxSizing: 'border-box'
          }
        }}
      >
        <Box sx={{ height: 72, minHeight: 72, flexShrink: 0, display: 'flex', alignItems: 'center', px: collapsed ? 1 : 2, borderBottom: '1px solid #334155', justifyContent: collapsed ? 'center' : 'space-between' }}>
          {!collapsed && logo()}
          <IconButton
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            className="!text-gray-300 hover:!bg-slate-800 hover:!text-white !rounded-lg !shrink-0 !ml-2"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </IconButton>
        </Box>
        {renderMenu(false)}
      </Drawer>

      {/* Sidebar mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            bgcolor: '#0f172a',
            color: '#fff',
            width: DRAWER_FULL,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }
        }}
      >
        <Box className="flex items-center justify-between px-4 h-16 border-b border-slate-700" sx={{ flexShrink: 0 }}>
          {logo()}
          <IconButton onClick={() => setMobileOpen(false)} className="!text-gray-400 hover:!text-white">
            <X className="w-6 h-6" />
          </IconButton>
        </Box>
        {renderMenu(true)}
      </Drawer>

      {/* Main content */}
      <Box className="flex-1 flex flex-col min-w-0" sx={{ ml: { lg: 0 } }}>
        {appBar}

        <Box component="main" className="flex-1 p-4 lg:p-6 overflow-y-auto !bg-gray-50">
          <Outlet />
        </Box>
      </Box>

      {cambiandoSede && (
        <Box className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <CircularProgress size={40} className="!text-primary-600" />
          <Typography className="!text-sm !font-medium !text-gray-700">Cambiando de sede...</Typography>
        </Box>
      )}
    </Box>
  )
}

function ButtonMenu({ children, ...props }) {
  return (
    <IconButton {...props} size="small" sx={{ border: '1px solid rgba(25,118,210,0.3)', borderRadius: '8px', gap: 0.5 }}>
      {children}
    </IconButton>
  )
}