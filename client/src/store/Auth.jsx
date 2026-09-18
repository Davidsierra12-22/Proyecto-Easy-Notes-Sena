import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api.service'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(() => {
    const stored = localStorage.getItem('usuario')
    if (!stored) return null
    const parsed = JSON.parse(stored)
    return parsed._id ? parsed : { ...parsed, _id: parsed.id }
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
      const usuarioConId = datosUsuario._id ? datosUsuario : { ...datosUsuario, _id: datosUsuario.id }
      localStorage.setItem('token', nuevoToken)
      localStorage.setItem('usuario', JSON.stringify(usuarioConId))
      setToken(nuevoToken)
      setUsuario(usuarioConId)
      if (datosUsuario.debeCambiarPassword) {
        setDebeCambiarPassword(true)
      }
      return usuarioConId
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

  const cambiarPerfil = async (perfil) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/auth/cambiar-perfil', { perfil })
      const { token: nuevoToken, usuario: datosUsuario } = res.data.data
      const usuarioConId = datosUsuario._id ? datosUsuario : { ...datosUsuario, _id: datosUsuario.id }
      localStorage.setItem('token', nuevoToken)
      localStorage.setItem('usuario', JSON.stringify(usuarioConId))
      setToken(nuevoToken)
      setUsuario(usuarioConId)
      return usuarioConId
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar de perfil')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const actualizarUsuario = (parcial) => {
    if (!usuario) return
    const actualizado = { ...usuario, ...parcial }
    localStorage.setItem('usuario', JSON.stringify(actualizado))
    setUsuario(actualizado)
  }

  const usuarioNormalizado = usuario ? (usuario._id ? usuario : { ...usuario, _id: usuario.id }) : null

  const value = {
    usuario: usuarioNormalizado,
    token,
    loading,
    error,
    debeCambiarPassword,
    login,
    logout,
    cambiarPassword,
    cambiarPerfil,
    actualizarUsuario,
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
