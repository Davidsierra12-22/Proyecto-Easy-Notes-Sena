import { useEffect, useState } from 'react'
import { Building2, GraduationCap, Save, Plus, Trash2, RefreshCw, Settings2 } from 'lucide-react'
import {
  Alert, Button, Checkbox, FormControl, IconButton, InputLabel, MenuItem, Select,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField
} from '@mui/material'
import api from '../services/api.service'
import { useAuth } from '../store/Auth'

const GRADOS_ESTANDAR = [
  { numero: 0, nombre: 'Preescolar' },
  { numero: 1, nombre: 'Primero' },
  { numero: 2, nombre: 'Segundo' },
  { numero: 3, nombre: 'Tercero' },
  { numero: 4, nombre: 'Cuarto' },
  { numero: 5, nombre: 'Quinto' },
  { numero: 6, nombre: 'Sexto' },
  { numero: 7, nombre: 'Séptimo' },
  { numero: 8, nombre: 'Octavo' },
  { numero: 9, nombre: 'Noveno' },
  { numero: 10, nombre: 'Décimo' },
  { numero: 11, nombre: 'Once' }
]

const NIVELES_DEFECTO = [
  { orden: 1, valor: 'Superior', rangoMin: 4.6, rangoMax: 5.0 },
  { orden: 2, valor: 'Alto', rangoMin: 4.0, rangoMax: 4.5 },
  { orden: 3, valor: 'Básico', rangoMin: 3.0, rangoMax: 3.9 },
  { orden: 4, valor: 'Bajo', rangoMin: 1.0, rangoMax: 2.9 }
]

