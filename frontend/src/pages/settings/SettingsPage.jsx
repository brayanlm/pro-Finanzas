import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/format';
import {
  User, Lock, Bell, Palette, Save, Trash2, ShieldAlert,
  Eye, EyeOff, AlertTriangle, Fingerprint
} from 'lucide-react';
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
    { label: 'Símbolo', met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password) }
  ];

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium">
        <span className="w-2 h-2 rounded-full bg-expense-600" /> Fortaleza de la contraseña
      </div>
      <div className="h-1.5 w-full rounded-full overflow-hidden bg-gray-100 dark:bg-surfaceRaised">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            password.length === 0 ? 'w-0 bg-expense-400' :
              password.length < 4 ? 'w-1/4 bg-expense-400' :
              password.length < 8 ? 'w-2/4 bg-warning-400' : 'w-full bg-income-500'
          )}
        />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {checks.map((check, i) => (
          <span key={i} className={cn('inline-flex items-center gap-1.5 text-xs', check.met ? 'text-income-600 dark:text-income-400' : 'text-gray-400 dark:text-gray-500')}>
            {check.met ? <span className="w-1.5 h-1.5 rounded-full bg-income-500" /> : <span className="w-1.5 h-1.5 rounded-full border border-gray-300 dark:border-gray-600" />}
            {check.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const Toggle = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-border-light dark:border-white/6 last:border-0">
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{label}</p>
      {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
        checked ? 'bg-primary-600' : 'bg-gray-200 dark:bg-surfaceRaised'
      )}
    >
      <span className={cn('absolute top-0.5 left-0.5 h-[1.125rem] w-[1.125rem] rounded-full bg-white shadow-sm transition-transform duration-200', checked ? 'translate-x-5' : 'translate-x-0')} aria-hidden="true" />
    </button>
  </div>
);

const SettingsPage = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState('profile');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    monthlyReminder: true
  });

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
    watch: watchProfile
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
    watch: watchPassword
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

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
      showSuccess('Contraseña cambiada correctamente');
      resetPassword();
    } catch {
      showError('Error al cambiar contraseña');
    }
  };

  const currencyValue = watchProfile('preferences.currency') || CURRENCY_OPTIONS[0].value;
  const themeValue = watchProfile('preferences.theme') || 'light';
  const languageValue = watchProfile('preferences.language') || 'es';

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="page-title">Configuración</h1>
        <p className="page-subtitle">Gestiona tu cuenta y preferencias</p>
      </div>

      {/* Tabs */}
      <div role="tablist" className="flex flex-wrap gap-1 rounded-xl bg-gray-100 dark:bg-surfaceRaised p-1 w-fit" aria-label="Secciones de configuración">
        {[
          { id: 'profile', label: 'Perfil', icon: User },
          { id: 'security', label: 'Seguridad', icon: ShieldAlert },
          { id: 'preferences', label: 'Preferencias', icon: Palette },
          { id: 'notifications', label: 'Notificaciones', icon: Bell },
          { id: 'danger', label: 'Zona peligrosa', icon: Trash2 }
        ].map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm dark:bg-surfaceRaised dark:text-gray-50'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            )}
          >
            <tab.icon className="w-4 h-4" aria-hidden="true" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- Perfil --- */}
      {activeTab === 'profile' && (
        <Card className="stat-card">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-2xl font-bold text-primary-600 dark:text-primary-400">
              {user?.name?.split(' ')[0]?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 dark:text-gray-50">{user?.name || 'Usuario'}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              <Badge className="mt-2">Miembro desde aprox. 2026</Badge>
            </div>
          </div>

          <form onSubmit={handleSubmitProfile(handleProfileSubmit)} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nombre completo"
                placeholder="Juan Pérez"
                error={profileErrors.name?.message}
                {...registerProfile('name')}
                required
              />
              <Input
                label="Email"
                type="email"
                value={user?.email || ''}
                disabled
                helperText="El email no se puede cambiar desde aquí."
              />
            </div>
            <div className="flex justify-end pt-4 border-t border-border-light">
              <Button type="submit" loading={profileSubmitting}>
                <Save className="w-4 h-4" />
                Guardar cambios
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* --- Seguridad --- */}
      {activeTab === 'security' && (
        <Card className="stat-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/20 flex items-center justify-center">
              <Fingerprint className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-50">Cambiar contraseña</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tu contraseña actual protege tu cuenta</p>
            </div>
          </div>

          <form onSubmit={handleSubmitPassword(handlePasswordSubmit)} className="space-y-5">
            <Input
              label="Contraseña actual"
              type={showCurrentPassword ? 'text' : 'password'}
              placeholder="••••••••"
              error={passwordErrors.currentPassword?.message}
              {...registerPassword('currentPassword')}
              required
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label={showCurrentPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Nueva contraseña"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={passwordErrors.newPassword?.message}
                {...registerPassword('newPassword')}
                required
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label={showNewPassword ? 'Ocultar contraseña nueva' : 'Mostrar contraseña nueva'}
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
              />
              <Input
                label="Confirmar nueva contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={passwordErrors.confirmPassword?.message}
                {...registerPassword('confirmPassword')}
                required
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label={showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
              />
            </div>

            <PasswordStrength password={watchPassword('newPassword') || ''} />

            <div className="flex justify-end pt-4 border-t border-border-light">
              <Button type="submit" loading={passwordSubmitting}>
                <Lock className="w-4 h-4" />
                Cambiar contraseña
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* --- Preferencias --- */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <Card className="stat-card">
            <h2 className="font-semibold mb-5 text-gray-900 dark:text-gray-50">Apariencia</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label">Tema</label>
                <Select options={THEME_OPTIONS} {...registerProfile('preferences.theme')} defaultValue={themeValue} />
              </div>
              <div>
                <label className="label">Idioma</label>
                <Select options={LANGUAGE_OPTIONS} {...registerProfile('preferences.language')} defaultValue={languageValue} />
              </div>
              <div className="sm:col-span-2">
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
            </div>
          </Card>

          <Card className="stat-card">
            <h2 className="font-semibold mb-5 text-gray-900 dark:text-gray-50">Formato monetario</h2>
            <div>
              <label className="label">Moneda preferida</label>
              <Select options={CURRENCY_OPTIONS} {...registerProfile('preferences.currency')} defaultValue={currencyValue} />
            </div>
          </Card>
        </div>
      )}

      {/* --- Notificaciones --- */}
      {activeTab === 'notifications' && (
        <Card className="stat-card">
          <h2 className="font-semibold mb-5 text-gray-900 dark:text-gray-50">Notificaciones en la app</h2>
          <div className="border-t border-border-light pt-2">
            <Toggle
              checked={notifications.budgetAlerts}
              onChange={(v) => setNotifications(prev => ({ ...prev, budgetAlerts: v }))}
              label="Alertas de presupuesto"
              description="Recibe avisos cuando un presupuesto se acerque al límite"
            />
            <Toggle
              checked={notifications.monthlyReminder}
              onChange={(v) => setNotifications(prev => ({ ...prev, monthlyReminder: v }))}
              label="Recordatorio mensual"
              description="Resumen de tus finanzas al inicio de cada mes"
            />
          </div>
          <div className="flex justify-end mt-5 pt-4 border-t border-border-light">
            <Button variant="secondary">
              Guardar preferencias
            </Button>
          </div>
        </Card>
      )}

      {/* --- Zona peligrosa --- */}
      {activeTab === 'danger' && (
        <Card className="stat-card border border-expense-200 dark:border-expense-700/30">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-expense-50 text-expense-600 dark:bg-expense-900/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold text-expense-700 dark:text-expense-300">Zona peligrosa</h2>
              <p className="text-sm text-expense-600 dark:text-expense-400 mt-0.5">Acciones irreversibles. Procede con precaución.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-expense-50 dark:bg-expense-900/10 border border-expense-200 dark:border-expense-700/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h4 className="font-medium text-expense-700 dark:text-expense-300">Eliminar cuenta</h4>
                <p className="text-sm text-expense-600 dark:text-expense-400 mt-1">
                  Esta acción eliminará permanentemente tu cuenta y todos tus datos financieros. No se puede deshacer.
                </p>
              </div>
              <Button variant="danger" onClick={() => setShowDeleteModal(true)} className="flex-shrink-0">
                <Trash2 className="w-4 h-4" />
                Eliminar mi cuenta
              </Button>
            </div>
          </div>
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
            onChange={(e) => e.target.value === 'ELIMINAR' && setShowDeleteModal(false)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;
