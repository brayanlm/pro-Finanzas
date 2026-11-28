import { useState, useMemo, useCallback } from 'react';
import { useMovements } from '../../hooks/useMovements';
import { useCategories } from '../../hooks/useCategories';
import { useAccounts } from '../../hooks/useAccounts';
import { formatCurrency, formatDate, cn, getTypeColorClass } from '../../utils/format';
import {
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  X
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { movementSchema } from '../../validators/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { confirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
const HISTORY_PAGE_SIZE = 20;

const HistoryPage = () => {
  const {
    movements,
    meta,
    loading,
    filters,
    setFilters,
    createMovement,
    updateMovement,
    deleteMovement
  } = useMovements({ page: 1, limit: HISTORY_PAGE_SIZE });

  const { categories, loading: categoriesLoading } = useCategories();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { showSuccess, showError } = useToast();

  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [showModal, setShowModal] = useState(false);
  const [editingMovement, setEditingMovement] = useState(null);

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
    form.reset({
      type: 'expense',
      description: '',
      amount: '',
      categoryId: '',
      accountId: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowModal(true);
  };

  const openEditModal = useCallback((movement) => {
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
  }, [form]);

  const handleDelete = useCallback(async (id) => {
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
  }, [deleteMovement, showSuccess, showError]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    form,
    setValue,
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
    } catch {
      showError('Error al guardar');
    }
  };

  const handleTypeChange = (type) => {
    setValue('type', type);
    setValue('categoryId', '');
  };

  const columns = useMemo(() => [
    {
      key: 'date',
      header: 'Fecha',
      sortable: true,
      render: (v) => <span className="text-gray-700 dark:text-gray-300 tabular-nums">{formatDate(v)}</span>
    },
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
    {
      key: 'description',
      header: 'Descripción',
      sortable: false,
      render: (v, row) => (
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: row.category?.color }} aria-hidden="true" />
          <span className="text-gray-900 dark:text-gray-100 truncate">{v}</span>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Categoría',
      sortable: true,
      render: (v) => (
        <span className={cn('font-medium', getTypeColorClass('expense'))}>{v?.name}</span>
      )
    },
    {
      key: 'account',
      header: 'Cuenta',
      sortable: true,
      render: (v) => (
        <span className="text-gray-700 dark:text-gray-300 truncate">{v?.name}</span>
      )
    },
    {
      key: 'amount',
      header: 'Importe',
      sortable: true,
      align: 'right',
      render: (v, row) => (
        <span className={cn('font-semibold text-right', row.type === 'income' ? 'text-income-700 dark:text-income-300' : 'text-expense-700 dark:text-expense-300')}>
          {row.type === 'income' ? <ArrowUpRight className="inline w-3.5 h-3.5" aria-hidden="true" /> : <ArrowDownRight className="inline w-3.5 h-3.5 text-expense-500" aria-hidden="true" />}
          {' '}
          {formatCurrency(Math.abs(v))}
        </span>
      )
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEditModal(row)} aria-label="Editar">
            <span className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" aria-hidden="true">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} aria-label="Eliminar">
            <span className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-expense-600 transition-colors" aria-hidden="true">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </span>
          </Button>
        </div>
      )
    }
  ], [openEditModal, handleDelete]);

  /* Filtrado cliente rápido para el buscador */
  const searchTerm = (filters.search || '').trim().toLowerCase();
  const filteredMovements = useMemo(() => {
    if (!searchTerm) return movements;
    return movements.filter(m =>
      (m.description || '').toLowerCase().includes(searchTerm) ||
      (m.category?.name || '').toLowerCase().includes(searchTerm) ||
      (m.account?.name || '').toLowerCase().includes(searchTerm) ||
      formatCurrency(m.amount).toLowerCase().includes(searchTerm)
    );
  }, [movements, searchTerm]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Historial</h1>
          <p className="page-subtitle">Gestiona tus movimientos financieros</p>
        </div>
        <Button onClick={openCreateModal} className="w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Nuevo movimiento
        </Button>
      </div>

      {/* Barra de herramientas */}
      <Card className="stat-card">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            label="Buscar"
            placeholder="Buscar en descripción, categoría o cuenta..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
          >
            <Search className="w-4 h-4 text-gray-400" />
            {(filters.search || '') && (
              <button
                type="button"
                className="btn-action"
                onClick={() => handleFilterChange({ search: '' })}
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
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
            disabled={categoriesLoading && !filters.categoryId}
          />

          <Select
            label="Cuenta"
            options={[
              { value: '', label: 'Todas' },
              ...accounts.map(a => ({ value: a.id, label: a.name }))
            ]}
            value={filters.accountId || ''}
            onChange={(e) => handleFilterChange({ accountId: e.target.value || undefined })}
            disabled={accountsLoading && !filters.accountId}
          />

          <div>
            <label className="label">Rango de fechas</label>
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="Desde"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange({ startDate: e.target.value || undefined })}
                className="w-1/2"
              />
              <Input
                type="date"
                placeholder="Hasta"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange({ endDate: e.target.value || undefined })}
                className="w-1/2"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Tabla */}
      <Card className="stat-card overflow-hidden">
        <Table
          columns={columns}
          data={filteredMovements}
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
            pageSize={meta.limit || HISTORY_PAGE_SIZE}
          />
        )}
      </Card>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingMovement(null); }}
        title={editingMovement ? 'Editar movimiento' : 'Nuevo movimiento'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
              <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-income-500" aria-hidden="true" />Ingreso</span>
              <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-expense-500" aria-hidden="true" />Gasto</span>
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
            >
              <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: watch('type') === 'income' ? '#16a34a' : '#dc2626' }} aria-hidden="true" />{(watch('type') === 'income' ? incomeCategories : expenseCategories).find(c => c.id === watch('categoryId'))?.name || 'Selecciona una categoría'}</span>
            </Select>

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

          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-light dark:border-white/8">
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
