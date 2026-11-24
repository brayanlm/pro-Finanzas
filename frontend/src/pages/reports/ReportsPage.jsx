import { useState, useEffect } from 'react';
import { useReports } from '../../hooks/useReports';
import { useCategories } from '../../hooks/useCategories';
import { useAccounts } from '../../hooks/useAccounts';
import { cn, formatDate, formatCurrency } from '../../utils/format';
import { Calendar, Download, FileText, Filter, X, Eye } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { EXPORT_FORMATS } from '../../utils/constants';

const ReportsPage = () => {
  const { 
    preview, 
    loading, 
    exporting, 
    fetchPreview, 
    exportReport 
  } = useReports();
  
  const { categories, loading: categoriesLoading } = useCategories();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { showSuccess, showError } = useToast();

  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    type: 'all',
    categoryId: '',
    accountId: '',
    startDate: '',
    endDate: ''
  });

  const [activeTab, setActiveTab] = useState('preview');

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  useEffect(() => {
    fetchPreview(filters);
  }, [filters.year, filters.month, filters.type, filters.categoryId, filters.accountId, filters.startDate, filters.endDate]);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleExport = async (format) => {
    try {
      await exportReport(filters, format);
    } catch {
      showError('Error al exportar');
    }
  };

  const clearFilters = () => {
    setFilters({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      type: 'all',
      categoryId: '',
      accountId: '',
      startDate: '',
      endDate: ''
    });
  };

  const hasActiveFilters = filters.type !== 'all' || filters.categoryId || filters.accountId || filters.startDate || filters.endDate;

  if (activeTab === 'preview') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reportes</h1>
            <p className="text-gray-500 dark:text-gray-400">Exporta tus datos financieros en PDF o Excel</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {EXPORT_FORMATS.map(fmt => (
              <Button 
                key={fmt.value}
                variant="secondary" 
                onClick={() => handleExport(fmt.value)}
                disabled={exporting}
                className="w-full sm:w-auto"
              >
                <Download className="w-4 h-4" />
                Exportar {fmt.label}
              </Button>
            ))}
          </div>
        </div>

        <Card className="p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <Select
              label="Año"
              options={Array.from({ length: 10 }, (_, i) => ({ value: new Date().getFullYear() - 5 + i, label: String(new Date().getFullYear() - 5 + i) }))}
              value={filters.year}
              onChange={(e) => handleFilterChange({ year: parseInt(e.target.value) })}
            />
            <Select
              label="Mes"
              options={[
                { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
                { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
                { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
                { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
              ]}
              value={filters.month}
              onChange={(e) => handleFilterChange({ month: parseInt(e.target.value) })}
            />
            <Select
              label="Tipo"
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'income', label: 'Ingresos' },
                { value: 'expense', label: 'Gastos' }
              ]}
              value={filters.type}
              onChange={(e) => handleFilterChange({ type: e.target.value })}
            />
            <Select
              label="Categoría"
              options={[
                { value: '', label: 'Todas' },
                ...categories.map(c => ({ value: c.id, label: c.name }))
              ]}
              value={filters.categoryId}
              onChange={(e) => handleFilterChange({ categoryId: e.target.value || '' })}
            />
            <Select
              label="Cuenta"
              options={[
                { value: '', label: 'Todas' },
                ...accounts.map(a => ({ value: a.id, label: a.name }))
              ]}
              value={filters.accountId}
              onChange={(e) => handleFilterChange({ accountId: e.target.value || '' })}
            />
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="label">Rango fechas</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  placeholder="Desde"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange({ startDate: e.target.value })}
                />
                <Input
                  type="date"
                  placeholder="Hasta"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange({ endDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Filtros activos</span>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4" />
                Limpiar todo
              </Button>
            </div>
          )}
        </Card>

        {loading ? (
          <Card>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">Generando vista previa...</span>
            </div>
          </Card>
        ) : preview ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <Card.Content className="p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ingresos</p>
                  <p className="text-2xl font-bold text-income-600 dark:text-income-400">{formatCurrency(preview.summary.income)}</p>
                </Card.Content>
              </Card>
              <Card>
                <Card.Content className="p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Gastos</p>
                  <p className="text-2xl font-bold text-expense-600 dark:text-expense-400">{formatCurrency(preview.summary.expense)}</p>
                </Card.Content>
              </Card>
              <Card>
                <Card.Content className="p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(preview.summary.balance)}</p>
                </Card.Content>
              </Card>
              <Card>
                <Card.Content className="p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Movimientos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{preview.summary.count}</p>
                </Card.Content>
              </Card>
            </div>

            <Card>
              <Table
                columns={[
                  { key: 'date', header: 'Fecha', sortable: true, render: (v) => formatDate(v), align: 'center' },
                  { 
                    key: 'type', 
                    header: 'Tipo', 
                    sortable: true, 
                    render: (v) => (
                      <Badge variant={v === 'income' ? 'income' : 'expense'}>
                        {v === 'income' ? 'Ingreso' : 'Gasto'}
                      </Badge>
                    )
                  },
                  { key: 'description', header: 'Descripción', sortable: false },
                  { 
                    key: 'category', 
                    header: 'Categoría', 
                    sortable: true, 
                    render: (v) => (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: v?.color }} />
                        {v?.name}
                      </div>
                    )
                  },
                  { key: 'account', header: 'Cuenta', sortable: true, render: (v) => v?.name },
                  { 
                    key: 'amount', 
                    header: 'Importe', 
                    sortable: true, 
                    align: 'right',
                    render: (v, row) => (
                      <span className={cn('font-medium', row.type === 'income' ? 'text-income-600' : 'text-expense-600')}>
                        {row.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(v))}
                      </span>
                    )
                  }
                ]}
                data={preview.movements}
                loading={false}
                emptyMessage="No hay movimientos para los filtros seleccionados"
              />
            </Card>
          </>
        ) : (
          <Card className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No hay datos</h3>
            <p className="text-gray-500 dark:text-gray-400">No se encontraron movimientos para los filtros seleccionados</p>
          </Card>
        )}
      </div>
    );
  }

  return null;
};

export default ReportsPage;