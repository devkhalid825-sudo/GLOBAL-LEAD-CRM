import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar.js';
import { api } from '../../api/client.js';

export const AppShell: React.FC = () => {
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
    <div className="min-h-screen bg-white text-black font-sans flex flex-col selection:bg-neutral-900 selection:text-white">
      {/* Editorial Luxury Top Navigation Bar matching Figma */}
      <Topbar />

      {/* Main Full-Width Editorial Content Area */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
};
