import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider.js';
import {
  LayoutDashboard,
  Compass,
  Users,
  Inbox,
  MessageSquare,
  Calendar,
  FileText,
  Clock,
  BarChart3,
  Sliders,
  Settings,
  Terminal,
  FileCheck2,
  UserCog,
  Activity,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const baseNav = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Lead Finder', to: '/finder', icon: Compass },
    { label: 'Leads Directory', to: '/leads', icon: Users },
    { label: 'Unified Inbox', to: '/inbox', icon: Inbox },
    { label: 'Team Chat', to: '/chat', icon: MessageSquare },
    { label: 'Meetings', to: '/meetings', icon: Calendar },
    { label: 'Proposals', to: '/proposals', icon: FileText },
    { label: 'Follow-ups', to: '/followups', icon: Clock },
    { label: 'Reports', to: '/reports', icon: BarChart3 },
  ];

  const consoleNav = [
    { label: 'Integrations & Keys', to: '/console/integrations', icon: Sliders },
    { label: 'Config (.env)', to: '/console/config', icon: Settings },
    { label: 'Live Logs', to: '/console/logs', icon: Terminal },
    { label: 'Audit Trail', to: '/console/audit', icon: FileCheck2 },
    { label: 'Team Users', to: '/console/users', icon: UserCog },
    { label: 'System Health', to: '/console/health', icon: Activity },
  ];

  const renderNavContent = (isMobile = false) => (
    <>
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            G
          </div>
          <div>
            <span className="font-bold text-white tracking-tight">Global CRM</span>
            <span className="block text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
              {user?.role} portal
            </span>
          </div>
        </div>
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
          CRM Core
        </div>
        {baseNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                if (isMobile && onClose) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {isAdmin && (
          <div className="pt-6">
            <div className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5">
              <span>Admin Console</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-mono">
                SECURE
              </span>
            </div>
            {consoleNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    if (isMobile && onClose) onClose();
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        Lead Engine v1.0.0
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col flex-shrink-0 text-slate-300">
        {renderNavContent(false)}
      </aside>

      {/* Mobile Drawer (visible when isOpen is true) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />

          {/* Drawer Body */}
          <div className="relative w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 flex flex-col text-slate-300 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
