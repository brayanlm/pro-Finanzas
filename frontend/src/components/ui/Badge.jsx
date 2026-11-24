import { cn } from '../../utils/format';
import { getAlertLevelColor, getAlertLevelLabel } from '../../utils/format';

const Badge = ({ 
  children, 
  variant = 'default', 
  className = '', 
  ...props 
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
    income: 'bg-income-100 text-income-700 dark:bg-income-900/30 dark:text-income-400',
    expense: 'bg-expense-100 text-expense-700 dark:bg-expense-900/30 dark:text-expense-400',
    warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    alert: (level) => getAlertLevelColor(level)
  };

  let variantClass = variants[variant] || variants.default;
  if (typeof variantClass === 'function') {
    variantClass = variantClass(props.alertLevel);
  }

  return (
    <span 
      className={cn('badge', variantClass, className)}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;