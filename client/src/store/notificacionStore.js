import { create } from 'zustand'

const useNotificacionStore = create((set, get) => {
  let idSeq = 0
  return {
    notificaciones: [],

    notificar: (mensaje, tipo = 'info', duracion = 4000) => {
      const id = ++idSeq
      set({ notificaciones: [...get().notificaciones, { id, mensaje, tipo }] })
      setTimeout(() => get().quitar(id), duracion)
    },

    quitar: (id) => {
      set({ notificaciones: get().notificaciones.filter(n => n.id !== id) })
    }
  }
})

export const notificar = (mensaje, tipo = 'info', duracion = 4000) =>
  useNotificacionStore.getState().notificar(mensaje, tipo, duracion)

export const useNotificaciones = () => useNotificacionStore((s) => s.notificaciones)
export const quitarNotificacion = (id) => useNotificacionStore.getState().quitar(id)

export default useNotificacionStore