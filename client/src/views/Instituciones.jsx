import { useRef, useState, useEffect } from 'react'
import CrudTable from '../components/Tables/CrudTable'
import { useAuth } from '../store/Auth'
import { ImageUp, X, Loader2, UserPlus, School } from 'lucide-react'
import {
  Button, IconButton, TextField, Select, MenuItem, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl
} from '@mui/material'
import api from '../services/api.service'

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
          <Button
            variant="contained"
            color="primary"
            startIcon={<School className="w-4 h-4" />}
            onClick={abrirCrear}
          >
            Crear Colegio
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <CircularProgress size={32} className="!text-primary-600" />
          </div>
        ) : colegios.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <p className="text-gray-600 mb-4">Aún no hay colegios registrados en el núcleo.</p>
            <Button
              variant="contained"
              color="primary"
              startIcon={<School className="w-4 h-4" />}
              onClick={abrirCrear}
            >
              Crear el primer colegio
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow className="bg-gray-50">
                      {['Colegio', 'Núcleo', 'Estudiantes', 'Docentes', 'Matrículas', 'Grupos', 'Sedes', 'Recaudado', 'Acciones'].map(h => (
                        <TableCell key={h} className="!font-semibold !text-gray-500 !text-xs !uppercase !tracking-wider whitespace-nowrap">{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {colegios.map(c => (
                      <TableRow key={c._id} hover>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {c.logo && <img src={c.logo} alt="Logo" className="w-9 h-9 object-contain" />}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{c.nombre}</p>
                              <p className="text-xs text-gray-500">NIT {c.nit}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="!text-sm !text-gray-600">{c.nucleoId?.nombre || '—'}</TableCell>
                        <TableCell className="!text-sm !text-gray-600">{c.estudiantes}</TableCell>
                        <TableCell className="!text-sm !text-gray-600">{c.docentes}</TableCell>
                        <TableCell className="!text-sm !text-gray-600">{c.matriculasActivas}</TableCell>
                        <TableCell className="!text-sm !text-gray-600">{c.grupos}</TableCell>
                        <TableCell className="!text-sm !text-gray-600">{c.sedes}</TableCell>
                        <TableCell className="!text-sm !text-gray-600">
                          {c.recaudado ? `$${Number(c.recaudado).toLocaleString('es-CO')}` : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Button
                              size="small"
                              onClick={() => { setAdminDe(c); setFormAdmin({ tipoDocumento: 'CC' }); setAdminResultado(null); setAdminError('') }}
                              title="Crear admin inicial del colegio"
                              startIcon={<UserPlus className="w-4 h-4" />}
                            >
                              Admin inicial
                            </Button>
                            <Button
                              size="small"
                              onClick={() => abrirLogo(c)}
                              title="Subir logo del colegio"
                              startIcon={<ImageUp className="w-4 h-4" />}
                            >
                              Logo
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          </div>
        )}
      </div>

      <Dialog open={crearAbierto} onClose={() => setCrearAbierto(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="flex items-center justify-between pr-2">
          <span>Crear Colegio</span>
          <IconButton onClick={() => setCrearAbierto(false)} aria-label="Cerrar" size="small">
            <X className="w-5 h-5" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={crearColegio}>
          <DialogContent className="!pt-2">
            <div className="space-y-4">
              <TextField
                label="Nombre del Colegio"
                value={formColegio.nombre || ''}
                onChange={setC('nombre')}
                placeholder="Ej: Institución Educativa San José"
                required
                fullWidth
              />
              <div className="grid grid-cols-2 gap-4">
                <TextField
                  label="NIT"
                  value={formColegio.nit || ''}
                  onChange={setC('nit')}
                  placeholder="Ej: 900123456"
                  required
                  fullWidth
                />
                <TextField
                  label="Código DANE"
                  value={formColegio.dane || ''}
                  onChange={setC('dane')}
                  fullWidth
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormControl fullWidth size="small">
                  <Select value={formColegio.tipo || 'privado'} onChange={setC('tipo')}>
                    {TIPOS.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <Select value={formColegio.nucleoId || ''} onChange={setC('nucleoId')}>
                    <MenuItem value="">Sin núcleo</MenuItem>
                    {nucleos.map(n => <MenuItem key={n._id} value={n._id}>{n.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
              </div>
              <TextField
                label="Dirección"
                value={formColegio.direccion || ''}
                onChange={setC('direccion')}
                fullWidth
              />
              {crearError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{crearError}</div>
              )}
            </div>
          </DialogContent>
          <DialogActions className="!px-6 !pb-5">
            <Button onClick={() => setCrearAbierto(false)} className="!text-gray-700 hover:!bg-gray-100">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={creando} startIcon={creando ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
              {creando ? 'Creando...' : 'Crear Colegio'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={!!adminDe} onClose={() => !adminResultado && setAdminDe(null)} maxWidth="sm" fullWidth>
        <DialogTitle className="flex items-center justify-between pr-2">
          <span>Admin inicial · {adminDe?.nombre}</span>
          {!adminResultado && (
            <IconButton onClick={() => setAdminDe(null)} aria-label="Cerrar" size="small">
              <X className="w-5 h-5" />
            </IconButton>
          )}
        </DialogTitle>
        {adminResultado ? (
          <DialogContent className="!pt-2">
            <div className="space-y-4">
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
            </div>
          </DialogContent>
        ) : (
          <form onSubmit={crearAdmin}>
            <DialogContent className="!pt-2">
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Crea el usuario administrador que gestionará este colegio.</p>
                <div className="grid grid-cols-2 gap-4">
                  <FormControl fullWidth size="small">
                    <Select value={formAdmin.tipoDocumento || 'CC'} onChange={setA('tipoDocumento')}>
                      {TIPOS_DOC.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Documento"
                    value={formAdmin.documento || ''}
                    onChange={setA('documento')}
                    required
                    fullWidth
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <TextField
                    label="Nombres"
                    value={formAdmin.nombres || ''}
                    onChange={setA('nombres')}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Apellidos"
                    value={formAdmin.apellidos || ''}
                    onChange={setA('apellidos')}
                    required
                    fullWidth
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <TextField
                    type="email"
                    label="Email"
                    value={formAdmin.email || ''}
                    onChange={setA('email')}
                    fullWidth
                  />
                  <TextField
                    label="Teléfono"
                    value={formAdmin.telefono || ''}
                    onChange={setA('telefono')}
                    fullWidth
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <TextField
                    label="Usuario"
                    value={formAdmin.usuario || ''}
                    onChange={setA('usuario')}
                    placeholder="Por defecto: el documento"
                    fullWidth
                  />
                  <TextField
                    label="Contraseña"
                    value={formAdmin.password || ''}
                    onChange={setA('password')}
                    placeholder="Por defecto: el documento"
                    fullWidth
                  />
                </div>
                {adminError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{adminError}</div>
                )}
              </div>
            </DialogContent>
            <DialogActions className="!px-6 !pb-5">
              <Button onClick={() => setAdminDe(null)} className="!text-gray-700 hover:!bg-gray-100">
                Saltar / Cancelar
              </Button>
              <Button type="submit" variant="contained" color="primary" disabled={creandoAdmin} startIcon={creandoAdmin ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
                {creandoAdmin ? 'Creando...' : 'Crear Admin Inicial'}
              </Button>
            </DialogActions>
          </form>
        )}
        {adminResultado && (
          <DialogActions className="!px-6 !pb-5">
            <Button variant="contained" color="primary" onClick={() => setAdminDe(null)}>
              Listo
            </Button>
          </DialogActions>
        )}
      </Dialog>

      <Dialog open={!!logoInstitucion} onClose={() => setLogoInstitucion(null)} maxWidth="xs" fullWidth>
        <DialogTitle className="flex items-center justify-between pr-2">
          <span>Logo de {logoInstitucion?.nombre}</span>
          <IconButton onClick={() => setLogoInstitucion(null)} aria-label="Cerrar" size="small">
            <X className="w-5 h-5" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={subirLogo}>
          <DialogContent className="!pt-2">
            <div className="space-y-4">
              <div className="flex justify-center py-3">
                {logoPreview ? (
                  <img src={logoPreview} alt="Vista previa" className="h-24 object-contain" />
                ) : logoInstitucion?.logo ? (
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
            </div>
          </DialogContent>
          <DialogActions className="!px-6 !pb-5">
            <Button onClick={() => setLogoInstitucion(null)} className="!text-gray-700 hover:!bg-gray-100">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={logoSubiendo}>
              {logoSubiendo ? 'Subiendo...' : 'Guardar logo'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
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
