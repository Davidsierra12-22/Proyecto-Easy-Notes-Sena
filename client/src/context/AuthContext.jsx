import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(() => {
    const stored = localStorage.getItem('usuario')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [debeCambiarPassword, setDebeCambiarPassword] = useState(false)

  const login = async (usuario, password) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/auth/login', { usuario, password })
      const { token: nuevoToken, usuario: datosUsuario } = res.data.data
      localStorage.setItem('token', nuevoToken)
      localStorage.setItem('usuario', JSON.stringify(datosUsuario))
      setToken(nuevoToken)
      setUsuario(datosUsuario)
      if (datosUsuario.debeCambiarPassword) {
        setDebeCambiarPassword(true)
      }
      return datosUsuario
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const cambiarPassword = async (passwordActual, passwordNueva) => {
    setLoading(true)
    setError(null)
    try {
      await api.put('/auth/password', { passwordActual, passwordNueva })
      if (usuario) {
        const actualizado = { ...usuario, debeCambiarPassword: false }
        localStorage.setItem('usuario', JSON.stringify(actualizado))
        setUsuario(actualizado)
        setDebeCambiarPassword(false)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar contraseña')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setToken(null)
    setUsuario(null)
    setDebeCambiarPassword(false)
  }

  const value = {
    usuario,
    token,
    loading,
    error,
    debeCambiarPassword,
    login,
    logout,
    cambiarPassword,
    setError
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
