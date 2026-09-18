import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { GraduationCap, KeyRound, AlertTriangle } from 'lucide-react'
import { Button, TextField, Alert } from '@mui/material'
import api from '../services/api.service'

export default function RestablecerPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [listo, setListo] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      await api.put('/auth/restablecer-password', { token, nuevaPassword: password })
      setListo(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.response?.data?.message || 'El enlace no es válido o ya expiró')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-9 h-9 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Enlace no válido</h1>
          <p className="text-sm text-gray-500 mt-1">El enlace de recuperación es inválido o está incompleto.</p>
          <Link to="/recuperar-password" className="inline-block mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium">
            Solicitar uno nuevo
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-4">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva contraseña</h1>
            <p className="text-sm text-gray-500 text-center mt-1">
              Ingresa tu nueva contraseña (mínimo 6 caracteres)
            </p>
          </div>

          {listo ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-7 h-7 text-emerald-600" />
              </div>
              <p className="text-gray-700 text-sm">
                Contraseña restablecida correctamente. Redirigiendo al inicio de sesión...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <TextField
                  label="Nueva contraseña"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  required
                  autoFocus
                  placeholder="Mínimo 6 caracteres"
                  fullWidth
                />
              <TextField
                  label="Confirmar contraseña"
                  type="password"
                  value={confirmar}
                  onChange={(e) => { setConfirmar(e.target.value); setError('') }}
                  required
                  placeholder="Repite la nueva contraseña"
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
              >
                {loading ? 'Guardando...' : 'Restablecer contraseña'}
              </Button>
            </form>
          )}
        </div>
        <p className="text-center text-gray-500 text-sm mt-4">
          © 2025 EasyNotes. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}