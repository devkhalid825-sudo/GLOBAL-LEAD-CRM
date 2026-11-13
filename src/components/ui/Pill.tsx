import React from 'react';

export interface PillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  outlined?: boolean;
}

export const Pill: React.FC<PillProps> = ({
  active = false,
  outlined = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <button
      type="button"
      className={`pill-luxury ${active ? 'on' : ''} ${outlined ? 'border-dashed' : ''} ${className}`}
      aria-pressed={active}
      {...props}
    >
      {children}
    </button>
  );
};
