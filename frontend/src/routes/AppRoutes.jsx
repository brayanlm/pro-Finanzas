import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardPage from '../pages/dashboard/DashboardPage';
import HistoryPage from '../pages/history/HistoryPage';
import CategoriesPage from '../pages/categories/CategoriesPage';
import AccountsPage from '../pages/accounts/AccountsPage';
import BudgetsPage from '../pages/budgets/BudgetsPage';
import ReportsPage from '../pages/reports/ReportsPage';
import SettingsPage from '../pages/settings/SettingsPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
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