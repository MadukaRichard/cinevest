/**
 * ===========================================
 * Input Component
 * ===========================================
 * 
 * Reusable input component with label and icon support.
 */

import { clsx } from 'clsx';

function Input({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  icon,
  error,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-muted-foreground mb-2"
        >
          {label}
          {required && <span className="text-primary-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={clsx(
            'input-field',
            icon && 'pl-10',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

export default Input;
