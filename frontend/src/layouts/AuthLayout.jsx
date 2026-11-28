import { Outlet } from 'react-router-dom';
import { BarChart2, ArrowRight } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-page-light dark:bg-page-dark flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-md animate-pop-in">
        {/* Fondo decorativo sutil */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-500/[0.08] via-transparent to-transparent pointer-events-none" aria-hidden="true" />

        <div className="relative card shadow-[0_32px_64px_-8px_rgb(0_0_0_/_0.14),0_0_0_1px_rgb(0_0_0_/_0.04)] dark:shadow-[0_32px_64px_-8px_rgb(0_0_0_/_0.4)]">
          {/* Identidad de marca */}
          <div className="flex flex-col items-center gap-3 mb-7 pb-7 border-b border-border-light">
            <div className="relative w-14 h-14 rounded-2xl bg-primary-600 shadow-glow flex items-center justify-center">
              <BarChart2 className="w-7 h-7 text-white" />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-expense-500 ring-2 ring-surface-light animate-pulse-glow" aria-hidden="true" />
            </div>
            <div className="text-center">
              <h1 className="page-title mb-1">Finanzas App</h1>
              <p className="page-subtitle">Dashboard de Finanzas Personales</p>
            </div>
          </div>

          <div className="px-2 sm:px-4 py-2">
            <Outlet />
          </div>

          {/* Pie con enlace rápido */}
          <div className="mt-6 pt-5 border-t border-border-light text-center">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-all duration-200 hover:gap-2"
              aria-label="Continuar a la aplicación"
            >
              Ir al dashboard
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      {/* Pie de página */}
      <p className="absolute bottom-4 text-xs text-gray-400 dark:text-gray-500 select-none">
        © {new Date().getFullYear()} Finanzas App · Dashboard de Finanzas Personales
      </p>
    </div>
  );
};

export default AuthLayout;
