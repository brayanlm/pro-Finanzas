import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../utils/format';
import { 
  LayoutDashboard, 
  History, 
  Tag, 
  Wallet, 
  Target, 
  Settings, 
  BarChart2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Historial', href: '/history', icon: History },
  { name: 'Categorías', href: '/categories', icon: Tag },
  { name: 'Cuentas', href: '/accounts', icon: Wallet },
  { name: 'Presupuestos', href: '/budgets', icon: Target },
  { name: 'Reportes', href: '/reports', icon: BarChart2 },
  { name: 'Configuración', href: '/settings', icon: Settings }
];

const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
      aria-label="Navegación principal"
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <NavLink to="/dashboard" className="flex items-center gap-2" aria-label="Finanzas App">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-gray-100">Finanzas</span>
          </NavLink>
        )}
        <button
          onClick={onToggle}
          className={cn(
            'p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
            collapsed && 'ml-auto'
          )}
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1" aria-label="Menú principal">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive: active }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50',
                collapsed && 'justify-center'
              )}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 flex items-center justify-center font-medium">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 mx-auto rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 flex items-center justify-center font-medium">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;