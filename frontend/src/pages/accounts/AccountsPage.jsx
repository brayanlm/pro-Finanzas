import { useState, useEffect } from 'react';
import { useAccounts } from '../../hooks/useAccounts';
import { cn, formatCurrency } from '../../utils/format';
import { Plus, Edit, Trash2, RefreshCw, Building2, PiggyBank, CreditCard, Banknote, Wallet, Search, Filter } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { accountSchema } from '../../validators/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { confirmDialog, toast } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { ACCOUNT_TYPES } from '../../utils/constants';

const AccountsPage = () => {
  const { 
    accounts, 
    loading, 
    createAccount, 
    updateAccount, 
    deleteAccount,
    recalculateBalance 
  } = useAccounts();
  const { showSuccess, showError } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue
  } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type: 'cash',
      initialBalance: 0,
      currency: 'EUR',
      creditLimit: '',
      bankName: '',
      lastFourDigits: '',
      description: ''
    }
  });

  const accountType = watch('type');
  const showCreditLimit = accountType === 'credit_card';
  const showBankFields = ['bank', 'savings', 'debit_card', 'credit_card'].includes(accountType);

  const openCreateModal = () => {
    setEditingAccount(null);
    reset({ name: '', type: 'cash', initialBalance: 0, currency: 'EUR', creditLimit: '', bankName: '', lastFourDigits: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (account) => {
    setEditingAccount(account);
    reset({ 
      name: account.name, 
      type: account.type, 
      initialBalance: account.initialBalance, 
      currency: account.currency, 
      creditLimit: account.creditLimit || '', 
      bankName: account.bankName || '', 
      lastFourDigits: account.lastFourDigits || '', 
      description: account.description || '' 
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar cuenta?',
      text: 'Esta acción no se puede deshacer. No se puede eliminar si tiene movimientos asociados.',
      confirmText: 'Eliminar',
      confirmColor: '#ef4444'
    });
    if (confirmed) {
      try {
        await deleteAccount(id);
        showSuccess('Cuenta eliminada');
      } catch (error) {
        if (error.response?.data?.code === 'CONFLICT') {
          showError(`No se puede eliminar: tiene ${error.response.data.details?.movementCount} movimientos`);
        } else {
          showError('Error al eliminar');
        }
      }
    }
  };

  const handleRecalculate = async (id) => {
    try {
      await recalculateBalance(id);
      showSuccess('Balance recalculado');
    } catch {
      showError('Error al recalcular');
    }
  };

  const onSubmit = async (data) => {
    try {
      const submitData = {
        ...data,
        initialBalance: data.initialBalance || 0,
        creditLimit: showCreditLimit ? (data.creditLimit || undefined) : undefined,
        bankName: showBankFields ? data.bankName : undefined,
        lastFourDigits: showBankFields ? data.lastFourDigits : undefined
      };
      
      if (editingAccount) {
        await updateAccount(editingAccount.id, submitData);
        showSuccess('Cuenta actualizada');
      } else {
        await createAccount(submitData);
        showSuccess('Cuenta creada');
      }
      setShowModal(false);
      setEditingAccount(null);
    } catch (error) {
      showError('Error al guardar');
    }
  };

  const getTypeIcon = (type) => {
    const typeConfig = ACCOUNT_TYPES.find(t => t.value === type);
    return typeConfig?.icon || 'wallet';
  };

  const getTypeLabel = (type) => {
    const typeConfig = ACCOUNT_TYPES.find(t => t.value === type);
    return typeConfig?.label || type;
  };

  const columns = [
    { 
      key: 'name', 
      header: 'Cuenta', 
      sortable: true,
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <i data-lucide={getTypeIcon(row.type)} className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{v}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{getTypeLabel(row.type)}</p>
          </div>
        </div>
      )
    },
    { 
      key: 'type', 
      header: 'Tipo', 
      sortable: true,
      render: (v) => (
        <Badge variant="default">{getTypeLabel(v)}</Badge>
      )
    },
    { 
      key: 'currency', 
      header: 'Moneda', 
      sortable: true,
      align: 'center'
    },
    { 
      key: 'initialBalance', 
      header: 'Saldo inicial', 
      sortable: true,
      align: 'right',
      render: (v, row) => formatCurrency(v, row.currency)
    },
    { 
      key: 'currentBalance', 
      header: 'Saldo actual', 
      sortable: true,
      align: 'right',
      render: (v, row) => (
        <span className="font-bold text-gray-900 dark:text-gray-100">
          {formatCurrency(v, row.currency)}
        </span>
      )
    },
    { 
      key: 'bankName', 
      header: 'Banco', 
      sortable: true,
      render: (v) => v || '-'
    },
    { 
      key: 'isActive', 
      header: 'Estado', 
      sortable: true,
      render: (v) => v ? <Badge variant="success">Activa</Badge> : <Badge variant="default">Inactiva</Badge>
    },
    { 
      key: 'actions', 
      header: 'Acciones', 
      sortable: false, 
      align: 'center',
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEditModal(row)} aria-label="Editar">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleRecalculate(row.id)} aria-label="Recalcular">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} aria-label="Eliminar">
            <Trash2 className="w-4 h-4 text-expense-600" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cuentas</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestiona tus cuentas y medios de pago</p>
        </div>
        <Button onClick={openCreateModal} className="w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Nueva cuenta
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {accounts.map((account) => (
          <Card key={account.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <i data-lucide={getTypeIcon(account.type)} className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{account.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{getTypeLabel(account.type)}</p>
                </div>
              </div>
              <Badge variant={account.isActive ? 'success' : 'default'}>
                {account.isActive ? 'Activa' : 'Inactiva'}
              </Badge>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(account.currentBalance, account.currency)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Saldo inicial: {formatCurrency(account.initialBalance, account.currency)}
              </p>
              {account.bankName && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {account.bankName} {account.lastFourDigits ? `•••• ${account.lastFourDigits}` : ''}
                </p>
              )}
              {account.type === 'credit_card' && account.creditLimit && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Límite: {formatCurrency(account.creditLimit, account.currency)}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <Button variant="ghost" size="sm" onClick={() => openEditModal(account)} className="flex-1" aria-label="Editar">
                <Edit className="w-4 h-4 mx-auto" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleRecalculate(account.id)} className="flex-1" aria-label="Recalcular">
                <RefreshCw className="w-4 h-4 mx-auto" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(account.id)} className="flex-1" aria-label="Eliminar">
                <Trash2 className="w-4 h-4 text-expense-600 mx-auto" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {accounts.length === 0 && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Wallet className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No hay cuentas</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Crea tu primera cuenta para empezar a registrar movimientos</p>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            Crear cuenta
          </Button>
        </Card>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingAccount(null); }}
        title={editingAccount ? 'Editar cuenta' : 'Nueva cuenta'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej: Efectivo, Banco Principal, Tarjeta Visa..."
            error={errors.name?.message}
            {...register('name')}
            required
          />

          <Select
            label="Tipo de cuenta"
            options={ACCOUNT_TYPES.map(t => ({ value: t.value, label: t.label }))}
            {...register('type')}
            required
          >
            {ACCOUNT_TYPES.map(t => (
              <div key={t.value} className="flex items-center gap-2">
                <i data-lucide={t.icon} className="w-4 h-4" />
                {t.label}
              </div>
            ))}
          </Select>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Saldo inicial"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.initialBalance?.message}
              {...register('initialBalance', { valueAsNumber: true })}
            />

            <Select
              label="Moneda"
              options={[
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'USD', label: 'USD ($)' },
                { value: 'GBP', label: 'GBP (£)' }
              ]}
              {...register('currency')}
            />
          </div>

          {showBankFields && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Banco / Entidad"
                placeholder="Ej: Banco Santander, BBVA..."
                error={errors.bankName?.message}
                {...register('bankName')}
              />

              <Input
                label="Últimos 4 dígitos"
                placeholder="1234"
                maxLength={4}
                pattern="[0-9]*"
                error={errors.lastFourDigits?.message}
                {...register('lastFourDigits')}
              />
            </div>
          )}

          {showCreditLimit && (
            <Input
              label="Límite de crédito"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="3000.00"
              error={errors.creditLimit?.message}
              {...register('creditLimit', { valueAsNumber: true })}
              required
            />
          )}

          <Input
            label="Descripción (opcional)"
            placeholder="Notas adicionales..."
            {...register('description')}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditingAccount(null); }}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingAccount ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AccountsPage;