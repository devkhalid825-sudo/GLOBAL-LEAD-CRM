import React from 'react';
import { useAuth } from '../../auth/AuthProvider.js';
import { LogOut, User as UserIcon, Shield } from 'lucide-react';

export const Topbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Workspace</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center font-semibold text-xs">
            {user?.name?.slice(0, 2).toUpperCase() || 'US'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-semibold text-slate-800 dark:text-white leading-tight">
              {user?.name}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span>{user?.email}</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-mono uppercase font-bold">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out"
          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
