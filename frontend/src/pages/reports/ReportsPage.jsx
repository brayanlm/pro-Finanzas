import { useState, useEffect } from 'react';
import { useReports } from '../../hooks/useReports';
import { useCategories } from '../../hooks/useCategories';
import { useAccounts } from '../../hooks/useAccounts';
import { cn, formatDate, formatCurrency, getTypeColorClass } from '../../utils/format';
import { Calendar, Download, X, FileText, ArrowDown, ArrowUp, Building2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';
import { EXPORT_FORMATS } from '../../utils/constants';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const getCurrentYear = () => new Date().getFullYear();
const getMonthOptions = () => Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: MONTHS[i] }));
const getYearOptions = () => Array.from({ length: 10 }, (_, i) => getCurrentYear() - 5 + i);

const ReportsPage = () => {
  const { preview, loading, exporting, fetchPreview, exportReport } = useReports();

  const { categories, loading: categoriesLoading } = useCategories();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { showSuccess, showError } = useToast();

  const [filters, setFilters] = useState({
    year: getCurrentYear(),
    month: new Date().getMonth() + 1,
    type: 'all',
    categoryId: '',
    accountId: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchPreview(filters);
  }, [filters, fetchPreview]);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleExport = async (format) => {
    try {
      await exportReport(filters, format);
      showSuccess(`Informe exportado como ${format.toUpperCase()}`);
    } catch {
      showError('Error al exportar');
    }
  };

  const clearFilters = () => {
    setFilters({
      year: getCurrentYear(),
      month: new Date().getMonth() + 1,
      type: 'all',
      categoryId: '',
      accountId: '',
      startDate: '',
      endDate: ''
    });
  };

  const hasActiveFilters = filters.type !== 'all' || filters.categoryId || filters.accountId || filters.startDate || filters.endDate;

  const columns = [
    { key: 'date', header: 'Fecha', sortable: true, render: (v) => <span className="tabular-nums text-gray-700 dark:text-gray-300">{formatDate(v)}</span>, align: 'center' },
    {
      key: 'type',
      header: 'Tipo',
      sortable: true,
      render: (v) => (
        <div className="flex items-center justify-center gap-2">
          {v === 'income' ? <ArrowUp className="w-3.5 h-3.5 text-income-500" aria-hidden="true" /> : <ArrowDown className="w-3.5 h-3.5 text-expense-500" aria-hidden="true" />}
          <Badge variant={v === 'income' ? 'income' : 'expense'}>
            {v === 'income' ? 'Ingreso' : 'Gasto'}
          </Badge>
        </div>
      ),
      align: 'center'
    },
    {
      key: 'description',
      header: 'Descripción',
      sortable: false,
      render: (v) => <span className="text-gray-900 dark:text-gray-50">{v}</span>
    },
    {
      key: 'category',
      header: 'Categoría',
      sortable: true,
      render: (v) => (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: v?.color }} aria-hidden="true" />
          <span className={cn('font-medium', getTypeColorClass('expense'))}>{v?.name}</span>
        </div>
      )
    },
    { key: 'account', header: 'Cuenta', sortable: true, render: (v) => <span className="text-gray-700 dark:text-gray-300">{v?.name}</span> },
    {
      key: 'amount',
      header: 'Importe',
      sortable: true,
      align: 'right',
      render: (v, row) => (
        <span className={cn('font-semibold text-right tabular-nums', row.type === 'income' ? 'text-income-700 dark:text-income-300' : 'text-expense-700 dark:text-expense-300')}>
          {row.type === 'income' ? '+' : '−'}{formatCurrency(Math.abs(v))}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Exporta tus datos financieros en PDF o Excel</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXPORT_FORMATS.map(fmt => (
            <Button key={fmt.value} variant="secondary" onClick={() => handleExport(fmt.value)} disabled={exporting}>
              <Download className="w-4 h-4" />
              Exportar {fmt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <Card className="stat-card">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 rounded bg-primary-500" aria-hidden="true" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-50">Filtros de período</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <Select
            label="Año"
            options={getYearOptions().map(y => ({ value: y, label: String(y) }))}
            value={filters.year}
            onChange={(e) => handleFilterChange({ year: parseInt(e.target.value) })}
            className="text-sm"
          />
          <Select
            label="Mes"
            options={getMonthOptions()}
            value={filters.month}
            onChange={(e) => handleFilterChange({ month: parseInt(e.target.value) })}
            className="text-sm"
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
            disabled={categoriesLoading}
          />
          <Select
            label="Cuenta"
            options={[
              { value: '', label: 'Todas' },
              ...accounts.map(a => ({ value: a.id, label: a.name }))
            ]}
            value={filters.accountId}
            onChange={(e) => handleFilterChange({ accountId: e.target.value || '' })}
            disabled={accountsLoading}
          />
          <div>
            <label className="label">Rango fechas (opcional)</label>
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="Desde"
                value={filters.startDate}
                onChange={(e) => handleFilterChange({ startDate: e.target.value })}
                className="w-1/2"
              />
              <Input
                type="date"
                placeholder="Hasta"
                value={filters.endDate}
                onChange={(e) => handleFilterChange({ endDate: e.target.value })}
                className="w-1/2"
              />
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-light">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Filtros activos: {MONTHS[filters.month - 1] || filters.month} {filters.year}
            </span>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4" />
              Limpiar filtros
            </Button>
          </div>
        )}
      </Card>

      {/* Resumen + tabla */}
      {loading ? (
        <Card className="stat-card">
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Generando vista previa...</span>
          </div>
        </Card>
      ) : preview ? (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="stat-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-income-50 text-income-600 dark:bg-income-900/20 flex items-center justify-center">
                  <ArrowUp className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ingresos</p>
                  <p className="text-2xl font-extrabold text-income-600 dark:text-income-400 tabular-nums">{formatCurrency(preview.summary.income)}</p>
                </div>
              </div>
            </Card>
            <Card className="stat-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-expense-50 text-expense-600 dark:bg-expense-900/20 flex items-center justify-center">
                  <ArrowDown className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Gastos</p>
                  <p className="text-2xl font-extrabold text-expense-600 dark:text-expense-400 tabular-nums">{formatCurrency(preview.summary.expense)}</p>
                </div>
              </div>
            </Card>
            <Card className="stat-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
                  <p className={cn('text-2xl font-extrabold tabular-nums', preview.summary.balance >= 0 ? 'text-gray-900 dark:text-gray-50' : 'text-expense-600 dark:text-expense-400')}>
                    {formatCurrency(preview.summary.balance)}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="stat-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-surfaceRaised text-gray-500 flex items-center justify-center">
                  <Calendar className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Movimientos</p>
                  <p className="text-2xl font-extrabold tabular-nums text-gray-900 dark:text-gray-50">{preview.summary.count}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabla */}
          <Card className="stat-card overflow-hidden">
            <Table
              columns={columns}
              data={preview.movements}
              loading={false}
              emptyMessage="No hay movimientos para los filtros seleccionados"
            />
          </Card>
        </>
      ) : (
        <Card className="stat-card">
          <div className="empty-state">
            <div className="empty-state-icon"><FileText className="w-7 h-7" aria-hidden="true" /></div>
            <h3 className="empty-state-title">No hay datos</h3>
            <p className="empty-state-desc">No se encontraron movimientos para los filtros seleccionados</p>
          </div>
        </Card>
      )}

    </div>
  );
};

export default ReportsPage;
