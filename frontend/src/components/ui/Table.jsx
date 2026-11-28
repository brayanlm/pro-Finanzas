import { forwardRef, memo } from 'react';
import { cn } from '../../utils/format';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, X } from 'lucide-react';

const SortIcon = ({ direction, active }) => {
  if (!active) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />;
  return direction === 'asc'
    ? <ChevronUp className="w-3.5 h-3.5 text-primary-500" aria-hidden="true" />
    : <ChevronDown className="w-3.5 h-3.5 text-primary-500" aria-hidden="true" />;
};

const Table = memo(forwardRef(({
  columns = [],
  data = [],
  keyField = 'id',
  sortable = true,
  onSort,
  sortConfig = { key: null, direction: 'asc' },
  className = '',
  emptyMessage = 'No hay datos',
  loading = false,
  search,
  onSearch,
  ...props
}, ref) => {
  const handleSort = (key) => {
    if (!sortable || !onSort) return;
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    onSort({ key, direction });
  };

  const getSortIcon = (key) => {
    const active = sortConfig.key === key;
    return <SortIcon direction={sortConfig.direction} active={active} />;
  };

  if (loading) {
    return (
      <div className={cn('overflow-x-auto', className)}>
        <table className="w-full table-auto text-left" role="table" aria-busy="true">
          <thead>
            <tr className="border-b border-border-light dark:border-white/5">
              {columns.map((col) => (
                <th key={col.key} className="table-head-cell px-5 py-4">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-border-light/40 dark:border-white/3">
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-4">
                    <div className="skeleton-line h-5 max-w-[60%] sm:max-w-[45%]" style={{ minWidth: 40 }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      {search && onSearch ? (
        <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Buscar en la tabla..."
              className="input pl-10 pr-4 py-2.5 text-sm"
              aria-label="Buscar en tabla"
            />
          </div>
          {search && (
            <button type="button" className="btn-action" onClick={() => onSearch('')} aria-label="Limpiar búsqueda">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : null}

      <div className="table-wrapper">
        <table className="w-full table-auto text-left" role="table" ref={ref} {...props}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'table-head-cell',
                    col.align && `text-${col.align}`,
                    col.sortable && 'group cursor-pointer select-none hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-150'
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                  onKeyDown={(e) => {
                    if (col.sortable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleSort(col.key); }
                  }}
                  tabIndex={col.sortable ? 0 : undefined}
                  style={col.width ? { width: col.width } : undefined}
                  aria-sort={
                    sortConfig.key === col.key
                      ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                      : undefined
                  }
                >
                  <span className="inline-flex items-center gap-2">
                    {col.header}
                    {sortable && col.sortable && getSortIcon(col.key)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light/50 dark:divide-white/5">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-14 text-center">
                  <span className="empty-state-desc">{emptyMessage}</span>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row[keyField] || rowIndex}
                  className="table-body-row"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-5 py-4 text-sm text-gray-900 dark:text-gray-100',
                        col.align && `text-${col.align}`,
                        col.key === 'actions' && 'whitespace-nowrap'
                      )}
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}));

Table.displayName = 'Table';

export default Table;
