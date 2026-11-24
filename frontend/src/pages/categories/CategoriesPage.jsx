import { useState, useEffect } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { cn } from '../../utils/format';
import { Plus, Edit, Trash2, Palette, Tag, Search, Filter, ChevronUp, ChevronDown } from 'lucide-react';
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
import * as lucideIcons from 'lucide-react';
import { confirmDialog, toast } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { ICONS } from '../../utils/constants';

const getIconComponent = (name) => {
  const PascalName = name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return lucideIcons[PascalName] || lucideIcons.Tag;
};

const CategoriesPage = () => {
  const { 
    categories, 
    loading, 
    createCategory, 
    updateCategory, 
    deleteCategory,
    seedDefaults 
  } = useCategories();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState('expense');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const filteredCategories = categories.filter(c => c.type === activeTab);

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
    } catch (error) {
      showError('Error al guardar');
    }
  };

  const columns = [
    { key: 'name', header: 'Nombre', sortable: true },
    { 
      key: 'color', 
      header: 'Color', 
      sortable: false, 
      render: (v) => (
        <span
          className="inline-block w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
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
      render: (v) => v ? <Badge variant="warning">Sí</Badge> : <Badge variant="default">No</Badge>
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
          {!row.isDefault && (
            <Button variant="ghost" size="sm" onClick={() => openEditModal(row)} aria-label="Editar">
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {!row.isDefault && (
            <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} aria-label="Eliminar">
              <Trash2 className="w-4 h-4 text-expense-600" />
            </Button>
          )}
          {row.isDefault && (
            <Badge variant="default" className="text-xs">Sistema</Badge>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Categorías</h1>
          <p className="text-gray-500 dark:text-gray-400">Organiza tus ingresos y gastos</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="secondary" onClick={handleSeedDefaults} disabled={loading} className="w-full sm:w-auto">
            <Tag className="w-4 h-4" />
            Categorías por defecto
          </Button>
          <Button onClick={openCreateModal} className="w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Nueva categoría
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700" role="tablist" aria-label="Tipo de categorías">
        {['expense', 'income'].map((type) => (
          <button
            key={type}
            role="tab"
            aria-selected={activeTab === type}
            onClick={() => setActiveTab(type)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === type
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            {type === 'expense' ? 'Gastos' : 'Ingresos'}
          </button>
        ))}
      </div>

      <Card>
        <Table
          columns={columns}
          data={filteredCategories}
          loading={loading}
          emptyMessage={`No hay categorías de ${activeTab === 'expense' ? 'gastos' : 'ingresos'}`}
        />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingCategory(null); }}
        title={editingCategory ? 'Editar categoría' : 'Nueva categoría'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-income-500" />
                Ingreso
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-expense-500" />
                Gasto
              </div>
            </Select>

            <div className="sm:col-span-2">
              <label className="label">Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  {...register('color')}
                  className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                  aria-label="Selector de color"
                />
                <span
                  className="inline-block w-7 h-7 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm"
                  style={{ backgroundColor: watch('color') }}
                  aria-label={`Color: ${watch('color')}`}
                  role="img"
                />
              </div>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="label">Icono</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => {
                const Icon = getIconComponent(icon);
                const isSelected = watch('icon') === icon;
                return (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setValue('icon', icon)}
                    className={cn(
                      'p-2 rounded-lg border-2 transition-colors',
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                    )}
                    aria-label={icon}
                    aria-pressed={isSelected}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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