import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../store/Auth'
import AdminLayout from '../layouts/AdminLayout'

const Login = lazy(() => import('../views/Login'))
const CambiarPassword = lazy(() => import('../views/CambiarPassword'))
const Dashboard = lazy(() => import('../views/Dashboard'))
const Usuarios = lazy(() => import('../views/Usuarios'))
const Areas = lazy(() => import('../views/Areas'))
const Asignaturas = lazy(() => import('../views/Asignaturas'))
const Grupos = lazy(() => import('../views/Grupos'))
const CargaAcademica = lazy(() => import('../views/CargaAcademica'))
const AniosAcademicos = lazy(() => import('../views/AniosAcademicos'))
const Matriculas = lazy(() => import('../views/Matriculas'))
const Calificaciones = lazy(() => import('../views/Calificaciones'))
const Boletines = lazy(() => import('../views/Boletines'))
const ConceptosContables = lazy(() => import('../views/ConceptosContables'))
const Pagos = lazy(() => import('../views/Pagos'))
const Cartera = lazy(() => import('../views/Cartera'))
const Bitacora = lazy(() => import('../views/Bitacora'))
const Comunicados = lazy(() => import('../views/Comunicados'))
const Recuperaciones = lazy(() => import('../views/Recuperaciones'))
const Indicadores = lazy(() => import('../views/Indicadores'))
const Actividades = lazy(() => import('../views/Actividades'))
const MisClases = lazy(() => import('../views/MisClases'))
const MisNotas = lazy(() => import('../views/MisNotas'))
const Horario = lazy(() => import('../views/Horario'))
const MisExcusas = lazy(() => import('../views/MisExcusas'))
const Sedes = lazy(() => import('../views/Sedes'))
const Carnets = lazy(() => import('../views/Carnets'))
const Prematriculas = lazy(() => import('../views/Prematriculas'))
const PrematriculaOnline = lazy(() => import('../views/PrematriculaOnline'))
const Promocion = lazy(() => import('../views/Promocion'))
const Certificados = lazy(() => import('../views/Certificados'))
const Configuracion = lazy(() => import('../views/Configuracion'))
const Perfil = lazy(() => import('../views/Perfil'))
const RecuperarPassword = lazy(() => import('../views/RecuperarPassword'))
const RestablecerPassword = lazy(() => import('../views/RestablecerPassword'))
const ElegirPerfil = lazy(() => import('../views/ElegirPerfil'))
const Instituciones = lazy(() => import('../views/Instituciones'))
const Nucleos = lazy(() => import('../views/Nucleos'))
const EstadisticasNucleo = lazy(() => import('../views/EstadisticasNucleo'))

export function RutaProtegida({ children }) {
  const { token, debeCambiarPassword } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (debeCambiarPassword) return <Navigate to="/cambiar-password" replace />
  return children
}

export default function Rutas() {
  const { token, debeCambiarPassword } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={token && !debeCambiarPassword ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/cambiar-password" element={token ? <CambiarPassword /> : <Navigate to="/login" replace />} />
      <Route path="/prematricula" element={<PrematriculaOnline />} />
      <Route path="/recuperar-password" element={<RecuperarPassword />} />
      <Route path="/restablecer-password" element={<RestablecerPassword />} />
      <Route path="/elegir-perfil" element={token && !debeCambiarPassword ? <ElegirPerfil /> : <Navigate to="/login" replace />} />

      <Route
        path="/"
        element={
          <RutaProtegida>
            <AdminLayout />
          </RutaProtegida>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="instituciones" element={<Instituciones />} />
        <Route path="nucleos" element={<Nucleos />} />
        <Route path="estadisticas" element={<EstadisticasNucleo />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="areas" element={<Areas />} />
        <Route path="asignaturas" element={<Asignaturas />} />
        <Route path="grupos" element={<Grupos />} />
        <Route path="carga-academica" element={<CargaAcademica />} />
        <Route path="anios-academicos" element={<AniosAcademicos />} />
        <Route path="matriculas" element={<Matriculas />} />
        <Route path="calificaciones" element={<Calificaciones />} />
        <Route path="boletines" element={<Boletines />} />
        <Route path="conceptos-contables" element={<ConceptosContables />} />
        <Route path="pagos" element={<Pagos />} />
        <Route path="cartera" element={<Cartera />} />
        <Route path="bitacora" element={<Bitacora />} />
        <Route path="comunicados" element={<Comunicados />} />
        <Route path="recuperaciones" element={<Recuperaciones />} />
        <Route path="indicadores" element={<Indicadores />} />
        <Route path="actividades" element={<Actividades />} />
        <Route path="mis-clases" element={<MisClases />} />
        <Route path="mis-notas" element={<MisNotas />} />
        <Route path="horario" element={<Horario />} />
        <Route path="mis-excusas" element={<MisExcusas />} />
        <Route path="sedes" element={<Sedes />} />
        <Route path="carnets" element={<Carnets />} />
        <Route path="prematriculas" element={<Prematriculas />} />
        <Route path="promocion" element={<Promocion />} />
        <Route path="certificados" element={<Certificados />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}