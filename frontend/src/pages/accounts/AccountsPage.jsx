import { useState } from 'react';
import { useAccounts } from '../../hooks/useAccounts';
import { cn, formatCurrency } from '../../utils/format';
import {
  Plus, Edit, Trash2, RefreshCw, Wallet, Search,
  Banknote, Building2, PiggyBank, CreditCard
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { accountSchema } from '../../validators/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { confirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { ACCOUNT_TYPES } from '../../utils/constants';

const TYPE_ICON_COMPONENTS = {
  cash: Banknote,
  bank: Building2,
  savings: PiggyBank,
  debit_card: CreditCard,
  credit_card: CreditCard,
  other: Wallet
};

const getTypeIcon = (type) => TYPE_ICON_COMPONENTS[type] || Wallet;
const getTypeLabel = (type) => ACCOUNT_TYPES.find(t => t.value === type)?.label || type;
const getTypeColorClass = (type) => {
  switch (type) {
    case 'bank': return 'text-primary-600 dark:text-primary-400';
    case 'savings': return 'text-income-600 dark:text-income-400';
    case 'debit_card': return 'text-primary-500';
    case 'credit_card': return 'text-expense-600 dark:text-expense-400';
    case 'cash': return 'text-warning-600 dark:text-warning-400';
    default: return 'text-gray-600 dark:text-gray-400';
  }
};
const getTypeBgClass = (type) => {
  switch (type) {
    case 'bank': return 'bg-primary-50 dark:bg-primary-900/20';
    case 'savings': return 'bg-income-50 dark:bg-income-900/20';
    case 'debit_card': return 'bg-primary-50 dark:bg-primary-900/20';
    case 'credit_card': return 'bg-expense-50 dark:bg-expense-900/20';
    case 'cash': return 'bg-warning-50 dark:bg-warning-900/20';
    default: return 'bg-gray-100 dark:bg-surfaceRaised';
  }
};

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
  const [search, setSearch] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    
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
        lastFourDigits: showBankFields ? (data.lastFourDigits || undefined) : undefined
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
    } catch {
      showError('Error al guardar');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Cuenta',
      sortable: true,
      render: (v, row) => {
        const TypeIcon = getTypeIcon(row.type);
        return (
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-sm', getTypeBgClass(row.type), getTypeColorClass(row.type))}>
            <TypeIcon className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-gray-50 truncate">{v}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn('text-xs font-medium', getTypeColorClass(row.type))}>{getTypeLabel(row.type)}</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{row.currency}</span>
              {row.bankName && <span className="text-xs text-gray-500 dark:text-gray-400 truncate">· {row.bankName}</span>}
            </div>
          </div>
        </div>
        );
      }
    },
    {
      key: 'currentBalance',
      header: 'Saldo actual',
      sortable: true,
      align: 'right',
      render: (v, row) => (
        <p className={cn('font-bold text-xl tabular-nums', v >= 0 ? 'text-gray-900 dark:text-gray-50' : 'text-expense-700 dark:text-expense-300')}>
          {formatCurrency(v, row.currency)}
        </p>
      )
    },
    {
      key: 'isActive',
      header: 'Estado',
      sortable: true,
      align: 'center',
      render: (v) => (
        <Badge variant={v ? 'success' : 'default'}>{v ? 'Activa' : 'Inactiva'}</Badge>
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
          <Button variant="ghost" size="sm" onClick={() => handleRecalculate(row.id)} aria-label="Recalcular">
            <span className="btn-icon" aria-hidden="true"><RefreshCw className="w-4 h-4" /></span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} aria-label="Eliminar">
            <span className="btn-icon text-expense-600" aria-hidden="true"><Trash2 className="w-4 h-4" /></span>
          </Button>
        </div>
      )
    }
  ];

  const searchTerm = search.trim().toLowerCase();
  const filteredAccounts = accounts.filter(a =>
    !searchTerm || (a.name || '').toLowerCase().includes(searchTerm) || (a.bankName || '').toLowerCase().includes(searchTerm)
  );

  const AccountCard = ({ account }) => {
    const TypeIcon = getTypeIcon(account.type);
    return (
    <Card className="stat-card">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', getTypeBgClass(account.type), getTypeColorClass(account.type))}>
            <TypeIcon className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-gray-50 truncate">{account.name}</p>
            <p className={cn('text-xs font-medium mt-0.5', getTypeColorClass(account.type))}>{getTypeLabel(account.type)}</p>
            {account.bankName && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {account.bankName} {account.lastFourDigits ? `•••• ${account.lastFourDigits}` : ''}
              </p>
            )}
          </div>
        </div>
        <Badge variant={account.isActive ? 'success' : 'default'}>
          {account.isActive ? 'Activa' : 'Inactiva'}
        </Badge>
      </div>

      <div className="mt-4 pt-4 border-t border-border-light">
        <p className={cn('text-3xl font-extrabold tabular-nums', account.currentBalance >= 0 ? 'text-gray-900 dark:text-gray-50' : 'text-expense-700 dark:text-expense-300')}>
          {formatCurrency(account.currentBalance, account.currency)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Saldo inicial: {formatCurrency(account.initialBalance, account.currency)}
        </p>
        {account.type === 'credit_card' && account.creditLimit && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Límite: {formatCurrency(account.creditLimit, account.currency)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border-light">
        <Button variant="ghost" size="sm" onClick={() => openEditModal(account)} className="flex-1" aria-label="Editar">
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleRecalculate(account.id)} className="flex-1" aria-label="Recalcular">
          <RefreshCw className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleDelete(account.id)} className="flex-1" aria-label="Eliminar">
          <Trash2 className="w-4 h-4 text-expense-500" />
        </Button>
      </div>
    </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Cuentas</h1>
          <p className="page-subtitle">Gestiona tus cuentas y medios de pago</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="relative max-w-xs w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar cuenta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 py-2.5 text-sm w-full sm:w-48"
              aria-label="Buscar cuenta"
            />
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            Nueva cuenta
          </Button>
        </div>
      </div>

      {/* Grid de cuentas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAccounts.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
        {filteredAccounts.length === 0 && !loading && (
          <EmptyState
            className="bg-surface-light dark:bg-surfaceRaised rounded-2xl border border-border-light dark:border-white/8"
            icon={<Wallet className="w-7 h-7" />}
            title="No hay cuentas"
            description={searchTerm ? 'No se encontraron cuentas con esa búsqueda.' : 'Crea tu primera cuenta para empezar a registrar movimientos.'}
            action={{ label: 'Crear cuenta', onClick: openCreateModal }}
          />
        )}
      </div>

      {/* Tabla detallada */}
      {accounts.length > 0 && (
        <Card className="stat-card overflow-hidden">
          <Table
            columns={columns}
            data={accounts}
            loading={loading}
            emptyMessage="No se encontraron cuentas"
          />
        </Card>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingAccount(null); }}
        title={editingAccount ? 'Editar cuenta' : 'Nueva cuenta'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Nombre"
            placeholder="Ej: Efectivo, Banco Principal, Tarjeta Visa..."
            error={errors.name?.message}
            {...register('name')}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Tipo de cuenta"
              options={ACCOUNT_TYPES.map(t => ({ value: t.value, label: t.label }))}
              {...register('type')}
              required
            >
              {ACCOUNT_TYPES.map(t => {
                const Icon = TYPE_ICON_COMPONENTS[t.value] || Wallet;
                return (
                  <span key={t.value} className="inline-flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </span>
                );
              })}
            </Select>

            <div className="grid gap-2">
              <label className="label">Saldo inicial</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.initialBalance?.message}
                {...register('initialBalance', { valueAsNumber: true })}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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

          <div className="flex justify-end gap-3 pt-4 border-t border-border-light">
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
