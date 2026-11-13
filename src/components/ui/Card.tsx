import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className = '', children, ...props }) => {
  return (
    <div className={`card-luxury p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};
