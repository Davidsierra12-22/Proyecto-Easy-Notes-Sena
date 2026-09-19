import { create } from 'zustand'
import api from '../services/api.service'

const loadUsuario = () => {
  const stored = localStorage.getItem('usuario')
  if (!stored) return null
  const parsed = JSON.parse(stored)
  return parsed._id ? parsed : { ...parsed, _id: parsed.id }
}

const useAuthStore = create((set, get) => ({
  usuario: loadUsuario(),
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
  debeCambiarPassword: false,

  get usuarioNormalizado() {
    const u = get().usuario
    return u ? (u._id ? u : { ...u, _id: u.id }) : null
  },

  login: async (usuario, password) => {
    set({ loading: true, error: null })
    try {
      const res = await api.post('/auth/login', { usuario, password })
      const { token: nuevoToken, usuario: datosUsuario } = res.data.data
      const usuarioConId = datosUsuario._id ? datosUsuario : { ...datosUsuario, _id: datosUsuario.id }
      localStorage.setItem('token', nuevoToken)
      localStorage.setItem('usuario', JSON.stringify(usuarioConId))
      set({
        token: nuevoToken,
        usuario: usuarioConId,
        debeCambiarPassword: !!datosUsuario.debeCambiarPassword
      })
      return usuarioConId
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al iniciar sesión'
      set({ error: msg })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    set({ token: null, usuario: null, debeCambiarPassword: false })
  },

  cambiarPassword: async (passwordActual, passwordNueva) => {
    set({ loading: true, error: null })
    try {
      await api.put('/auth/password', { passwordActual, passwordNueva })
      const u = get().usuario
      if (u) {
        const actualizado = { ...u, debeCambiarPassword: false }
        localStorage.setItem('usuario', JSON.stringify(actualizado))
        set({ usuario: actualizado, debeCambiarPassword: false })
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al cambiar contraseña'
      set({ error: msg })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  cambiarPerfil: async (perfil) => {
    set({ loading: true, error: null })
    try {
      const res = await api.post('/auth/cambiar-perfil', { perfil })
      const { token: nuevoToken, usuario: datosUsuario } = res.data.data
      const usuarioConId = datosUsuario._id ? datosUsuario : { ...datosUsuario, _id: datosUsuario.id }
      localStorage.setItem('token', nuevoToken)
      localStorage.setItem('usuario', JSON.stringify(usuarioConId))
      set({ token: nuevoToken, usuario: usuarioConId })
      return usuarioConId
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al cambiar de perfil'
      set({ error: msg })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  actualizarUsuario: (parcial) => {
    const u = get().usuario
    if (!u) return
    const actualizado = { ...u, ...parcial }
    localStorage.setItem('usuario', JSON.stringify(actualizado))
    set({ usuario: actualizado })
  },

  setError: (error) => set({ error })
}))

export const useAuth = () => {
  const state = useAuthStore()
  return {
    usuario: state.usuario ? (state.usuario._id ? state.usuario : { ...state.usuario, _id: state.usuario.id }) : null,
    token: state.token,
    loading: state.loading,
    error: state.error,
    debeCambiarPassword: state.debeCambiarPassword,
    login: state.login,
    logout: state.logout,
    cambiarPassword: state.cambiarPassword,
    cambiarPerfil: state.cambiarPerfil,
    actualizarUsuario: state.actualizarUsuario,
    setError: state.setError
  }
}

export default useAuthStore
