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
    text: 'h-4 max-w-full',
    title: 'h-6 w-3/4 rounded',
    card: 'h-36',
    avatar: 'w-10 h-10 rounded-full',
    button: 'h-11 w-28 rounded-lg',
    tableRow: 'h-12',
    stat: 'h-28'
  };

  const baseStyle = {
    width,
    height: height || variants[variant] || variants.text,
    minHeight: height || variants[variant] || variants.text
  };

  const skeletonItems = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={cn('skeleton-card', className)}
      style={baseStyle}
      {...props}
    />
  ));

  return <>{skeletonItems}</>;
};

export default Skeleton;
