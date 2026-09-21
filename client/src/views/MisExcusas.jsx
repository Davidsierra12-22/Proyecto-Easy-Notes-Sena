import { useEffect, useState } from 'react'
import {
  Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, IconButton, MenuItem, Select, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material'
import { Plus, X, Stethoscope } from 'lucide-react'
import api from '../services/api.service'
import { useEstudiante } from '../hooks/useEstudiante'

const estadoBadge = (estado) => {
  const map = {
    pendiente: 'bg-amber-100 text-amber-700',
    aprobada: 'bg-emerald-100 text-emerald-700',
    rechazada: 'bg-red-100 text-red-700'
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[estado] || 'bg-gray-100 text-gray-600'}`}>{estado}</span>
}

export default function MisExcusas() {
  const { matricula, loading: cargaMatricula } = useEstudiante()
  const [excusas, setExcusas] = useState([])
  const [docentes, setDocentes] = useState([])
  const [cargas, setCargas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const grupoId = matricula?.grupoId
  const anioId = matricula?.anioAcademicoId

  const cargarTodo = async () => {
    setLoading(true)
    setError('')
    try {
      const [resExc, resDoc] = await Promise.all([
        api.get('/excusas'),
        api.get('/usuarios?tipoPerfil=docente')
      ])
      setExcusas(resExc.data.data || [])
      setDocentes(resDoc.data.data || [])
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar excusas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarTodo() }, [])

  useEffect(() => {
    if (!grupoId) return
    api.get(`/carga-academica/grupo/${grupoId}`).then(r => setCargas(r.data.data || [])).catch(() => {})
  }, [grupoId])

  const misDocentes = []
  const vistos = new Set()
  cargas.forEach(c => {
    const id = String(c.docenteId)
    if (!vistos.has(id)) {
      vistos.add(id)
      const d = docentes.find(x => String(x._id) === id)
      if (d) misDocentes.push(d)
    }
  })

  const abrirCrear = () => {
    setForm({ fechaInicio: new Date().toISOString().slice(0, 10), fechaFin: new Date().toISOString().slice(0, 10), motivo: '', sinSoporte: true, soporteDocumental: '', docenteId: '' })
    setError('')
    setModal(true)
  }

  const crear = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/excusas', {
        ...form,
        anioAcademicoId: anioId,
        soporteDocumental: form.sinSoporte ? undefined : form.soporteDocumental
      })
      setModal(false)
      await cargarTodo()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear la excusa')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mis Excusas</h1>
              <p className="text-sm text-gray-500">Registra tus inasistencias ante tus docentes</p>
            </div>
          </div>
          <Button onClick={abrirCrear} disabled={!anioId} variant="contained" color="primary" className="!normal-case text-sm font-medium !px-4 !py-2" startIcon={<Plus className="w-4 h-4" />}>
            Nueva Excusa
          </Button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

        {cargaMatricula || loading ? (
          <div className="flex justify-center py-12">
            <CircularProgress size={28} className="!text-primary-600" />
          </div>
        ) : excusas.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No tienes excusas registradas.</p>
        ) : (
          <TableContainer className="overflow-x-auto">
            <Table size="small" className="min-w-full divide-y divide-gray-200">
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="!px-4 !py-3 !text-left !text-xs !font-semibold !text-gray-500 !uppercase">Docente</TableCell>
                  <TableCell className="!px-4 !py-3 !text-left !text-xs !font-semibold !text-gray-500 !uppercase">Periodo</TableCell>
                  <TableCell className="!px-4 !py-3 !text-left !text-xs !font-semibold !text-gray-500 !uppercase">Motivo</TableCell>
                  <TableCell className="!px-4 !py-3 !text-left !text-xs !font-semibold !text-gray-500 !uppercase">Estado</TableCell>
                  <TableCell className="!px-4 !py-3 !text-left !text-xs !font-semibold !text-gray-500 !uppercase">Observaciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody className="bg-white divide-y divide-gray-200">
                {excusas.map(x => (
                  <TableRow key={x._id} hover>
                    <TableCell className="!px-4 !py-3 !text-sm !font-medium !text-gray-900">
                      {docentes.find(d => String(d._id) === String(x.docenteId))?.nombres || '—'} {docentes.find(d => String(d._id) === String(x.docenteId))?.apellidos || ''}
                    </TableCell>
                    <TableCell className="!px-4 !py-3 !text-sm !text-gray-700">
                      {new Date(x.fechaInicio).toLocaleDateString('es-CO')} → {new Date(x.fechaFin).toLocaleDateString('es-CO')}
                    </TableCell>
                    <TableCell className="!px-4 !py-3 !text-sm !text-gray-700 !max-w-xs !truncate">{x.motivo}</TableCell>
                    <TableCell className="!px-4 !py-3 !text-sm">{estadoBadge(x.estado || 'pendiente')}</TableCell>
                    <TableCell className="!px-4 !py-3 !text-sm !text-gray-500 !max-w-xs !truncate">{x.observaciones || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>

      <Dialog open={modal} onClose={() => setModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="flex items-center justify-between pr-2">
          <span>Nueva excusa</span>
          <IconButton onClick={() => { setModal(false); setError('') }} aria-label="Cerrar modal de excusa" size="small" className="!text-gray-400 hover:!text-gray-600">
            <X className="w-5 h-5" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={crear}>
          <DialogContent className="!pt-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Docente <span className="text-red-500">*</span></label>
                <FormControl fullWidth size="small">
                  <Select value={form.docenteId || ''} onChange={(e) => setForm({ ...form, docenteId: e.target.value })} required displayEmpty className="text-sm">
                    <MenuItem value="">Seleccionar...</MenuItem>
                    {(misDocentes.length ? misDocentes : docentes).map(d => (
                      <MenuItem key={d._id} value={d._id}>{d.nombres} {d.apellidos}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio <span className="text-red-500">*</span></label>
                <TextField type="date" value={form.fechaInicio || ''} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} required fullWidth className="text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin <span className="text-red-500">*</span></label>
                <TextField type="date" value={form.fechaFin || ''} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} required fullWidth className="text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo <span className="text-red-500">*</span></label>
                <TextField value={form.motivo || ''} onChange={(e) => setForm({ ...form, motivo: e.target.value })} required multiline minRows={3} placeholder="Describe el motivo de la inasistencia" fullWidth className="text-sm" />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <Checkbox checked={form.sinSoporte !== false} onChange={(e) => setForm({ ...form, sinSoporte: e.target.checked })} size="small" color="primary" />
                  No tengo soporte documental
                </label>
              </div>
              {form.sinSoporte === false && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Soporte documental</label>
                  <TextField type="text" value={form.soporteDocumental || ''} onChange={(e) => setForm({ ...form, soporteDocumental: e.target.value })} placeholder="URL o referencia del soporte" fullWidth className="text-sm" />
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mt-4">{error}</div>
            )}
          </DialogContent>
          <DialogActions className="!px-6 !pb-5">
            <Button onClick={() => { setModal(false); setError('') }} className="!text-gray-700 hover:!bg-gray-100">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} variant="contained" color="primary">
              {saving ? 'Guardando...' : 'Enviar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  )
}