import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema } from '../../validators/schemas';
import { authApi } from '../../services/authApi';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

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

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validToken, setValidToken] = useState(true);

  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: token || '',
      password: '',
      confirmPassword: ''
    }
  });

  const password = watch('password');

  useEffect(() => {
    if (!token) {
      setValidToken(false);
    }
  }, [token]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await authApi.resetPassword({
        token: data.token,
        password: data.password,
        confirmPassword: data.confirmPassword
      });
      showSuccess('Contraseña actualizada. Inicia sesión con la nueva.');
      navigate('/login');
    } catch (error) {
      const message = error.response?.data?.message || 'Error al restablecer contraseña';
      if (error.response?.data?.code === 'TOKEN_EXPIRED') {
        showError('El enlace ha expirado. Solicita uno nuevo.');
        setValidToken(false);
      } else {
        showError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!validToken) {
    return (
      <div className="text-center space-y-5">
        <div className="w-16 h-16 mx-auto mb-4 bg-expense-100 dark:bg-expense-900/30 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-expense-600 dark:text-expense-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Enlace inválido o expirado</h3>
        <p className="text-gray-500 dark:text-gray-400">
          Este enlace de recuperación ha expirado o ya fue utilizado.
        </p>
        <Link to="/forgot-password" className="btn-primary inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <input type="hidden" {...register('token')} value={token} />

      <div className="space-y-5">
        <Input
          label="Nueva contraseña"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
          required
          leftIcon={<Lock className="w-5 h-5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          }
        />
        <PasswordStrength password={password} />
      </div>

      <Input
        label="Confirmar nueva contraseña"
        type={showConfirmPassword ? 'text' : 'password'}
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
        required
        leftIcon={<Lock className="w-5 h-5" />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="text-gray-400 hover:text-gray-600"
            aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        }
      />

      <Button type="submit" className="w-full" loading={submitting}>
        Restablecer contraseña
      </Button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
          <ArrowLeft className="w-4 h-4 inline" />
          Volver al login
        </Link>
      </p>
    </form>
  );
};

export default ResetPasswordPage;