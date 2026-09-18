import { useEffect, useState } from 'react'
import CrudTable from '../components/Tables/CrudTable'
import api from '../services/api.service'
import { useAuth } from '../store/Auth'
import { useSede } from '../store/General'

export default function Asignaturas() {
  const { usuario } = useAuth()
  const { sedes, sedeId } = useSede()
  const [areas, setAreas] = useState([])
  const puedeGestionar = ['super_admin', 'admin', 'secretaria'].includes(usuario?.tipoPerfil)
  const puedeControl = ['super_admin', 'admin'].includes(usuario?.tipoPerfil)

  useEffect(() => {
    api.get('/areas', { params: sedeId ? { sedeId } : {} }).then(r => {
      setAreas(r.data.data.map(a => ({ value: a._id, label: a.nombre })))
    }).catch(() => {})
  }, [sedeId])

  const columnas = [
    { key: 'nombre', label: 'Asignatura', render: (a) => <span className="font-medium text-gray-900">{a.nombre}</span> },
    {
      key: 'areaId', label: 'Área',
      render: (a) => {
        const ar = areas.find(x => x.value === a.areaId)
        return ar?.label || '—'
      }
    },
    { key: 'abreviatura', label: 'Abreviatura', render: (a) => a.abreviatura || '—' },
    { key: 'intensidadHoraria', label: 'Int. Horaria', render: (a) => (a.intensidadHoraria ?? 4) + ' h' },
    { key: 'orden', label: 'Orden', render: (a) => a.orden ?? '—' },
    {
      key: 'sedeId', label: 'Sede',
      render: (a) => {
        const s = sedes.find(x => x._id === a.sedeId)
        return s ? s.nombre : '—'
      }
    }
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
      parametrosForzados={sedeId ? { sedeId } : {}}
      puedeGestionar={puedeGestionar}
      puedeDesactivar={puedeControl}
    />
  )
}