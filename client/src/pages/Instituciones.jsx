import { useRef, useState, useEffect } from 'react'
import CrudTable from '../components/CrudTable'
import { useAuth } from '../context/AuthContext'
import { ImageUp, X, Loader2, UserPlus, School } from 'lucide-react'
import api from '../services/api'

const TIPOS = [
  { value: 'publico', label: 'Público' },
  { value: 'privado', label: 'Privado' }
]

const ESTADOS = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' }
]

const TIPOS_DOC = [
  { value: 'RC', label: 'Registro Civil' },
  { value: 'TI', label: 'Tarjeta Identidad' },
  { value: 'CC', label: 'Cédula' },
  { value: 'CE', label: 'Cédula Extranjería' },
  { value: 'PAS', label: 'Pasaporte' }
]

const columnas = [
  {
    key: 'nombre', label: 'Colegio',
    render: (i) => (
      <div className="flex items-center gap-3">
        {i.logo && <img src={i.logo} alt="Logo" className="w-9 h-9 object-contain" />}
        <span className="font-medium text-gray-900">{i.nombre}</span>
      </div>
    )
  },
  { key: 'nit', label: 'NIT', render: (i) => i.nit },
  { key: 'dane', label: 'DANE', render: (i) => i.dane || '—' },
  {
    key: 'tipo', label: 'Tipo',
    render: (i) => TIPOS.find(x => x.value === i.tipo)?.label || i.tipo || '—'
  },
  { key: 'email', label: 'Email', render: (i) => i.email || '—' },
  {
    key: 'estado', label: 'Estado',
    render: (i) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${i.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
        {i.estado}
      </span>
    )
  }
]

const campos = [
  { name: 'nombre', label: 'Nombre del Colegio', required: true },
  { name: 'nit', label: 'NIT', required: true },
  { name: 'dane', label: 'Código DANE' },
  { name: 'tipo', label: 'Tipo', type: 'select', options: TIPOS, default: 'privado' },
  { name: 'email', label: 'Email' },
  { name: 'estado', label: 'Estado', type: 'select', options: ESTADOS, default: 'activo' }
]

const Label = ({ children, required }) => (
  <label className="block text-sm font-medium text-gray-700 mb-1">
    {children}{required && <span className="text-red-500"> *</span>}
  </label>
)

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500'
const selectCls = `${inputCls} bg-white`

