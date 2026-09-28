import { useState } from 'react'
import { Button } from '@mui/material'
import { FileUp } from 'lucide-react'
import CrudTable from '../components/Tables/CrudTable'
import CargaMasivaDialog from '../components/CargaMasivaDialog'
import { useAuth } from '../store/Auth'

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
  const puedeGestionar = ['super_admin', 'admin', 'secretaria'].includes(usuario?.tipoPerfil)
  const puedeControl = ['super_admin', 'admin'].includes(usuario?.tipoPerfil)
  const esSuperAdmin = usuario?.tipoPerfil === 'super_admin'
  const [cargaMasivaAbierta, setCargaMasivaAbierta] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const validar = (form) => {
    const e = {}
    if (!form.nombre?.trim()) e.nombre = 'El nombre del área es obligatorio'
    return e
  }

  return (
    <>
      <CrudTable
        titulo="Áreas Académicas"
        baseURL="/areas"
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
        titulo="Carga masiva de áreas"
        entidad="areas"
        endpoint="/carga-masiva/areas"
        onCompletado={() => setRefreshKey(k => k + 1)}
      />
    </>
  )
}