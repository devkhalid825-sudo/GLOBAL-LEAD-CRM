import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider.js';
import { NavLink, useNavigate } from 'react-router-dom';
import { api, apiFetch } from '../api/client.js';
import {
  Compass,
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Sparkles,
  Radio,
  Target,
  Video,
  ExternalLink,
  Phone,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Zap,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [totalLeads, setTotalLeads] = useState(0);
  const [metaLeadsCount, setMetaLeadsCount] = useState(0);
  const [adsLeadsCount, setAdsLeadsCount] = useState(0);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [leadsRes, metaRes, adsRes, meetingsRes] = await Promise.all([
        api.get<any>('/leads?limit=5').catch(() => ({ items: [], total: 0 })),
        api.get<any>('/leads?metaIntegrated=true&limit=1').catch(() => ({ total: 0 })),
        api.get<any>('/leads?runningAds=true&limit=1').catch(() => ({ total: 0 })),
        apiFetch<{ success: boolean; data: any[] }>('/meetings').catch(() => ({ success: false, data: [] })),
      ]);

      const items = leadsRes?.items || (Array.isArray(leadsRes?.data) ? leadsRes.data : []);
      setTotalLeads(leadsRes?.total || items.length);
      setRecentLeads(items.slice(0, 5));
      setMetaLeadsCount(metaRes?.total || 0);
      setAdsLeadsCount(adsRes?.total || 0);

      const meetings = meetingsRes?.data || [];
      const scheduled = meetings.filter((m: any) => m.status === 'scheduled');
      setUpcomingMeetings(scheduled.slice(0, 3));
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleQuickSeed = async () => {
    setSeeding(true);
    setSeedNotice(null);
    try {
      const res = await api.post<any>('/leads/seed-test-data', {});
      setSeedNotice(`Generated ${res.leadsCount} test leads & ${res.meetingsCount} Google Meet calls!`);
      loadDashboardData();
    } catch (err: any) {
      setSeedNotice(`Seeding failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/70 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Global Lead Intelligence &amp; Meta Ad Scraper</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">{user?.name || 'Commander'}</span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Find business leads across Google Maps in 2km grid cells, detect Meta Pixel integration and active Facebook/Instagram ads, book Google Meet strategy calls, and close deals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleQuickSeed}
              disabled={seeding}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-900/30 flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>{seeding ? 'Generating...' : 'Seed Test Leads & Calls'}</span>
            </button>

            <NavLink
              to="/finder"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Launch Lead Finder</span>
            </NavLink>
          </div>
        </div>

        {seedNotice && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{seedNotice}</span>
            </div>
            <button onClick={() => setSeedNotice(null)} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Verified Leads</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {loading ? '...' : totalLeads}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">Active in CRM</span>
          </div>
          <NavLink to="/leads" className="mt-3 text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 font-medium transition">
            <span>Browse directory</span>
            <ArrowRight className="w-3 h-3" />
          </NavLink>
        </div>

        {/* Meta Integrated Brands */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl hover:border-blue-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Meta Integrated</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <Radio className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-400 font-mono">
              {loading ? '...' : metaLeadsCount}
            </span>
            <span className="text-xs text-blue-300 font-semibold">Pixel / IG / FB</span>
          </div>
          <NavLink to="/leads" className="mt-3 text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1 font-medium transition">
            <span>Filter Meta brands</span>
            <ArrowRight className="w-3 h-3" />
          </NavLink>
        </div>

        {/* Active Meta Advertisers */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl hover:border-amber-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Running Meta Ads</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400 font-mono">
              {loading ? '...' : adsLeadsCount}
            </span>
            <span className="text-xs text-amber-300 font-semibold">Active Advertisers</span>
          </div>
          <NavLink to="/leads" className="mt-3 text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 font-medium transition">
            <span>Check live ad campaigns</span>
            <ArrowRight className="w-3 h-3" />
          </NavLink>
        </div>

        {/* Scheduled Meetings */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl hover:border-indigo-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Strategy Calls</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Video className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-400 font-mono">
              {loading ? '...' : upcomingMeetings.length}
            </span>
            <span className="text-xs text-indigo-300 font-semibold">Google Meet calls</span>
          </div>
          <NavLink to="/meetings" className="mt-3 text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1 font-medium transition">
            <span>Open calls calendar</span>
            <ArrowRight className="w-3 h-3" />
          </NavLink>
        </div>
      </div>

      {/* Main Grid: Upcoming Calls & Recent High-Intent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Recent Leads with Meta Intel */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Recent High-Intent Leads</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified businesses with Meta tracking, direct WhatsApp &amp; website analysis
              </p>
            </div>
            <NavLink
              to="/leads"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <span>View All ({totalLeads})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>

          {recentLeads.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-3">
              <p>No leads extracted yet.</p>
              <button
                onClick={handleQuickSeed}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold"
              >
                Seed Test Leads Now
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {recentLeads.map((lead) => {
                const phone = lead.phoneNorm || (lead.phones && lead.phones[0]);
                const cleanPhone = phone ? phone.replace(/[^\d]/g, '') : null;
                const waLink = cleanPhone
                  ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                      `Hi ${lead.name}, noticed your business in ${lead.city} and would love to connect.`
                    )}`
                  : null;
                const tags = Array.isArray(lead.tags) ? (lead.tags as string[]) : [];
                const isMetaIntegrated = tags.includes('Meta Integrated') || tags.includes('Meta Pixel Active') || lead.adsInfo?.pixelDetected;
                const isAdsRunning = tags.includes('Meta Ads Active') || lead.adsInfo?.running;
                const adLibraryUrl = lead.adsInfo?.adLibraryUrl || `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(lead.name)}`;

                return (
                  <div key={lead.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/20 px-2 rounded-xl transition">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm truncate">{lead.name}</span>
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] uppercase font-mono font-bold">
                          {lead.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                        <span>📍 {lead.city}, {lead.country}</span>
                        {lead.categoryName && (
                          <span className="text-emerald-400 font-mono text-[11px] truncate max-w-xs">
                            • {lead.categoryName}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {isMetaIntegrated && (
                          <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded text-[10px] font-semibold flex items-center gap-1">
                            <Radio className="w-2.5 h-2.5 text-blue-400" />
                            Meta Integrated
                          </span>
                        )}
                        {isAdsRunning && (
                          <a
                            href={adLibraryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 rounded text-[10px] font-semibold flex items-center gap-1 transition"
                          >
                            <Target className="w-2.5 h-2.5 text-amber-400" />
                            Active Ads ↗
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      {phone && (
                        <>
                          <a
                            href={`tel:${phone}`}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
                            title="Call Phone"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          </a>
                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                        </>
                      )}

                      <button
                        onClick={() => navigate(`/leads/${lead.id}`)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Upcoming Google Meet Strategy Calls */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-400" />
                <span>Upcoming Calls</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Google Meet strategy sessions</p>
            </div>
            <NavLink to="/meetings" className="text-xs text-indigo-400 hover:underline">
              All
            </NavLink>
          </div>

          {upcomingMeetings.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <Calendar className="w-8 h-8 text-slate-700 mx-auto" />
              <p>No strategy calls scheduled for today.</p>
              <NavLink
                to="/meetings"
                className="text-emerald-400 hover:underline text-xs inline-block font-semibold"
              >
                + Schedule Call
              </NavLink>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingMeetings.map((m) => (
                <div key={m.id} className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                  <div className="font-bold text-white text-xs">{m.title}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    <span>{new Date(m.startTime).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                  {m.meetLink && (
                    <a
                      href={m.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Google Meet</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
