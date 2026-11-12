import React from 'react';
import { useAuth } from '../../auth/AuthProvider.js';
import { LogOut, Menu, Shield, Zap, Compass, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface TopbarProps {
  onToggleMenu?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMenu }) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-4 sm:px-6 z-10 select-none">
      <div className="flex items-center gap-3">
        {onToggleMenu && (
          <button
            onClick={onToggleMenu}
            className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Meta Engine Online
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <NavLink
          to="/finder"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold transition"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>New Lead Search</span>
        </NavLink>

        <div className="h-5 w-[1px] bg-slate-800 hidden sm:block" />

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 text-emerald-400 border border-slate-700/80 flex items-center justify-center font-bold text-xs flex-shrink-0 shadow">
            {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-white leading-tight">
              {user?.name}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <span className="truncate max-w-[140px]">{user?.email}</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono uppercase text-[9px] font-bold">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out of CRM"
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
