import { useRef, useState } from 'react'
import { useAuth } from '../store/Auth'
import api from '../services/api.service'
import { Camera, Trash2, X, Loader2 } from 'lucide-react'
import { Alert, Button } from '@mui/material'

const ROL_LABEL = {
  super_admin: 'Dirección de Núcleo',
  admin: 'Administrador',
  rector: 'Rector',
  coordinador: 'Coordinador',
  docente: 'Docente',
  estudiante: 'Estudiante',
  acudiente: 'Acudiente',
  secretaria: 'Secretaría'
}

export default function Perfil() {
  const { usuario, actualizarUsuario } = useAuth()
  const fileRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [subiendo, setSubiendo] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  const seleccionar = (e) => {
    setError('')
    setExito('')
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setPreview(null)
      setError('La imagen supera el tamaño máximo permitido (2MB)')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    setPreview(URL.createObjectURL(file))
  }

  const subir = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setSubiendo(true)
    setError('')
    setExito('')
    try {
      const form = new FormData()
      form.append('archivo', file)
      const res = await api.post(`/usuarios/${usuario.id}/foto`, form, {
        headers: { 'Content-Type': undefined }
      })
      actualizarUsuario({ foto: res.data.data.foto })
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
      setExito('Foto de perfil actualizada')
    } catch (e) {
      setError(e.response?.data?.message || 'Error al subir la foto')
    } finally {
      setSubiendo(false)
    }
  }

  const quitar = async () => {
    setSubiendo(true)
    setError('')
    setExito('')
    try {
      await api.delete(`/usuarios/${usuario.id}/foto`)
      actualizarUsuario({ foto: null })
      setExito('Foto de perfil eliminada')
    } catch (e) {
      setError(e.response?.data?.message || 'Error al quitar la foto')
    } finally {
      setSubiendo(false)
    }
  }

  const inicial = (usuario?.nombreCompleto || usuario?.nombres || 'U').charAt(0).toUpperCase()

  const datos = [
    { label: 'Documento', value: usuario?.documento || '—' },
    { label: 'Email', value: usuario?.email || '—' },
    { label: 'Celular', value: usuario?.celular || '—' },
    { label: 'Rol', value: ROL_LABEL[usuario?.tipoPerfil] || usuario?.tipoPerfil }
  ]

  return (
    <div className="max-w-3xl space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <h1 className="text-xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-sm text-gray-500 mt-1">Gestiona tu foto de perfil y revisa tus datos.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center">
              {usuario?.foto ? (
                <img src={usuario.foto} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-primary-600">{inicial}</span>
              )}
            </div>
            {preview && (
              <div className="absolute -inset-1 rounded-full ring-2 ring-primary-500 flex items-center justify-center bg-black/40">
                <img src={preview} alt="Vista previa" className="w-full h-full rounded-full object-cover" />
              </div>
            )}
          </div>

          <div className="flex-1 w-full">
            <h2 className="text-lg font-bold text-gray-900">
              {usuario?.nombreCompleto || `${usuario?.nombres} ${usuario?.apellidos}`}
            </h2>
            <p className="text-sm text-gray-500 mb-4">{ROL_LABEL[usuario?.tipoPerfil] || usuario?.tipoPerfil}</p>

            <div className="flex flex-wrap gap-2">
              <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={seleccionar} className="hidden" />
              <Button
                variant="contained"
                color="primary"
                onClick={() => fileRef.current?.click()}
                startIcon={<Camera className="w-4 h-4" />}
              >
                {usuario?.foto ? 'Cambiar foto' : 'Subir foto'}
              </Button>
              {preview ? (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={subir}
                    disabled={subiendo}
                    startIcon={subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  >
                    Guardar
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = '' }}
                    className="!bg-gray-100 !text-gray-700 hover:!bg-gray-200"
                    startIcon={<X className="w-4 h-4" />}
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                usuario?.foto && (
                  confirmando ? (
                    <>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={quitar}
                        disabled={subiendo}
                        startIcon={subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      >
                        Confirmar
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => setConfirmando(false)}
                        disabled={subiendo}
                        className="!bg-gray-100 !text-gray-700 hover:!bg-gray-200"
                        startIcon={<X className="w-4 h-4" />}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => setConfirmando(true)}
                      disabled={subiendo}
                      className="!bg-red-50 !text-red-600 hover:!bg-red-100"
                      startIcon={<Trash2 className="w-4 h-4" />}
                    >
                      Quitar foto
                    </Button>
                  )
                )
              )}
            </div>
            <p className="text-xs text-gray-400 mt-3">Formatos: JPG o PNG · Máximo 2MB.</p>

            {error && (
              <Alert severity="error" className="mt-3">{error}</Alert>
            )}
            {exito && (
              <Alert severity="success" className="mt-3">{exito}</Alert>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos de contacto</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {datos.map((d) => (
            <div key={d.label}>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{d.label}</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{d.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}