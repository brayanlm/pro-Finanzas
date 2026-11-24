import { forwardRef } from 'react';
import { cn } from '../../utils/format';

const Select = forwardRef(({ 
  label, 
  error, 
  options = [], 
  placeholder = 'Seleccionar...', 
  className = '', 
  id, 
  leftIcon,
  ...props 
}, ref) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="label">
          {label}
          {props.required && <span className="text-expense-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {leftIcon}
          </div>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn('input', error && 'input-error', className, leftIcon && 'pl-10')}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-expense-600 dark:text-expense-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;