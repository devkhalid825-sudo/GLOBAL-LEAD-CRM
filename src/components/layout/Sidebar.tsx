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
} from 'lucide-react';

export const Sidebar: React.FC = () => {
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

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 text-slate-300">
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
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
    </aside>
  );
};
