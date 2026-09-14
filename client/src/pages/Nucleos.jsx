import CrudTable from '../components/CrudTable'
import { Building } from 'lucide-react'

const columnas = [
  {
    key: 'nombre', label: 'Núcleo',
    render: (n) => (
      <div className="flex items-center gap-3">
        <span className="p-2 rounded-lg bg-primary-50 text-primary-700">
          <Building className="w-4 h-4" />
        </span>
        <span className="font-medium text-gray-900">{n.nombre}</span>
      </div>
    )
  },
  { key: 'codigo', label: 'Código', render: (n) => n.codigo || '—' },
  {
    key: 'ubicacion', label: 'Ubicación',
    render: (n) => [n.municipio, n.departamento].filter(Boolean).join(', ') || '—'
  },
  {
    key: 'contacto', label: 'Contacto',
    render: (n) => {
      const c = n.contacto
      return c?.nombre || c?.email || c?.telefono
        ? (
            <div className="text-xs text-gray-600">
              {c.nombre && <p className="font-medium text-gray-900">{c.nombre}</p>}
              {c.email && <p>{c.email}</p>}
              {c.telefono && <p>{c.telefono}</p>}
            </div>
          )
        : '—'
    }
  },
  {
    key: 'estado', label: 'Estado',
    render: (n) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${n.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
        {n.estado}
      </span>
    )
  }
]

const campos = [
  { name: 'nombre', label: 'Nombre del Núcleo', required: true, placeholder: 'Ej: Núcleo No. 3 - Oriente' },
  { name: 'codigo', label: 'Código', placeholder: 'Ej: NO-03' },
  { name: 'municipio', label: 'Municipio' },
  { name: 'departamento', label: 'Departamento' },
  { name: 'contacto.nombre', label: 'Contacto (nombre)' },
  { name: 'contacto.email', label: 'Contacto (email)', placeholder: 'correo@nucleo.edu.co' },
  { name: 'contacto.telefono', label: 'Contacto (teléfono)' },
  { name: 'estado', label: 'Estado', type: 'select', options: [{ value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }], default: 'activo' }
]

const aplanarContacto = (rows) =>
  (rows || []).map(n => ({
    ...n,
    'contacto.nombre': n.contacto?.nombre || '',
    'contacto.email': n.contacto?.email || '',
    'contacto.telefono': n.contacto?.telefono || ''
  }))

export default function Nucleos() {
  return (
    <CrudTable
      titulo="Núcleos"
      baseURL="/nucleos"
      columnas={columnas}
      campos={campos}
      transformDatos={aplanarContacto}
      puedeDesactivar
    />
  )
}