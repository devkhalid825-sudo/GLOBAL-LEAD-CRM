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

    sendBeat();
    const interval = setInterval(sendBeat, 60000); // every 60s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-tx font-sans flex flex-col lg:flex-row selection:bg-tx selection:text-canvas">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Minimal Sticky Topbar */}
        <Topbar onToggleMenu={() => setMobileMenuOpen(true)} />

        {/* Dynamic Outlet Container */}
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
