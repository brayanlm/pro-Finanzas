import { useState } from 'react';
import { useBudgets } from '../../hooks/useBudgets';
import { useCategories } from '../../hooks/useCategories';
import { cn, formatCurrency, formatPercent, getAlertLevelLabel, getProgressColor } from '../../utils/format';
import { Plus, Edit, Trash2, Target, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { budgetSchema } from '../../validators/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { confirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';

const BudgetsPage = () => {
  const {
    budgets,
    summary,
    loading,
    currentMonth,
    currentYear,
    setMonth,
    setYear,
    upsertBudget,
    updateBudget,
    deleteBudget
  } = useBudgets();

  const { categories } = useCategories('expense');
  const { showSuccess, showError } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const expenseCategories = categories.filter(c => c.type === 'expense');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch
  } = useForm({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: '',
      amount: '',
      alertThresholds: { warning: 80, danger: 90, critical: 100 }
    }
  });

  const openCreateModal = () => {
    setEditingBudget(null);
    reset({ categoryId: '', amount: '', alertThresholds: { warning: 80, danger: 90, critical: 100 } });
    setShowModal(true);
  };

  const openEditModal = (budget) => {
    setEditingBudget(budget);
    reset({
      categoryId: budget.categoryId,
      amount: budget.amount,
      alertThresholds: budget.alertThresholds
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar presupuesto?',
      text: 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      confirmColor: '#ef4444'
    });
    if (confirmed) {
      try {
        await deleteBudget(id);
        showSuccess('Presupuesto eliminado');
      } catch {
        showError('Error al eliminar');
      }
    }
  };

  const onSubmit = async (data) => {
    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, data);
        showSuccess('Presupuesto actualizado');
      } else {
        upsertBudget({ ...data, month: currentMonth, year: currentYear });
        showSuccess('Presupuesto creado');
      }
      setShowModal(false);
      setEditingBudget(null);
    } catch {
      showError('Error al guardar');
    }
  };

  const _getCategory = (categoryId) => categories.find(c => c.id === categoryId);

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const yearOptions = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  const columns = [
    {
      key: 'category',
      header: 'Categoría',
      sortable: true,
      render: (v) => (
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v?.color }} aria-hidden="true" />
          <span className="font-medium text-gray-900 dark:text-gray-50">{v?.name}</span>
        </div>
      )
    },
    {
      key: 'amount',
      header: 'Presupuesto',
      sortable: true,
      align: 'right',
      render: (v, row) => <span className="tabular-nums text-gray-900 dark:text-gray-50 font-semibold">{formatCurrency(v, row.currency || 'EUR')}</span>
    },
    {
      key: 'spent',
      header: 'Gastado',
      sortable: true,
      align: 'right',
      render: (v, row) => (
        <span className={cn('tabular-nums font-semibold', v > 0 ? 'text-expense-700 dark:text-expense-300' : 'text-gray-700 dark:text-gray-300')}>
          {formatCurrency(v, row.currency || 'EUR')}
        </span>
      )
    },
    {
      key: 'remaining',
      header: 'Restante',
      sortable: true,
      align: 'right',
      render: (v, row) => (
        <span className={cn('tabular-nums font-semibold', v < 0 ? 'text-expense-700 dark:text-expense-300' : 'text-income-700 dark:text-income-300')}>
          {formatCurrency(v, row.currency || 'EUR')}
        </span>
      )
    },
    {
      key: 'percentage',
      header: 'Consumido',
      sortable: true,
      align: 'right',
      render: (v) => <span className="tabular-nums text-gray-700 dark:text-gray-300">{formatPercent(v)}</span>
    },
    {
      key: 'alertLevel',
      header: 'Estado',
      sortable: true,
      align: 'center',
      render: (v) => (
        <div className="flex items-center justify-center gap-2">
          <Badge variant="alert" alertLevel={v}>{getAlertLevelLabel(v)}</Badge>
          {v === 'normal' && <CheckCircle className="w-3.5 h-3.5 text-income-500 opacity-60" aria-hidden="true" />}
        </div>
      )
    },
    {
      key: 'progress',
      header: 'Progreso',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-full h-2 bg-gray-100 dark:bg-surfaceRaised rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-[width,background-color] duration-500 ease-out', getProgressColor(row.percentage))}
              style={{ width: `${Math.min(row.percentage, 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums w-12 text-right shrink-0">
            {formatPercent(row.percentage)}
          </span>
        </div>
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
            <span className="btn-icon" aria-hidden="true"><Edit className="w-4 h-4" /></span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} aria-label="Eliminar">
            <span className="btn-icon text-expense-500" aria-hidden="true"><Trash2 className="w-4 h-4" /></span>
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Presupuestos</h1>
          <p className="page-subtitle">Controla tus gastos por categoría</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Mes</label>
            <Select
              options={monthNames.map((name, i) => ({ value: i + 1, label: name }))}
              value={currentMonth}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-auto text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Año</label>
            <Select
              options={yearOptions.map(y => ({ value: y, label: String(y) }))}
              value={currentYear}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-auto text-sm"
            />
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            Nuevo presupuesto
          </Button>
        </div>
      </div>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="stat-card">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total presupuestado</div>
            <p className="stat-card-value tabular-nums">{formatCurrency(summary.totalBudgeted)}</p>
          </Card>
          <Card className="stat-card">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total gastado</div>
            <p className={cn('stat-card-value tabular-nums', summary.totalSpent > 0 ? 'text-expense-700 dark:text-expense-300' : 'text-gray-900 dark:text-gray-50')}>
              {formatCurrency(summary.totalSpent)}
            </p>
          </Card>
          <Card className="stat-card">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Porcentaje global</div>
            <p className="stat-card-value tabular-nums">{formatPercent(summary.overallPercentage)}</p>
          </Card>
          <Card className="stat-card">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Restante</div>
            <p className={cn('stat-card-value tabular-nums', summary.totalBudgeted - summary.totalSpent >= 0 ? 'text-income-700 dark:text-income-300' : 'text-expense-700 dark:text-expense-300')}>
              {formatCurrency(summary.totalBudgeted - summary.totalSpent)}
            </p>
          </Card>
        </div>
      )}

      {budgets.length > 0 && (
        <Card className="stat-card overflow-hidden">
          <Table
            columns={columns}
            data={budgets}
            loading={loading}
            emptyMessage="No hay presupuestos para este mes."
          />
        </Card>
      )}

      {budgets.length === 0 && !loading && (
        <Card className="stat-card">
          <EmptyState
            icon={<Target className="w-7 h-7" />}
            title="No hay presupuestos"
            description="Crea presupuestos por categoría para controlar tus gastos mensuales."
            action={{ label: 'Crear primer presupuesto', onClick: openCreateModal }}
          />
        </Card>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingBudget(null); }}
        title={editingBudget ? 'Editar presupuesto' : 'Nuevo presupuesto'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Select
            label="Categoría"
            options={[
              { value: '', label: 'Seleccionar categoría...' },
              ...expenseCategories.map(c => ({ value: c.id, label: c.name }))
            ]}
            error={errors.categoryId?.message}
            {...register('categoryId')}
            required
            disabled={!!editingBudget}
          >
            {expenseCategories.map(c => {
              const isSelected = watch('categoryId') === c.id;
              return (
                <span key={c.id} className="inline-flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} aria-hidden="true" />
                  {c.name}{isSelected ? ' ✓' : ''}
                </span>
              );
            })}
          </Select>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Importe del presupuesto"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              error={errors.amount?.message}
              {...register('amount', { valueAsNumber: true })}
              required
            />
            <Select
              label="Mes"
              options={monthNames.map((name, i) => ({ value: i + 1, label: name }))}
              value={currentMonth}
              disabled
            />
            <Select
              label="Año"
              options={yearOptions.map(y => ({ value: y, label: String(y) }))}
              value={currentYear}
              disabled
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Advertencia (%)"
              type="number"
              min="1"
              max="100"
              error={errors['alertThresholds.warning']?.message}
              {...register('alertThresholds.warning', { valueAsNumber: true })}
            />
            <Input
              label="Peligro (%)"
              type="number"
              min="1"
              max="100"
              error={errors['alertThresholds.danger']?.message}
              {...register('alertThresholds.danger', { valueAsNumber: true })}
            />
            <Input
              label="Crítico (%)"
              type="number"
              min="1"
              max="100"
              error={errors['alertThresholds.critical']?.message}
              {...register('alertThresholds.critical', { valueAsNumber: true })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-light">
            <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditingBudget(null); }}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingBudget ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BudgetsPage;
