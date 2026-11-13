import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'pill';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium transition duration-150 ease-out focus-visible:outline-2 focus-visible:outline-tx disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 rounded-btn',
    md: 'text-xs sm:text-sm px-4 py-2.5 rounded-btn',
    lg: 'text-sm px-5 py-3 rounded-btn',
  }[size];

  const variantClasses = {
    primary: 'btn-solid',
    ghost: 'btn-ghost',
    pill: 'pill-luxury',
  }[variant];

  return (
    <button
      className={`${base} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      )}
      {children}
    </button>
  );
};
