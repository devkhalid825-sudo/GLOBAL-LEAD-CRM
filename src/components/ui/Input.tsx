import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-tx-muted">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input-luxury ${error ? 'border-mono-600' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-[11px] text-tx-muted">{error}</p>}
      {helperText && !error && <p className="text-[11px] text-tx-subtle">{helperText}</p>}
    </div>
  );
};
