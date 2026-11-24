import { useState, useEffect } from 'react';
import { useBudgets } from '../../hooks/useBudgets';
import { useCategories } from '../../hooks/useCategories';
import { cn, formatCurrency, formatPercent, getAlertLevelColor, getAlertLevelLabel } from '../../utils/format';
import { Plus, Edit, Trash2, AlertTriangle, CheckCircle, AlertCircle, XCircle, Target } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { budgetSchema } from '../../validators/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { confirmDialog, toast } from '../../components/ui/ConfirmDialog';
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
    deleteBudget,
    fetchBudgets 
  } = useBudgets();
  
  const { categories, loading: categoriesLoading } = useCategories('expense');
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
        await upsertBudget({ ...data, month: currentMonth, year: currentYear });
        showSuccess('Presupuesto creado');
      }
      setShowModal(false);
      setEditingBudget(null);
    } catch (error) {
      showError('Error al guardar');
    }
  };

  const getCategory = (categoryId) => {
    return categories.find(c => c.id === categoryId);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 90) return 'bg-orange-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Presupuestos</h1>
          <p className="text-gray-500 dark:text-gray-400">Controla tus gastos por categoría</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Mes:</label>
            <Select
              options={monthNames.map((name, i) => ({ value: i + 1, label: name }))}
              value={currentMonth}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Año:</label>
            <Select
              options={Array.from({ length: 10 }, (_, i) => ({ value: new Date().getFullYear() - 5 + i, label: String(new Date().getFullYear() - 5 + i) }))}
              value={currentYear}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-auto"
            />
          </div>
          <Button onClick={openCreateModal} className="w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Nuevo presupuesto
          </Button>
        </div>
      </div>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <Card.Content className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total presupuestado</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(summary.totalBudgeted)}</p>
            </Card.Content>
          </Card>
          <Card>
            <Card.Content className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total gastado</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(summary.totalSpent)}</p>
            </Card.Content>
          </Card>
          <Card>
            <Card.Content className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Porcentaje global</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatPercent(summary.overallPercentage)}</p>
            </Card.Content>
          </Card>
          <Card>
            <Card.Content className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Restante</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(summary.totalBudgeted - summary.totalSpent)}</p>
            </Card.Content>
          </Card>
        </div>
      )}

      <Card>
        <Table
          columns={[
            { key: 'category', header: 'Categoría', sortable: true, render: (v) => v?.name },
            { key: 'color', header: '', sortable: false, render: (v) => <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: v }} /> },
            { key: 'amount', header: 'Presupuesto', sortable: true, align: 'right', render: (v, row) => formatCurrency(v, row.currency || 'EUR') },
            { key: 'spent', header: 'Gastado', sortable: true, align: 'right', render: (v, row) => formatCurrency(v, row.currency || 'EUR') },
            { key: 'remaining', header: 'Restante', sortable: true, align: 'right', render: (v, row) => (
              <span className={cn('font-medium', v < 0 ? 'text-expense-600' : 'text-green-600')}>
                {formatCurrency(v, row.currency || 'EUR')}
              </span>
            )},
            { key: 'percentage', header: 'Consumido', sortable: true, align: 'center', render: (v) => formatPercent(v) },
            { key: 'alertLevel', header: 'Estado', sortable: true, align: 'center', render: (v) => (
              <Badge variant="alert" alertLevel={v}>{getAlertLevelLabel(v)}</Badge>
            )},
            { key: 'progress', header: 'Progreso', sortable: false, render: (_, row) => (
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(row.percentage, 100)}%`, backgroundColor: getProgressColor(row.percentage) }}
                />
              </div>
            )},
            { key: 'actions', header: 'Acciones', sortable: false, align: 'center', render: (_, row) => (
              <div className="flex items-center justify-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEditModal(row)} aria-label="Editar">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} aria-label="Eliminar">
                  <Trash2 className="w-4 h-4 text-expense-600" />
                </Button>
              </div>
            )}
          ]}
          data={budgets}
          loading={loading}
          emptyMessage="No hay presupuestos para este mes. Crea uno para empezar a controlar tus gastos."
        />
      </Card>

      {budgets.length === 0 && !loading && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-warning-100 dark:bg-warning-900/30 rounded-full flex items-center justify-center">
            <Target className="w-8 h-8 text-warning-600 dark:text-warning-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No hay presupuestos</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Crea presupuestos por categoría para controlar tus gastos mensuales</p>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            Crear primer presupuesto
          </Button>
        </Card>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingBudget(null); }}
        title={editingBudget ? 'Editar presupuesto' : 'Nuevo presupuesto'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          />

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

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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