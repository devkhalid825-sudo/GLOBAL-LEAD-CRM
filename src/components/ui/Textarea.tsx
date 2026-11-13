import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-medium text-tx-muted">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`input-luxury resize-y min-h-[90px] ${className}`}
        {...props}
      />
      {error && <p className="text-[11px] text-tx-muted">{error}</p>}
    </div>
  );
};
