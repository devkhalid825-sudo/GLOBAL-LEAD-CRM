import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/client.js';
import {
  BarChart3,
  TrendingUp,
  Users,
  PhoneCall,
  CheckCircle2,
  Globe,
  Tag,
  RefreshCw,
  Award,
} from 'lucide-react';
import { Card, Button, Pill } from '../components/ui/index.js';

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
    { key: 'new', label: 'New Leads' },
    { key: 'contacted', label: 'Contacted' },
    { key: 'interested', label: 'Interested' },
    { key: 'meeting', label: 'Meeting Set' },
    { key: 'proposal', label: 'Proposal Sent' },
    { key: 'won', label: 'Deals Won' },
    { key: 'lost', label: 'Deals Lost' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-tx leading-tight">
            Analytics &amp; Reports.
          </h1>
          <p className="text-sm text-tx-muted mt-2 font-sans">
            Real-time pipeline velocity, commercial conversion metrics, and regional performance.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchReports}
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-tx-muted text-xs font-semibold uppercase tracking-wider">
            <span>Total Leads</span>
            <Users className="w-4 h-4 text-tx" />
          </div>
          <div className="text-3xl font-bold text-tx font-mono">
            {overview ? overview.totalLeads.toLocaleString() : '—'}
          </div>
          <div className="text-xs text-tx-subtle font-mono">
            +{overview?.leadsThisWeek || 0} in last 7 days
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-tx-muted text-xs font-semibold uppercase tracking-wider">
            <span>Conversion Rate</span>
            <TrendingUp className="w-4 h-4 text-tx" />
          </div>
          <div className="text-3xl font-bold text-tx font-mono">
            {overview ? `${overview.conversionRate}%` : '—'}
          </div>
          <div className="text-xs text-tx-subtle">
            Lead to won client ratio
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-tx-muted text-xs font-semibold uppercase tracking-wider">
            <span>Calls Logged</span>
            <PhoneCall className="w-4 h-4 text-tx" />
          </div>
          <div className="text-3xl font-bold text-tx font-mono">
            {overview ? overview.totalCalls.toLocaleString() : '—'}
          </div>
          <div className="text-xs text-tx-subtle">
            Outbound sales &amp; follow-up calls
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-tx-muted text-xs font-semibold uppercase tracking-wider">
            <span>Deals Closed (Won)</span>
            <CheckCircle2 className="w-4 h-4 text-tx" />
          </div>
          <div className="text-3xl font-bold text-tx font-mono">
            {overview ? (overview.pipeline.won || 0).toLocaleString() : '—'}
          </div>
          <div className="text-xs text-tx-subtle">
            Successfully closed accounts
          </div>
        </Card>
      </div>

      {/* Commercial Conversion Funnel */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-tx flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-tx" />
            <span>Lead Pipeline Funnel</span>
          </h2>
          <p className="text-xs text-tx-muted mt-0.5">
            Distribution of all business leads across sales progression stages.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {pipelineStages.map((st) => {
            const count = overview?.pipeline[st.key] || 0;
            const total = overview?.totalLeads || 1;
            const pct = Math.round((count / total) * 100);

            return (
              <div
                key={st.key}
                className="bg-surface-2 border border-border rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-medium text-tx-muted">{st.label}</div>
                  <div className="text-2xl font-bold text-tx font-mono mt-1">{count}</div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-tx-subtle font-mono mb-1">
                    <span>Share</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full bg-surface-1 h-1.5 rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full bg-tx rounded-full"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Middle Row: Geo Distribution & Top Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geo Distribution */}
        <Card className="p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold text-tx flex items-center gap-2">
            <Globe className="w-5 h-5 text-tx" />
            <span>Top Geographic Markets</span>
          </h2>
          {geoData.length === 0 ? (
            <div className="text-tx-subtle text-xs py-8 text-center">
              No geographical lead data yet. Search leads from the Finder to populate.
            </div>
          ) : (
            <div className="space-y-3">
              {geoData.slice(0, 5).map((g) => (
                <div key={g.country} className="bg-surface-2 border border-border rounded-xl p-3.5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-serif font-semibold text-tx text-xs">{g.country}</span>
                    <Pill active className="text-[10px] font-mono">
                      {g.count} leads
                    </Pill>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {g.cities.slice(0, 5).map((ct) => (
                      <span
                        key={ct.city}
                        className="text-[11px] bg-surface-1 text-tx-muted px-2 py-0.5 rounded-md border border-border font-mono"
                      >
                        {ct.city}: <strong className="text-tx">{ct.count}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Categories Distribution */}
        <Card className="p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold text-tx flex items-center gap-2">
            <Tag className="w-5 h-5 text-tx" />
            <span>Top Business Categories</span>
          </h2>
          {categories.length === 0 ? (
            <div className="text-tx-subtle text-xs py-8 text-center">
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
                      <span className="text-tx font-medium">{cat.category}</span>
                      <span className="text-tx-muted font-mono font-medium">
                        {cat.count} <span className="text-tx-subtle font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-surface-2 h-2 rounded-full overflow-hidden border border-border">
                      <div
                        className="h-full bg-tx rounded-full"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Team Leaderboard */}
      <Card className="p-6 space-y-4">
        <h2 className="font-serif text-lg font-bold text-tx flex items-center gap-2">
          <Award className="w-5 h-5 text-tx" />
          <span>Sales Team Performance Leaderboard</span>
        </h2>
        {team.length === 0 ? (
          <div className="text-tx-subtle text-xs py-6 text-center">
            No team members registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-tx border-collapse">
              <thead>
                <tr className="border-b border-border text-tx-subtle text-[11px] bg-surface-2">
                  <th className="py-2.5 px-3 font-medium">Sales Agent</th>
                  <th className="py-2.5 px-3 font-medium">Email</th>
                  <th className="py-2.5 px-3 font-medium text-center">Assigned Leads</th>
                  <th className="py-2.5 px-3 font-medium text-center">Calls Logged</th>
                  <th className="py-2.5 px-3 font-medium text-center">Deals Won</th>
                  <th className="py-2.5 px-3 font-medium text-center">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-sans">
                {team.map((ag) => {
                  const winRate =
                    ag.leadsAssigned > 0 ? Math.round((ag.wonCount / ag.leadsAssigned) * 100) : 0;

                  return (
                    <tr key={ag.userId} className="hover:bg-row-hover transition">
                      <td className="py-3 px-3 font-semibold text-tx flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-surface-2 border border-border text-tx flex items-center justify-center text-xs font-bold font-mono">
                          {ag.name.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="font-serif font-semibold">{ag.name}</span>
                      </td>
                      <td className="py-3 px-3 text-tx-muted font-mono">{ag.email}</td>
                      <td className="py-3 px-3 text-center font-bold text-tx font-mono">{ag.leadsAssigned}</td>
                      <td className="py-3 px-3 text-center font-bold text-tx font-mono">{ag.callsCount}</td>
                      <td className="py-3 px-3 text-center font-bold text-tx font-mono">{ag.wonCount}</td>
                      <td className="py-3 px-3 text-center">
                        <Pill active={winRate > 20} className="text-[10px] font-mono">
                          {winRate}%
                        </Pill>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
