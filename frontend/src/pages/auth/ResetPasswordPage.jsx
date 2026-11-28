import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema } from '../../validators/schemas';
import { authApi } from '../../services/authApi';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';


const PasswordStrength = ({ password }) => {
  if (!password) return null;

  const checks = [
    { label: 'Mínimo 8 caracteres', met: password.length >= 8 },
    { label: 'Mayúscula', met: /[A-Z]/.test(password) },
    { label: 'Minúscula', met: /[a-z]/.test(password) },
    { label: 'Número', met: /[0-9]/.test(password) },
    { label: 'Símbolo', met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password) }
  ];

  const strength = checks.filter((c) => c.met).length;
  const strengthLabel = ['Muy débil', 'Débil', 'Fuerte', 'Muy fuerte', 'Excelente'][Math.min(strength, 4)] || 'Excelente';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Fortaleza</span>
        <span className="text-xs font-semibold" style={{ color: strength >= 3 ? '#16a34a' : strength >= 1 ? '#d97706' : '#dc2626' }}>
          {strengthLabel} ({strength}/5)
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-surfaceRaised">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${strength * 20}%`,
            backgroundColor: strength >= 3 ? '#16a34a' : strength >= 1 ? '#d97706' : '#dc2626'
          }}
        />
      </div>
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
      <Card className="space-y-4 animate-pop-in text-center py-8">
        <div className="w-14 h-14 mx-auto rounded-full bg-expense-50 text-expense-600 dark:bg-expense-900/20 flex items-center justify-center">
          <Lock className="w-7 h-7" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Enlace inválido o expirado</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          Este enlace de recuperación ha expirado o ya fue utilizado.
        </p>
        <Link to="/forgot-password" className="btn-primary mt-4 inline-flex items-center gap-1.5 justify-center">
          <ArrowLeft className="w-4 h-4" />
          Solicitar nuevo enlace
        </Link>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-fade-in" aria-label="Formulario de restablecimiento de contraseña">
      <input type="hidden" {...register('token')} value={token} />

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
            aria-label={showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        }
      />

      <Button type="submit" className="w-full" loading={submitting}>
        Restablecer contraseña
      </Button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver al login
        </Link>
      </p>
    </form>
  );
};

export default ResetPasswordPage;
