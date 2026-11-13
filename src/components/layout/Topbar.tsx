import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthProvider.js';
import { LogOut, Menu, ShieldCheck } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { TwoFactorModal } from '../auth/TwoFactorModal.js';
import { ThemeToggle } from '../ui/ThemeToggle.js';

interface TopbarProps {
  onToggleMenu?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMenu }) => {
  const { user, logout } = useAuth();
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [clock, setClock] = useState('');

  useEffect(() => {
    const updateTime = () => setClock(new Date().toLocaleTimeString('en-GB'));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const topTabs = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Lead finder', to: '/finder' },
    { label: 'Leads', to: '/leads' },
    { label: 'Meetings', to: '/meetings' },
  ];

  return (
    <>
      <header className="sticky top-0 z-20 bg-surface-1/95 backdrop-blur-md border-b border-border select-none">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Mobile Menu & Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {onToggleMenu && (
              <button
                onClick={onToggleMenu}
                className="lg:hidden p-2 text-tx-muted hover:text-tx hover:bg-surface-2 rounded-btn transition"
                aria-label="Open navigation drawer"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <NavLink
              to="/dashboard"
              className="serif font-bold text-lg sm:text-xl tracking-[0.12em] text-tx hover:opacity-80 transition"
            >
              GLOBAL CRM
            </NavLink>
          </div>

          {/* Quick-Switch Section Tabs */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto flex-1 max-w-lg py-1">
            {topTabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-btn text-xs font-medium transition duration-150 whitespace-nowrap ${
                    isActive
                      ? 'bg-btn text-btn-text font-semibold shadow-sm'
                      : 'text-tx-muted hover:text-tx hover:bg-surface-2'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Controls: Command Search, Live Clock, Theme Toggle, 2FA, Avatar */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            {/* Search leads Cmd+K button */}
            <button
              onClick={() => {
                const el = document.getElementById('search-input');
                if (el) el.focus();
              }}
              className="hidden xl:flex items-center justify-between gap-3 bg-surface-2 border border-border rounded-btn px-3.5 py-1.5 text-xs text-tx-muted hover:text-tx hover:border-tx transition min-w-[180px]"
            >
              <span>Search leads…</span>
              <span className="mono text-[11px] px-1.5 py-0.5 rounded bg-surface-1 text-tx-subtle border border-border">
                ⌘K
              </span>
            </button>

            {/* Live Clock with pulsing dot */}
            <div className="hidden sm:flex items-center gap-2 text-tx-muted text-xs">
              <span className="w-2 h-2 rounded-full bg-tx animate-pulse" />
              <span className="mono text-[12px]">{clock || '00:00:00'}</span>
            </div>

            {/* Dark / Light Mode Switcher */}
            <ThemeToggle />

            {/* 2FA Security Pill */}
            <button
              onClick={() => setShow2FAModal(true)}
              title="Two-Factor Security & WhatsApp Backup Settings"
              className={`pill-luxury ${user?.twoFactorEnabled ? 'on' : ''}`}
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 inline" />
              <span className="hidden sm:inline">{user?.twoFactorEnabled ? '2FA active' : 'Setup 2FA'}</span>
              <span className="sm:hidden">2FA</span>
            </button>

            {/* User Avatar Circle */}
            <div
              className="w-8 h-8 rounded-full border border-border bg-surface-2 text-tx font-bold text-xs flex items-center justify-center flex-shrink-0 cursor-pointer shadow-sm"
              title={`${user?.name} (${user?.role})`}
            >
              {user?.name?.slice(0, 2).toUpperCase() || 'AK'}
            </div>

            {/* Sign Out */}
            <button
              onClick={logout}
              title="Sign out of CRM"
              className="p-1.5 text-tx-subtle hover:text-tx hover:bg-surface-2 rounded-btn transition"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2FA Security Modal */}
      <TwoFactorModal isOpen={show2FAModal} onClose={() => setShow2FAModal(false)} />
    </>
  );
};
