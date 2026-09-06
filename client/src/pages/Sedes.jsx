import CrudTable from '../components/CrudTable'
import { useAuth } from '../context/AuthContext'

const columnas = [
  {
    key: 'nombre', label: 'Sede',
    render: (s) => <span className="font-medium text-gray-900">{s.nombre}</span>
  },
  { key: 'abreviatura', label: 'Abreviatura', render: (s) => s.abreviatura || '—' },
  { key: 'direccion', label: 'Dirección', render: (s) => s.direccion || '—' },
  { key: 'telefono', label: 'Teléfono', render: (s) => s.telefono || '—' },
  {
    key: 'estado', label: 'Estado',
    render: (s) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
        {s.estado}
      </span>
    )
  }
]

const campos = [
  { name: 'nombre', label: 'Nombre de la Sede', required: true },
  { name: 'abreviatura', label: 'Abreviatura' },
  { name: 'direccion', label: 'Dirección' },
  { name: 'telefono', label: 'Teléfono' },
  {
    name: 'estado', label: 'Estado', type: 'select',
    options: [
      { value: 'activo', label: 'Activo' },
      { value: 'inactivo', label: 'Inactivo' }
    ]
  }
]

export default function Sedes() {
  const { usuario } = useAuth()
  const puedeGestionar = ['super_admin', 'admin', 'rector', 'coordinador'].includes(usuario?.tipoPerfil)

  return (
    <CrudTable
      titulo="Sedes"
      baseURL="/sedes"
      columnas={columnas}
      campos={campos}
      puedeGestionar={puedeGestionar}
    />
  )
}
