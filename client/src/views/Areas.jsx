import CrudTable from '../components/Tables/CrudTable'
import { useAuth } from '../store/Auth'
import { useSede } from '../store/General'

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
  const { sedes, sedeId } = useSede()
  const puedeGestionar = ['super_admin', 'admin', 'secretaria'].includes(usuario?.tipoPerfil)
  const puedeControl = ['super_admin', 'admin'].includes(usuario?.tipoPerfil)

  const cols = [
    ...columnas,
    {
      key: 'sedeId', label: 'Sede',
      render: (a) => {
        const s = sedes.find(x => x._id === a.sedeId)
        return s ? s.nombre : '—'
      }
    }
  ]

  return (
    <CrudTable
      titulo="Áreas Académicas"
      baseURL="/areas"
      columnas={cols}
      campos={campos}
      parametrosForzados={sedeId ? { sedeId } : {}}
      puedeGestionar={puedeGestionar}
      puedeDesactivar={puedeControl}
    />
  )
}