import { useState, useEffect, useMemo } from 'react';
import { useMovements } from '../../hooks/useMovements';
import { useCategories } from '../../hooks/useCategories';
import { useAccounts } from '../../hooks/useAccounts';
import { formatCurrency, formatDate, cn } from '../../utils/format';
import { Search, Filter, ChevronUp, ChevronDown, Plus, Download, FileText } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import Card from '../../components/ui/Card';
import { movementSchema } from '../../validators/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { confirmDialog, toast } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';

const HistoryPage = () => {
  const { 
    movements, 
    meta, 
    loading, 
    filters, 
    setFilters, 
    fetchMovements, 
    createMovement, 
    updateMovement, 
    deleteMovement 
  } = useMovements({ page: 1, limit: 20 });
  
  const { categories, loading: categoriesLoading } = useCategories();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { showSuccess, showError } = useToast();

  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [showModal, setShowModal] = useState(false);
  const [editingMovement, setEditingMovement] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  const handleSort = (config) => {
    setSortConfig(config);
    setFilters(prev => ({ ...prev, sort: `${config.direction === 'desc' ? '-' : ''}${config.key}` }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const openCreateModal = () => {
    setEditingMovement(null);
    form.reset({ type: 'expense', date: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  };

  const openEditModal = (movement) => {
    setEditingMovement(movement);
    form.reset({
      type: movement.type,
      description: movement.description,
      amount: movement.amount,
      categoryId: movement.categoryId,
      accountId: movement.accountId,
      date: movement.date.split('T')[0],
      notes: movement.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar movimiento?',
      text: 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      confirmColor: '#ef4444'
    });
    if (confirmed) {
      try {
        await deleteMovement(id);
        showSuccess('Movimiento eliminado');
      } catch {
        showError('Error al eliminar');
      }
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    form,
    watch
  } = useForm({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type: 'expense',
      description: '',
      amount: '',
      categoryId: '',
      accountId: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    }
  });

  const onSubmit = async (data) => {
    try {
      if (editingMovement) {
        await updateMovement(editingMovement.id, data);
        showSuccess('Movimiento actualizado');
      } else {
        await createMovement(data);
        showSuccess('Movimiento creado');
      }
      setShowModal(false);
      setEditingMovement(null);
    } catch (error) {
      showError('Error al guardar');
    }
  };

  const handleTypeChange = (type) => {
    setValue('type', type);
    setValue('categoryId', '');
  };

  const columns = useMemo(() => [
    { key: 'date', header: 'Fecha', sortable: true, render: (v) => formatDate(v), align: 'center' },
    { 
      key: 'type', 
      header: 'Tipo', 
      sortable: true, 
      render: (v) => (
        <span className={cn('badge', v === 'income' ? 'badge-income' : 'badge-expense')}>
          {v === 'income' ? 'Ingreso' : 'Gasto'}
        </span>
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
    { 
      key: 'account', 
      header: 'Cuenta', 
      sortable: true, 
      render: (v) => v?.name
    },
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
    },
    { 
      key: 'actions', 
      header: 'Acciones', 
      sortable: false, 
      align: 'center',
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEditModal(row)} aria-label="Editar">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} aria-label="Eliminar">
            <svg className="w-4 h-4 text-expense-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      )
    }
  ], [categories, accounts]);

  useEffect(() => {
    if (filters.startDate || filters.endDate) {
      setDateRange({
        start: filters.startDate || '',
        end: filters.endDate || ''
      });
    }
  }, [filters.startDate, filters.endDate]);

  const handleDateRangeChange = (start, end) => {
    handleFilterChange({ startDate: start, endDate: end || start });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Historial</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestiona tus movimientos financieros</p>
        </div>
        <Button onClick={openCreateModal} className="w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Nuevo movimiento
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            label="Buscar"
            placeholder="Descripción..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
          >
            <Search className="w-5 h-5 text-gray-400" />
          </Input>

          <Select
            label="Tipo"
            options={[
              { value: '', label: 'Todos' },
              { value: 'income', label: 'Ingresos' },
              { value: 'expense', label: 'Gastos' }
            ]}
            value={filters.type || ''}
            onChange={(e) => handleFilterChange({ type: e.target.value || undefined })}
          />

          <Select
            label="Categoría"
            options={[
              { value: '', label: 'Todas' },
              ...categories.map(c => ({ value: c.id, label: c.name }))
            ]}
            value={filters.categoryId || ''}
            onChange={(e) => handleFilterChange({ categoryId: e.target.value || undefined })}
          />

          <Select
            label="Cuenta"
            options={[
              { value: '', label: 'Todas' },
              ...accounts.map(a => ({ value: a.id, label: a.name }))
            ]}
            value={filters.accountId || ''}
            onChange={(e) => handleFilterChange({ accountId: e.target.value || undefined })}
          />

          <div className="sm:col-span-2 lg:col-span-1">
            <label className="label">Rango de fechas</label>
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="Desde"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                onBlur={() => handleDateRangeChange(dateRange.start, dateRange.end)}
              />
              <Input
                type="date"
                placeholder="Hasta"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                onBlur={() => handleDateRangeChange(dateRange.start, dateRange.end)}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={movements}
          sortConfig={sortConfig}
          onSort={handleSort}
          loading={loading}
          emptyMessage="No se encontraron movimientos"
        />
        {meta.total > 0 && (
          <Pagination
            currentPage={meta.page}
            totalPages={meta.totalPages}
            onPageChange={handlePageChange}
            total={meta.total}
            showPageSize
            pageSize={meta.limit}
          />
        )}
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingMovement(null); }}
        title={editingMovement ? 'Editar movimiento' : 'Nuevo movimiento'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Tipo"
              options={[
                { value: 'income', label: 'Ingreso' },
                { value: 'expense', label: 'Gasto' }
              ]}
              {...register('type')}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-income-500" />
                Ingreso
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-expense-500" />
                Gasto
              </div>
            </Select>

            <Input
              label="Descripción"
              placeholder="Ej: Supermercado, Salario..."
              error={errors.description?.message}
              {...register('description')}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Importe"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              error={errors.amount?.message}
              {...register('amount', { valueAsNumber: true })}
              required
            />

            <Select
              label="Categoría"
              options={[
                { value: '', label: 'Seleccionar...' },
                ...(watch('type') === 'income' ? incomeCategories : expenseCategories).map(c => ({
                  value: c.id,
                  label: c.name
                }))
              ]}
              error={errors.categoryId?.message}
              {...register('categoryId')}
              required
            />

            <Select
              label="Cuenta"
              options={[
                { value: '', label: 'Seleccionar...' },
                ...accounts.map(a => ({ value: a.id, label: a.name }))
              ]}
              error={errors.accountId?.message}
              {...register('accountId')}
              required
            />
          </div>

          <Input
            label="Fecha"
            type="date"
            error={errors.date?.message}
            {...register('date')}
            required
          />

          <Input
            label="Notas (opcional)"
            placeholder="Detalles adicionales..."
            {...register('notes')}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditingMovement(null); }}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingMovement ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HistoryPage;