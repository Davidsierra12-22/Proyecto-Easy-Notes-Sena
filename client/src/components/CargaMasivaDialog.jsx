import { useRef, useState } from 'react'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, IconButton, MenuItem, Select, FormControl, InputLabel } from '@mui/material'
import { X, UploadCloud, FileDown, Loader2 } from 'lucide-react'
import api from '../services/api.service'

/**
 * Dialog reutilizable para cargas masivas desde .xlsx/.csv
 * @param {Object} props
 * - titulo: string
 * - entidad: 'usuarios'|'areas'|'asignaturas'|'grupos' (define plantilla y endpoint)
 * - endpoint: string (ej: '/carga-masiva/usuarios')
 * - camposExtra: [{ name, label, options, required }] selectores enviados como formData (ej: anioAcademicoId)
 * - onCompletado: callback al terminar (para refrescar la tabla)
 */
export default function CargaMasivaDialog({ open, onClose, titulo, entidad, endpoint, camposExtra = [], onCompletado }) {
  const [archivo, setArchivo] = useState(null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState(null)
  const [descargando, setDescargando] = useState(false)
  const [extra, setExtra] = useState({})
  const fileRef = useRef(null)

  const cerrar = () => {
    if (subiendo) return
    setArchivo(null)
    setError('')
    setResultado(null)
    setExtra({})
    if (fileRef.current) fileRef.current.value = ''
    onClose()
  }

  const seleccionar = (e) => {
    setError('')
    const f = e.target.files?.[0]
    if (!f) return
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'csv'].includes(ext)) {
      setError('Formato no soportado. Usa .xlsx o .csv')
      setArchivo(null)
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('El archivo supera el tamaño máximo (10MB)')
      setArchivo(null)
      return
    }
    setArchivo(f)
    setResultado(null)
  }

  const validarExtra = () => {
    for (const campo of camposExtra) {
      if (campo.required && !extra[campo.name]) {
        setError(`Debes seleccionar: ${campo.label}`)
        return false
      }
    }
    return true
  }

  const importar = async () => {
    if (!archivo) {
      setError('Selecciona un archivo primero')
      return
    }
    if (!validarExtra()) return

    setSubiendo(true)
    setError('')
    setResultado(null)
    try {
      const fd = new FormData()
      fd.append('archivo', archivo)
      Object.entries(extra).forEach(([k, v]) => { if (v) fd.append(k, v) })
      const res = await api.post(endpoint, fd, { headers: { 'Content-Type': undefined } })
      setResultado(res.data.data)
      setArchivo(null)
      if (fileRef.current) fileRef.current.value = ''
      if (onCompletado) onCompletado()
    } catch (e) {
      setError(e.response?.data?.message || 'Error al importar el archivo')
    } finally {
      setSubiendo(false)
    }
  }

  const descargarPlantilla = async () => {
    setDescargando(true)
    setError('')
    try {
      const res = await api.get(`/carga-masiva/plantilla/${entidad}`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `plantilla_${entidad}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e.response?.data?.message || 'Error al descargar la plantilla')
    } finally {
      setDescargando(false)
    }
  }

  return (
    <Dialog open={open} onClose={cerrar} maxWidth="sm" fullWidth>
      <DialogTitle className="flex items-center justify-between pr-2">
        <span>{titulo}</span>
        <IconButton onClick={cerrar} aria-label="Cerrar" size="small">
          <X className="w-5 h-5" />
        </IconButton>
      </DialogTitle>
      <DialogContent className="!pt-2 space-y-4">
        <Alert severity="info" className="!text-xs">
          Descarga la plantilla, llena los datos en Excel y súbela. Las filas duplicadas u omitidas se reportan en el resumen.
        </Alert>

        {camposExtra.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {camposExtra.map(campo => (
              <FormControl key={campo.name} fullWidth size="small">
                <InputLabel>{campo.label}</InputLabel>
                <Select
                  label={campo.label}
                  value={extra[campo.name] || ''}
                  onChange={(e) => setExtra(prev => ({ ...prev, [campo.name]: e.target.value }))}
                >
                  <MenuItem value="">Seleccionar...</MenuItem>
                  {campo.options?.map(op => (
                    <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.csv"
            onChange={seleccionar}
            className="hidden"
          />
          <Button
            onClick={() => fileRef.current?.click()}
            variant="outlined"
            color="primary"
            startIcon={<UploadCloud className="w-4 h-4" />}
            className="!normal-case !text-primary-700 !border-primary-300 hover:!bg-primary-50"
          >
            {archivo ? archivo.name : 'Seleccionar archivo'}
          </Button>
          <Button
            onClick={descargarPlantilla}
            disabled={descargando}
            variant="text"
            startIcon={descargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            className="!normal-case !text-gray-700 hover:!bg-gray-100"
          >
            {descargando ? 'Descargando...' : 'Plantilla'}
          </Button>
        </div>

        {error && <Alert severity="error">{error}</Alert>}

        {subiendo && (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <CircularProgress size={20} className="!text-primary-600" />
            <span>Importando archivo... esto puede tardar unos segundos.</span>
          </div>
        )}

        {resultado && (
          <div className="space-y-3">
            <Alert severity={resultado.errores.length === 0 && resultado.omitidos.length === 0 ? 'success' : 'warning'}>
              <span className="font-medium">Resumen:</span>{' '}
              {resultado.total} fila(s) · {resultado.creados.length} creados ·{' '}
              {resultado.omitidos.length} omitidos · {resultado.errores.length} con error
            </Alert>

            {resultado.creados.length > 0 && resultado.creados[0]?.password && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 space-y-1 max-h-40 overflow-y-auto">
                <p className="text-xs font-semibold text-primary-800">Credenciales creadas (usuario = contraseña = documento):</p>
                {resultado.creados.slice(0, 50).map(c => (
                  <p key={c.fila} className="text-xs text-primary-700">
                    {c.fila} · {c.nombre || c.documento} → <span className="font-mono">{c.usuario}</span> / <span className="font-mono">{c.password}</span>
                  </p>
                ))}
                {resultado.creados.length > 50 && (
                  <p className="text-xs text-primary-700">...y {resultado.creados.length - 50} más</p>
                )}
              </div>
            )}

            {resultado.omitidos.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 max-h-40 overflow-y-auto">
                <p className="text-xs font-semibold text-amber-800">Omitidas:</p>
                {resultado.omitidos.map(o => (
                  <p key={o.fila} className="text-xs text-amber-700">Fila {o.fila}: {o.motivo}</p>
                ))}
              </div>
            )}

            {resultado.errores.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 max-h-40 overflow-y-auto">
                <p className="text-xs font-semibold text-red-800">Errores:</p>
                {resultado.errores.map((e, i) => (
                  <p key={i} className="text-xs text-red-700">Fila {e.fila}: {e.motivo}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
      <DialogActions className="!px-6 !pb-5">
        <Button onClick={cerrar} className="!text-gray-700 hover:!bg-gray-100">
          {resultado ? 'Cerrar' : 'Cancelar'}
        </Button>
        <Button
          onClick={importar}
          disabled={subiendo || !archivo}
          variant="contained"
          color="primary"
          startIcon={subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
        >
          {subiendo ? 'Importando...' : 'Importar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}