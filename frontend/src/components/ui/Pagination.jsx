import { cn } from '../../utils/format';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({ 
  currentPage = 1, 
  totalPages = 1, 
  onPageChange, 
  showPageSize = false, 
  pageSize = 20, 
  onPageSizeChange,
  className = '',
  total = 0
}) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <nav className={cn('flex items-center justify-between', className)} aria-label="Paginación">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Página {currentPage} de {totalPages} ({total} total)
        </span>
        
        {showPageSize && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(parseInt(e.target.value))}
            className="input w-auto py-1.5 text-sm"
            aria-label="Elementos por página"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={cn('btn-ghost p-2', currentPage === 1 && 'opacity-50 cursor-not-allowed')}
          aria-label="Primera página"
          aria-disabled={currentPage === 1}
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn('btn-ghost p-2', currentPage === 1 && 'opacity-50 cursor-not-allowed')}
          aria-label="Página anterior"
          aria-disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="btn-ghost px-3 py-1.5"
              aria-label="Página 1"
            >
              1
            </button>
            {startPage > 2 && (
              <span className="px-2 text-gray-400">...</span>
            )}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              'btn-ghost px-3 py-1.5 min-w-[2.5rem]',
              page === currentPage && 'bg-primary-600 text-white'
            )}
            aria-label={`Página ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="px-2 text-gray-400">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="btn-ghost px-3 py-1.5"
              aria-label={`Página ${totalPages}`}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn('btn-ghost p-2', currentPage === totalPages && 'opacity-50 cursor-not-allowed')}
          aria-label="Página siguiente"
          aria-disabled={currentPage === totalPages}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={cn('btn-ghost p-2', currentPage === totalPages && 'opacity-50 cursor-not-allowed')}
          aria-label="Última página"
          aria-disabled={currentPage === totalPages}
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;