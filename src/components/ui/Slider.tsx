import React from 'react';

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  valueDisplay?: string | number;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  valueDisplay,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full space-y-2">
      {(label || valueDisplay !== undefined) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="text-tx-muted font-medium">{label}</span>}
          {valueDisplay !== undefined && (
            <span className="mono font-semibold text-tx">{valueDisplay}</span>
          )}
        </div>
      )}
      <input
        type="range"
        className={`w-full accent-tx cursor-pointer ${className}`}
        {...props}
      />
    </div>
  );
};
