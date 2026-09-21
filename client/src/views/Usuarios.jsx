import { useState, useRef, useEffect } from 'react'
import CrudTable from '../components/Tables/CrudTable'
import { useAuth } from '../store/Auth'
import { useSede } from '../store/General'
import api from '../services/api.service'
import { KeyRound, X, ImagePlus, Trash2, Mail, Loader2 } from 'lucide-react'
import { Button, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material'

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'rector', label: 'Rector' },
  { value: 'coordinador', label: 'Coordinador' },
  { value: 'docente', label: 'Docente' },
  { value: 'estudiante', label: 'Estudiante' },
  { value: 'acudiente', label: 'Acudiente' },
  { value: 'secretaria', label: 'Secretaría' }
]

const TIPOS_DOC = [
  { value: 'RC', label: 'Registro Civil' },
  { value: 'TI', label: 'Tarjeta Identidad' },
  { value: 'CC', label: 'Cédula' },
  { value: 'CE', label: 'Cédula Extranjería' },
  { value: 'PAS', label: 'Pasaporte' }
]

const columnas = [
  { key: 'documento', label: 'Documento' },
  {
    key: 'tipoDocumento', label: 'Tipo',
    render: (u) => TIPOS_DOC.find(t => t.value === u.tipoDocumento)?.label || u.tipoDocumento
  },
  {
    key: 'nombreCompleto', label: 'Nombre Completo',
    render: (u) => `${u.nombres} ${u.apellidos}`
  },
  {
    key: 'institucionId', label: 'Colegio',
    render: (u) => u.institucionId?.nombre || '—'
  },
  {
    key: 'roles', label: 'Rol',
    render: (u) => {
      const roles = u.roles && u.roles.length ? u.roles : [u.tipoPerfil]
      return (
        <div className="flex flex-wrap gap-1">
          {roles.map(rol => {
            const activo = rol === u.tipoPerfil
            return (
              <span key={rol} className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                activo
                  ? (rol === 'admin' || rol === 'super_admin' ? 'bg-primary-600 text-white' : rol === 'docente' ? 'bg-primary-100 text-primary-800' : 'bg-emerald-100 text-emerald-700')
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {ROL_LABEL[rol] || rol}
                {activo && <span className="ml-1">·</span>}
              </span>
            )
          })}
        </div>
      )
    }
  },
  { key: 'email', label: 'Email', render: (u) => u.email || '—' },
  { key: 'celular', label: 'Celular', render: (u) => u.celular || '—' },
  {
    key: 'estado', label: 'Estado',
    render: (u) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        u.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
      }`}>
        {u.estado}
      </span>
    )
  }
]

const campos = [
  { name: 'tipoDocumento', label: 'Tipo Documento', type: 'select', options: TIPOS_DOC, required: true },
  { name: 'documento', label: 'N° Documento', required: true, placeholder: 'Ej: 123456789', inputMode: 'numeric', pattern: '[0-9]{6,12}' },
  { name: 'nombres', label: 'Nombres', required: true },
  { name: 'apellidos', label: 'Apellidos', required: true },
  { name: 'tipoPerfil', label: 'Rol principal', type: 'select', options: ROLES, required: true },
  { name: 'roles', label: 'Roles (multi-perfil)', type: 'multiSelect', options: ROLES, getOptions: (form) => rolesSecundariosPara(form.tipoPerfil), colSpan: 2, max: 1, dependsOn: 'tipoPerfil', hint: 'Solo puedes elegir 1 perfil adicional (máximo 2 en total)' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'celular', label: 'Celular' },
  { name: 'telefono', label: 'Teléfono' },
  { name: 'genero', label: 'Género', type: 'select', options: [{value:'M',label:'Masculino'},{value:'F',label:'Femenino'},{value:'O',label:'Otro'}] },
  { name: 'estrato', label: 'Estrato', type: 'number' },
  { name: 'fechaNacimiento', label: 'Fecha Nacimiento', type: 'date', colSpan: 2 },
  { name: 'direccion', label: 'Dirección', colSpan: 2 },
  { name: 'eps', label: 'EPS' }
]

const ROL_LABEL = Object.fromEntries(ROLES.map(r => [r.value, r.label]))

const ROLES_SECUNDARIOS_PERMITIDOS = {
  super_admin: ['admin', 'rector', 'coordinador', 'docente', 'secretaria'],
  admin: ['rector', 'coordinador', 'docente', 'secretaria'],
  rector: ['admin', 'coordinador', 'docente', 'secretaria'],
  coordinador: ['rector', 'docente'],
  docente: ['coordinador', 'acudiente'],
  estudiante: [],
  acudiente: [],
  secretaria: []
}

const rolesSecundariosPara = (tipoPerfil) => {
  const permitidos = ROLES_SECUNDARIOS_PERMITIDOS[tipoPerfil] || []
  return ROLES.filter(r => permitidos.includes(r.value))
}

const validarUsuario = (form) => {
  const errores = {}

  if (!form.tipoDocumento) errores.tipoDocumento = 'Selecciona el tipo de documento'

  if (!form.documento || !form.documento.toString().trim()) {
    errores.documento = 'El número de documento es obligatorio'
  } else if (!/^\d{6,12}$/.test(form.documento.toString().trim())) {
    errores.documento = 'El documento debe tener entre 6 y 12 dígitos numéricos'
  }

  if (!form.nombres || !form.nombres.trim()) {
    errores.nombres = 'Los nombres son obligatorios'
  } else if (form.nombres.trim().length < 2) {
    errores.nombres = 'Los nombres deben tener al menos 2 caracteres'
  } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(form.nombres.trim())) {
    errores.nombres = 'Los nombres solo pueden contener letras y espacios'
  }

  if (!form.apellidos || !form.apellidos.trim()) {
    errores.apellidos = 'Los apellidos son obligatorios'
  } else if (form.apellidos.trim().length < 2) {
    errores.apellidos = 'Los apellidos deben tener al menos 2 caracteres'
  } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(form.apellidos.trim())) {
    errores.apellidos = 'Los apellidos solo pueden contener letras y espacios'
  }

  if (!form.tipoPerfil) errores.tipoPerfil = 'Selecciona el rol principal'

  if (form.email && form.email.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errores.email = 'Ingresa un correo electrónico válido'
    }
  }

  if (form.celular && form.celular.trim()) {
    if (!/^\d{7,10}$/.test(form.celular.trim())) {
      errores.celular = 'El celular debe tener entre 7 y 10 dígitos'
    }
  }

  if (form.telefono && form.telefono.trim()) {
    if (!/^\d{7,10}$/.test(form.telefono.trim())) {
      errores.telefono = 'El teléfono debe tener entre 7 y 10 dígitos'
    }
  }

  if (form.estrato !== undefined && form.estrato !== '' && form.estrato !== null) {
    const est = Number(form.estrato)
    if (isNaN(est) || est < 1 || est > 6) {
      errores.estrato = 'El estrato debe ser un número entre 1 y 6'
    }
  }

  if (form.fechaNacimiento) {
    const fecha = new Date(form.fechaNacimiento)
    if (isNaN(fecha.getTime())) {
      errores.fechaNacimiento = 'Fecha inválida'
    } else if (fecha > new Date()) {
      errores.fechaNacimiento = 'La fecha de nacimiento no puede ser en el futuro'
    }
  }

  return errores
}

export default function Usuarios() {
  const { usuario } = useAuth()
  const { sedes, sedeId } = useSede()
  const rolActual = usuario?.tipoPerfil

  const puedeGestionar = ['super_admin', 'admin', 'secretaria'].includes(rolActual)
  const esSuperAdmin = rolActual === 'super_admin'

  const [instituciones, setInstituciones] = useState([])

  useEffect(() => {
    api.get('/instituciones').then(r => {
      setInstituciones(r.data.data.map(i => ({ value: i._id, label: i.nombre })))
    }).catch(() => {})
  }, [])

  const camposSelectorColegio = esSuperAdmin
    ? [{ name: 'institucionId', label: 'Colegio', type: 'select', options: instituciones, required: true }]
    : []

  const filtros = esSuperAdmin
    ? [
        { name: 'institucionId', label: 'Colegio', options: instituciones },
        { name: 'tipoPerfil', label: 'Rol', options: ROLES }
      ]
    : undefined

  const [modal, setModal] = useState(null) // { mode: 'reset'|'result', user, result? }
  const [resetPass, setResetPass] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState('')
  const [enviandoCorreo, setEnviandoCorreo] = useState(false)
  const [envioMsg, setEnvioMsg] = useState(null)
  const [credResult, setCredResult] = useState(null)

  const [fotoUser, setFotoUser] = useState(null)
  const fotoRef = useRef(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [fotoSubiendo, setFotoSubiendo] = useState(false)
  const [fotoError, setFotoError] = useState('')

  const abrirFoto = (u) => {
    setFotoUser(u)
    setFotoPreview(null)
    setFotoError('')
    if (fotoRef.current) fotoRef.current.value = ''
  }

  const seleccionarFoto = (e) => {
    setFotoError('')
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setFotoPreview(null)
      setFotoError('La imagen supera el tamaño máximo permitido (2MB)')
      if (fotoRef.current) fotoRef.current.value = ''
      return
    }
    setFotoPreview(URL.createObjectURL(file))
  }

  const subirFoto = async () => {
    const file = fotoRef.current?.files?.[0]
    if (!file) return
    setFotoSubiendo(true)
    setFotoError('')
    try {
      const form = new FormData()
      form.append('archivo', file)
      await api.post(`/usuarios/${fotoUser._id}/foto`, form, { headers: { 'Content-Type': undefined } })
      setFotoUser(null)
      setFotoPreview(null)
    } catch (e) {
      setFotoError(e.response?.data?.message || 'Error al subir la foto')
    } finally {
      setFotoSubiendo(false)
    }
  }

  const quitarFoto = async () => {
    if (!window.confirm(`¿Quitar la foto de ${fotoUser.nombres} ${fotoUser.apellidos}?`)) return
    setFotoSubiendo(true)
    setFotoError('')
    try {
      await api.delete(`/usuarios/${fotoUser._id}/foto`)
      setFotoUser(null)
      setFotoPreview(null)
    } catch (e) {
      setFotoError(e.response?.data?.message || 'Error al quitar la foto')
    } finally {
      setFotoSubiendo(false)
    }
  }

  const abrirReset = (u) => {
    setModal({ mode: 'reset', user: u })
    setResetPass('')
    setResetError('')
    setCredResult(null)
    setEnvioMsg(null)
  }

  const guardarReset = async () => {
    if (resetPass.trim() && resetPass.trim().length < 6) {
      setResetError('La contraseña debe tener mínimo 6 caracteres')
      return
    }
    setResetting(true)
    setResetError('')
    setCredResult(null)
    setEnvioMsg(null)
    try {
      const body = resetPass.trim() ? { password: resetPass.trim() } : {}
      const res = await api.post(`/usuarios/${modal.user._id}/notificar-credenciales`, body)
      setCredResult({ usuario: res.data?.data?.usuario, password: res.data?.data?.password })
      setResetPass('')
      if (res.data?.data?.enviado) {
        setEnvioMsg({ tipo: 'ok', texto: res.data.message })
      } else {
        setEnvioMsg({ tipo: 'warn', texto: res.data.message || 'No se pudo enviar el correo. Entrega las credenciales manualmente' })
      }
    } catch (e) {
      setResetError(e.response?.data?.message || 'Error al restablecer y enviar credenciales')
    } finally {
      setResetting(false)
    }
  }

  const enviarCredenciales = async () => {
    if (!modal?.user?.email && !modal?.user?._id) return
    setEnviandoCorreo(true)
    setEnvioMsg(null)
    try {
      const res = await api.post(`/usuarios/${modal.user._id}/notificar-credenciales`, { password: modal.result.password })
      if (res.data?.data) {
        setModal((m) => ({ ...m, result: { ...m.result, password: res.data.data.password } }))
      }
      if (res.data?.data?.enviado) {
        setEnvioMsg({ tipo: 'ok', texto: res.data.message })
      } else {
        setEnvioMsg({ tipo: 'warn', texto: res.data.message })
      }
    } catch (e) {
      setEnvioMsg({ tipo: 'err', texto: e.response?.data?.message || 'Error al enviar el correo' })
    } finally {
      setEnviandoCorreo(false)
    }
  }

  const cerrarModal = () => {
    setModal(null)
    setResetPass('')
    setResetError('')
    setEnvioMsg(null)
    setCredResult(null)
  }

  const cols = esSuperAdmin
    ? columnas
    : [
        ...columnas.slice(0, 4),
        {
          key: 'sedeId', label: 'Sede',
          render: (u) => {
            const s = sedes.find(x => x._id === u.sedeId)
            return s ? s.nombre : '—'
          }
        },
        ...columnas.slice(4)
      ]

  const marcarProtegidos = (datos) => datos?.map(u => ({
    ...u,
    _protegido: u._id === usuario?.id || (u.tipoPerfil === 'super_admin' && !esSuperAdmin)
  }))

  return (
    <>
      <CrudTable
        titulo="Gestión de Usuarios"
        baseURL="/usuarios"
        columnas={cols}
        campos={[...camposSelectorColegio, ...campos]}
        filtros={filtros}
        parametrosForzados={sedeId ? { sedeId } : {}}
        puedeGestionar={puedeGestionar}
        puedeDesactivar={['super_admin', 'admin'].includes(rolActual)}
        transformDatos={marcarProtegidos}
        validate={validarUsuario}
        onAfterSave={(creado) => {
          if (creado) {
            setEnvioMsg(null)
            setModal({ mode: 'result', user: creado, result: { usuario: creado.documento, password: creado.documento }, recienCreado: true })
          }
        }}
        renderAcciones={(u) => (
          u._protegido ? null : (
            <>
              <IconButton
                onClick={() => abrirReset(u)}
                aria-label="Restablecer contrasena"
                title="Restablecer contraseña y enviar credenciales"
                size="small"
                className="!text-amber-600 hover:!text-amber-800 rounded-lg hover:!bg-amber-50"
              >
                <KeyRound className="w-4 h-4" />
              </IconButton>
              <IconButton
                onClick={() => abrirFoto(u)}
                aria-label="Subir foto de perfil"
                title="Subir foto de perfil"
                size="small"
                className="!text-primary-600 hover:!text-primary-800 rounded-lg hover:!bg-primary-50"
              >
                <ImagePlus className="w-4 h-4" />
              </IconButton>
            </>
          )
        )}
      />

      <Dialog
        open={Boolean(fotoUser)}
        onClose={() => setFotoUser(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between pr-2">
          <span>Foto de perfil</span>
          <IconButton onClick={() => setFotoUser(null)} aria-label="Cerrar modal de foto" size="small">
            <X className="w-5 h-5" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!pt-2 space-y-4">
          <p className="text-sm text-gray-700">
            <span className="font-medium">{fotoUser?.nombres} {fotoUser?.apellidos}</span>
            <span className="text-gray-500"> · Doc: {fotoUser?.documento}</span>
          </p>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center shrink-0">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Vista previa" className="w-full h-full object-cover" />
              ) : fotoUser?.foto ? (
                <img src={fotoUser.foto} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-primary-600">
                  {(fotoUser?.nombres || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fotoRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={seleccionarFoto}
                className="hidden"
              />
              <Button
                onClick={() => fotoRef.current?.click()}
                variant="contained"
                color="primary"
                startIcon={<ImagePlus className="w-4 h-4" />}
                className="!py-2 !px-4 !normal-case"
              >
                Seleccionar archivo
              </Button>
              {fotoUser?.foto && (
                <Button
                  onClick={quitarFoto}
                  disabled={fotoSubiendo}
                  variant="text"
                  color="error"
                  startIcon={<Trash2 className="w-4 h-4" />}
                  className="!py-2 !px-4 !normal-case !bg-red-50 hover:!bg-red-100 disabled:!opacity-50"
                >
                  Quitar
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400">JPG o PNG · Máximo 2MB.</p>

          {fotoError && (
            <Alert severity="error">{fotoError}</Alert>
          )}
        </DialogContent>
        <DialogActions className="!px-6 !pb-5">
          <Button onClick={() => setFotoUser(null)} className="!text-gray-700 hover:!bg-gray-100">
            Cancelar
          </Button>
          <Button onClick={subirFoto} disabled={fotoSubiendo || !fotoPreview} variant="contained" color="primary">
            {fotoSubiendo ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(modal)} onClose={cerrarModal} maxWidth="xs" fullWidth>
        <DialogTitle className="flex items-center justify-between pr-2">
          <span>
            {modal?.mode === 'reset' ? 'Restablecer contraseña y enviar credenciales' : 'Contraseña'}
          </span>
          <IconButton onClick={cerrarModal} aria-label="Cerrar modal de contraseña" size="small">
            <X className="w-5 h-5" />
          </IconButton>
        </DialogTitle>

        {modal?.mode === 'reset' ? (
          <form onSubmit={(e) => { e.preventDefault(); guardarReset() }}>
            <DialogContent className="!pt-2 space-y-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">{modal?.user?.nombres} {modal?.user?.apellidos}</span>
                <span className="text-gray-500"> · Doc: {modal?.user?.documento}</span>
              </p>

              <TextField
                label="Nueva contraseña temporal"
                type="text"
                value={resetPass}
                onChange={(e) => { setResetPass(e.target.value); setResetError('') }}
                autoFocus
                placeholder="Vacío = se genera una temporal"
                fullWidth
              />
              <p className="text-xs text-gray-400 -mt-2">Mínimo 6 caracteres. Si la dejas vacía se generará una contraseña temporal.</p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Correo:</span> {modal?.user?.email || 'Sin email registrado'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Se enviarán las credenciales a este correo. Si está mal, edítalo primero en la fila del usuario.
                </p>
              </div>

              {credResult && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 space-y-1">
                  <p className="text-sm text-gray-700"><span className="font-medium">Usuario:</span> {credResult.usuario}</p>
                  <p className="text-sm text-gray-700"><span className="font-medium">Contraseña:</span> {credResult.password}</p>
                </div>
              )}

              {envioMsg && (
                <Alert severity={envioMsg.tipo === 'ok' ? 'success' : envioMsg.tipo === 'warn' ? 'warning' : 'error'}>
                  {envioMsg.texto}
                </Alert>
              )}

              {resetError && (
                <Alert severity="error">{resetError}</Alert>
              )}
            </DialogContent>
            <DialogActions className="!px-6 !pb-5">
              <Button type="button" onClick={cerrarModal} className="!text-gray-700 hover:!bg-gray-100">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={resetting}
                variant="contained"
                color="primary"
                startIcon={resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              >
                {resetting ? 'Guardando...' : 'Guardar y enviar credenciales'}
              </Button>
            </DialogActions>
          </form>
        ) : (
          <>
            <DialogContent className="!pt-2 space-y-4">
              <p className="text-sm text-gray-700">
                {modal?.recienCreado
                  ? `Usuario creado. Entrega estas credenciales a ${modal?.user?.nombres} ${modal?.user?.apellidos}:`
                  : `Contraseña restablecida para ${modal?.user?.nombres} ${modal?.user?.apellidos}:`}
              </p>
              <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 space-y-1">
                <p className="text-sm text-gray-700"><span className="font-medium">Usuario:</span> {modal?.result?.usuario}</p>
                <p className="text-sm text-gray-700"><span className="font-medium">Contraseña:</span> {modal?.result?.password}</p>
              </div>
              <p className="text-xs text-gray-500">El usuario deberá cambiar la contraseña en su primer ingreso.</p>

              <Button
                onClick={enviarCredenciales}
                disabled={enviandoCorreo || !modal?.user?.email}
                title={modal?.user?.email ? '' : 'El usuario no tiene email registrado'}
                variant="text"
                color="primary"
                fullWidth
                className="!text-primary-700 !bg-primary-50 hover:!bg-primary-100 !normal-case disabled:!opacity-50 disabled:!cursor-not-allowed"
                startIcon={enviandoCorreo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              >
                {enviandoCorreo
                  ? 'Enviando...'
                  : `Enviar credenciales al correo${modal?.user?.email ? ` (${modal?.user?.email})` : ''}`}
              </Button>

              {envioMsg && (
                <Alert severity={envioMsg.tipo === 'ok' ? 'success' : envioMsg.tipo === 'warn' ? 'warning' : 'error'}>
                  {envioMsg.texto}
                </Alert>
              )}
            </DialogContent>
            <DialogActions className="!px-6 !pb-5">
              <Button onClick={cerrarModal} variant="contained" color="primary">
                Aceptar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  )
}