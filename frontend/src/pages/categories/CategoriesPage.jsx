import { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { cn } from '../../utils/format';
import { Plus, Edit, Trash2, Tag, Search, X, Check } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { categorySchema } from '../../validators/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { confirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { ICONS } from '../../utils/constants';
import { ICON_MAP, FALLBACK_ICON } from '../../utils/categoryIcons';

const getIconComponent = (name) => {
  return ICON_MAP[name] || FALLBACK_ICON;
};

const ColorPicker = ({ id, value, onChange, disabled }) => (
  <div className="flex items-center gap-3">
    <input
      type="color"
      id={id}
      {...(onChange ? { value } : {})}
      onChange={(e) => onChange?.(e.target.value)}
      className={cn(
        'h-10 w-10 cursor-pointer rounded-lg border border-border-light shadow-sm transition-transform duration-150 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed',
        !onChange && 'cursor-default'
      )}
      aria-label={`Seleccionar color (${value})`}
      disabled={disabled}
    />
    <span
      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border-light shadow-sm ring-2 ring-offset-1 ring-offset-surface-light"
      style={{ backgroundColor: value }}
      aria-hidden="true"
    />
    <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[12rem]">{value}</span>
  </div>
);

const CategoriesPage = () => {
  const { categories, loading, createCategory, updateCategory, deleteCategory, seedDefaults } = useCategories();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState('expense');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [search, setSearch] = useState('');

  const searchTerm = search.trim().toLowerCase();
  const filteredCategories = categories.filter(
    (c) =>
      c.type === activeTab &&
      (!searchTerm || (c.name || '').toLowerCase().includes(searchTerm))
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: activeTab,
      color: '#4f46e5',
      icon: 'tag'
    }
  });

  const openCreateModal = () => {
    setEditingCategory(null);
    reset({ name: '', type: activeTab, color: '#4f46e5', icon: 'tag' });
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    reset({ name: category.name, type: category.type, color: category.color, icon: category.icon });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar categoría?',
      text: 'Esta acción no se puede deshacer. No se puede eliminar si tiene movimientos asociados.',
      confirmText: 'Eliminar',
      confirmColor: '#ef4444'
    });
    if (confirmed) {
      try {
        await deleteCategory(id);
        showSuccess('Categoría eliminada');
      } catch (error) {
        if (error.response?.data?.code === 'CONFLICT') {
          showError(`No se puede eliminar: tiene ${error.response.data.details?.movementCount} movimientos`);
        } else {
          showError('Error al eliminar');
        }
      }
    }
  };

  const handleSeedDefaults = async () => {
    const confirmed = await confirmDialog({
      title: 'Crear categorías por defecto',
      text: 'Se crearán las categorías estándar del sistema. Las que ya existan no se duplicarán.',
      confirmText: 'Crear'
    });
    if (confirmed) {
      try {
        await seedDefaults();
        showSuccess('Categorías por defecto creadas');
      } catch {
        showError('Error al crear categorías');
      }
    }
  };

  const onSubmit = async (data) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
        showSuccess('Categoría actualizada');
      } else {
        await createCategory(data);
        showSuccess('Categoría creada');
      }
      setShowModal(false);
      setEditingCategory(null);
    } catch {
      showError('Error al guardar');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Nombre',
      sortable: true,
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color }} aria-hidden="true" />
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-50">{v}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.type === 'income' ? 'Ingreso' : 'Gasto'}</p>
          </div>
        </div>
      )
    },
    {
      key: 'color',
      header: 'Color',
      sortable: false,
      render: (v) => (
        <span
          className="inline-block h-7 w-7 rounded-lg border border-border-light shadow-sm ring-2 ring-offset-1 ring-offset-surface-light"
          style={{ backgroundColor: v }}
          title={v}
          aria-label={`Color: ${v}`}
          role="img"
        />
      )
    },
    {
      key: 'icon',
      header: 'Icono',
      sortable: false,
      render: (v) => {
        const Icon = getIconComponent(v);
        return <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" aria-label={v} />;
      }
    },
    {
      key: 'isDefault',
      header: 'Por defecto',
      sortable: true,
      render: (v) => v ? <Badge variant="warning">Sí</Badge> : <Badge variant="success">No</Badge>
    },
    {
      key: 'isActive',
      header: 'Estado',
      sortable: true,
      render: (v) => v ? <Badge variant="success">Activa</Badge> : <Badge variant="default">Inactiva</Badge>
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          {!row.isDefault && (
            <Button variant="ghost" size="sm" onClick={() => openEditModal(row)} aria-label="Editar">
              <span className="btn-icon" aria-hidden="true"><Edit className="w-4 h-4" /></span>
            </Button>
          )}
          {!row.isDefault && (
            <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} aria-label="Eliminar">
              <span className="btn-icon text-expense-600" aria-hidden="true"><Trash2 className="w-4 h-4" /></span>
            </Button>
          )}
          {row.isDefault && <Badge variant="default">Sistema</Badge>}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Categorías</h1>
          <p className="page-subtitle">Organiza tus ingresos y gastos</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="secondary" onClick={handleSeedDefaults} disabled={loading}>
            <Tag className="w-4 h-4" />
            Categorías por defecto
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            Nueva categoría
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Tipo de categorías">
        <div className="flex gap-2 border-b border-border-light pb-1">
          {['expense', 'income'].map((type) => (
            <button
              key={type}
              role="tab"
              aria-selected={activeTab === type}
              onClick={() => setActiveTab(type)}
              className={cn(
                'relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                activeTab === type
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-surfaceRaised'
              )}
            >
              {type === 'expense' ? 'Gastos' : 'Ingresos'}
              {activeTab === type && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary-600 dark:bg-primary-300" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <Card className="stat-card">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 pr-4 py-2.5 text-sm"
            aria-label="Buscar categoría"
          />
          {search && (
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setSearch('')} aria-label="Limpiar búsqueda">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </Card>

      {/* Tabla */}
      <Card className="stat-card overflow-hidden">
        <Table
          columns={columns}
          data={filteredCategories}
          loading={loading}
          emptyMessage={`No hay categorías de ${activeTab === 'expense' ? 'gastos' : 'ingresos'}`}
        />
      </Card>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingCategory(null); }}
        title={editingCategory ? 'Editar categoría' : 'Nueva categoría'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Nombre"
            placeholder="Ej: Alimentación, Salario..."
            error={errors.name?.message}
            {...register('name')}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Tipo"
              options={[
                { value: 'income', label: 'Ingreso' },
                { value: 'expense', label: 'Gasto' }
              ]}
              {...register('type')}
              disabled={!!editingCategory}
            >
              <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-income-500" aria-hidden="true" />Ingreso</span>
              <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-expense-500" aria-hidden="true" />Gasto</span>
            </Select>

            <div>
              <label className="label">Color</label>
              <ColorPicker id="category-color" value={watch('color')} onChange={(v) => setValue('color', v)} />
            </div>
          </div>

          <div>
            <label className="label">Icono</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {ICONS.slice(0, 40).map((icon) => {
                const Icon = getIconComponent(icon);
                const isSelected = watch('icon') === icon;
                return (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setValue('icon', icon)}
                    className={cn(
                      'relative flex items-center justify-center h-12 rounded-xl border-2 transition-all duration-200',
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.04]'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50 dark:border-surfaceRaised dark:hover:bg-surfaceRaised'
                    )}
                    aria-label={icon}
                    aria-pressed={isSelected}
                  >
                    <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    {isSelected && <Check className="absolute -top-1.5 -right-1.5 w-4 h-4 text-primary-500" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-light">
            <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditingCategory(null); }}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingCategory ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CategoriesPage;
