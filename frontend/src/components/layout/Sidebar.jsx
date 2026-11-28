import { NavLink, useLocation } from 'react-router-dom';
import { cn, truncate } from '../../utils/format';
import {
  LayoutDashboard,
  History,
  Tag,
  Wallet,
  Target,
  Settings,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useRef, useState } from 'react';
import Avatar from '../ui/Avatar';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Historial', href: '/history', icon: History },
  { name: 'Categorías', href: '/categories', icon: Tag },
  { name: 'Cuentas', href: '/accounts', icon: Wallet },
  { name: 'Presupuestos', href: '/budgets', icon: Target },
  { name: 'Reportes', href: '/reports', icon: BarChart2 },
  { name: 'Configuración', href: '/settings', icon: Settings }
];

const Sidebar = ({ collapsed, onToggle, isMobileOpen, onMobileClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [brandHovered, setBrandHovered] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (!isMobileOpen) return;
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onMobileClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileOpen, onMobileClose]);

  const isActive = (href) => {
    const current = location.pathname;
    return current === href || current.startsWith(href + '/');
  };

  const brand = (
    <NavLink to="/dashboard" className="flex items-center gap-3" aria-label="Finanzas App">
      <div
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 shadow-glow transition-transform duration-300',
          brandHovered && 'scale-105'
        )}
        onMouseEnter={() => setBrandHovered(true)}
        onMouseLeave={() => setBrandHovered(false)}
        aria-hidden="true"
      >
        <BarChart2 className="h-5 w-5 text-white" />
        <div className="absolute -inset-1 rounded-xl border border-primary-400/40 animate-pulse-glow" aria-hidden="true" />
      </div>
      <span className="font-extrabold text-lg text-gray-900 dark:text-gray-50 tracking-tight">
        Finanzas
        <span className="text-primary-500"> Alpha</span>
      </span>
    </NavLink>
  );

  return (
    <>
      {/* Overlay móvil */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        ref={sidebarRef}
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen flex-col bg-surface-light dark:bg-surfaceRaised border-r border-border-light dark:border-white/8 transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          'hidden lg:block',
          isMobileOpen && 'block'
        )}
        aria-label="Navegación principal"
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border-light dark:border-white/5">
          {!collapsed ? (
            brand
          ) : (
            <NavLink to="/dashboard" className="flex items-center justify-center w-full" aria-label="Finanzas App">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 shadow-glow">
                <BarChart2 className="h-5 w-5 text-white" />
              </div>
            </NavLink>
          )}
          <button
            type="button"
            onClick={collapsed ? onToggle : onMobileClose}
            className={cn(
              'btn-icon w-8 h-8',
              collapsed && 'ml-auto'
            )}
            aria-label={collapsed ? (isMobileOpen ? 'Cerrar menú' : 'Expandir sidebar') : 'Colapsar sidebar'}
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : isMobileOpen ? (
              <PanelLeft className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 space-y-1 px-3 py-5 overflow-y-auto" aria-label="Menú principal">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive: activeNow }) => cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative',
                  activeNow
                    ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-500/10 font-semibold shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-surfaceRaised/50',
                  active && !activeNow && 'bg-primary-50/50 dark:bg-primary-500/5'
                )}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? item.name : undefined}
                onClick={() => { if (isMobileOpen && !collapsed) onMobileClose(); }}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Usuario */}
        <div className="p-4 border-t border-border-light dark:border-white/5 bg-page-light/40 dark:bg-page-dark/40 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name} size="sm" />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">{user?.name || 'Usuario'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{truncate(user?.email || '', 30)}</p>
              </div>
            )}
            <button
              type="button"
              onClick={logout}
              className="btn-icon w-8 h-8 flex-shrink-0"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-[1.125rem] h-[1.125rem]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
