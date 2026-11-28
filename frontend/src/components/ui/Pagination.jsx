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

  const PageButton = ({ page, active, ariaLabel, children }) => (
    <button
      type="button"
      onClick={() => onPageChange(page)}
      className={cn(
        'inline-flex items-center justify-center min-w-[2.25rem] px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
        active
          ? 'bg-primary-600 text-white shadow-sm'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-surfaceRaised',
        !active && 'active:scale-95'
      )}
      aria-label={ariaLabel}
      aria-current={active ? 'page' : undefined}
      disabled={active}
    >
      {children}
    </button>
  );

  return (
    <nav className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-3', className)} aria-label="Paginación">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          Página {currentPage} de {totalPages}
        </span>
        {total > 0 && (
          <span className="text-gray-400 dark:text-gray-500">· {total} registros</span>
        )}

        {showPageSize && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(parseInt(e.target.value))}
            className="input w-auto py-1.5 text-sm ml-2"
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
        <PageButton page={1} active={currentPage === 1} ariaLabel="Primera página">
          <ChevronsLeft className="w-4 h-4" aria-hidden="true" />
        </PageButton>

        <PageButton page={currentPage - 1} active={currentPage === 1} ariaLabel="Página anterior">
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </PageButton>

        {startPage > 1 && (
          <>
            <PageButton page={1} ariaLabel="Página 1">1</PageButton>
            {startPage > 2 && <span className="px-2 text-gray-400 select-none">…</span>}
          </>
        )}

        {pages.map((page) => (
          <PageButton key={page} page={page} active={page === currentPage} ariaLabel={`Página ${page}`}>
            {page}
          </PageButton>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-gray-400 select-none">…</span>}
            <PageButton page={totalPages} ariaLabel={`Página ${totalPages}`}>{totalPages}</PageButton>
          </>
        )}

        <PageButton page={currentPage + 1} active={currentPage === totalPages} ariaLabel="Página siguiente">
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </PageButton>

        <PageButton page={totalPages} active={currentPage === totalPages} ariaLabel="Última página">
          <ChevronsRight className="w-4 h-4" aria-hidden="true" />
        </PageButton>
      </div>
    </nav>
  );
};

export default Pagination;
