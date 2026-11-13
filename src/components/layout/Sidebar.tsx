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
    { label: 'Lead finder', to: '/finder', icon: Compass, badge: 'Grid 2km' },
    { label: 'Leads directory', to: '/leads', icon: Users, badge: 'Meta' },
    { label: 'Meetings & calls', to: '/meetings', icon: Calendar, badge: 'Meet' },
    { label: 'Proposals & deals', to: '/proposals', icon: FileText },
    { label: 'Unified inbox', to: '/inbox', icon: Inbox },
    { label: 'Team chat', to: '/chat', icon: MessageSquare },
    { label: 'Follow-ups & drip', to: '/followups', icon: Clock },
    { label: 'Analytics & reports', to: '/reports', icon: BarChart3 },
  ];

  const consoleNav = [
    { label: 'Integrations & keys', to: '/console/integrations', icon: Sliders },
    { label: 'Config & env', to: '/console/config', icon: Settings },
    { label: 'Realtime logs', to: '/console/logs', icon: Terminal },
    { label: 'Audit trail', to: '/console/audit', icon: FileCheck2 },
    { label: 'Team members', to: '/console/users', icon: UserCog },
    { label: 'System health', to: '/console/health', icon: Activity },
  ];

  const renderNavContent = (isMobile = false) => (
    <>
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-border bg-surface-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-btn bg-tx text-canvas flex items-center justify-center font-bold text-xs tracking-wider">
            CRM
          </div>
          <div>
            <span className="serif font-bold text-tx tracking-[0.12em] text-sm">
              GLOBAL CRM
            </span>
            <span className="block text-[10px] text-tx-subtle mono uppercase">
              {user?.role || 'user'} workspace
            </span>
          </div>
        </div>
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-tx-subtle hover:text-tx rounded-lg hover:bg-surface-2 transition"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
        <div className="text-[10px] font-semibold text-tx-subtle uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
          <span>CRM Intelligence</span>
          <span className="w-1.5 h-1.5 rounded-full bg-tx animate-pulse" />
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
                `flex items-center justify-between px-3 py-2 rounded-btn text-xs font-medium transition duration-150 ${
                  isActive
                    ? 'bg-surface-2 text-tx border border-border shadow-sm font-semibold'
                    : 'text-tx-muted hover:text-tx hover:bg-surface-2'
                }`
              }
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className="w-4 h-4 flex-shrink-0 text-tx-subtle" />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] mono px-1.5 py-0.5 rounded-full border border-border bg-surface-1 text-tx-subtle">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {isAdmin && (
          <div className="pt-5 mt-4 border-t border-border space-y-1">
            <div className="text-[10px] font-semibold text-tx-subtle uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
              <span>Admin Console</span>
              <span className="mono text-[9px] px-1 rounded border border-border">ROOT</span>
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
                    `flex items-center justify-between px-3 py-2 rounded-btn text-xs font-medium transition duration-150 ${
                      isActive
                        ? 'bg-surface-2 text-tx border border-border shadow-sm font-semibold'
                        : 'text-tx-muted hover:text-tx hover:bg-surface-2'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 flex-shrink-0 text-tx-subtle" />
                    <span className="truncate">{item.label}</span>
                  </div>
                </NavLink>
              );
            })}
          </div>
        )}
      </nav>

      {/* User profile footer */}
      <div className="p-4 border-t border-border bg-surface-1 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full border border-border bg-surface-2 text-tx font-bold text-xs flex items-center justify-center flex-shrink-0">
            {user?.name?.slice(0, 2).toUpperCase() || 'AK'}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-tx truncate">{user?.name}</div>
            <div className="text-[11px] text-tx-subtle truncate">{user?.email}</div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-30 bg-surface-1 border-r border-border select-none">
        {renderNavContent(false)}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-surface-1 border-r border-border flex flex-col lg:hidden transform transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderNavContent(true)}
      </div>
    </>
  );
};
