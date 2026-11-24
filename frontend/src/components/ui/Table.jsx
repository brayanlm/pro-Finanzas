import { forwardRef } from 'react';
import { cn } from '../../utils/format';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

const Table = forwardRef(({ 
  columns = [], 
  data = [], 
  keyField = 'id', 
  sortable = true, 
  onSort, 
  sortConfig = { key: null, direction: 'asc' },
  className = '',
  emptyMessage = 'No hay datos',
  loading = false,
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
    if (sortConfig.key !== key) return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-primary-600" /> 
      : <ChevronDown className="w-4 h-4 text-primary-600" />;
  };

  if (loading) {
    return (
      <div className={cn('overflow-x-auto', className)}>
        <table className="w-full" role="table">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
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
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full" role="table" {...props}>
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {columns.map((col) => (
              <th 
                key={col.key} 
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                  col.align && `text-${col.align}`,
                  sortable && col.sortable && 'cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
                onClick={() => col.sortable && handleSort(col.key)}
                style={{ width: col.width }}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {sortable && col.sortable && getSortIcon(col.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={row[keyField] || rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3 text-sm text-gray-900 dark:text-gray-100', col.align && `text-${col.align}`)}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
});

Table.displayName = 'Table';

export default Table;