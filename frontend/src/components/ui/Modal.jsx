import { Fragment, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/format';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
  closeOnOverlayClick = true,
  showCloseButton = true
}) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-full mx-4'
  };

  // Accesibilidad: cerrar con Escape mientras el modal está abierto.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Fragment>
      <div
        className="fixed inset-0 bg-black/40 z-50 animate-fade-in"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            'w-full bg-surface-light dark:bg-surfaceRaised rounded-2xl shadow-[0_24px_48px_-8px_rgb(0_0_0_/_0.25),_0_0_0_1px_rgb(0_0_0_/_0.05)] dark:shadow-black/40 animate-pop-in border border-border-light dark:border-white/8',
            sizes[size],
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
        >
          {title && (
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-light dark:border-white/8">
              <h2 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                {title}
              </h2>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-surfaceRaised transition-all duration-150 active:scale-95"
                  aria-label="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default Modal;
