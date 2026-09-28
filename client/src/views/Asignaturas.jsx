import { useEffect, useState } from 'react'
import { Button } from '@mui/material'
import { FileUp } from 'lucide-react'
import CrudTable from '../components/Tables/CrudTable'
import CargaMasivaDialog from '../components/CargaMasivaDialog'
import api from '../services/api.service'
import { useAuth } from '../store/Auth'

export default function Asignaturas() {
  const { usuario } = useAuth()
  const [areas, setAreas] = useState([])
  const puedeGestionar = ['super_admin', 'admin', 'secretaria'].includes(usuario?.tipoPerfil)
  const puedeControl = ['super_admin', 'admin'].includes(usuario?.tipoPerfil)
  const esSuperAdmin = usuario?.tipoPerfil === 'super_admin'
  const [cargaMasivaAbierta, setCargaMasivaAbierta] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

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
        return ar?.label || '—'
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

  const validar = (form) => {
    const e = {}
    if (!form.nombre?.trim()) e.nombre = 'El nombre de la asignatura es obligatorio'
    if (!form.areaId) e.areaId = 'Debe seleccionar un área'
    return e
  }

  return (
    <>
      <CrudTable
        titulo="Asignaturas"
        baseURL="/asignaturas"
        columnas={columnas}
        campos={campos}
        validate={validar}
        puedeGestionar={puedeGestionar}
        puedeDesactivar={puedeControl}
        refreshKey={refreshKey}
        extraBotones={puedeGestionar && !esSuperAdmin && (
          <Button
            onClick={() => setCargaMasivaAbierta(true)}
            variant="outlined"
            color="primary"
            className="!normal-case !text-primary-700 !border-primary-300 hover:!bg-primary-50"
            startIcon={<FileUp className="w-4 h-4" />}
          >
            Carga masiva
          </Button>
        )}
      />

      <CargaMasivaDialog
        open={cargaMasivaAbierta}
        onClose={() => setCargaMasivaAbierta(false)}
        titulo="Carga masiva de asignaturas"
        entidad="asignaturas"
        endpoint="/carga-masiva/asignaturas"
        onCompletado={() => setRefreshKey(k => k + 1)}
      />
    </>
  )
}