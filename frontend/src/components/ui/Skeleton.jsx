import { cn } from '../../utils/format';

const Skeleton = ({ 
  variant = 'text', 
  width = '100%', 
  height, 
  className = '', 
  count = 1,
  ...props 
}) => {
  const variants = {
    text: 'h-4',
    title: 'h-6 w-3/4',
    card: 'h-32',
    avatar: 'w-10 h-10 rounded-full',
    button: 'h-10 w-24 rounded-lg',
    tableRow: 'h-12'
  };

  const baseStyle = {
    width,
    height: height || variants[variant] || variants.text,
    minHeight: height || variants[variant] || variants.text
  };

  const skeletonItems = Array.from({ length: count }, (_, i) => (
    <div 
      key={i} 
      className={cn('animate-pulse bg-gray-200 dark:bg-gray-700 rounded', className)} 
      style={baseStyle}
      {...props}
    />
  ));

  return <>{skeletonItems}</>;
};

export default Skeleton;