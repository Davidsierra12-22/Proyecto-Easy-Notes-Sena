import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/Auth'
import { Lock, ShieldAlert } from 'lucide-react'
import { Button, TextField, Alert, CircularProgress } from '@mui/material'

export default function CambiarPassword() {
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const { cambiarPassword, loading, usuario } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (passwordNueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    if (passwordNueva !== confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }

    try {
      await cambiarPassword(passwordActual, passwordNueva)
      navigate('/')
    } catch {
      setError('No se pudo cambiar la contraseña. Verifique la contraseña actual.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
              <ShieldAlert className="w-9 h-9 text-amber-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 text-center">
              Cambio de contraseña obligatorio
            </h1>
            <p className="text-sm text-gray-500 text-center mt-1">
              Hola {usuario?.nombreCompleto || usuario?.nombres}. Por seguridad, debes
              cambiar tu contraseña antes de continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField
              label="Contraseña actual"
              type="password"
              value={passwordActual}
              onChange={(e) => { setPasswordActual(e.target.value); setError('') }}
              required
              placeholder="••••••••"
              fullWidth
            />

            <TextField
              label="Nueva contraseña"
              type="password"
              value={passwordNueva}
              onChange={(e) => { setPasswordNueva(e.target.value); setError('') }}
              required
              placeholder="Mínimo 6 caracteres"
              fullWidth
            />

            <TextField
              label="Confirmar nueva contraseña"
              type="password"
              value={confirmar}
              onChange={(e) => { setConfirmar(e.target.value); setError('') }}
              required
              placeholder="Repita la nueva contraseña"
              fullWidth
            />

            {error && (
              <Alert severity="error">{error}</Alert>
            )}

            <Button
              type="submit"
              disabled={loading}
              variant="contained"
              color="primary"
              fullWidth
              className="!py-2.5 !normal-case"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Lock className="w-4 h-4" />}
            >
              Cambiar contraseña
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