export default function Configuracion() {
  const { usuario } = useAuth()
  const [institucion, setInstitucion] = useState(null)
  const [configuracion, setConfiguracion] = useState(null)
  const [datos, setDatos] = useState({ nombre: '', nit: '', dane: '', telefono: '', direccion: '', email: '' })
  const [grados, setGrados] = useState([])
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [siee, setSiee] = useState({ notaMinima: 3, numeroPeriodos: 4, pierdeAnoPor: 'areas', numPerdidas: 3, aproximaPromedio: true, niveles: NIVELES_DEFECTO })
  const [guardandoDatos, setGuardandoDatos] = useState(false)
  const [guardandoGrados, setGuardandoGrados] = useState(false)
  const [guardandoSiee, setGuardandoSiee] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  const cargar = async () => {
    setError('')
    setExito('')
    try {
      const resInst = await api.get('/instituciones')
      const id = usuario?.institucionId
      if (!id) return
      const resConf = await api.get(`/instituciones/${id}/configuracion`)
      const miInst = resInst.data.data.find(i => i._id === id)
      setInstitucion(miInst || null)
      if (miInst) {
        setDatos({
          nombre: miInst.nombre || '',
          nit: miInst.nit || '',
          dane: miInst.dane?.codigo || miInst.dane || '',
          telefono: miInst.telefono || '',
          direccion: miInst.direccion || '',
          email: miInst.email || ''
        })
      }
      setConfiguracion(resConf.data.data || {})
      setGrados((resConf.data.data?.grados || []).map(g => ({ numero: g.numero, nombre: g.nombre })))
      const c = resConf.data.data || {}
      setSiee({
        notaMinima: c.notaMinima ?? 3,
        numeroPeriodos: c.numeroPeriodos ?? 4,
        pierdeAnoPor: c.pierdeAnoPor || 'areas',
        numPerdidas: c.numPerdidas ?? 3,
        aproximaPromedio: c.aproximaPromedio ?? true,
        niveles: c.niveles?.length ? c.niveles.map(n => ({ ...n })) : NIVELES_DEFECTO.map(n => ({ ...n }))
      })
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar configuración')
    }
  }

  useEffect(() => { cargar() }, [usuario?.institucionId])

  const guardarDatos = async () => {
    if (!institucion) return
    setGuardandoDatos(true)
    setError('')
    setExito('')
    try {
      const payload = {
        nombre: datos.nombre,
        nit: datos.nit,
        dane: datos.dane,
        telefono: datos.telefono,
        direccion: datos.direccion,
        email: datos.email
      }
      await api.put(`/instituciones/${institucion._id}`, payload)
      setExito('Datos del colegio guardados')
      await cargar()
    } catch (e) {
      setError(e.response?.data?.message || 'Error al guardar')
    } finally {
      setGuardandoDatos(false)
    }
  }

  const guardarGrados = async () => {
    if (!institucion) return
    setGuardandoGrados(true)
    setError('')
    setExito('')
    try {
      const limpiados = grados
        .filter(g => g.numero !== '' && g.nombre.trim() !== '')
        .sort((a, b) => a.numero - b.numero)
      await api.put(`/instituciones/${institucion._id}`, {
        configuracion: { ...(configuracion || {}), grados: limpiados }
      })
      setGrados(limpiados)
      setExito('Grados guardados')
    } catch (e) {
      setError(e.response?.data?.message || 'Error al guardar grados')
    } finally {
      setGuardandoGrados(false)
    }
  }

  const agregarGrado = () => {
    if (!nuevoNombre.trim()) return
    setGrados(prev => {
      const numero = Math.max(0, ...prev.map(g => (typeof g.numero === 'number' ? g.numero : Number(g.numero) || 0))) + 1
      return [...prev, { numero, nombre: nuevoNombre.trim() }]
    })
    setNuevoNombre('')
  }

  const alternarGradoEstandar = (estandar) => {
    setGrados(prev => {
      const existe = prev.some(g => String(g.numero) === String(estandar.numero))
      if (existe) return prev.filter(g => String(g.numero) !== String(estandar.numero))
      return [...prev, { numero: estandar.numero, nombre: estandar.nombre }].sort((a, b) => a.numero - b.numero)
    })
  }

  const guardarSiee = async () => {
    if (!institucion) return
    setGuardandoSiee(true)
    setError('')
    setExito('')
    try {
      const niveles = siee.niveles
        .filter(n => n.valor?.trim() && n.rangoMin !== '' && n.rangoMax !== '')
        .map((n, i) => ({ orden: i + 1, valor: n.valor.trim(), rangoMin: Number(n.rangoMin), rangoMax: Number(n.rangoMax) }))
      await api.put(`/instituciones/${institucion._id}`, {
        configuracion: {
          ...(configuracion || {}),
          notaMinima: Number(siee.notaMinima) || 3,
          numeroPeriodos: Number(siee.numeroPeriodos) || 4,
          pierdeAnoPor: siee.pierdeAnoPor,
          numPerdidas: Number(siee.numPerdidas) || 3,
          aproximaPromedio: siee.aproximaPromedio,
          niveles
        }
      })
      setExito('Política de evaluación (SIEE) guardada')
      await cargar()
    } catch (e) {
      setError(e.response?.data?.message || 'Error al guardar la política de evaluación')
    } finally {
      setGuardandoSiee(false)
    }
  }

  const editarNivel = (i, campo, valor) => {
    setSiee(prev => {
      const niveles = [...prev.niveles]
      niveles[i] = { ...niveles[i], [campo]: valor }
      return { ...prev, niveles }
    })
  }

  if (!usuario?.institucionId) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <Settings2 className="w-10 h-10 text-primary-600 mx-auto mb-3" />
        <h1 className="text-lg font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
          La configuración de cada colegio (datos, grados y SIEE) la gestiona el administrador de la institución desde su propio panel.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary-600" /> Configuración del colegio
            </h1>
            <p className="text-sm text-gray-500 mt-1">Datos institucionales y grados que ofrece el colegio</p>
          </div>
          <IconButton onClick={cargar} aria-label="Recargar configuración" title="Recargar configuración" size="small" className="!text-gray-500 hover:!bg-gray-100">
            <RefreshCw className="w-4 h-4" />
          </IconButton>
        </div>
        {error && <Alert severity="error" className="mt-4">{error}</Alert>}
        {exito && <Alert severity="success" className="mt-4">{exito}</Alert>}
      </div>

      {institucion && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-600" /> Datos del colegio
            </h2>
            {institucion.logo && (
              <img src={institucion.logo} alt="Logo" className="w-20 h-20 rounded-xl object-contain border border-gray-200 bg-white p-1 mb-4" />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <TextField value={datos.nombre} onChange={e => setDatos({ ...datos, nombre: e.target.value })}
                  label="Nombre" size="small" fullWidth />
              </div>
              <div>
                <TextField value={datos.nit} onChange={e => setDatos({ ...datos, nit: e.target.value })}
                  label="NIT" size="small" fullWidth />
              </div>
              <div>
                <TextField value={datos.dane} onChange={e => setDatos({ ...datos, dane: e.target.value })}
                  label="DANE" size="small" fullWidth />
              </div>
              <div>
                <TextField value={datos.telefono} onChange={e => setDatos({ ...datos, telefono: e.target.value })}
                  label="Teléfono" size="small" fullWidth />
              </div>
              <div>
                <TextField value={datos.direccion} onChange={e => setDatos({ ...datos, direccion: e.target.value })}
                  label="Dirección" size="small" fullWidth />
              </div>
              <div className="sm:col-span-2">
                <TextField value={datos.email} onChange={e => setDatos({ ...datos, email: e.target.value })}
                  label="Correo" size="small" fullWidth />
              </div>
            </div>
            <Button variant="contained" color="primary" onClick={guardarDatos} disabled={guardandoDatos}
              className="mt-4" startIcon={<Save className="w-4 h-4" />}>
              {guardandoDatos ? 'Guardando...' : 'Guardar datos del colegio'}
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary-600" /> Grados del colegio
            </h2>
            <p className="text-xs text-gray-500 mb-4">Marca los grados que ofrece el colegio. Aparecerán como filtro en Carnets y en el sistema.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {GRADOS_ESTANDAR.map(g => {
                const activo = grados.some(x => String(x.numero) === String(g.numero))
                return (
                  <label key={g.numero}
                    className={`flex items-center gap-3 border rounded-lg px-3 py-2 cursor-pointer transition-colors ${activo ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
                    <Checkbox checked={activo} onChange={() => alternarGradoEstandar(g)} size="small" color="primary" />
                    <span className={`text-sm font-medium ${activo ? 'text-primary-700' : 'text-gray-600'}`}>
                      {g.nombre} <span className="text-xs opacity-70">· Grado {g.numero}</span>
                    </span>
                  </label>
                )
              })}
            </div>

            {grados.filter(g => !GRADOS_ESTANDAR.some(e => String(e.numero) === String(g.numero))).length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Grados personalizados</h3>
                <div className="space-y-2">
                  {grados.filter(g => !GRADOS_ESTANDAR.some(e => String(e.numero) === String(g.numero))).map(g => (
                    <div key={g.numero} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      <span className="text-sm font-semibold text-gray-700 w-24">Grado {g.numero}</span>
                      <span className="text-sm text-gray-600 flex-1">{g.nombre}</span>
                      <IconButton onClick={() => setGrados(prev => prev.filter(x => String(x.numero) !== String(g.numero)))}
                        size="small" className="!text-red-500 hover:!bg-red-50" title="Quitar">
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <div className="flex gap-2">
                <TextField value={nuevoNombre}
                  onChange={e => setNuevoNombre(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarGrado() } }}
                  placeholder="Ej: Aceleración, Transición..."
                  label="Agregar grado personalizado" size="small" className="flex-1" />
                <Button variant="outlined" color="primary" onClick={agregarGrado} startIcon={<Plus className="w-4 h-4" />}>
                  Agregar
                </Button>
              </div>
            </div>

            <Button variant="contained" color="primary" onClick={guardarGrados} disabled={guardandoGrados}
              className="mt-4" startIcon={<Save className="w-4 h-4" />}>
              {guardandoGrados ? 'Guardando...' : 'Guardar grados'}
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 lg:col-span-2">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary-600" /> SIEE · Política de evaluación
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Define cómo se evalúa en el colegio. Lo usan Calificaciones, Boletines y la Promoción.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div>
                <TextField label="Nota mínima de aprobación" type="number" value={siee.notaMinima}
                  onChange={e => setSiee({ ...siee, notaMinima: e.target.value })}
                  slotProps={{ htmlInput: { min: 0, max: 5, step: 0.1 } }} size="small" fullWidth />
              </div>
              <div>
                <TextField label="Número de períodos" type="number" value={siee.numeroPeriodos}
                  onChange={e => setSiee({ ...siee, numeroPeriodos: e.target.value })}
                  slotProps={{ htmlInput: { min: 1, max: 6 } }} size="small" fullWidth />
              </div>
              <div>
                <FormControl size="small" fullWidth>
                  <InputLabel>Pierde el año por</InputLabel>
                  <Select value={siee.pierdeAnoPor} onChange={e => setSiee({ ...siee, pierdeAnoPor: e.target.value })} label="Pierde el año por">
                    <MenuItem value="areas">Áreas perdidas</MenuItem>
                    <MenuItem value="materias">Materias perdidas</MenuItem>
                  </Select>
                </FormControl>
              </div>
              <div>
                <TextField label="Cantidad de pérdidas para reprobar" type="number" value={siee.numPerdidas}
                  onChange={e => setSiee({ ...siee, numPerdidas: e.target.value })}
                  slotProps={{ htmlInput: { min: 1, max: 20 } }} size="small" fullWidth />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 mb-4">
              <Checkbox checked={siee.aproximaPromedio}
                onChange={e => setSiee({ ...siee, aproximaPromedio: e.target.checked })}
                size="small" color="primary" />
              Aproximar promedios
            </label>

            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Escala de desempeños (cualitativo)</h3>
            <div className="overflow-x-auto mb-4">
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow className="!border-b !border-gray-200">
                      <TableCell className="!py-2 !pr-2 !pl-0 !font-semibold !text-xs !text-gray-500">Desempeño</TableCell>
                      <TableCell className="!py-2 !pr-2 !font-semibold !text-xs !text-gray-500">Desde</TableCell>
                      <TableCell className="!py-2 !pr-2 !font-semibold !text-xs !text-gray-500">Hasta</TableCell>
                      <TableCell className="!py-2 !font-semibold" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {siee.niveles.map((n, i) => (
                      <TableRow key={i} className="!border-b !border-gray-100">
                        <TableCell className="!py-1.5 !pr-2 !pl-0">
                          <TextField value={n.valor}
                            onChange={e => editarNivel(i, 'valor', e.target.value)}
                            size="small" fullWidth />
                        </TableCell>
                        <TableCell className="!py-1.5 !pr-2">
                          <TextField type="number" value={n.rangoMin}
                            onChange={e => editarNivel(i, 'rangoMin', e.target.value)}
                            slotProps={{ htmlInput: { min: 0, max: 5, step: 0.1 } }}
                            size="small" className="!w-24" />
                        </TableCell>
                        <TableCell className="!py-1.5 !pr-2">
                          <TextField type="number" value={n.rangoMax}
                            onChange={e => editarNivel(i, 'rangoMax', e.target.value)}
                            slotProps={{ htmlInput: { min: 0, max: 5, step: 0.1 } }}
                            size="small" className="!w-24" />
                        </TableCell>
                        <TableCell className="!py-1.5 !text-right">
                          <IconButton onClick={() => setSiee(prev => ({ ...prev, niveles: prev.niveles.filter((_, j) => j !== i) }))}
                            disabled={siee.niveles.length <= 1}
                            size="small" className="!text-red-500 hover:!bg-red-50 disabled:!opacity-40" title="Quitar nivel">
                            <Trash2 className="w-4 h-4" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
            <Button variant="outlined" color="primary" onClick={() => setSiee(prev => ({ ...prev, niveles: [...prev.niveles, { valor: '', rangoMin: '', rangoMax: '' }] }))}
              className="mb-4" startIcon={<Plus className="w-4 h-4" />}>
              Agregar desempeño
            </Button>

            <Button variant="contained" color="primary" onClick={guardarSiee} disabled={guardandoSiee}
              className="mt-2" startIcon={<Save className="w-4 h-4" />}>
              {guardandoSiee ? 'Guardando...' : 'Guardar política de evaluación'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}