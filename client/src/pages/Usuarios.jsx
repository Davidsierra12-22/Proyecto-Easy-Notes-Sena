import { useState, useRef, useEffect } from 'react'
import CrudTable from '../components/CrudTable'
import { useAuth } from '../context/AuthContext'
import { useSede } from '../context/SedeContext'
import api from '../services/api'
import { KeyRound, X, ImagePlus, Trash2, Mail, Loader2 } from 'lucide-react'

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
  { name: 'documento', label: 'N° Documento', required: true, placeholder: 'Ej: 123456789' },
  { name: 'nombres', label: 'Nombres', required: true },
  { name: 'apellidos', label: 'Apellidos', required: true },
  { name: 'tipoPerfil', label: 'Rol principal', type: 'select', options: ROLES, required: true },
  { name: 'roles', label: 'Roles (multi-perfil)', type: 'multiSelect', options: ROLES, colSpan: 2, max: 1, hint: 'Solo puedes elegir 1 perfil adicional (máximo 2 en total)' },
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
        onAfterSave={(creado) => {
          if (creado) {
            setEnvioMsg(null)
            setModal({ mode: 'result', user: creado, result: { usuario: creado.documento, password: creado.documento }, recienCreado: true })
          }
        }}
        renderAcciones={(u) => (
          u._protegido ? null : (
            <>
              <button
                onClick={() => abrirReset(u)}
                aria-label="Restablecer contrasena"
                title="Restablecer contraseña y enviar credenciales"
                className="p-1.5 text-amber-600 hover:text-amber-800 rounded-lg hover:bg-amber-50"
              >
                <KeyRound className="w-4 h-4" />
              </button>
              <button
                onClick={() => abrirFoto(u)}
                aria-label="Subir foto de perfil"
                title="Subir foto de perfil"
                className="p-1.5 text-primary-600 hover:text-primary-800 rounded-lg hover:bg-primary-50"
              >
                <ImagePlus className="w-4 h-4" />
              </button>
            </>
          )
        )}
      />

      {fotoUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFotoUser(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Foto de perfil</h2>
              <button onClick={() => setFotoUser(null)} aria-label="Cerrar modal de foto" className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">{fotoUser.nombres} {fotoUser.apellidos}</span>
                <span className="text-gray-500"> · Doc: {fotoUser.documento}</span>
              </p>

              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center shrink-0">
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="Vista previa" className="w-full h-full object-cover" />
                  ) : fotoUser.foto ? (
                    <img src={fotoUser.foto} alt="Foto de perfil" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-primary-600">
                      {(fotoUser.nombres || 'U').charAt(0).toUpperCase()}
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
                  <button
                    onClick={() => fotoRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
                  >
                    <ImagePlus className="w-4 h-4" /> Seleccionar archivo
                  </button>
                  {fotoUser.foto && (
                    <button
                      onClick={quitarFoto}
                      disabled={fotoSubiendo}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" /> Quitar
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400">JPG o PNG · Máximo 2MB.</p>

              {fotoError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
                  {fotoError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setFotoUser(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={subirFoto}
                  disabled={fotoSubiendo || !fotoPreview}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50"
                >
                  {fotoSubiendo ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={cerrarModal} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {modal.mode === 'reset' ? 'Restablecer contraseña y enviar credenciales' : 'Contraseña'}
              </h2>
              <button onClick={cerrarModal} aria-label="Cerrar modal de contraseña" className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modal.mode === 'reset' ? (
              <form
                onSubmit={(e) => { e.preventDefault(); guardarReset() }}
                className="p-6 space-y-4"
              >
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{modal.user.nombres} {modal.user.apellidos}</span>
                  <span className="text-gray-500"> · Doc: {modal.user.documento}</span>
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva contraseña temporal
                  </label>
                  <input
                    type="text"
                    value={resetPass}
                    onChange={(e) => { setResetPass(e.target.value); setResetError('') }}
                    autoFocus
                    placeholder="Vacío = se genera una temporal"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Mínimo 6 caracteres. Si la dejas vacía se generará una contraseña temporal.</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Correo:</span> {modal.user.email || 'Sin email registrado'}
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
                  <div
                    className={
                      envioMsg.tipo === 'ok'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-3 py-2'
                        : envioMsg.tipo === 'warn'
                          ? 'bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-3 py-2'
                          : 'bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2'
                    }
                  >
                    {envioMsg.texto}
                  </div>
                )}

                {resetError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
                    {resetError}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={resetting}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50"
                  >
                    {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    {resetting ? 'Guardando...' : 'Guardar y enviar credenciales'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-700">
                  {modal.recienCreado
                    ? `Usuario creado. Entrega estas credenciales a ${modal.user.nombres} ${modal.user.apellidos}:`
                    : `Contraseña restablecida para ${modal.user.nombres} ${modal.user.apellidos}:`}
                </p>
                <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 space-y-1">
                  <p className="text-sm text-gray-700"><span className="font-medium">Usuario:</span> {modal.result.usuario}</p>
                  <p className="text-sm text-gray-700"><span className="font-medium">Contraseña:</span> {modal.result.password}</p>
                </div>
                <p className="text-xs text-gray-500">El usuario deberá cambiar la contraseña en su primer ingreso.</p>

                <button
                  onClick={enviarCredenciales}
                  disabled={enviandoCorreo || !modal.user.email}
                  title={modal.user.email ? '' : 'El usuario no tiene email registrado'}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enviandoCorreo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  {enviandoCorreo
                    ? 'Enviando...'
                    : `Enviar credenciales al correo${modal.user.email ? ` (${modal.user.email})` : ''}`}
                </button>

                {envioMsg && (
                  <div
                    className={
                      envioMsg.tipo === 'ok'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-3 py-2'
                        : envioMsg.tipo === 'warn'
                          ? 'bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-3 py-2'
                          : 'bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2'
                    }
                  >
                    {envioMsg.texto}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={cerrarModal}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}