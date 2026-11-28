import { cn } from '../../utils/format';

const Badge = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700 dark:bg-surfaceRaised dark:text-gray-200',
    income: 'bg-income-50 text-income-700 dark:bg-income-900/20 dark:text-income-300',
    expense: 'bg-expense-50 text-expense-700 dark:bg-expense-900/20 dark:text-expense-300',
    warning: 'bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-300',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
    success: 'bg-income-100 text-income-700 dark:bg-income-900/20 dark:text-income-300',
    alert: (level) => ({
      critical: 'bg-expense-50 text-expense-700 dark:bg-expense-900/20 dark:text-expense-300',
      danger: 'bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-300',
      warning: 'bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-300',
      default: 'bg-income-50 text-income-700 dark:bg-income-900/20 dark:text-income-300'
    })[level]?.() || 'bg-income-50 text-income-700 dark:bg-income-900/20 dark:text-income-300'
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
