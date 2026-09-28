import { Alert, Snackbar } from '@mui/material'
import { useNotificaciones, quitarNotificacion } from '../store/notificacionStore'

const Iconos = {
  success: { color: 'success', label: 'Éxito' },
  error: { color: 'error', label: 'Error' },
  warning: { color: 'warning', label: 'Advertencia' },
  info: { color: 'info', label: 'Información' }
}

export default function NotificacionesGlobal() {
  const notificaciones = useNotificaciones()
  return (
    <>
      {notificaciones.map((n) => {
        const cfg = Iconos[n.tipo] || Iconos.info
        return (
          <Snackbar
            key={n.id}
            open
            autoHideDuration={4000}
            onClose={() => quitarNotificacion(n.id)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert
              severity={cfg.color}
              variant="filled"
              onClose={() => quitarNotificacion(n.id)}
              className="!shadow-lg"
            >
              {n.mensaje}
            </Alert>
          </Snackbar>
        )
      })}
    </>
  )
}