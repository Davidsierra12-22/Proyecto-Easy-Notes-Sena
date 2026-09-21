import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'

export default function ConfirmDialog({
  open, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar',
  color = 'primary', onConfirm, onCancel, loading = false
}) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText className="!whitespace-pre-line">{message}</DialogContentText>
      </DialogContent>
      <DialogActions className="!px-6 !pb-4">
        <Button onClick={onCancel}>{cancelText}</Button>
        <Button color={color} variant="contained" onClick={onConfirm} disabled={loading}>{confirmText}</Button>
      </DialogActions>
    </Dialog>
  )
}