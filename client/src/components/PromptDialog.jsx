import { useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@mui/material'

export default function PromptDialog({
  open, title, message, label = 'Observaciones', defaultValue = '',
  confirmText = 'Confirmar', cancelText = 'Cancelar', color = 'primary',
  onConfirm, onCancel, required = false, placeholder = '', loading = false
}) {
  const [valor, setValor] = useState(defaultValue)
  const valorLimpio = valor.trim()

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {message && <DialogContentText className="!whitespace-pre-line !mb-3">{message}</DialogContentText>}
        <TextField
          autoFocus
          label={label}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder={placeholder}
          fullWidth
          multiline={required}
          minRows={required ? 2 : 1}
          size="small"
          disabled={loading}
        />
      </DialogContent>
      <DialogActions className="!px-6 !pb-4">
        <Button onClick={onCancel} disabled={loading}>{cancelText}</Button>
        <Button
          color={color}
          variant="contained"
          onClick={() => onConfirm(valor)}
          disabled={(required && !valorLimpio) || loading}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}