import { create } from 'zustand'
import api from '../services/api.service'
import useAuthStore from './authStore'

const useSedeStore = create((set, get) => ({
  sedes: [],
  sedeId: '',
  loading: false,
  cambiandoSede: false,
  _creando: false,
  _timer: null,

  cargarSedes: async () => {
    const usuario = useAuthStore.getState().usuario
    const esDeColegio = usuario && ['admin', 'rector', 'coordinador', 'secretaria'].includes(usuario.tipoPerfil)
    if (!esDeColegio) {
      set({ sedes: [], sedeId: '' })
      return
    }
    set({ loading: true })
    try {
      const r = await api.get('/sedes')
      const lista = r.data.data
      set({ sedes: lista })

      if (lista.length === 0 && !get()._creando) {
        set({ _creando: true })
        try {
          const nombreInstitucion = usuario?.institucion?.nombre || 'Colegio'
          await api.post('/sedes', { nombre: nombreInstitucion, direccion: 'Sede principal' })
          const r2 = await api.get('/sedes')
          set({ sedes: r2.data.data })
        } catch {
          set({ sedes: [] })
        } finally {
          set({ _creando: false })
        }
      }

      const guardada = localStorage.getItem(`easynots_sede_${usuario._id}`)
      set({ sedeId: lista.some(s => s._id === guardada) ? guardada : '' })
    } catch {
      set({ sedes: [], sedeId: '' })
    } finally {
      set({ loading: false })
    }
  },

  setSedeId: (id) => {
    const usuario = useAuthStore.getState().usuario
    set({ sedeId: id })
    localStorage.setItem(`easynots_sede_${usuario?._id}`, id || '')
    set({ cambiandoSede: true })
    const prev = get()._timer
    if (prev) clearTimeout(prev)
    const t = setTimeout(() => {
      set({ cambiandoSede: false, _timer: null })
    }, 800)
    set({ _timer: t })
  },

  refrescarSedes: () => get().cargarSedes()
}))

useAuthStore.subscribe((state, prev) => {
  if (state.usuario !== prev.usuario) {
    useSedeStore.getState().cargarSedes()
  }
})

export const useSede = () => {
  const state = useSedeStore()
  const usuario = useAuthStore(s => s.usuario)
  const esDeColegio = usuario && ['admin', 'rector', 'coordinador', 'secretaria'].includes(usuario.tipoPerfil)

  return {
    sedes: state.sedes,
    sedeId: state.sedeId,
    setSedeId: state.setSedeId,
    sedeActual: state.sedes.find(s => s._id === state.sedeId) || null,
    loading: state.loading,
    cambiandoSede: state.cambiandoSede,
    refrescarSedes: state.cargarSedes,
    esDeColegio
  }
}

export default useSedeStore
