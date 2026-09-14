import CrudTable from '../components/CrudTable'
import { useAuth } from '../context/AuthContext'

const columnas = [
  { key: 'nombre', label: 'Concepto' },
  { key: 'tipo', label: 'Tipo', render: (c) => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.tipo === 'obligatorio' ? 'bg-amber-100 text-amber-700' : 'bg-primary-100 text-primary-800'}`}>
      {c.tipo}
    </span>
  )},
  { key: 'periodicidad', label: 'Periodicidad', render: (c) => c.periodicidad || '—' },
  { key: 'valor', label: 'Valor', render: (c) => `$${Number(c.valor).toLocaleString('es-CO')}` },
  { key: 'esPorcentual', label: 'Tipo de valor', render: (c) => c.esPorcentual ? '%' : 'Valor fijo' },
  { key: 'descripcion', label: 'Descripción', render: (c) => c.descripcion || '—' },
  {
    key: 'estado', label: 'Estado',
    render: (c) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
        {c.estado}
      </span>
    )
  }
]

const campos = [
  { name: 'nombre', label: 'Nombre del concepto', required: true, placeholder: 'Ej: Pensión' },
  { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: [
    { value: 'obligatorio', label: 'Obligatorio' },
    { value: 'opcional', label: 'Opcional' }
  ]},
  { name: 'periodicidad', label: 'Periodicidad', type: 'select', options: [
    { value: 'mensual', label: 'Mensual' },
    { value: 'bimestral', label: 'Bimestral' },
    { value: 'trimestral', label: 'Trimestral' },
    { value: 'semestral', label: 'Semestral' },
    { value: 'anual', label: 'Anual' },
    { value: 'unico', label: 'Único' }
  ]},
  { name: 'valor', label: 'Valor', type: 'number' },
  { name: 'esPorcentual', label: '¿Es porcentual?', type: 'select', options: [
    { value: false, label: 'Valor fijo' },
    { value: true, label: 'Porcentaje' }
  ]},
  { name: 'descripcion', label: 'Descripción', colSpan: 2 }
]

export default function ConceptosContables() {
  const { usuario } = useAuth()
  const puedeGestionar = ['super_admin', 'admin', 'secretaria'].includes(usuario?.tipoPerfil)

  return (
    <CrudTable
      titulo="Conceptos Contables"
      baseURL="/conceptos-contables"
      columnas={columnas}
      campos={campos}
      puedeGestionar={puedeGestionar}
      puedeDesactivar={['super_admin', 'admin'].includes(usuario?.tipoPerfil)}
    />
  )
}
