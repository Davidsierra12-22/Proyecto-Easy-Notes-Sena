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
        <button
          onClick={() => onCambio(pagina - 1)}
          disabled={pagina <= 1}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Anterior
        </button>
        <button
          onClick={() => onCambio(pagina + 1)}
          disabled={pagina >= totalPaginas}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 flex items-center gap-1"
        >
          Siguiente <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}