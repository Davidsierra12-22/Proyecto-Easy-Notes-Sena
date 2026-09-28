import { useEffect, useState } from 'react'
import { Users, X, FileUp } from 'lucide-react'
import { Button } from '@mui/material'
import CrudTable from '../components/Tables/CrudTable'
import CargaMasivaDialog from '../components/CargaMasivaDialog'
import api from '../services/api.service'
import { useAuth } from '../store/Auth'
import { useSede } from '../store/General'
import { GRADOS_ESTANDAR, gradoLabel } from '../constants/grados'
import {
  CircularProgress, Dialog, DialogTitle, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material'

const JORNADAS = [
  { value: 'manana', label: 'Mañana' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noche', label: 'Noche' },
  { value: 'continua', label: 'Continua' }
]

const GRADOS_DEFAULT = GRADOS_ESTANDAR.map(g => ({ value: g.numero, label: g.nombre }))

export default function Grupos() {
  const { usuario } = useAuth()
  const { sedes, sedeId } = useSede()
  const [anios, setAnios] = useState([])
  const [grados, setGrados] = useState(GRADOS_DEFAULT)
  const [gradosCfg, setGradosCfg] = useState([])
  const [estModal, setEstModal] = useState(null)
  const [estLista, setEstLista] = useState(null)
  const [estLoading, setEstLoading] = useState(false)
  const [estError, setEstError] = useState('')
  const puedeGestionar = ['super_admin', 'admin', 'secretaria'].includes(usuario?.tipoPerfil)
  const puedeControl = ['super_admin', 'admin'].includes(usuario?.tipoPerfil)
  const esSuperAdmin = usuario?.tipoPerfil === 'super_admin'
  const [cargaMasivaAbierta, setCargaMasivaAbierta] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const verEstudiantes = async (g) => {
    setEstModal(g)
    setEstLista(null)
    setEstError('')
    setEstLoading(true)
    try {
      const params = {}
      if (sedeId) params.sedeId = sedeId
      const res = await api.get('/matriculas', { params })
      const list = res.data.data.filter(m => {
        const grupo = m.grupoId
        if (!grupo || typeof grupo !== 'object') return false
        if (grupo.grado === undefined || String(grupo.grado) !== String(g.grado)) return false
        const anioDeMat = m.anioAcademicoId?._id || m.anioAcademicoId
        const anioDeGrupo = g.anioAcademicoId?._id || g.anioAcademicoId
        if (anioDeGrupo && anioDeMat && anioDeMat !== anioDeGrupo) return false
        return true
      })
      setEstLista(list)
    } catch (e) {
      setEstLista([])
      setEstError(e.response?.data?.message || 'Error al cargar estudiantes')
    } finally {
      setEstLoading(false)
    }
  }

  useEffect(() => {
    api.get('/anios-academicos').then(r => {
      setAnios(r.data.data.map(a => ({ value: a._id, label: `Año ${a.anio}` })))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    api.get('/instituciones').then(r => {
      const mi = r.data.data.find(i => i._id === usuario?.institucionId)
      const config = (mi?.configuracion?.grados || []).filter(g => g.numero !== undefined && g.nombre)
      if (config.length) {
        setGrados(config
          .slice()
          .sort((a, b) => a.numero - b.numero)
          .map(g => ({ value: g.numero, label: g.nombre })))
        setGradosCfg(config)
      }
    }).catch(() => {})
  }, [usuario?.institucionId])

  const columnas = [
    { key: 'nombre', label: 'Grupo', render: (g) => <span className="font-medium text-gray-900">{g.nombre}</span> },
    { key: 'grado', label: 'Grado', render: (g) => gradoLabel(g.grado, gradosCfg) },
    {
      key: 'sedeId', label: 'Sede',
      render: (g) => {
        const s = sedes.find(x => x._id === g.sedeId)
        return s ? s.nombre : '—'
      }
    },
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
    { name: 'nombre', label: 'Nombre del Grupo', required: true, placeholder: 'Ej: 6-1' },
    { name: 'anioAcademicoId', label: 'Año Académico', type: 'select', options: anios, required: true },
    { name: 'grado', label: 'Grado', type: 'select', options: grados, required: true },
    { name: 'jornada', label: 'Jornada', type: 'select', options: JORNADAS, required: true },
    { name: 'capacidad', label: 'Capacidad', type: 'number', default: 35 },
    { name: 'ciclo', label: 'Ciclo', type: 'select', options: [{ value: 'normal', label: 'Normal' }, { value: 'semestre1', label: 'Semestre 1' }, { value: 'semestre2', label: 'Semestre 2' }], default: 'normal' },
    { name: 'especialidad', label: 'Especialidad', type: 'select', options: [{ value: '', label: 'Ninguna' }, { value: 'tecnica', label: 'Técnica' }, { value: 'comercial', label: 'Comercial' }, { value: 'industrial', label: 'Industrial' }, { value: 'pedagogica', label: 'Pedagógica' }, { value: 'otra', label: 'Otra' }] }
  ]

  const validar = (form) => {
    const e = {}
    if (!form.nombre?.trim()) e.nombre = 'El nombre del grupo es obligatorio'
    if (!form.anioAcademicoId) e.anioAcademicoId = 'Debe seleccionar un año académico'
    if (!form.grado) e.grado = 'Debe seleccionar un grado'
    if (!form.jornada) e.jornada = 'Debe seleccionar una jornada'
    return e
  }

  return (
    <>
      <CrudTable
        titulo="Grupos"
        baseURL="/grupos"
        columnas={columnas}
        campos={campos}
        validate={validar}
        parametrosForzados={sedeId ? { sedeId } : {}}
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
        renderAcciones={(g) => (
          <IconButton
            onClick={() => verEstudiantes(g)}
            aria-label="Ver estudiantes"
            title="Ver estudiantes de este grado"
            className="!text-primary-600 hover:!text-primary-800 !rounded-lg"
            size="small"
          >
            <Users className="w-4 h-4" />
          </IconButton>
        )}
      />

      <Dialog open={Boolean(estModal)} onClose={() => setEstModal(null)} fullWidth maxWidth="md">
        <DialogTitle className="flex items-center justify-between pr-2">
          <span>
            Estudiantes del grado {estModal?.grado} · {estModal?.nombre}
          </span>
          <IconButton onClick={() => setEstModal(null)} aria-label="Cerrar lista de estudiantes" size="small">
            <X className="w-5 h-5" />
          </IconButton>
        </DialogTitle>
        <div className="p-6">
          {estLoading ? (
            <div className="flex justify-center py-8">
              <CircularProgress size={24} className="!text-primary-600" />
            </div>
          ) : estError ? (
            <p className="text-center text-red-600 py-8">{estError}</p>
          ) : estLista && estLista.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay estudiantes matriculados en este grado.</p>
          ) : estLista ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow className="bg-gray-50">
                    <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider">Estudiante</TableCell>
                    <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider">Documento</TableCell>
                    <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider">Grupo</TableCell>
                    <TableCell className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider">Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {estLista.map(m => (
                    <TableRow key={m._id} hover>
                      <TableCell className="!text-sm !text-gray-900 !py-3">
                        <span className="font-medium">
                          {m.estudianteId?.nombres ? `${m.estudianteId.nombres} ${m.estudianteId.apellidos}` : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="!text-sm !text-gray-700 !py-3">{m.estudianteId?.documento || '—'}</TableCell>
                      <TableCell className="!text-sm !text-gray-700 !py-3">{m.grupoId?.nombre || '—'}</TableCell>
                      <TableCell className="!text-sm !py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.estado === 'activa' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                          {m.estado}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </div>
      </Dialog>

      <CargaMasivaDialog
        open={cargaMasivaAbierta}
        onClose={() => setCargaMasivaAbierta(false)}
        titulo="Carga masiva de grupos"
        entidad="grupos"
        endpoint="/carga-masiva/grupos"
        camposExtra={[
          { name: 'anioAcademicoId', label: 'Año Académico', options: anios, required: true },
          { name: 'sedeId', label: 'Sede', options: sedes.map(s => ({ value: s._id, label: s.nombre })) }
        ]}
        onCompletado={() => setRefreshKey(k => k + 1)}
      />
    </>
  )
}