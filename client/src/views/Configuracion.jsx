import { useEffect, useState } from 'react'
import { Building2, GraduationCap, Save, Plus, Trash2, RefreshCw, Settings2 } from 'lucide-react'
import {
  Alert, Button, Checkbox, FormControl, IconButton, InputLabel, MenuItem, Select,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField
} from '@mui/material'
import api from '../services/api.service'
import { useAuth } from '../store/Auth'
import { notificar } from '../store/notificacionStore'
import { GRADOS_ESTANDAR as GRADOS_ESTANDAR_LIST } from '../constants/grados'

const GRADOS_ESTANDAR = GRADOS_ESTANDAR_LIST

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
    const limpiados = grados
      .filter(g => g.numero !== '' && g.nombre.trim() !== '')
      .sort((a, b) => a.numero - b.numero)
    const usados = new Set()
    for (const g of limpiados) {
      if (usados.has(g.numero)) {
        setError(`El grado ${g.numero} está repetido. Revisa la lista antes de guardar.`)
        return
      }
      usados.add(g.numero)
    }
    setGuardandoGrados(true)
    setError('')
    setExito('')
    try {
      await api.put(`/instituciones/${institucion._id}`, {
        configuracion: { ...(configuracion || {}), grados: limpiados }
      })
      await cargar()
      notificar('Grados guardados', 'success')
    } catch (e) {
      setError(e.response?.data?.message || 'Error al guardar grados')
    } finally {
      setGuardandoGrados(false)
    }
  }

  const editarGrado = (numero, campo, valor) => {
    setGrados(prev => prev.map(g => String(g.numero) === String(numero) ? { ...g, [campo]: valor } : g))
  }

  const quitarGrado = (numero) => {
    setGrados(prev => prev.filter(g => String(g.numero) !== String(numero)))
  }

  const agregarGradosEstandar = () => {
    setGrados(prev => {
      const faltantes = GRADOS_ESTANDAR
        .filter(e => !prev.some(g => String(g.numero) === String(e.numero)))
        .map(e => ({ numero: e.numero, nombre: e.nombre }))
      if (!faltantes.length) return prev
      return [...prev, ...faltantes].sort((a, b) => a.numero - b.numero)
    })
  }

  const agregarGrado = () => {
    const usados = new Set(grados.map(g => Number(g.numero) || 0))
    let numero = 0
    while (usados.has(numero)) numero++
    setGrados(prev => [...prev, { numero, nombre: '' }])
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
            <p className="text-xs text-gray-500 mb-4">
              Lista los grados que ofrece el colegio. Edita los nombres, quita los que no usas o agrega grados personalizados.
            </p>

            <div className="space-y-2 mb-4">
              {grados
                .slice()
                .sort((a, b) => a.numero - b.numero)
                .map((g) => (
                  <div key={`${g.numero}`} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <span className="text-sm font-semibold text-gray-400 w-14 shrink-0">Grado {g.numero}</span>
                    <TextField
                      value={g.nombre}
                      onChange={(e) => editarGrado(g.numero, 'nombre', e.target.value)}
                      size="small"
                      fullWidth
                      placeholder="Nombre del grado"
                    />
                    <IconButton onClick={() => quitarGrado(g.numero)} size="small" className="!text-red-500 hover:!bg-red-50" title="Quitar grado">
                      <Trash2 className="w-4 h-4" />
                    </IconButton>
                  </div>
                ))}
              {grados.length === 0 && (
                <p className="text-sm text-gray-500">Aún no has agregado grados. Usa el botón de abajo para añadir los grados estándar (Preescolar a Once).</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={agregarGradosEstandar}
                disabled={GRADOS_ESTANDAR.every(e => grados.some(g => String(g.numero) === String(e.numero)))}
                startIcon={<Plus className="w-4 h-4" />}
                className="!normal-case"
              >
                Añadir grados estándar (Preescolar a Once)
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={agregarGrado}
                startIcon={<Plus className="w-4 h-4" />}
                className="!normal-case"
              >
                Agregar grado
              </Button>
            </div>

            <Button variant="contained" color="primary" onClick={guardarGrados} disabled={guardandoGrados}
              className="mt-1" startIcon={<Save className="w-4 h-4" />}>
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