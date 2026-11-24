import { forwardRef } from 'react';
import { cn } from '../../utils/format';

const Input = forwardRef(({ 
  label,
  error,
  helperText,
  className = '',
  id,
  type = 'text',
  leftIcon,
  rightIcon,
  children,
  ...props 
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
          {props.required && <span className="text-expense-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400" aria-hidden="true">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn('input', error && 'input-error', className, leftIcon && 'pl-10', rightIcon && 'pr-10')}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {children && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {children}
          </div>
        )}
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400" aria-hidden="true">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-expense-600 dark:text-expense-400" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <span id={`${inputId}-helper`} className="mt-1.5 block text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;