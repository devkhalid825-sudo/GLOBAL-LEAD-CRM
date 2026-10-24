import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireRole } from './auth/RequireRole.js';
import { AppShell } from './components/layout/AppShell.js';
import { LoginPage } from './auth/LoginPage.js';
import { DashboardPage } from './pages/Dashboard.js';

// Operational Pages (Phase 2 & Phase 3)
import { LeadFinderPage } from './pages/LeadFinder.js';
import { LeadsPage } from './pages/Leads.js';
import { LeadDetailPage } from './pages/LeadDetail.js';
import { ChatPage } from './pages/Chat.js';

// Console Pages (Phase 1)
import { IntegrationsPage } from './pages/console/Integrations.js';
import { ConfigPage } from './pages/console/Config.js';
import { LogsPage } from './pages/console/Logs.js';
import { AuditPage } from './pages/console/Audit.js';
import { UsersPage } from './pages/console/Users.js';
import { HealthPage } from './pages/console/Health.js';

// Future Phase Placeholders
import {
  InboxPage,
  MeetingsPage,
  ProposalsPage,
  FollowupsPage,
  ReportsPage,
} from './pages/Placeholders.js';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth */}
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated Workspace */}
      <Route
        path="/"
        element={
          <RequireRole>
            <AppShell />
          </RequireRole>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="finder" element={<LeadFinderPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="leads/:id" element={<LeadDetailPage />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="meetings" element={<MeetingsPage />} />
        <Route path="proposals" element={<ProposalsPage />} />
        <Route path="followups" element={<FollowupsPage />} />
        <Route path="reports" element={<ReportsPage />} />

        {/* Admin Console: Strictly protected with allowedRoles={['admin']} */}
        <Route
          path="console/integrations"
          element={
            <RequireRole allowedRoles={['admin']}>
              <IntegrationsPage />
            </RequireRole>
          }
        />
        <Route
          path="console/config"
          element={
            <RequireRole allowedRoles={['admin']}>
              <ConfigPage />
            </RequireRole>
          }
        />
        <Route
          path="console/logs"
          element={
            <RequireRole allowedRoles={['admin']}>
              <LogsPage />
            </RequireRole>
          }
        />
        <Route
          path="console/audit"
          element={
            <RequireRole allowedRoles={['admin']}>
              <AuditPage />
            </RequireRole>
          }
        />
        <Route
          path="console/users"
          element={
            <RequireRole allowedRoles={['admin']}>
              <UsersPage />
            </RequireRole>
          }
        />
        <Route
          path="console/health"
          element={
            <RequireRole allowedRoles={['admin']}>
              <HealthPage />
            </RequireRole>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
