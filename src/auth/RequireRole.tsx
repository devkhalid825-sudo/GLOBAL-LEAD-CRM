import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider.js';
import { UserRole } from '../shared/index.js';
import { Card, Button } from '../components/ui/index.js';

interface RequireRoleProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const RequireRole: React.FC<RequireRoleProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas text-tx">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-tx border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-tx-muted">Loading Global CRM...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <Card className="max-w-md p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center text-tx mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="font-serif text-xl font-bold text-tx">Access Denied</h2>
          <p className="text-xs text-tx-muted">
            Your current account role is <span className="font-mono text-tx font-semibold">[{user.role}]</span>. 
            You do not have administrative permission to access this section.
          </p>
          <div className="pt-2">
            <a href="/dashboard">
              <Button variant="primary" size="sm">
                Return to Dashboard
              </Button>
            </a>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
