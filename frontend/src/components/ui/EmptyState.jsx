import { cn } from '../../utils/format';
import Button from './Button';
import { Sparkles } from 'lucide-react';

const EmptyState = ({
  icon,
  title,
  description,
  action,
  className = '',
  illustration = true,
  actionVariant = 'primary'
}) => {
  return (
    <div className={cn('empty-state', className)}>
      {illustration && (
        <div className="w-20 h-20 rounded-3xl bg-gray-50 dark:bg-surfaceRaised/60 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-5 ring-1 ring-border-light dark:ring-white/8">
          {typeof icon === 'function' ? <icon className="w-9 h-9" /> : icon || <Sparkles className="w-9 h-9" aria-hidden="true" />}
        </div>
      )}
      {title && (
        <h3 className="empty-state-title">{title}</h3>
      )}
      {description && (
        <p className="empty-state-desc">{description}</p>
      )}
      {action && (
        <Button variant={actionVariant} onClick={action.onClick} className="mt-5">
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
