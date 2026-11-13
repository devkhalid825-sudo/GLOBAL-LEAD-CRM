import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string | React.ReactNode;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onChange,
  className = '',
  id,
  ...props
}) => {
  const checkboxId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <label htmlFor={checkboxId} className={`inline-flex items-center gap-2 cursor-pointer select-none text-xs text-tx ${className}`}>
      <span className="relative flex items-center justify-center">
        <input
          type="checkbox"
          id={checkboxId}
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
          {...props}
        />
        <span className="w-4 h-4 rounded-md border border-border bg-surface-2 flex items-center justify-center peer-checked:bg-tx peer-checked:border-tx transition">
          {checked && <Check className="w-3 h-3 text-canvas stroke-[3]" />}
        </span>
      </span>
      {label && <span>{label}</span>}
    </label>
  );
};
