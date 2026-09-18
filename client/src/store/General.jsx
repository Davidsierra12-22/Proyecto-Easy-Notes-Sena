import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import api from '../services/api.service'
import { useAuth } from './Auth'

const SedeContext = createContext({})

export function SedeProvider({ children }) {
  const { usuario } = useAuth()
  const [sedes, setSedes] = useState([])
  const [sedeId, setSedeId] = useState('')
  const [loading, setLoading] = useState(false)
  const [cambiandoSede, setCambiandoSede] = useState(false)
  const creandoSede = useRef(false)
  const timerSede = useRef(null)

  const esDeColegio = usuario && ['admin', 'rector', 'coordinador', 'secretaria'].includes(usuario.tipoPerfil)

  const cargarSedes = useCallback(async () => {
    if (!esDeColegio) return
    setLoading(true)
    try {
      const r = await api.get('/sedes')
      const lista = r.data.data
      setSedes(lista)

      if (lista.length === 0 && !creandoSede.current) {
        creandoSede.current = true
        try {
          const nombreInstitucion = usuario?.institucion?.nombre || 'Colegio'
          await api.post('/sedes', {
            nombre: nombreInstitucion,
            direccion: 'Sede principal'
          })
          const r2 = await api.get('/sedes')
          setSedes(r2.data.data)
        } catch (e) {
          setSedes([])
        } finally {
          creandoSede.current = false
        }
      }

      const guardada = localStorage.getItem(`easynots_sede_${usuario._id}`)
      setSedeId(lista.some(s => s._id === guardada) ? guardada : '')
    } catch (e) {
      setSedes([])
      setSedeId('')
    } finally {
      setLoading(false)
    }
  }, [esDeColegio, usuario?.institucion?.nombre])

  useEffect(() => {
    if (esDeColegio) {
      cargarSedes()
    } else {
      setSedes([])
      setSedeId('')
    }
  }, [esDeColegio, cargarSedes])

  const seleccionarSede = (id) => {
    setSedeId(id)
    localStorage.setItem(`easynots_sede_${usuario._id}`, id || '')
    setCambiandoSede(true)
    if (timerSede.current) clearTimeout(timerSede.current)
    timerSede.current = setTimeout(() => {
      setCambiandoSede(false)
      timerSede.current = null
    }, 800)
  }

  useEffect(() => () => clearTimeout(timerSede.current), [])

  const sedeActual = sedes.find(s => s._id === sedeId) || null

  const value = {
    sedes,
    sedeId,
    setSedeId: seleccionarSede,
    sedeActual,
    loading,
    cambiandoSede,
    refrescarSedes: cargarSedes
  }

  return <SedeContext.Provider value={value}>{children}</SedeContext.Provider>
}

export function useSede() {
  return useContext(SedeContext)
}