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
  Radio,
  Zap,
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
    { label: 'Lead Finder', to: '/finder', icon: Compass, badge: 'Grid 2km' },
    { label: 'Leads Directory', to: '/leads', icon: Users, badge: 'Meta' },
    { label: 'Meetings & Calls', to: '/meetings', icon: Calendar, badge: 'Meet' },
    { label: 'Proposals & Deals', to: '/proposals', icon: FileText },
    { label: 'Unified Inbox', to: '/inbox', icon: Inbox },
    { label: 'Team Chat', to: '/chat', icon: MessageSquare },
    { label: 'Follow-ups & Drip', to: '/followups', icon: Clock },
    { label: 'Analytics & Reports', to: '/reports', icon: BarChart3 },
  ];

  const consoleNav = [
    { label: 'Integrations & Keys', to: '/console/integrations', icon: Sliders },
    { label: 'Config & Env', to: '/console/config', icon: Settings },
    { label: 'Realtime Logs', to: '/console/logs', icon: Terminal },
    { label: 'Audit Trail', to: '/console/audit', icon: FileCheck2 },
    { label: 'Team Members', to: '/console/users', icon: UserCog },
    { label: 'System Health', to: '/console/health', icon: Activity },
  ];

  const renderNavContent = (isMobile = false) => (
    <>
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center font-black text-base shadow-lg shadow-emerald-500/20">
            G
          </div>
          <div>
            <span className="font-extrabold text-white tracking-tight text-sm flex items-center gap-1.5">
              <span>Global CRM</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </span>
            <span className="block text-[10px] uppercase tracking-wider text-emerald-400 font-bold font-mono">
              {user?.role || 'user'} workspace
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

      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1 scrollbar-thin">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
          <span>CRM Intelligence</span>
          <span className="text-[9px] text-emerald-400/80 font-mono">LIVE</span>
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
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition group ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-emerald-400 border border-emerald-500/25 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`
              }
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 group-hover:text-emerald-300 transition">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {isAdmin && (
          <div className="pt-5">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
              <span>Admin Console</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-mono font-bold">
                ROOT
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
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </nav>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Meta Ads Sync</span>
        </span>
        <span className="text-slate-500 font-mono text-[10px]">v2.4 Pro</span>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900/95 border-r border-slate-800/90 flex-col flex-shrink-0 text-slate-300 select-none">
        {renderNavContent(false)}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="relative w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 flex flex-col text-slate-300 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
