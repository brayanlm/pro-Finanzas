import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../validators/schemas';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showError } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await login(data.email, data.password, data.rememberMe);
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Error al iniciar sesión';
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-fade-in" aria-label="Formulario de inicio de sesión">
      <Input
        label="Email"
        type="email"
        placeholder="tu@email.com"
        error={errors.email?.message}
        {...register('email')}
        required
        leftIcon={<Mail className="w-5 h-5" />}
      />

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

      <div className="flex items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2.5 cursor-pointer text-sm text-gray-600 dark:text-gray-400 select-none">
          <input
            type="checkbox"
            {...register('rememberMe')}
            className="h-[1.125rem] w-[1.125rem] rounded border-gray-300 accent-primary-600 cursor-pointer"
          />
          Recordarme
        </label>
        <Link
          to="/forgot-password"
          className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <Button type="submit" className="w-full" loading={submitting}>
        Iniciar sesión
      </Button>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border-light dark:border-white/8" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-surface-light dark:bg-surfaceRaised text-gray-500 dark:text-gray-400">
            O
          </span>
        </div>
      </div>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">
          Regístrate
        </Link>
      </p>
    </form>
  );
};

export default LoginPage;
