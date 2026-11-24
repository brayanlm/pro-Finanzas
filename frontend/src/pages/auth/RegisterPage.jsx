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
      const message = error.response?.data?.message || 'Error al registrar';
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
        placeholder="usuario@ejemplo.com"
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
            aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
};

export default RegisterPage;