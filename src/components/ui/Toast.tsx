import React from 'react';

export interface ToastProps {
  message: string | null;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed left-1/2 bottom-6 -translate-x-1/2 z-50 bg-btn text-btn-text px-4 py-2.5 rounded-btn text-xs font-semibold shadow-luxury flex items-center gap-3 animate-in fade-in duration-150">
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="hover:opacity-75 text-xs font-bold" aria-label="Close alert">
          ✕
        </button>
      )}
    </div>
  );
};
