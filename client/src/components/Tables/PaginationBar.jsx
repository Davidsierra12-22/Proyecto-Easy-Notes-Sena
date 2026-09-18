import { Button } from '@mui/material'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function PaginationBar({ pagina, total, limite, totalPaginas, onCambio }) {
  if (!totalPaginas) return null
  const inicio = (pagina - 1) * limite + 1
  const fin = Math.min(pagina * limite, total)

  return (
    <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2">
      <p className="text-xs text-gray-500">
        Mostrando <span className="font-medium text-gray-700">{inicio}-{fin}</span> de{' '}
        <span className="font-medium text-gray-700">{total}</span> registros · página {pagina} de {totalPaginas}
      </p>
      <div className="flex items-center gap-1">
        <Button
          onClick={() => onCambio(pagina - 1)}
          disabled={pagina <= 1}
          size="small"
          variant="outlined"
          color="inherit"
          className="!normal-case !text-gray-700"
          startIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Anterior
        </Button>
        <Button
          onClick={() => onCambio(pagina + 1)}
          disabled={pagina >= totalPaginas}
          size="small"
          variant="outlined"
          color="inherit"
          className="!normal-case !text-gray-700"
        >
          Siguiente <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}