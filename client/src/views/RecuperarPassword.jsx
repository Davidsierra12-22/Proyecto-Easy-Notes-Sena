import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, MailSearch, ArrowLeft } from 'lucide-react'
import { Button, TextField, Alert } from '@mui/material'
import api from '../services/api.service'

export default function RecuperarPassword() {
  const [documento, setDocumento] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/recuperar-password', { documento: documento.trim() })
      setEnviado(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al solicitar la recuperación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-4">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Recuperar contraseña</h1>
            <p className="text-sm text-gray-500 text-center mt-1">
              Ingresa tu documento y te enviaremos un enlace a tu correo
            </p>
          </div>

          {enviado ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <MailSearch className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                Si el documento existe y tiene un correo registrado, recibirás un enlace
                para restablecer tu contraseña. Revisa tu bandeja de entrada y la carpeta
                de spam.
              </p>
              <Link to="/login" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <TextField
                  label="Número de documento"
                  type="text"
                  value={documento}
                  onChange={(e) => { setDocumento(e.target.value); setError('') }}
                  required
                  autoFocus
                  placeholder="Documento registrado en el sistema"
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
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </Button>

              <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
              </Link>
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