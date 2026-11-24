import { cn } from '../../utils/format';
import { getInitials } from '../../utils/format';

const Avatar = ({ 
  src, 
  alt, 
  name, 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  };

  const bgColors = [
    'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    'bg-income-100 text-income-700 dark:bg-income-900/30 dark:text-income-400',
    'bg-expense-100 text-expense-700 dark:bg-expense-900/30 dark:text-expense-400',
    'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
  ];

  const getColorIndex = (str) => {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % bgColors.length;
  };

  const initials = name ? getInitials(name) : '?';
  const colorClass = name ? bgColors[getColorIndex(name)] : bgColors[0];

  return (
    <div 
      className={cn('inline-flex items-center justify-center rounded-full font-medium ring-2 ring-white dark:ring-gray-800', sizes[size], colorClass, className)}
      {...props}
    >
      {src ? (
        <img 
          src={src} 
          alt={alt || name || 'Avatar'} 
          className="w-full h-full rounded-full object-cover" 
        />
      ) : (
        <span aria-label={name}>{initials}</span>
      )}
    </div>
  );
};

export default Avatar;