import { Outlet } from 'react-router-dom';
import { cn } from '../utils/format';
import { BarChart2 } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mx-auto mb-4">
            <BarChart2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Finanzas App</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Dashboard de Finanzas Personales</p>
        </div>
        <div className="card p-6">
          <Outlet />
        </div>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          © {new Date().getFullYear()} Finanzas App. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;