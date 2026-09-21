import CrudTable from '../components/Tables/CrudTable'
import { useAuth } from '../store/Auth'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api.service'

const columnas = [
  {
    key: 'nombre', label: 'Sede',
    render: (s) => <span className="font-medium text-gray-900">{s.nombre}</span>
  },
  {
    key: 'institucionId', label: 'Colegio',
    render: (s) => s.institucionId?.nombre || '—'
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

const camposBase = [
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
  const [instituciones, setInstituciones] = useState([])
  const [searchParams] = useSearchParams()
  const institucionIdParam = searchParams.get('institucionId')
  const esSuperAdmin = usuario?.tipoPerfil === 'super_admin'
  const puedeGestionar = ['super_admin', 'admin', 'secretaria'].includes(usuario?.tipoPerfil)

  useEffect(() => {
    api.get('/instituciones').then(r => {
      setInstituciones(r.data.data.map(i => ({ value: i._id, label: i.nombre })))
    }).catch(() => {})
  }, [])

  const filtroInicial = institucionIdParam ? { institucionId: institucionIdParam } : undefined

  const campos = esSuperAdmin
    ? [
        { name: 'institucionId', label: 'Colegio', type: 'select', options: instituciones, required: true, colSpan: 2 },
        ...camposBase
      ]
    : camposBase

  const filtros = esSuperAdmin ? [{ name: 'institucionId', label: 'Colegio', options: instituciones }] : undefined

  return (
    <CrudTable
      titulo="Sedes"
      baseURL="/sedes"
      columnas={columnas}
      campos={campos}
      filtros={filtros}
      filtroInicial={filtroInicial}
      puedeGestionar={puedeGestionar}
      puedeDesactivar={['super_admin', 'admin'].includes(usuario?.tipoPerfil)}
    />
  )
}
