import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthProvider.js';
import { LogOut, ShieldCheck } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { TwoFactorModal } from '../auth/TwoFactorModal.js';

interface TopbarProps {
  onToggleMenu?: () => void;
}

export const Topbar: React.FC<TopbarProps> = () => {
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
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] select-none">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <NavLink
              to="/dashboard"
              className="serif font-bold text-lg sm:text-xl tracking-[0.12em] text-black hover:opacity-80 transition"
            >
              GLOBAL CRM
            </NavLink>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 overflow-x-auto flex-1 max-w-xl py-1">
            {navLinks.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                    isActive
                      ? 'bg-black text-white shadow-sm'
                      : 'text-[#737373] hover:text-black hover:bg-[#F0F0F0]'
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
              className="hidden xl:flex items-center justify-between gap-4 bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl px-3.5 py-1.5 text-xs text-[#737373] hover:text-black hover:border-black transition min-w-[190px]"
            >
              <span>Search leads…</span>
              <span className="mono text-[11px] px-1.5 py-0.5 rounded bg-white text-[#525252] border border-[#E5E5E5]">
                ⌘K
              </span>
            </button>

            {/* Live Clock with pulsing black dot */}
            <div className="hidden sm:flex items-center gap-2 text-[#525252] text-xs">
              <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
              <span className="mono text-[12px] font-semibold">{clock || '00:00:00'}</span>
            </div>

            {/* 2FA Security Pill */}
            <button
              onClick={() => setShow2FAModal(true)}
              title="Two-Factor Security & WhatsApp Backup Settings"
              className={`pill-luxury ${user?.twoFactorEnabled ? 'on' : ''}`}
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 inline" />
              <span>{user?.twoFactorEnabled ? '2FA Active' : 'Setup 2FA'}</span>
            </button>

            {/* User Avatar Circle */}
            <div
              className="w-8 h-8 rounded-full border border-[#E5E5E5] bg-[#F8F8F8] text-black font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm cursor-pointer hover:border-black transition"
              title={`${user?.name} (${user?.role})`}
            >
              {user?.name?.slice(0, 2).toUpperCase() || 'AK'}
            </div>

            {/* Sign Out */}
            <button
              onClick={logout}
              title="Sign out of CRM"
              className="p-1.5 text-[#737373] hover:text-black hover:bg-[#F0F0F0] rounded-xl transition"
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
