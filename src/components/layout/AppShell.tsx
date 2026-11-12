import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { Topbar } from './Topbar.js';
import { api } from '../../api/client.js';

export const AppShell: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active time & heartbeat tracker: records active session minutes while CRM window is open
  useEffect(() => {
    const sendBeat = () => {
      if (!document.hidden) {
        api.post('/reports/heartbeat', {}).catch(() => {});
      }
    };

    // Initial beat
    sendBeat();
    const interval = setInterval(sendBeat, 60000); // every 60s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onToggleMenu={() => setMobileMenuOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-black">
          <div className="max-w-[1440px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
