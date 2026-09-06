import { useEffect, useState } from 'react'
import CrudTable from '../components/CrudTable'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const JORNADAS = [
  { value: 'manana', label: 'Mañana' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noche', label: 'Noche' },
  { value: 'continua', label: 'Continua' }
]

const GRADOS = Array.from({ length: 12 }, (_, i) => ({ value: i, label: `Grado ${i}` }))

export default function Grupos() {
  const { usuario } = useAuth()
  const [anios, setAnios] = useState([])
  const [sedes, setSedes] = useState([])
  const puedeGestionar = ['super_admin', 'admin', 'rector', 'coordinador'].includes(usuario?.tipoPerfil)

  useEffect(() => {
    api.get('/anios-academicos').then(r => {
      setAnios(r.data.data.map(a => ({ value: a._id, label: `Año ${a.anio}` })))
    }).catch(() => {})
    api.get('/sedes').then(r => {
      setSedes(r.data.data.map(s => ({ value: s._id, label: s.nombre })))
    }).catch(() => {})
  }, [])

  const columnas = [
    { key: 'nombre', label: 'Grupo', render: (g) => <span className="font-medium text-gray-900">{g.nombre}</span> },
    { key: 'grado', label: 'Grado', render: (g) => `Grado ${g.grado}` },
    {
      key: 'jornada', label: 'Jornada',
      render: (g) => {
        const j = JORNADAS.find(x => x.value === g.jornada)
        return j ? j.label : (g.jornada || '—')
      }
    },
    { key: 'capacidad', label: 'Capacidad', render: (g) => g.capacidad ?? 35 },
    {
      key: 'anioAcademicoId', label: 'Año',
      render: (g) => {
        const a = anios.find(x => x.value === g.anioAcademicoId)
        return a ? a.label : '—'
      }
    },
    { key: 'estado', label: 'Estado', render: (g) => <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${g.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{g.estado}</span> }
  ]

  const campos = [
    { name: 'nombre', label: 'Nombre del Grupo', required: true, placeholder: 'Ej: 601' },
    { name: 'anioAcademicoId', label: 'Año Académico', type: 'select', options: anios, required: true },
    { name: 'grado', label: 'Grado', type: 'select', options: GRADOS, required: true },
    { name: 'jornada', label: 'Jornada', type: 'select', options: JORNADAS, required: true },
    { name: 'sedeId', label: 'Sede', type: 'select', options: [{ value: '', label: 'Sin sede' }, ...sedes] },
    { name: 'capacidad', label: 'Capacidad', type: 'number', default: 35 },
    { name: 'ciclo', label: 'Ciclo', type: 'select', options: [{ value: 'normal', label: 'Normal' }, { value: 'semestre1', label: 'Semestre 1' }, { value: 'semestre2', label: 'Semestre 2' }], default: 'normal' },
    { name: 'especialidad', label: 'Especialidad', type: 'select', options: [{ value: '', label: 'Ninguna' }, { value: 'tecnica', label: 'Técnica' }, { value: 'comercial', label: 'Comercial' }, { value: 'industrial', label: 'Industrial' }, { value: 'pedagogica', label: 'Pedagógica' }, { value: 'otra', label: 'Otra' }] }
  ]

  return (
    <CrudTable
      titulo="Grupos"
      baseURL="/grupos"
      columnas={columnas}
      campos={campos}
      puedeGestionar={puedeGestionar}
    />
  )
}
