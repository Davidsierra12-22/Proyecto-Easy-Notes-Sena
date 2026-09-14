import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'

const Login = lazy(() => import('./pages/Login'))
const CambiarPassword = lazy(() => import('./pages/CambiarPassword'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Usuarios = lazy(() => import('./pages/Usuarios'))
const Areas = lazy(() => import('./pages/Areas'))
const Asignaturas = lazy(() => import('./pages/Asignaturas'))
const Grupos = lazy(() => import('./pages/Grupos'))
const CargaAcademica = lazy(() => import('./pages/CargaAcademica'))
const AniosAcademicos = lazy(() => import('./pages/AniosAcademicos'))
const Matriculas = lazy(() => import('./pages/Matriculas'))
const Calificaciones = lazy(() => import('./pages/Calificaciones'))
const Boletines = lazy(() => import('./pages/Boletines'))
const ConceptosContables = lazy(() => import('./pages/ConceptosContables'))
const Pagos = lazy(() => import('./pages/Pagos'))
const Cartera = lazy(() => import('./pages/Cartera'))
const Bitacora = lazy(() => import('./pages/Bitacora'))
const Comunicados = lazy(() => import('./pages/Comunicados'))
const Recuperaciones = lazy(() => import('./pages/Recuperaciones'))
const Indicadores = lazy(() => import('./pages/Indicadores'))
const Actividades = lazy(() => import('./pages/Actividades'))
const MisClases = lazy(() => import('./pages/MisClases'))
const MisNotas = lazy(() => import('./pages/MisNotas'))
const Horario = lazy(() => import('./pages/Horario'))
const MisExcusas = lazy(() => import('./pages/MisExcusas'))
const Sedes = lazy(() => import('./pages/Sedes'))
const Carnets = lazy(() => import('./pages/Carnets'))
const Prematriculas = lazy(() => import('./pages/Prematriculas'))
const PrematriculaOnline = lazy(() => import('./pages/PrematriculaOnline'))
const Promocion = lazy(() => import('./pages/Promocion'))
const Certificados = lazy(() => import('./pages/Certificados'))
const Configuracion = lazy(() => import('./pages/Configuracion'))
const Perfil = lazy(() => import('./pages/Perfil'))
const RecuperarPassword = lazy(() => import('./pages/RecuperarPassword'))
const RestablecerPassword = lazy(() => import('./pages/RestablecerPassword'))
const ElegirPerfil = lazy(() => import('./pages/ElegirPerfil'))
const Instituciones = lazy(() => import('./pages/Instituciones'))
const Nucleos = lazy(() => import('./pages/Nucleos'))
const EstadisticasNucleo = lazy(() => import('./pages/EstadisticasNucleo'))

function RutaProtegida({ children }) {
  const { token, debeCambiarPassword } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (debeCambiarPassword) return <Navigate to="/cambiar-password" replace />
  return children
}

export default function App() {
  const { token, debeCambiarPassword } = useAuth()

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    }>
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
            <Layout />
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
    </Suspense>
  )
}
