import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../store/Auth'
import { GraduationCap, Lock, Eye, EyeOff } from 'lucide-react'
import { Alert, Button, CircularProgress, IconButton, InputAdornment, TextField } from '@mui/material'

export default function Login() {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { login, loading } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const datos = await login(usuario.trim(), password)
      if (datos.debeCambiarPassword) {
        window.location.href = '/cambiar-password'
      } else if (datos.roles && datos.roles.length > 1) {
        window.location.href = '/elegir-perfil'
      } else {
        window.location.href = '/'
      }
    } catch {
      // error ya está en el contexto
      setError('Credenciales inválidas. Verifique su usuario y contraseña.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-4">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">EasyNotes</h1>
            <p className="text-sm text-gray-500">Sistema de Gestión Académica</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <TextField
                label="Usuario (Documento)"
                type="text"
                name="usuario"
                autoComplete="username"
                value={usuario}
                onChange={(e) => { setUsuario(e.target.value); setError('') }}
                required
                fullWidth
                size="small"
                placeholder="Número de documento"
              />
            </div>

            <div>
              <TextField
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                required
                fullWidth
                size="small"
                placeholder="••••••••"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
              />
            </div>

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              type="submit"
              disabled={loading}
              variant="contained"
              color="primary"
              fullWidth
              startIcon={loading ? <CircularProgress size={20} className="!text-white" /> : <Lock className="w-4 h-4" />}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>

            <p className="text-center text-sm">
              <Link to="/recuperar-password" className="text-primary-600 hover:text-primary-700 font-medium">
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
          </form>
        </div>
        <p className="text-center text-gray-500 text-sm mt-4">
          © 2025 EasyNotes. Todos los derechos reservados.
        </p>
        <p className="text-center mt-2">
          <Link to="/prematricula" className="text-primary-600 hover:text-primary-700 text-sm underline underline-offset-2">
            ¿Es estudiante nuevo? Realice su prematrícula online
          </Link>
        </p>
      </div>
    </div>
  )
}