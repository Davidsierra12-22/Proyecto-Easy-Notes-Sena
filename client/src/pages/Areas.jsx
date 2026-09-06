import CrudTable from '../components/CrudTable'
import { useAuth } from '../context/AuthContext'

const columnas = [
  {
    key: 'nombre', label: 'Área',
    render: (a) => <span className="font-medium text-gray-900">{a.nombre}</span>
  },
  { key: 'abreviatura', label: 'Abreviatura', render: (a) => a.abreviatura || '—' },
  { key: 'porcentaje', label: '%', render: (a) => a.porcentaje ? `${a.porcentaje}%` : '—' },
  { key: 'orden', label: 'Orden', render: (a) => a.orden ?? '—' },
  { key: 'tag', label: 'Tag', render: (a) => a.tag || '—' }
]

const campos = [
  { name: 'nombre', label: 'Nombre del Área', required: true },
  { name: 'abreviatura', label: 'Abreviatura' },
  { name: 'porcentaje', label: 'Porcentaje', type: 'number' },
  { name: 'orden', label: 'Orden', type: 'number' },
  { name: 'tag', label: 'Tag' }
]

export default function Areas() {
  const { usuario } = useAuth()
  const puedeGestionar = ['super_admin', 'admin', 'rector', 'coordinador'].includes(usuario?.tipoPerfil)

  return (
    <CrudTable
      titulo="Áreas Académicas"
      baseURL="/areas"
      columnas={columnas}
      campos={campos}
      puedeGestionar={puedeGestionar}
    />
  )
}