function VistaNucleo() {
  const [colegios, setColegios] = useState([])
  const [loading, setLoading] = useState(true)
  const [nucleos, setNucleos] = useState([])

  const [crearAbierto, setCrearAbierto] = useState(false)
  const [formColegio, setFormColegio] = useState({})
  const [crearError, setCrearError] = useState('')
  const [creando, setCreando] = useState(false)

  const [adminDe, setAdminDe] = useState(null)
  const [formAdmin, setFormAdmin] = useState({})
  const [adminResultado, setAdminResultado] = useState(null)
  const [adminError, setAdminError] = useState('')
  const [creandoAdmin, setCreandoAdmin] = useState(false)

  const [logoInstitucion, setLogoInstitucion] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoSubiendo, setLogoSubiendo] = useState(false)
  const [logoError, setLogoError] = useState('')
  const logoRef = useRef(null)

  const cargar = async () => {
    setLoading(true)
    try {
      const [rColegios, rNucleos] = await Promise.all([
        api.get('/nucleo/instituciones').catch(() => ({ data: { data: [] } })),
        api.get('/nucleos').catch(() => ({ data: { data: [] } }))
      ])
      setColegios(rColegios.data.data || [])
      setNucleos(rNucleos.data.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const abrirCrear = () => {
    setFormColegio({ tipo: 'privado', nucleoId: nucleos[0]?._id || '' })
    setCrearError('')
    setCrearAbierto(true)
  }

  const crearColegio = async (e) => {
    e.preventDefault()
    setCreando(true)
    setCrearError('')
    try {
      const res = await api.post('/nucleo/instituciones', formColegio)
      setCrearAbierto(false)
      const nuevo = res.data.data
      await cargar()
      setAdminDe(nuevo)
      setFormAdmin({ tipoDocumento: 'CC' })
      setAdminResultado(null)
      setAdminError('')
    } catch (err) {
      setCrearError(err.response?.data?.message || 'Error al crear el colegio')
    } finally {
      setCreando(false)
    }
  }

  const crearAdmin = async (e) => {
    e.preventDefault()
    if (!adminDe?._id) return
    setCreandoAdmin(true)
    setAdminError('')
    try {
      const res = await api.post(`/nucleo/instituciones/${adminDe._id}/admin`, formAdmin)
      setAdminResultado(res.data.data)
    } catch (err) {
      setAdminError(err.response?.data?.message || 'Error al crear el admin inicial')
    } finally {
      setCreandoAdmin(false)
    }
  }

  const abrirLogo = (i) => {
    setLogoInstitucion(i)
    setLogoPreview(null)
    setLogoError('')
    if (logoRef.current) logoRef.current.value = ''
  }

  const seleccionarLogo = (e) => {
    setLogoError('')
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setLogoPreview(null)
      setLogoError('El logo supera el tamaño máximo permitido (2MB)')
      if (logoRef.current) logoRef.current.value = ''
      return
    }
    setLogoPreview(URL.createObjectURL(file))
  }

  const subirLogo = async (e) => {
    e.preventDefault()
    const file = logoRef.current?.files?.[0]
    if (!file) {
      setLogoError('Selecciona un archivo de imagen')
      return
    }
    setLogoSubiendo(true)
    setLogoError('')
    try {
      const fd = new FormData()
      fd.append('archivo', file)
      await api.post(`/upload/${logoInstitucion._id}/logo`, fd)
      setLogoInstitucion(null)
      await cargar()
    } catch (err) {
      setLogoError(err.response?.data?.message || 'Error al subir el logo')
    } finally {
      setLogoSubiendo(false)
    }
  }

  const setC = (k) => (e) => setFormColegio({ ...formColegio, [k]: e.target.value })
  const setA = (k) => (e) => setFormAdmin({ ...formAdmin, [k]: e.target.value })

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Colegios del Núcleo</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Dirección de Núcleo: crear colegios, asignar su admin inicial y revisar su operación.
            </p>
          </div>
          <button
            onClick={abrirCrear}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg"
          >
            <School className="w-4 h-4" /> Crear Colegio
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : colegios.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <p className="text-gray-600 mb-4">Aún no hay colegios registrados en el núcleo.</p>
            <button
              onClick={abrirCrear}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg"
            >
              <School className="w-4 h-4" /> Crear el primer colegio
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Colegio', 'Núcleo', 'Estudiantes', 'Docentes', 'Matrículas', 'Grupos', 'Sedes', 'Recaudado', 'Acciones'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {colegios.map(c => (
                    <tr key={c._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {c.logo && <img src={c.logo} alt="Logo" className="w-9 h-9 object-contain" />}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{c.nombre}</p>
                            <p className="text-xs text-gray-500">NIT {c.nit}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{c.nucleoId?.nombre || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{c.estudiantes}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{c.docentes}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{c.matriculasActivas}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{c.grupos}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{c.sedes}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {c.recaudado ? `$${Number(c.recaudado).toLocaleString('es-CO')}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => { setAdminDe(c); setFormAdmin({ tipoDocumento: 'CC' }); setAdminResultado(null); setAdminError('') }}
                            title="Crear admin inicial del colegio"
                            className="text-primary-600 hover:text-primary-800 text-sm font-medium inline-flex items-center gap-1"
                          >
                            <UserPlus className="w-4 h-4" /> Admin inicial
                          </button>
                          <button
                            onClick={() => abrirLogo(c)}
                            title="Subir logo del colegio"
                            className="text-primary-600 hover:text-primary-800 text-sm font-medium inline-flex items-center gap-1"
                          >
                            <ImageUp className="w-4 h-4" /> Logo
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {crearAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCrearAbierto(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Crear Colegio</h2>
              <button onClick={() => setCrearAbierto(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={crearColegio} className="p-6 space-y-4">
              <div>
                <Label required>Nombre del Colegio</Label>
                <input className={inputCls} value={formColegio.nombre || ''} onChange={setC('nombre')} placeholder="Ej: Institución Educativa San José" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label required>NIT</Label>
                  <input className={inputCls} value={formColegio.nit || ''} onChange={setC('nit')} placeholder="Ej: 900123456" required />
                </div>
                <div>
                  <Label>Código DANE</Label>
                  <input className={inputCls} value={formColegio.dane || ''} onChange={setC('dane')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <select className={selectCls} value={formColegio.tipo || 'privado'} onChange={setC('tipo')}>
                    {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Núcleo</Label>
                  <select className={selectCls} value={formColegio.nucleoId || ''} onChange={setC('nucleoId')}>
                    <option value="">Sin núcleo</option>
                    {nucleos.map(n => <option key={n._id} value={n._id}>{n.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label>Dirección</Label>
                <input className={inputCls} value={formColegio.direccion || ''} onChange={setC('direccion')} />
              </div>
              {crearError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{crearError}</div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setCrearAbierto(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" disabled={creando} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 inline-flex items-center gap-2">
                  {creando && <Loader2 className="w-4 h-4 animate-spin" />}
                  {creando ? 'Creando...' : 'Crear Colegio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {adminDe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !adminResultado && setAdminDe(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Admin inicial · {adminDe.nombre}</h2>
              {!adminResultado && (
                <button onClick={() => setAdminDe(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            {adminResultado ? (
              <div className="p-6 space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3">
                  Admin inicial creado correctamente. Guarda estas credenciales: se muestran una sola vez.
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm"><span className="text-gray-500">Nombre:</span> <span className="font-medium">{adminResultado.nombres} {adminResultado.apellidos}</span></p>
                  <p className="text-sm"><span className="text-gray-500">Documento:</span> <span className="font-medium">{adminResultado.documento}</span></p>
                  <p className="text-sm"><span className="text-gray-500">Usuario:</span> <span className="font-mono font-medium">{adminResultado.credenciales.usuario}</span></p>
                  <p className="text-sm"><span className="text-gray-500">Contraseña:</span> <span className="font-mono font-medium">{adminResultado.credenciales.password}</span></p>
                </div>
                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3">
                  El admin deberá cambiar la contraseña en su primer inicio de sesión.
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setAdminDe(null)} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg">
                    Listo
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={crearAdmin} className="p-6 space-y-4">
                <p className="text-sm text-gray-500">Crea el usuario administrador que gestionará este colegio.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo documento</Label>
                    <select className={selectCls} value={formAdmin.tipoDocumento || 'CC'} onChange={setA('tipoDocumento')}>
                      {TIPOS_DOC.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label required>Documento</Label>
                    <input className={inputCls} value={formAdmin.documento || ''} onChange={setA('documento')} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label required>Nombres</Label>
                    <input className={inputCls} value={formAdmin.nombres || ''} onChange={setA('nombres')} required />
                  </div>
                  <div>
                    <Label required>Apellidos</Label>
                    <input className={inputCls} value={formAdmin.apellidos || ''} onChange={setA('apellidos')} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <input type="email" className={inputCls} value={formAdmin.email || ''} onChange={setA('email')} />
                  </div>
                  <div>
                    <Label>Teléfono</Label>
                    <input className={inputCls} value={formAdmin.telefono || ''} onChange={setA('telefono')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Usuario</Label>
                    <input className={inputCls} value={formAdmin.usuario || ''} onChange={setA('usuario')} placeholder="Por defecto: el documento" />
                  </div>
                  <div>
                    <Label>Contraseña</Label>
                    <input className={inputCls} value={formAdmin.password || ''} onChange={setA('password')} placeholder="Por defecto: el documento" />
                  </div>
                </div>
                {adminError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{adminError}</div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setAdminDe(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">
                    Saltar / Cancelar
                  </button>
                  <button type="submit" disabled={creandoAdmin} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 inline-flex items-center gap-2">
                    {creandoAdmin && <Loader2 className="w-4 h-4 animate-spin" />}
                    {creandoAdmin ? 'Creando...' : 'Crear Admin Inicial'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {logoInstitucion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setLogoInstitucion(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Logo de {logoInstitucion.nombre}</h2>
              <button onClick={() => setLogoInstitucion(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={subirLogo} className="p-6 space-y-4">
              <div className="flex justify-center py-3">
                {logoPreview ? (
                  <img src={logoPreview} alt="Vista previa" className="h-24 object-contain" />
                ) : logoInstitucion.logo ? (
                  <img src={logoInstitucion.logo} alt="Logo actual" className="h-24 object-contain" />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                    Sin logo
                  </div>
                )}
              </div>
              <input
                ref={logoRef}
                type="file"
                accept="image/*"
                onChange={seleccionarLogo}
                className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              {logoError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{logoError}</div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setLogoInstitucion(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" disabled={logoSubiendo} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50">
                  {logoSubiendo ? 'Subiendo...' : 'Guardar logo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default function Instituciones() {
  const { usuario } = useAuth()
  const esNucleo = usuario?.tipoPerfil === 'super_admin'

  if (esNucleo) return <VistaNucleo />

  return (
    <CrudTable
      titulo="Colegios (Instituciones)"
      baseURL="/instituciones"
      columnas={columnas}
      campos={campos}
      puedeGestionar={false}
    />
  )
}