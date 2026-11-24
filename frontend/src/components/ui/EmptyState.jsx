import { cn } from '../../utils/format';
import Button from './Button';

const EmptyState = ({ 
  icon, 
  title, 
  description, 
  action, 
  className = '',
  illustration = true
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-4', className)}>
      {illustration && icon && (
        <div className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600">
          {typeof icon === 'function' ? <icon className="w-full h-full" /> : icon}
        </div>
      )}
      {title && (
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;