import React from 'react';
import { useAuth } from '../auth/AuthProvider.js';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  Users,
  Inbox,
  Shield,
  Sliders,
  CheckCircle2,
  TrendingUp,
  FileText,
  Activity,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Phase 1 Foundation Operational
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-slate-300 mt-2">
            Global Lead CRM is configured with encrypted key pools, multi-provider failover chains, argon2 authentication, and strict server-side RBAC.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {isAdmin ? (
              <NavLink
                to="/console/integrations"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-emerald-900/30"
              >
                <Sliders className="w-4 h-4" />
                <span>Configure API Keys & Providers</span>
              </NavLink>
            ) : (
              <NavLink
                to="/leads"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition"
              >
                <Users className="w-4 h-4" />
                <span>View Assigned Leads</span>
              </NavLink>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-semibold uppercase text-slate-400">Security Architecture</span>
          <div className="mt-3 flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-400" />
            <span className="text-xl font-bold text-white">AES-256-GCM</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Keys encrypted in Mongo</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-semibold uppercase text-slate-400">Failover Engine</span>
          <div className="mt-3 flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            <span className="text-xl font-bold text-white">Active</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Cooldown + Quota Recovery</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-semibold uppercase text-slate-400">Current Role</span>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xl font-bold text-white uppercase font-mono text-emerald-300">
              {user?.role}
            </span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {isAdmin ? 'Full administrative rights' : 'Restricted portal access'}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-semibold uppercase text-slate-400">Database Engine</span>
          <div className="mt-3 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span className="text-xl font-bold text-white">Mongoose 8</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Standard MongoDB compliant</span>
        </div>
      </div>
    </div>
  );
};
