import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../../validators/schemas';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/format';

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
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {checks.map((check, i) => (
          <span key={i} className={cn('inline-flex items-center gap-1.5 text-xs', check.met ? 'text-income-600 dark:text-income-400' : 'text-gray-400 dark:text-gray-500')}>
            <span className={cn('w-1.5 h-1.5 rounded-full', check.met ? 'bg-income-500' : 'bg-gray-300 dark:bg-surfaceRaised')} />
            {check.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const { showError, showSuccess } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: ''
    }
  });

  const password = watch('password');

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        name: data.name
      });
      showSuccess('Cuenta creada correctamente');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Error al registrar';
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-fade-in" aria-label="Formulario de registro">
      <Input
        label="Nombre completo"
        placeholder="Juan Pérez"
        error={errors.name?.message}
        {...register('name')}
        required
        leftIcon={<User className="w-5 h-5" />}
      />

      <Input
        label="Email"
        type="email"
        placeholder="tu@email.com"
        error={errors.email?.message}
        {...register('email')}
        required
        leftIcon={<Mail className="w-5 h-5" />}
      />

      <div className="space-y-5">
        <Input
          label="Contraseña"
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
        label="Confirmar contraseña"
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
        Crear cuenta
      </Button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
};

export default RegisterPage;
