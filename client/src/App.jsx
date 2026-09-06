import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import CambiarPassword from './pages/CambiarPassword'
import Dashboard from './pages/Dashboard'
import Layout from './components/Layout'
import Usuarios from './pages/Usuarios'
import Areas from './pages/Areas'
import Asignaturas from './pages/Asignaturas'
import Grupos from './pages/Grupos'
import AniosAcademicos from './pages/AniosAcademicos'
import Matriculas from './pages/Matriculas'
import Calificaciones from './pages/Calificaciones'
import Boletines from './pages/Boletines'
import ConceptosContables from './pages/ConceptosContables'
import Pagos from './pages/Pagos'
import Bitacora from './pages/Bitacora'
import Comunicados from './pages/Comunicados'
import Recuperaciones from './pages/Recuperaciones'
import Indicadores from './pages/Indicadores'
import Actividades from './pages/Actividades'
import Sedes from './pages/Sedes'
import Carnets from './pages/Carnets'
import Prematriculas from './pages/Prematriculas'
import PrematriculaOnline from './pages/PrematriculaOnline'
import Promocion from './pages/Promocion'
import Certificados from './pages/Certificados'
import RecuperarPassword from './pages/RecuperarPassword'
import RestablecerPassword from './pages/RestablecerPassword'

function RutaProtegida({ children }) {
  const { token, debeCambiarPassword } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (debeCambiarPassword) return <Navigate to="/cambiar-password" replace />
  return children
}

export default function App() {
  const { token, debeCambiarPassword } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={token && !debeCambiarPassword ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/cambiar-password" element={token ? <CambiarPassword /> : <Navigate to="/login" replace />} />
      <Route path="/prematricula" element={<PrematriculaOnline />} />
      <Route path="/recuperar-password" element={<RecuperarPassword />} />
      <Route path="/restablecer-password" element={<RestablecerPassword />} />

      <Route
        path="/"
        element={
          <RutaProtegida>
            <Layout />
          </RutaProtegida>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="areas" element={<Areas />} />
        <Route path="asignaturas" element={<Asignaturas />} />
        <Route path="grupos" element={<Grupos />} />
        <Route path="anios-academicos" element={<AniosAcademicos />} />
        <Route path="matriculas" element={<Matriculas />} />
        <Route path="calificaciones" element={<Calificaciones />} />
        <Route path="boletines" element={<Boletines />} />
        <Route path="conceptos-contables" element={<ConceptosContables />} />
        <Route path="pagos" element={<Pagos />} />
        <Route path="bitacora" element={<Bitacora />} />
        <Route path="comunicados" element={<Comunicados />} />
        <Route path="recuperaciones" element={<Recuperaciones />} />
        <Route path="indicadores" element={<Indicadores />} />
        <Route path="actividades" element={<Actividades />} />
        <Route path="sedes" element={<Sedes />} />
        <Route path="carnets" element={<Carnets />} />
        <Route path="prematriculas" element={<Prematriculas />} />
        <Route path="promocion" element={<Promocion />} />
        <Route path="certificados" element={<Certificados />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}
