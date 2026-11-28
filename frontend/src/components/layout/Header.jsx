import {
  Bell,
  ChevronDown,
  LogOut,
  Moon,
  PanelLeft,
  Settings,
  Sun,
  User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useRef, useState } from 'react';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';

const Header = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved ? JSON.parse(saved) : prefersDark;
    setDarkMode(initial);
    document.documentElement.classList.toggle('dark', initial);
  }, []);

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('darkMode', JSON.stringify(newValue));
    document.documentElement.classList.toggle('dark', newValue);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const MenuItem = ({ Icon, label, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="btn-ghost w-full justify-start text-sm text-gray-700 dark:text-gray-200"
    >
      {Icon ? <Icon className="w-4 h-4" aria-hidden="true" /> : null}
      {label}
    </button>
  );

  return (
    <header className="fixed top-0 right-0 z-30 h-16 bg-surface-light/90 dark:bg-surfaceRaised/90 backdrop-blur-md border-b border-border-light dark:border-white/8 transition-all duration-300">
      <div className="flex items-center justify-between w-full h-full px-4 sm:px-6">
        {/* Left: hamburger + title */}
        <div className="flex items-center gap-4 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            aria-label="Abrir menú principal"
            className="lg:hidden"
          >
            <PanelLeft className="w-5 h-5" />
          </Button>

          <h1 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400 hidden md:block truncate">
            Dashboard
          </h1>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5">
          {/* Tema */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="w-9 h-9"
            >
              {darkMode ? <Sun className="w-[1.125rem] h-[1.125rem]" /> : <Moon className="w-[1.125rem] h-[1.125rem]" />}
            </Button>
          </div>

          {/* Notificaciones */}
          <div className="relative" ref={notificationsRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label="Notificaciones"
              aria-expanded={notificationsOpen}
              className="w-9 h-9 relative"
            >
              <Bell className="w-[1.125rem] h-[1.125rem]" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-expense-500 text-[10px] leading-none font-semibold text-white flex items-center justify-center ring-2 ring-surface-light dark:ring-surfaceRaised">
                0
              </span>
            </Button>
            {notificationsOpen && (
              <div className="absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] bg-surface-light dark:bg-surfaceRaised rounded-2xl shadow-[0_20px_40px_-8px_rgb(0_0_0_/_0.18)] dark:shadow-black/40 border border-border-light dark:border-white/8 animate-pop-in z-50 overflow-hidden">
                <div className="px-5 py-4 border-b border-border-light dark:border-white/8">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Notificaciones</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">No hay alertas pendientes</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No hay notificaciones recientes. El sistema te avisará cuando un presupuesto se acerque a su límite.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Menú de usuario */}
          <div className="relative" ref={userMenuRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-label="Menú de usuario"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              className="flex items-center gap-2.5 pr-3"
            >
              <Avatar name={user?.name} size="sm" />
              <span className="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[10rem]">
                {user?.name || 'Usuario'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" aria-hidden="true" />
            </Button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2.5 w-64 max-w-[calc(100vw-2rem)] bg-surface-light dark:bg-surfaceRaised rounded-2xl shadow-[0_20px_40px_-8px_rgb(0_0_0_/_0.18)] dark:shadow-black/40 border border-border-light dark:border-white/8 animate-pop-in z-50 overflow-hidden">
                <div className="px-5 py-4 border-b border-border-light dark:border-white/8 bg-page-light/50 dark:bg-page-dark/50">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">{user?.name || 'Usuario'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{user?.email || ''}</p>
                </div>
                <div className="p-2 space-y-0.5">
                  <MenuItem Icon={User} label="Perfil" onClick={() => setUserMenuOpen(false)} />
                  <MenuItem Icon={Settings} label="Configuración" onClick={() => setUserMenuOpen(false)} />
                </div>
                <div className="p-2 pt-0 border-t border-border-light dark:border-white/8">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setUserMenuOpen(false); logout(); }}
                    className="w-full justify-start text-expense-600 dark:text-expense-400"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    Cerrar sesión
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
