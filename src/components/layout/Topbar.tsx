import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthProvider.js';
import { LogOut, Menu, ShieldCheck, Search } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { TwoFactorModal } from '../auth/TwoFactorModal.js';

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

  const navLinks = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Lead finder', to: '/finder' },
    { label: 'Leads', to: '/leads' },
    { label: 'Meetings', to: '/meetings' },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-[#262626] select-none">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {onToggleMenu && (
              <button
                onClick={onToggleMenu}
                className="lg:hidden p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-xl transition"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <NavLink to="/dashboard" className="serif font-bold text-lg sm:text-xl tracking-[0.12em] text-white">
              GLOBAL CRM
            </NavLink>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto flex-1 max-w-xl">
            {navLinks.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                    isActive
                      ? 'bg-[#121212] text-white shadow-[inset_0_0_0_1px_#262626]'
                      : 'text-neutral-400 hover:text-white'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Controls: Search, Live Clock, 2FA, Avatar */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Search leads Cmd+K button */}
            <button
              onClick={() => {
                const el = document.getElementById('search-input');
                if (el) el.focus();
              }}
              className="hidden xl:flex items-center justify-between gap-4 bg-[#0A0A0A] border border-[#262626] rounded-xl px-3.5 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 transition min-w-[190px]"
            >
              <span>Search leads…</span>
              <span className="mono text-[11px] px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                ⌘K
              </span>
            </button>

            {/* Live Clock with pulsing dot */}
            <div className="hidden sm:flex items-center gap-2 text-neutral-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="mono text-[11px]">{clock || '00:00:00'}</span>
            </div>

            {/* 2FA Security Pill */}
            <button
              onClick={() => setShow2FAModal(true)}
              title="Two-Factor Security & WhatsApp Backup Settings"
              className={`pill-luxury ${user?.twoFactorEnabled ? 'on' : ''}`}
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              <span>{user?.twoFactorEnabled ? '2FA Active' : 'Setup 2FA'}</span>
            </button>

            {/* User Avatar Circle */}
            <div
              className="w-8 h-8 rounded-full border border-[#262626] bg-[#121212] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow cursor-pointer hover:border-neutral-500 transition"
              title={`${user?.name} (${user?.role})`}
            >
              {user?.name?.slice(0, 2).toUpperCase() || 'AK'}
            </div>

            {/* Sign Out */}
            <button
              onClick={logout}
              title="Sign out of CRM"
              className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
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
