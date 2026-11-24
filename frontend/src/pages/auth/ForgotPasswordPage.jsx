import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema } from '../../validators/schemas';
import { authApi } from '../../services/authApi';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Mail, ArrowLeft } from 'lucide-react';

const ForgotPasswordPage = () => {
  const { showSuccess, showError } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' }
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await authApi.forgotPassword(data);
      setSent(true);
      showSuccess('Si el email existe, recibirás instrucciones');
    } catch (error) {
      const message = error.response?.data?.message || 'Error al solicitar recuperación';
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-5">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Email enviado</h3>
        <p className="text-gray-500 dark:text-gray-400">
          Si el email existe, recibirás instrucciones para restablecer tu contraseña.
        </p>
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Volver al login
        </Link>
      </div>
    );
  }

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

      <Button type="submit" className="w-full" loading={submitting}>
        Enviar instrucciones
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

export default ForgotPasswordPage;