import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { cn, formatCurrency } from '../../utils/format';
import { User, Lock, Bell, Palette, Globe, Save, CreditCard, Trash2, LogOut, Eye, EyeOff, AlertTriangle, Mail } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { profileSchema, changePasswordSchema } from '../../validators/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useToast } from '../../context/ToastContext';
import { THEME_OPTIONS, LANGUAGE_OPTIONS, CURRENCY_OPTIONS } from '../../utils/constants';

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  
  const checks = [
    { label: 'Mínimo 8 caracteres', met: password.length >= 8 },
    { label: 'Mayúscula', met: /[A-Z]/.test(password) },
    { label: 'Minúscula', met: /[a-z]/.test(password) },
    { label: 'Número', met: /[0-9]/.test(password) },
    { label: 'Símbolo', met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password) },
  ];

  return (
    <div className="mt-2 space-y-1 text-xs">
      {checks.map((check, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className={check.met ? 'text-green-500' : 'text-gray-400'}>
            {check.met ? '✓' : '○'}
          </span>
          <span className={check.met ? 'text-green-500' : 'text-gray-400'}>
            {check.label}
          </span>
        </div>
      ))}
    </div>
  );
};

const SettingsPage = () => {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState('profile');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
    reset: resetProfile
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      preferences: user?.preferences || {}
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
    reset: resetPassword,
    watch
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleProfileSubmit = async (data) => {
    try {
      await updateProfile(data);
      showSuccess('Perfil actualizado');
    } catch {
      showError('Error al actualizar perfil');
    }
  };

  const handlePasswordSubmit = async (data) => {
    try {
      await changePassword(data);
      showSuccess('Contraseña cambiada');
      resetPassword();
    } catch {
      showError('Error al cambiar contraseña');
    }
  };

  const handleDeleteAccount = async () => {
    showError('Función no implementada aún');
    setShowDeleteModal(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configuración</h1>
        <p className="text-gray-500 dark:text-gray-400">Gestiona tu cuenta y preferencias</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-6">
        {[
          { id: 'profile', label: 'Perfil', icon: User },
          { id: 'security', label: 'Seguridad', icon: Lock },
          { id: 'preferences', label: 'Preferencias', icon: Palette },
          { id: 'notifications', label: 'Notificaciones', icon: Bell },
          { id: 'danger', label: 'Zona peligrosa', icon: Trash2 }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2',
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <Card>
          <Card.Header>
            <Card.Title>Información personal</Card.Title>
            <Card.Description>Actualiza tu nombre y datos de contacto</Card.Description>
          </Card.Header>
          <Card.Content>
            <form onSubmit={handleSubmitProfile(handleProfileSubmit)} className="space-y-4">
              <Input
                label="Nombre completo"
                placeholder="Juan Pérez"
                error={profileErrors.name?.message}
                {...registerProfile('name')}
                required
                leftIcon={<User className="w-5 h-5" />}
              />

              <Input
                label="Email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={user?.email}
                disabled
                helperText="El email no se puede cambiar. Contacta con soporte si necesitas modificarlo."
                leftIcon={<Mail className="w-5 h-5" />}
              />

              <div>
                <label className="label">Moneda preferida</label>
                <Select
                  options={CURRENCY_OPTIONS.map(c => ({ value: c.value, label: c.label }))}
                  {...registerProfile('preferences.currency')}
                  leftIcon={<CreditCard className="w-5 h-5" />}
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button type="submit" loading={profileSubmitting}>
                  <Save className="w-4 h-4" />
                  Guardar cambios
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card>
          <Card.Header>
            <Card.Title>Cambiar contraseña</Card.Title>
            <Card.Description>Actualiza tu contraseña regularmente para mayor seguridad</Card.Description>
          </Card.Header>
          <Card.Content>
            <form onSubmit={handleSubmitPassword(handlePasswordSubmit)} className="space-y-4">
              <Input
                label="Contraseña actual"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={passwordErrors.currentPassword?.message}
                {...registerPassword('currentPassword')}
                required
                leftIcon={<Lock className="w-5 h-5" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label={showCurrentPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
              />

              <div className="space-y-5">
                <Input
                  label="Nueva contraseña"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  error={passwordErrors.newPassword?.message}
                  {...registerPassword('newPassword')}
                  required
                  leftIcon={<Lock className="w-5 h-5" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-gray-400 hover:text-gray-600"
                      aria-label={showNewPassword ? 'Ocultar' : 'Mostrar'}
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                />
                <PasswordStrength password={watch('newPassword')} />
              </div>

              <Input
                label="Confirmar nueva contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={passwordErrors.confirmPassword?.message}
                {...registerPassword('confirmPassword')}
                required
                leftIcon={<Lock className="w-5 h-5" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label={showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
              />

              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button type="submit" loading={passwordSubmitting}>
                  <Lock className="w-4 h-4" />
                  Cambiar contraseña
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card>
      )}

      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <Card.Title>Apariencia</Card.Title>
              <Card.Description>Personaliza cómo se ve la aplicación</Card.Description>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div>
                <label className="label">Tema</label>
                <Select
                  options={THEME_OPTIONS.map(t => ({ value: t.value, label: t.label }))}
                  {...registerProfile('preferences.theme')}
                />
              </div>
              <div>
                <label className="label">Idioma</label>
                <Select
                  options={LANGUAGE_OPTIONS.map(l => ({ value: l.value, label: l.label }))}
                  {...registerProfile('preferences.language')}
                />
              </div>
              <div>
                <label className="label">Formato de fecha</label>
                <Select
                  options={[
                    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
                    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
                    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' }
                  ]}
                  {...registerProfile('preferences.dateFormat')}
                />
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Moneda y formato</Card.Title>
              <Card.Description>Configura cómo se muestran los importes</Card.Description>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div>
                <label className="label">Moneda</label>
                <Select
                  options={CURRENCY_OPTIONS.map(c => ({ value: c.value, label: c.label }))}
                  {...registerProfile('preferences.currency')}
                  leftIcon={<CreditCard className="w-5 h-5" />}
                />
              </div>
            </Card.Content>
          </Card>
        </div>
      )}

      {activeTab === 'notifications' && (
        <Card>
          <Card.Header>
            <Card.Title>Notificaciones</Card.Title>
            <Card.Description>Configura qué notificaciones quieres recibir</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Alertas de presupuesto</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Recibe avisos cuando alcances el 80%, 90% o 100% de tu presupuesto</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Recordatorios mensuales</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Recibe un resumen al inicio de cada mes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </Card.Content>
        </Card>
      )}

      {activeTab === 'danger' && (
        <Card className="border-expense-200 dark:border-expense-800">
          <Card.Header>
            <Card.Title className="flex items-center gap-2 text-expense-600 dark:text-expense-400">
              <AlertTriangle className="w-5 h-5" />
              Zona peligrosa
            </Card.Title>
            <Card.Description>Acciones irreversibles. Procede con precaución.</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-6">
            <div className="p-4 bg-expense-50 dark:bg-expense-900/20 rounded-lg border border-expense-200 dark:border-expense-800">
              <h4 className="font-medium text-expense-700 dark:text-expense-300 mb-2">Eliminar cuenta</h4>
              <p className="text-sm text-expense-600 dark:text-expense-400 mb-4">
                Esta acción eliminará permanentemente tu cuenta y todos tus datos financieros (movimientos, categorías, cuentas, presupuestos). No se puede deshacer.
              </p>
              <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                <Trash2 className="w-4 h-4" />
                Eliminar mi cuenta
              </Button>
            </div>
          </Card.Content>
        </Card>
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar eliminación de cuenta"
        confirmText="Eliminar definitivamente"
        confirmColor="#ef4444"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Escribe <strong>ELIMINAR</strong> para confirmar que quieres borrar tu cuenta permanentemente.
          </p>
          <Input
            label="Confirmación"
            placeholder="ELIMINAR"
            onChange={(e) => e.target.value === 'ELIMINAR' && handleDeleteAccount()}
          />
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;