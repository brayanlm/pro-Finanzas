import { createBrowserRouter } from 'react-router-dom';
import { lazy } from 'react';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const HistoryPage = lazy(() => import('../pages/history/HistoryPage'));
const CategoriesPage = lazy(() => import('../pages/categories/CategoriesPage'));
const AccountsPage = lazy(() => import('../pages/accounts/AccountsPage'));
const BudgetsPage = lazy(() => import('../pages/budgets/BudgetsPage'));
const ReportsPage = lazy(() => import('../pages/reports/ReportsPage'));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: (
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        )
      },
      {
        path: 'history',
        element: (
          <PrivateRoute>
            <HistoryPage />
          </PrivateRoute>
        )
      },
      {
        path: 'categories',
        element: (
          <PrivateRoute>
            <CategoriesPage />
          </PrivateRoute>
        )
      },
      {
        path: 'accounts',
        element: (
          <PrivateRoute>
            <AccountsPage />
          </PrivateRoute>
        )
      },
      {
        path: 'budgets',
        element: (
          <PrivateRoute>
            <BudgetsPage />
          </PrivateRoute>
        )
      },
      {
        path: 'reports',
        element: (
          <PrivateRoute>
            <ReportsPage />
          </PrivateRoute>
        )
      },
      {
        path: 'settings',
        element: (
          <PrivateRoute>
            <SettingsPage />
          </PrivateRoute>
        )
      }
    ]
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <PublicRoute><LoginPage /></PublicRoute>
      },
      {
        path: 'register',
        element: <PublicRoute><RegisterPage /></PublicRoute>
      },
      {
        path: 'forgot-password',
        element: <PublicRoute><ForgotPasswordPage /></PublicRoute>
      },
      {
        path: 'reset-password',
        element: <PublicRoute><ResetPasswordPage /></PublicRoute>
      }
    ]
  }
]);