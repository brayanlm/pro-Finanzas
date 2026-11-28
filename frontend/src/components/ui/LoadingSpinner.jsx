import { cn } from '../../utils/format';

const LoadingSpinner = ({
  size = 'md',
  className = '',
  label = 'Cargando...',
  ...props
}) => {
  const sizes = {
    sm: 'w-3.5 h-3.5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)} {...props}>
      <div className={cn('relative', sizes[size])} aria-hidden="true">
        <svg className={cn('absolute inset-0 animate-spin text-primary-500', sizes[size])} viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
      {label && <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</span>}
    </div>
  );
};

export default LoadingSpinner;
