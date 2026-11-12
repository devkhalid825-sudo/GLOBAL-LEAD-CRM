import React, { useEffect, useState } from 'react';
import { api, getAccessToken } from '../api/client.js';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  Users,
  Download,
  Filter,
  Phone,
  MessageCircle,
  ExternalLink,
  Search,
  ChevronRight,
  ShieldAlert,
  Globe,
  Radio,
  Sparkles,
  Calendar,
  FileText,
  CheckCircle2,
  Zap,
  Target,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { AdPreviewModal } from '../components/leads/AdPreviewModal.js';

export const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [metaFilter, setMetaFilter] = useState<'all' | 'meta' | 'ads' | 'nopixel'>('all');
  const [page, setPage] = useState(1);

  // Action statuses
  const [enriching, setEnriching] = useState(false);
  const [scanningMeta, setScanningMeta] = useState(false);
  const [seedingTestData, setSeedingTestData] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ msg: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Live In-App Ad Inspector State
  const [previewAdLead, setPreviewAdLead] = useState<any | null>(null);

  const handleSeedTestData = async () => {
    try {
      setSeedingTestData(true);
      setActionNotice({ msg: 'Generating realistic test leads with Meta integration, meetings & proposals...', type: 'info' });
      const res = await api.post<any>('/leads/seed-test-data', {});
      setActionNotice({
        msg: `Successfully created ${res.leadsCount} test leads with ${res.meetingsCount} scheduled Google Meet calls and ${res.proposalsCount} proposals!`,
        type: 'success',
      });
      fetchLeads();
    } catch (err: any) {
      setActionNotice({ msg: `Failed to seed test data: ${err.message}`, type: 'error' });
    } finally {
      setSeedingTestData(false);
    }
  };

  const handleScanMetaAll = async () => {
    try {
      setScanningMeta(true);
      setActionNotice({ msg: 'Scanning websites for Meta Pixel, Facebook & Instagram links, and active Ads...', type: 'info' });
      const res = await api.post<any>('/leads/scan-meta-all', { limit: 50 });
      setActionNotice({
        msg: `Meta Intelligence Scan Finished: Checked ${res.scanned} websites, found ${res.metaIntegrated} Meta Integrated brands.`,
        type: 'success',
      });
      fetchLeads();
    } catch (err: any) {
      setActionNotice({ msg: `Scan failed: ${err.message}`, type: 'error' });
    } finally {
      setScanningMeta(false);
    }
  };

  const handleEnrichAll = async () => {
    try {
      setEnriching(true);
      setActionNotice({ msg: 'Scraping websites for public contact emails...', type: 'info' });
      const res = await api.post<any>('/leads/enrich-all', {});
      setActionNotice({
        msg: `Finished: Scanned ${res.scanned} leads, enriched ${res.enriched} with new verified emails.`,
        type: 'success',
      });
      fetchLeads();
    } catch (err: any) {
      setActionNotice({ msg: `Enrichment failed: ${err.message}`, type: 'error' });
    } finally {
      setEnriching(false);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      let query = `/leads?page=${page}&limit=50`;
      if (statusFilter !== 'all') query += `&status=${statusFilter}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;

      if (metaFilter === 'meta') {
        query += '&metaIntegrated=true';
      } else if (metaFilter === 'ads') {
        query += '&runningAds=true';
      } else if (metaFilter === 'nopixel') {
        query += '&tag=Missing Meta Pixel';
      }

      const res = await api.get<any>(query);
      const items = res?.items || (Array.isArray(res?.data) ? res.data : []);
      const totalCount = res?.total || items.length;
      setLeads(items);
      setTotal(totalCount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, statusFilter, metaFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      await api.patch(`/leads/${leadId}`, { status: newStatus });
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportExcel = () => {
    let url = '/api/leads/export.xlsx';
    const params = [];
    if (statusFilter !== 'all') params.push(`status=${statusFilter}`);
    if (metaFilter === 'meta') params.push('metaIntegrated=true');
    if (metaFilter === 'ads') params.push('runningAds=true');
    if (params.length > 0) url += `?${params.join('&')}`;

    const token = getAccessToken();
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `leads_meta_export_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Editorial Luxury Header matching Figma */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-[#262626]">
        <div>
          <h1 className="serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Leads database.
          </h1>
          <p className="text-sm text-neutral-400 mt-2 font-sans">
            <span className="mono text-white font-semibold">{total.toLocaleString()}</span> businesses, filtered to what matters today.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Quick Seed Button */}
          <button
            onClick={handleSeedTestData}
            disabled={seedingTestData}
            className="btn-solid flex items-center gap-2 text-xs"
            title="Seed high-quality test leads with Google Meet meetings and proposals"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{seedingTestData ? 'Generating...' : 'Seed Test Leads'}</span>
          </button>

          {/* Scan Meta & Ads */}
          <button
            onClick={handleScanMetaAll}
            disabled={scanningMeta}
            className="btn-ghost flex items-center gap-1.5 text-xs text-neutral-300"
            title="Scan websites for Meta Pixel, Facebook, Instagram & Ads"
          >
            <Radio className={`w-3.5 h-3.5 ${scanningMeta ? 'animate-pulse' : ''}`} />
            <span>{scanningMeta ? 'Scanning Meta...' : 'Scan Meta & Ads'}</span>
          </button>

          {/* Export */}
          <button
            onClick={handleExportExcel}
            className="btn-ghost flex items-center gap-1.5 text-xs text-neutral-300"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border shadow-lg ${
            actionNotice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : actionNotice.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{actionNotice.msg}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="px-2 text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
        {/* Meta & Ads Quick Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          <span className="text-slate-400 flex items-center gap-1.5 mr-1 flex-shrink-0">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            Category Filter:
          </span>
          <button
            onClick={() => {
              setMetaFilter('all');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition flex-shrink-0 ${
              metaFilter === 'all'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Leads ({total})
          </button>

          <button
            onClick={() => {
              setMetaFilter('meta');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 flex-shrink-0 ${
              metaFilter === 'meta'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Meta Integrated Brands</span>
          </button>

          <button
            onClick={() => {
              setMetaFilter('ads');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 flex-shrink-0 ${
              metaFilter === 'ads'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Active Meta Ads (FB/IG)</span>
          </button>

          <button
            onClick={() => {
              setMetaFilter('nopixel');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 flex-shrink-0 ${
              metaFilter === 'nopixel'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Missing Meta Pixel (Pitch Angle)</span>
          </button>
        </div>

        {/* Search & Pipeline status */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-0 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search leads by business name, city, website, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </form>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="all">Pipeline: All Stages</option>
              <option value="new">New Lead</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="meeting">Meeting Scheduled</option>
              <option value="proposal">Proposal Sent</option>
              <option value="won">Won / Closed</option>
              <option value="lost">Lost</option>
            </select>

            <button
              onClick={fetchLeads}
              className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs text-slate-400">
          <span>Found <strong className="text-white">{total}</strong> Business Leads</span>
          <span>Showing Page {page}</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 flex justify-center items-center">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3" />
            Loading leads directory...
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <p>No leads found matching your criteria.</p>
            <button
              onClick={handleSeedTestData}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-lg shadow-emerald-900/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Test Leads &amp; Meetings Now</span>
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< md) */}
            <div className="block md:hidden space-y-3 mt-4">
              {leads.map((lead) => {
                const phone = lead.phoneNorm || (lead.phones && lead.phones[0]);
                const cleanPhone = phone ? phone.replace(/[^\d]/g, '') : null;
                const waLink = cleanPhone
                  ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                      `Hi ${lead.name}, I noticed your business in ${lead.city} and would love to connect.`
                    )}`
                  : null;
                const tags = Array.isArray(lead.tags) ? (lead.tags as string[]) : [];
                const isMetaIntegrated = tags.includes('Meta Integrated') || tags.includes('Meta Pixel Active') || lead.adsInfo?.pixelDetected;
                const isAdsRunning = tags.includes('Meta Ads Active') || lead.adsInfo?.running;
                const adLibraryUrl = lead.adsInfo?.adLibraryUrl || `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(lead.name)}`;

                return (
                  <div
                    key={lead.id}
                    className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white text-sm truncate">{lead.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          📍 {lead.city}, {lead.country}
                        </div>
                        {lead.categoryName && (
                          <span className="text-[10px] text-emerald-400 font-mono block mt-0.5 truncate">
                            {lead.categoryName}
                          </span>
                        )}
                      </div>
                      <select
                        value={lead.status}
                        onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white font-medium focus:outline-none flex-shrink-0"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="interested">Interested</option>
                        <option value="meeting">Meeting</option>
                        <option value="proposal">Proposal</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                      </select>
                    </div>

                    {/* Meta Intelligence Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
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
                          title="View Live Ads in Meta Ad Library"
                        >
                          <Target className="w-2.5 h-2.5 text-amber-400" />
                          Meta Ads Active ↗
                        </a>
                      )}
                      <button
                        onClick={() => setPreviewAdLead(lead)}
                        className="px-2 py-0.5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 text-blue-300 rounded text-[10px] font-semibold flex items-center gap-1 transition"
                        title="Live simulated ad mockups (Instagram, Facebook & Google Search)"
                      >
                        <Eye className="w-2.5 h-2.5 text-blue-400" />
                        <span>Live Ad Preview</span>
                      </button>
                      {lead.status === 'meeting' && (
                        <NavLink
                          to="/meetings"
                          className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-semibold flex items-center gap-1"
                        >
                          <Calendar className="w-2.5 h-2.5" />
                          Meeting
                        </NavLink>
                      )}
                    </div>

                    {lead.website ? (
                      <a
                        href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px] truncate"
                      >
                        <span>{lead.websiteNorm || lead.website}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    ) : (
                      <span className="text-slate-500 text-[11px] block">No website listed</span>
                    )}

                    {Array.isArray(lead.emails) && lead.emails.length > 0 && (
                      <div className="text-purple-300 font-mono text-[11px] truncate">
                        ✉️ {lead.emails[0]}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-900 flex-wrap">
                      {phone ? (
                        <>
                          <a
                            href={`tel:${phone}`}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 text-[11px] font-mono transition"
                          >
                            <Phone className="w-3 h-3 text-emerald-400" />
                            <span>Call</span>
                          </a>
                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                api.post(`/leads/${lead.id}/timeline`, {
                                  type: 'whatsapp',
                                  payload: { message: `Initiated WhatsApp outreach with ${phone}` },
                                }).catch(() => {});
                              }}
                              className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center gap-1 text-[11px] transition border border-emerald-500/20"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-600 text-[11px]">No phone</span>
                      )}

                      <button
                        onClick={() => navigate(`/leads/${lead.id}`)}
                        className="ml-auto px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition"
                      >
                        <span>Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto mt-4">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-800/40 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Business &amp; Category</th>
                    <th className="py-3 px-4">Meta &amp; Ads Intelligence</th>
                    <th className="py-3 px-4">Quick Outreach</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Pipeline Stage</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {leads.map((lead) => {
                    const phone = lead.phoneNorm || (lead.phones && lead.phones[0]);
                    const cleanPhone = phone ? phone.replace(/[^\d]/g, '') : null;
                    const waLink = cleanPhone
                      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                          `Hi ${lead.name}, I noticed your business in ${lead.city} and would love to connect regarding web systems and scaling.`
                        )}`
                      : null;
                    const tags = Array.isArray(lead.tags) ? (lead.tags as string[]) : [];
                    const isMetaIntegrated = tags.includes('Meta Integrated') || tags.includes('Meta Pixel Active') || lead.adsInfo?.pixelDetected;
                    const isAdsRunning = tags.includes('Meta Ads Active') || lead.adsInfo?.running;
                    const isMissingPixel = tags.includes('Missing Meta Pixel');
                    const adLibraryUrl = lead.adsInfo?.adLibraryUrl || `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(lead.name)}`;

                    return (
                      <tr key={lead.id} className="hover:bg-slate-800/30 transition text-xs">
                        {/* Name, Category & Website */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-white text-sm">{lead.name}</div>
                          {lead.categoryName && (
                            <span className="text-[11px] text-emerald-400 font-mono block mt-0.5 truncate max-w-xs">
                              {lead.categoryName}
                            </span>
                          )}
                          {lead.website ? (
                            <a
                              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-emerald-400 hover:underline flex items-center gap-1 text-[11px] mt-0.5 truncate max-w-xs"
                            >
                              <span>{lead.websiteNorm || lead.website}</span>
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                          ) : (
                            <span className="text-slate-500 text-[11px]">No website</span>
                          )}
                          {Array.isArray(lead.emails) && lead.emails.length > 0 ? (
                            <span className="text-purple-300 font-mono text-[11px] block mt-0.5 truncate max-w-xs">
                              ✉️ {lead.emails[0]}
                            </span>
                          ) : null}
                        </td>

                        {/* Meta & Ads Status */}
                        <td className="py-3 px-4">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap gap-1.5">
                              {isMetaIntegrated ? (
                                <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded text-[10px] font-semibold flex items-center gap-1">
                                  <Radio className="w-2.5 h-2.5 text-blue-400" />
                                  Meta Integrated
                                </span>
                              ) : null}

                              {isAdsRunning ? (
                                <a
                                  href={adLibraryUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 rounded text-[10px] font-semibold flex items-center gap-1 transition"
                                  title="Open Meta Ad Library"
                                >
                                  <Target className="w-2.5 h-2.5 text-amber-400" />
                                  Meta Ads Active ↗
                                </a>
                              ) : isMissingPixel ? (
                                <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded text-[10px] font-semibold">
                                  Missing Pixel (Pitch)
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[10px]">Standard Lead</span>
                              )}

                              <button
                                onClick={() => setPreviewAdLead(lead)}
                                className="px-2 py-0.5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 text-blue-300 rounded text-[10px] font-semibold flex items-center gap-1 transition shadow"
                                title="Inspect simulated live Instagram, Facebook & Google Search ad mockups"
                              >
                                <Eye className="w-2.5 h-2.5 text-blue-400" />
                                <span>Preview Ads</span>
                              </button>
                            </div>

                            {lead.status === 'meeting' && (
                              <NavLink
                                to="/meetings"
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-semibold hover:bg-indigo-500/30 transition"
                              >
                                <Calendar className="w-2.5 h-2.5" />
                                <span>Meeting Booked</span>
                              </NavLink>
                            )}
                          </div>
                        </td>

                        {/* Quick Communications */}
                        <td className="py-3 px-4">
                          {phone ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={`tel:${phone}`}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 font-mono text-[11px] transition"
                                title="Click to dial phone"
                              >
                                <Phone className="w-3 h-3 text-emerald-400" />
                                <span>{phone}</span>
                              </a>

                              {waLink && (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => {
                                    api.post(`/leads/${lead.id}/timeline`, {
                                      type: 'whatsapp',
                                      payload: { message: `Initiated WhatsApp outreach with ${phone}` },
                                    }).catch(() => {});
                                  }}
                                  className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center gap-1.5 font-medium text-[11px] transition border border-emerald-500/20"
                                  title="Open WhatsApp chat"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">No phone number</span>
                          )}
                        </td>

                        {/* Location */}
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-200">{lead.city}</span>
                          <span className="text-slate-400 block text-[11px]">{lead.country}</span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <select
                            value={lead.status}
                            onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-medium focus:outline-none focus:border-emerald-500"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="interested">Interested</option>
                            <option value="meeting">Meeting</option>
                            <option value="proposal">Proposal</option>
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                          </select>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => navigate(`/leads/${lead.id}`)}
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                            title="Open Lead Intelligence Dossier"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {total > 50 && (
          <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-40"
            >
              Previous Page
            </button>
            <span className="text-slate-400">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={leads.length < 50}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-40"
            >
              Next Page
            </button>
          </div>
        )}
      </div>

      {/* In-App Live Ad Inspector Modal */}
      {previewAdLead && (
        <AdPreviewModal
          lead={previewAdLead}
          onClose={() => setPreviewAdLead(null)}
        />
      )}
    </div>
  );
};
