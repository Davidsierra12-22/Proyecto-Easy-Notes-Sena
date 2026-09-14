import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export function useEstudiante() {
  const { usuario } = useAuth()
  const [matricula, setMatricula] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let activo = true
    const cargar = async () => {
      try {
        const r = await api.get('/matriculas')
        const lista = r.data.data || []
        const mias = lista.filter(m =>
          m.estudianteId &&
          String(m.estudianteId._id) === String(usuario?._id) &&
          m.estado === 'activa'
        )
        if (activo) setMatricula(mias[0] || null)
      } catch {
        if (activo) setMatricula(null)
      } finally {
        if (activo) setLoading(false)
      }
    }
    if (usuario?.tipoPerfil === 'estudiante') cargar()
    return () => { activo = false }
  }, [usuario?._id, usuario?.tipoPerfil])

  return { matricula, loading }
}