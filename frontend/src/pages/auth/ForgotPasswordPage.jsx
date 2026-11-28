import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema } from '../../validators/schemas';
import { authApi } from '../../services/authApi';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ForgotPasswordPage = () => {
  const { showSuccess, showError } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
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
      <Card className="space-y-4 animate-pop-in text-center py-8">
        <div className="w-14 h-14 mx-auto rounded-full bg-income-100 dark:bg-income-900/20 text-income-600 dark:text-income-400 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Email enviado</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          Si el email existe, recibirás instrucciones para restablecer tu contraseña.
        </p>
        <a href="/login" className="btn-primary mt-4">
          <ArrowLeft className="w-4 h-4" />
          Volver al login
        </a>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-fade-in" aria-label="Formulario de recuperación de contraseña">
      <Input
        label="Email"
        type="email"
        placeholder="tu@email.com"
        error={errors.email?.message}
        {...register('email')}
        required
        leftIcon={<Mail className="w-5 h-5" />}
      />

      <Button type="submit" className="w-full" loading={submitting}>
        Enviar instrucciones
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

export default ForgotPasswordPage;
