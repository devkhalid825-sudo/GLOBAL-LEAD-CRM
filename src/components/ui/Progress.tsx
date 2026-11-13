import React from 'react';

export interface ProgressProps {
  value: number; // 0 to 100
  label?: string;
  statusText?: string;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  label,
  statusText,
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || statusText) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="text-tx-muted">{label}</span>}
          {statusText && <span className="mono font-semibold text-tx">{statusText}</span>}
        </div>
      )}
      <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-tx h-1.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
