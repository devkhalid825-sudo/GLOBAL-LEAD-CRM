import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/client.js';
import {
  BarChart3,
  TrendingUp,
  Users,
  PhoneCall,
  CheckCircle2,
  XCircle,
  Globe,
  Tag,
  RefreshCw,
  Award,
} from 'lucide-react';

interface OverviewData {
  totalLeads: number;
  pipeline: Record<string, number>;
  conversionRate: number;
  totalCalls: number;
  totalNotes: number;
  leadsThisWeek: number;
  sources: Record<string, number>;
}

interface GeoData {
  country: string;
  count: number;
  cities: Array<{ city: string; count: number }>;
}

interface CategoryData {
  category: string;
  count: number;
}

interface AgentData {
  userId: string;
  name: string;
  email: string;
  leadsAssigned: number;
  wonCount: number;
  callsCount: number;
}

export const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [geoData, setGeoData] = useState<GeoData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [team, setTeam] = useState<AgentData[]>([]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [ovRes, geoRes, catRes, teamRes] = await Promise.all([
        apiFetch<{ success: boolean; data: OverviewData }>('/reports/overview'),
        apiFetch<{ success: boolean; data: GeoData[] }>('/reports/geo'),
        apiFetch<{ success: boolean; data: CategoryData[] }>('/reports/categories'),
        apiFetch<{ success: boolean; data: AgentData[] }>('/reports/team'),
      ]);

      if (ovRes.success) setOverview(ovRes.data);
      if (geoRes.success) setGeoData(geoRes.data);
      if (catRes.success) setCategories(catRes.data);
      if (teamRes.success) setTeam(teamRes.data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const pipelineStages = [
    { key: 'new', label: 'New Leads', color: 'bg-blue-500', text: 'text-blue-400' },
    { key: 'contacted', label: 'Contacted', color: 'bg-amber-500', text: 'text-amber-400' },
    { key: 'interested', label: 'Interested', color: 'bg-indigo-500', text: 'text-indigo-400' },
    { key: 'meeting', label: 'Meeting Set', color: 'bg-purple-500', text: 'text-purple-400' },
    { key: 'proposal', label: 'Proposal Sent', color: 'bg-cyan-500', text: 'text-cyan-400' },
    { key: 'won', label: 'Deals Won', color: 'bg-emerald-500', text: 'text-emerald-400' },
    { key: 'lost', label: 'Deals Lost', color: 'bg-rose-500', text: 'text-rose-400' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-emerald-400" />
            Analytics & Conversion Reports
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time pipeline velocity, commercial conversion metrics, and regional performance.
          </p>
        </div>
        <button
          onClick={fetchReports}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          Refresh Metrics
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Leads</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white mt-3">
            {overview ? overview.totalLeads.toLocaleString() : '—'}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            <span className="text-emerald-400 font-bold">+{overview?.leadsThisWeek || 0}</span> in last 7 days
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Conversion Rate</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-3">
            {overview ? `${overview.conversionRate}%` : '—'}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Lead to <span className="text-emerald-400">Won Client</span> ratio
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Calls Logged</span>
            <PhoneCall className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-white mt-3">
            {overview ? overview.totalCalls.toLocaleString() : '—'}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Outbound sales & follow-up calls
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Deals Closed (Won)</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white mt-3">
            {overview ? (overview.pipeline.won || 0).toLocaleString() : '—'}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Successfully closed accounts
          </div>
        </div>
      </div>

      {/* Commercial Conversion Funnel */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Lead Pipeline Funnel
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Distribution of all business leads across sales progression stages.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {pipelineStages.map((st) => {
            const count = overview?.pipeline[st.key] || 0;
            const total = overview?.totalLeads || 1;
            const pct = Math.round((count / total) * 100);

            return (
              <div
                key={st.key}
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className={`text-xs font-semibold ${st.text}`}>{st.label}</div>
                  <div className="text-2xl font-black text-white mt-1">{count}</div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Share</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${st.color} rounded-full`}
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Middle Row: Geo Distribution & Top Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geo Distribution */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            Top Geographic Markets
          </h2>
          {geoData.length === 0 ? (
            <div className="text-slate-500 text-sm py-8 text-center">
              No geographical lead data yet. Search leads from the Finder to populate.
            </div>
          ) : (
            <div className="space-y-4">
              {geoData.slice(0, 5).map((g) => (
                <div key={g.country} className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-white text-sm">{g.country}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {g.count} leads
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {g.cities.slice(0, 5).map((ct) => (
                      <span
                        key={ct.city}
                        className="text-xs bg-slate-800/70 text-slate-300 px-2 py-1 rounded-md border border-slate-700/50"
                      >
                        {ct.city}: <strong className="text-white">{ct.count}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Categories Distribution */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-400" />
            Top Business Categories
          </h2>
          {categories.length === 0 ? (
            <div className="text-slate-500 text-sm py-8 text-center">
              No category data available yet.
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((cat) => {
                const total = overview?.totalLeads || 1;
                const pct = Math.round((cat.count / total) * 100);

                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-200 font-medium">{cat.category}</span>
                      <span className="text-slate-400 font-mono font-bold">
                        {cat.count} <span className="text-slate-500 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Team Leaderboard */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-400" />
          Sales Team Performance Leaderboard
        </h2>
        {team.length === 0 ? (
          <div className="text-slate-500 text-sm py-6 text-center">
            No team members registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Sales Agent</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-center">Assigned Leads</th>
                  <th className="py-3 px-4 text-center">Calls Logged</th>
                  <th className="py-3 px-4 text-center">Deals Won</th>
                  <th className="py-3 px-4 text-center">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {team.map((ag) => {
                  const winRate =
                    ag.leadsAssigned > 0 ? Math.round((ag.wonCount / ag.leadsAssigned) * 100) : 0;

                  return (
                    <tr key={ag.userId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold">
                          {ag.name.slice(0, 1).toUpperCase()}
                        </div>
                        {ag.name}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs font-mono">{ag.email}</td>
                      <td className="py-3 px-4 text-center font-bold text-white">{ag.leadsAssigned}</td>
                      <td className="py-3 px-4 text-center font-bold text-purple-400">{ag.callsCount}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-400">{ag.wonCount}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {winRate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
