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
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="Email"
        type="email"
        placeholder="usuario@ejemplo.com"
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

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register('rememberMe')}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">Recordarme</span>
        </label>
        <Link
          to="/forgot-password"
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <Button type="submit" className="w-full" loading={submitting}>
        Iniciar sesión
      </Button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
          Regístrate
        </Link>
      </p>
    </form>
  );
};

export default LoginPage;