import { useEffect, useState } from 'react'
import CrudTable from '../components/CrudTable'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Asignaturas() {
  const { usuario } = useAuth()
  const [areas, setAreas] = useState([])
  const puedeGestionar = ['super_admin', 'admin', 'rector', 'coordinador'].includes(usuario?.tipoPerfil)

  useEffect(() => {
    api.get('/areas').then(r => {
      setAreas(r.data.data.map(a => ({ value: a._id, label: a.nombre })))
    }).catch(() => {})
  }, [])

  const columnas = [
    { key: 'nombre', label: 'Asignatura', render: (a) => <span className="font-medium text-gray-900">{a.nombre}</span> },
    {
      key: 'areaId', label: 'Área',
      render: (a) => {
        const ar = areas.find(x => x.value === a.areaId)
        return ar ? ar.label : (a.areaId || '—')
      }
    },
    { key: 'abreviatura', label: 'Abreviatura', render: (a) => a.abreviatura || '—' },
    { key: 'intensidadHoraria', label: 'Int. Horaria', render: (a) => (a.intensidadHoraria ?? 4) + ' h' },
    { key: 'orden', label: 'Orden', render: (a) => a.orden ?? '—' }
  ]

  const campos = [
    { name: 'nombre', label: 'Nombre', required: true },
    { name: 'areaId', label: 'Área', type: 'select', options: areas, required: true },
    { name: 'abreviatura', label: 'Abreviatura' },
    { name: 'intensidadHoraria', label: 'Intensidad Horaria', type: 'number' },
    { name: 'orden', label: 'Orden', type: 'number' },
    { name: 'tag', label: 'Tag' }
  ]

  return (
    <CrudTable
      titulo="Asignaturas"
      baseURL="/asignaturas"
      columnas={columnas}
      campos={campos}
      puedeGestionar={puedeGestionar}
    />
  )
}
