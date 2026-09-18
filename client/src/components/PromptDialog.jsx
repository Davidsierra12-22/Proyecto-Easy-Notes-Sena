import { useEffect, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@mui/material'

export default function PromptDialog({
  open, title, message = '', initialValue = '', confirmText = 'Aceptar', cancelText = 'Cancelar',
  type = 'text', onConfirm, onCancel
}) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    if (open) setValue(initialValue)
  }, [open, initialValue])

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {message && <DialogContentText className="!mb-3 !whitespace-pre-line">{message}</DialogContentText>}
        <TextField
          autoFocus
          size="small"
          fullWidth
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onConfirm(value) }}
        />
      </DialogContent>
      <DialogActions className="!px-6 !pb-4">
        <Button onClick={onCancel}>{cancelText}</Button>
        <Button color="primary" variant="contained" onClick={() => onConfirm(value)}>{confirmText}</Button>
      </DialogActions>
    </Dialog>
  )
}