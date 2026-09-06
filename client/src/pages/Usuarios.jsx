import { useState } from 'react'
import CrudTable from '../components/CrudTable'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { KeyRound, X } from 'lucide-react'

const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
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
    key: 'tipoPerfil', label: 'Rol',
    render: (u) => {
      const rol = ROLES.find(r => r.value === u.tipoPerfil)
      return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          u.tipoPerfil === 'admin' || u.tipoPerfil === 'super_admin'
            ? 'bg-primary-600 text-white'
            : u.tipoPerfil === 'docente'
            ? 'bg-primary-100 text-primary-800'
            : u.tipoPerfil === 'estudiante'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {rol ? rol.label : u.tipoPerfil}
        </span>
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
  { name: 'tipoPerfil', label: 'Rol', type: 'select', options: ROLES, required: true },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'celular', label: 'Celular' },
  { name: 'telefono', label: 'Teléfono' },
  { name: 'genero', label: 'Género', type: 'select', options: [{value:'M',label:'Masculino'},{value:'F',label:'Femenino'},{value:'O',label:'Otro'}] },
  { name: 'estrato', label: 'Estrato', type: 'number' },
  { name: 'fechaNacimiento', label: 'Fecha Nacimiento', type: 'date', colSpan: 2 },
  { name: 'direccion', label: 'Dirección', colSpan: 2 },
  { name: 'eps', label: 'EPS' }
]

export default function Usuarios() {
  const { usuario } = useAuth()
  const rolActual = usuario?.tipoPerfil

  const puedeGestionar = ['super_admin', 'admin', 'rector', 'coordinador'].includes(rolActual)
  const esSuperAdmin = rolActual === 'super_admin'

  const [modal, setModal] = useState(null) // { mode: 'reset'|'result', user, result? }
  const [resetPass, setResetPass] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState('')

  const abrirReset = (u) => {
    setModal({ mode: 'reset', user: u })
    setResetPass('')
    setResetError('')
  }

  const guardarReset = async () => {
    const pass = resetPass.trim() || modal.user.documento
    if (resetPass.trim() && resetPass.trim().length < 6) {
      setResetError('La contraseña debe tener mínimo 6 caracteres')
      return
    }
    setResetting(true)
    setResetError('')
    try {
      await api.put(`/usuarios/${modal.user._id}`, { credenciales: { password: pass } })
      setModal({ mode: 'result', user: modal.user, result: { usuario: modal.user.documento, password: pass } })
      setResetPass('')
    } catch (e) {
      setResetError(e.response?.data?.message || 'Error al restablecer contraseña')
    } finally {
      setResetting(false)
    }
  }

  const cerrarModal = () => {
    setModal(null)
    setResetPass('')
    setResetError('')
  }

  const marcarProtegidos = (datos) => datos?.map(u => ({
    ...u,
    _protegido: u._id === usuario?.id || (u.tipoPerfil === 'super_admin' && !esSuperAdmin)
  }))

  return (
    <>
      <CrudTable
        titulo="Gestión de Usuarios"
        baseURL="/usuarios"
        columnas={columnas}
        campos={campos}
        puedeGestionar={puedeGestionar}
        transformDatos={marcarProtegidos}
        onAfterSave={(creado) => {
          if (creado) setModal({ mode: 'result', user: creado, result: { usuario: creado.documento, password: creado.documento }, recienCreado: true })
        }}
        renderAcciones={(u) => (
          u._protegido ? null : (
            <button
              onClick={() => abrirReset(u)}
              title="Restablecer contraseña"
              className="text-amber-600 hover:text-amber-800 text-sm font-medium mr-3 inline-flex items-center gap-1"
            >
              <KeyRound className="w-4 h-4" /> Contraseña
            </button>
          )
        )}
      />

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={cerrarModal} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {modal.mode === 'reset' ? 'Restablecer contraseña' : 'Contraseña'}
              </h2>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600">
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
                    onChange={(e) => setResetPass(e.target.value)}
                    autoFocus
                    placeholder="Vacío = se usa el documento"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Mínimo 6 caracteres. Si la dejas vacía, la contraseña será el documento del usuario.</p>
                </div>

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
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50"
                  >
                    {resetting ? 'Guardando...' : 'Guardar'}
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