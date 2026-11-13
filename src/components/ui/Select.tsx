import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  className = '',
  id,
  children,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-tx-muted">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`input-luxury cursor-pointer ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-[11px] text-tx-muted">{error}</p>}
    </div>
  );
};
