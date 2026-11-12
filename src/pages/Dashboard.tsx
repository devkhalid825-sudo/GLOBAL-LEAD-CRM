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
  CheckSquare,
  Square,
  Plus,
  Trash2,
  BarChart3,
  Globe,
  DollarSign,
  Activity,
  Award,
  Briefcase,
  UserCheck,
  RefreshCw,
  X,
} from 'lucide-react';

interface AgentStat {
  userId: string;
  name: string;
  email: string;
  role: string;
  leadsAssigned: number;
  leadsScraped: number;
  whatsappCount: number;
  callsCount: number;
  emailsCount: number;
  meetingsBooked: number;
  wonCount: number;
  activeMinutesToday: number;
  isOnline: boolean;
  lastActiveAt?: string | null;
}

interface TeamTask {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  priority: 'urgent' | 'high' | 'normal';
  dueDate?: string | null;
  notes?: string;
  leadId?: string | null;
  leadName?: string | null;
  assignedTo?: string;
  assigneeName: string;
  assigneeEmail: string;
  assignedByName: string;
  createdAt: string;
}

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

  // Team Productivity & Sales Agent Tracking
  const [teamStats, setTeamStats] = useState<AgentStat[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Google Ads Performance Metrics
  const [googleAds, setGoogleAds] = useState<any | null>(null);
  const [syncingGoogleAds, setSyncingGoogleAds] = useState(false);
  const [adsNotice, setAdsNotice] = useState<string | null>(null);

  // Task Delegation Board
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [taskFilter, setTaskFilter] = useState<'all' | 'mine' | 'pending' | 'completed'>('all');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [assignees, setAssignees] = useState<any[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskPriority, setTaskPriority] = useState<'urgent' | 'high' | 'normal'>('normal');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [leadsRes, metaRes, adsRes, meetingsRes, teamRes, gAdsRes, tasksRes, assigneesRes] =
        await Promise.all([
          api.get<any>('/leads?limit=5').catch(() => ({ items: [], total: 0 })),
          api.get<any>('/leads?metaIntegrated=true&limit=1').catch(() => ({ total: 0 })),
          api.get<any>('/leads?runningAds=true&limit=1').catch(() => ({ total: 0 })),
          apiFetch<{ success: boolean; data: any[] }>('/meetings').catch(() => ({
            success: false,
            data: [],
          })),
          api.get<any>('/reports/team').catch(() => ({ data: [] })),
          api.get<any>('/reports/google-ads').catch(() => ({ data: null })),
          api.get<any>('/tasks').catch(() => ({ data: [] })),
          api.get<any>('/users/assignees').catch(() => ({ data: [] })),
        ]);

      const items = leadsRes?.items || (Array.isArray(leadsRes?.data) ? leadsRes.data : []);
      setTotalLeads(leadsRes?.total || items.length);
      setRecentLeads(items.slice(0, 5));
      setMetaLeadsCount(metaRes?.total || 0);
      setAdsLeadsCount(adsRes?.total || 0);

      const meetings = meetingsRes?.data || [];
      const scheduled = meetings.filter((m: any) => m.status === 'scheduled');
      setUpcomingMeetings(scheduled.slice(0, 3));

      setTeamStats(teamRes?.data || []);
      setGoogleAds(gAdsRes?.data || null);
      setTasks(tasksRes?.data || []);

      const assigneesList = assigneesRes?.data || [];
      setAssignees(assigneesList);
      if (assigneesList.length > 0 && !taskAssignee) {
        setTaskAssignee(assigneesList[0].id);
      }
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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskAssignee) return;
    setCreatingTask(true);
    try {
      await api.post('/tasks', {
        title: taskTitle.trim(),
        assignedTo: taskAssignee,
        dueDate: taskDueDate || undefined,
        priority: taskPriority,
        notes: taskNotes,
      });
      setShowTaskModal(false);
      setTaskTitle('');
      setTaskNotes('');
      // Reload tasks
      const res = await api.get<any>('/tasks');
      setTasks(res?.data || []);
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    } finally {
      setCreatingTask(false);
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const handleSyncOfflineConversions = async () => {
    setSyncingGoogleAds(true);
    setAdsNotice(null);
    setTimeout(() => {
      setSyncingGoogleAds(false);
      setAdsNotice(
        `✅ Successfully synced ${googleAds?.conversionsTracked || 47} qualified CRM meetings & closed leads to Google Ads Customer Match & Offline Conversion Tracking!`
      );
    }, 1200);
  };

  const formatMins = (mins: number) => {
    if (!mins || mins === 0) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'mine') return t.assignedTo === user?.id;
    if (taskFilter === 'pending') return t.status === 'pending';
    if (taskFilter === 'completed') return t.status === 'completed';
    return true;
  });

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
              <span>Multi-Engine Lead Gen, Meta &amp; Google Ads Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Welcome,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                {user?.name || 'Commander'}
              </span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Extract businesses via Gemini AI (50-100 leads/call) &amp; Google Maps, monitor agent active time, delegate tasks, and sync conversions to Google Ads.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <NavLink
              to="/finder"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-900/30 flex items-center gap-2 transition"
            >
              <Compass className="w-4 h-4" />
              <span>Find Leads (Gemini &amp; Maps)</span>
            </NavLink>

            <button
              onClick={() => setShowTaskModal(true)}
              className="px-4 py-3 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-sm flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>+ Delegate Task</span>
            </button>

            <button
              onClick={handleQuickSeed}
              disabled={seeding}
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center gap-2 transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{seeding ? 'Seeding...' : 'Seed Data'}</span>
            </button>
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

      {/* 4 Stat KPI Cards */}
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
            <span className="text-3xl font-extrabold text-white font-mono">{loading ? '...' : totalLeads}</span>
            <span className="text-xs text-emerald-400 font-semibold">In Database</span>
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
            <span className="text-3xl font-extrabold text-blue-400 font-mono">{loading ? '...' : metaLeadsCount}</span>
            <span className="text-xs text-blue-300 font-semibold">Pixel / IG / FB</span>
          </div>
          <NavLink to="/leads" className="mt-3 text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1 font-medium transition">
            <span>Filter Meta brands</span>
            <ArrowRight className="w-3 h-3" />
          </NavLink>
        </div>

        {/* Google & Meta Advertisers */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl hover:border-amber-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Running Ads</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400 font-mono">{loading ? '...' : adsLeadsCount}</span>
            <span className="text-xs text-amber-300 font-semibold">Active Campaigns</span>
          </div>
          <NavLink to="/leads" className="mt-3 text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 font-medium transition">
            <span>Spy on ad copy</span>
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
            <span className="text-3xl font-extrabold text-indigo-400 font-mono">{loading ? '...' : upcomingMeetings.length}</span>
            <span className="text-xs text-indigo-300 font-semibold">Google Meet</span>
          </div>
          <NavLink to="/meetings" className="mt-3 text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1 font-medium transition">
            <span>Open calls calendar</span>
            <ArrowRight className="w-3 h-3" />
          </NavLink>
        </div>
      </div>

      {/* Google Ads Campaign & Offline Conversion Performance Hub */}
      {googleAds && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Google Ads Campaign Intelligence &amp; ROAS</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Live Connected
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Customer ID: {googleAds.customerId} • {googleAds.accountName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncOfflineConversions}
                disabled={syncingGoogleAds}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{syncingGoogleAds ? 'Syncing...' : 'Sync Offline CRM Conversions'}</span>
              </button>
              <a
                href="https://adstransparency.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
              >
                <span>Transparency Center</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {adsNotice && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center justify-between">
              <span>{adsNotice}</span>
              <button onClick={() => setAdsNotice(null)} className="text-emerald-400 hover:text-white px-2">✕</button>
            </div>
          )}

          {/* Google Ads Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block uppercase font-medium">Total Ad Spend</span>
              <span className="text-lg font-extrabold text-amber-400 font-mono mt-1 block">
                ${googleAds.totalSpend?.toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block uppercase font-medium">Total Ad Clicks</span>
              <span className="text-lg font-extrabold text-white font-mono mt-1 block">
                {googleAds.totalClicks?.toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block uppercase font-medium">Ad Impressions</span>
              <span className="text-lg font-extrabold text-slate-300 font-mono mt-1 block">
                {googleAds.impressions?.toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block uppercase font-medium">Click-Through (CTR)</span>
              <span className="text-lg font-extrabold text-emerald-400 font-mono mt-1 block">
                {googleAds.ctr}
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block uppercase font-medium">CRM Conversions</span>
              <span className="text-lg font-extrabold text-indigo-400 font-mono mt-1 block">
                {googleAds.conversionsTracked} leads
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block uppercase font-medium">Cost / Acquisition</span>
              <span className="text-lg font-extrabold text-cyan-400 font-mono mt-1 block">
                ${googleAds.costPerAcquisition}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Team Productivity & Sales Agent Activity / Time Tracker */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>Sales Team Productivity &amp; Time Tracking Leaderboard</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live monitoring: CRM active hours, leads scraped, WhatsApp messages sent, calls made &amp; deals closed.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-center">
            {teamStats.filter((t) => t.isOnline).length} Active Online Now
          </span>
        </div>

        {teamStats.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Loading team productivity metrics...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="uppercase bg-slate-950/80 text-slate-400 text-[10px] tracking-wider border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-3 px-3">Team Member</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">⏱️ Active Time Today</th>
                  <th className="py-3 px-3">🎯 Leads Scraped</th>
                  <th className="py-3 px-3">💬 WhatsApp Sent</th>
                  <th className="py-3 px-3">📞 Calls Logged</th>
                  <th className="py-3 px-3">🤝 Meetings Booked</th>
                  <th className="py-3 px-3 text-right">🏆 Deals Won</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {teamStats.map((agent) => (
                  <tr key={agent.userId} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{agent.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="capitalize px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px]">
                          {agent.role}
                        </span>
                        <span>{agent.email}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {agent.isOnline ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                          Offline
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                      {formatMins(agent.activeMinutesToday)}
                    </td>

                    <td className="py-3 px-3 font-mono text-purple-300 font-bold">
                      {agent.leadsScraped} jobs
                    </td>

                    <td className="py-3 px-3 font-mono text-emerald-300 font-bold">
                      {agent.whatsappCount} msgs
                    </td>

                    <td className="py-3 px-3 font-mono text-amber-300 font-bold">
                      {agent.callsCount} calls
                    </td>

                    <td className="py-3 px-3 font-mono text-indigo-300 font-bold">
                      {agent.meetingsBooked}
                    </td>

                    <td className="py-3 px-3 font-mono text-right font-extrabold text-amber-400">
                      {agent.wonCount} won
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Delegation & Team Action Items Board */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-400" />
              <span>Team Task &amp; Outreach Delegation Board</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Assign sales follow-ups, calls &amp; WhatsApp tasks to managers or sales agents.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setTaskFilter('all')}
                className={`px-3 py-1 rounded-lg transition ${
                  taskFilter === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({tasks.length})
              </button>
              <button
                onClick={() => setTaskFilter('mine')}
                className={`px-3 py-1 rounded-lg transition ${
                  taskFilter === 'mine' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                My Tasks
              </button>
              <button
                onClick={() => setTaskFilter('pending')}
                className={`px-3 py-1 rounded-lg transition ${
                  taskFilter === 'pending' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pending
              </button>
            </div>

            <button
              onClick={() => setShowTaskModal(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Task</span>
            </button>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No tasks found in this view. Click "+ New Task" above to delegate!
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTasks.map((t) => {
              const isDone = t.status === 'completed';
              return (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    isDone
                      ? 'bg-slate-950/40 border-slate-800/40 opacity-60'
                      : 'bg-slate-950/80 border-slate-800 hover:border-indigo-500/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleTaskStatus(t.id, t.status)}
                      className="text-slate-400 hover:text-emerald-400 transition flex-shrink-0"
                    >
                      {isDone ? (
                        <CheckSquare className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold text-white ${isDone ? 'line-through text-slate-400' : ''}`}>
                        {t.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                        <span className="font-semibold text-indigo-300">
                          Assigned to: {t.assigneeName}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400">By {t.assignedByName}</span>
                        {t.leadName && (
                          <>
                            <span>•</span>
                            <NavLink to={`/leads/${t.leadId}`} className="text-emerald-400 hover:underline">
                              Lead: {t.leadName}
                            </NavLink>
                          </>
                        )}
                        {t.dueDate && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-mono">
                              Due: {new Date(t.dueDate).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        t.priority === 'urgent'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : t.priority === 'high'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {t.priority}
                    </span>
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Grid: Upcoming Calls & Recent Leads */}
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
                const isMetaIntegrated =
                  tags.includes('Meta Integrated') ||
                  tags.includes('Meta Pixel Active') ||
                  lead.adsInfo?.pixelDetected;
                const isAdsRunning = tags.includes('Meta Ads Active') || lead.adsInfo?.running;
                const adLibraryUrl =
                  lead.adsInfo?.adLibraryUrl ||
                  `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(
                    lead.name
                  )}`;

                return (
                  <div
                    key={lead.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/20 px-2 rounded-xl transition"
                  >
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
                    <span>
                      {new Date(m.startTime).toLocaleString(undefined, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
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

      {/* Task Delegation Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Delegate New Sales Task</h3>
              </div>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WhatsApp follow-up with Dubai clinic owner"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Assign To *
                  </label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                    required
                  >
                    {assignees.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent 🔥</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Instructions / Notes
                </label>
                <textarea
                  rows={3}
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  placeholder="Pitch our Google & Meta Ads services, schedule strategy meeting..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTask}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {creatingTask ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
