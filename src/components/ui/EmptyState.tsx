import React from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon,
}) => {
  return (
    <div className="py-12 sm:py-16 text-center space-y-3 px-4">
      {icon && <div className="text-tx-subtle mx-auto flex justify-center mb-2">{icon}</div>}
      <h3 className="serif text-base font-semibold text-tx">{title}</h3>
      {description && <p className="text-xs text-tx-muted max-w-sm mx-auto">{description}</p>}
      {action && (
        <div className="pt-2">
          <button onClick={action.onClick} className="btn-solid text-xs">
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
};
