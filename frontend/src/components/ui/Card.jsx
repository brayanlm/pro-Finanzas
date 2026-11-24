import { cn } from '../../utils/format';

const Card = ({ 
  children, 
  className = '', 
  hover = false, 
  padding = 'p-6',
  ...props 
}) => {
  return (
    <div 
      className={cn('card', hover && 'card-hover', padding, className)}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', ...props }) => (
  <div className={cn('mb-4', className)} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={cn('text-lg font-semibold text-gray-900 dark:text-gray-100', className)} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '', ...props }) => (
  <p className={cn('text-sm text-gray-500 dark:text-gray-400 mt-1', className)} {...props}>
    {children}
  </p>
);

const CardContent = ({ children, className = '', ...props }) => (
  <div className={cn(className)} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={cn('mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2', className)} {...props}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;