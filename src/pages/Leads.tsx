import React, { useEffect, useState } from 'react';
import { api, getAccessToken } from '../api/client.js';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  Phone,
  MessageCircle,
  ExternalLink,
  Search,
  Radio,
  Sparkles,
  CheckCircle2,
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
        msg: `Successfully created ${res.leadsCount} test leads with ${res.meetingsCount} scheduled Google Meet calls!`,
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-[#E5E5E5]">
        <div>
          <h1 className="serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-black leading-tight">
            Leads database.
          </h1>
          <p className="text-sm text-[#525252] mt-2 font-sans">
            <span className="mono text-black font-semibold">{total.toLocaleString()}</span> businesses, filtered to what matters today.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={handleSeedTestData}
            disabled={seedingTestData}
            className="btn-solid flex items-center gap-2 text-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{seedingTestData ? 'Generating...' : 'Seed Test Leads'}</span>
          </button>

          <button
            onClick={handleScanMetaAll}
            disabled={scanningMeta}
            className="btn-ghost flex items-center gap-1.5 text-xs"
          >
            <Radio className={`w-3.5 h-3.5 ${scanningMeta ? 'animate-pulse' : ''}`} />
            <span>{scanningMeta ? 'Scanning Meta...' : 'Scan Meta & Ads'}</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="btn-ghost flex items-center gap-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export (.xlsx)</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 bg-[#F8F8F8] border border-[#E5E5E5] rounded-2xl text-black text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-black flex-shrink-0" />
            <span>{actionNotice.msg}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-[#737373] hover:text-black">✕</button>
        </div>
      )}

      {/* Filter and Search Bar matching Figma pills */}
      <div className="card-luxury p-4 space-y-4">
        {/* Quick Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => {
              setMetaFilter('all');
              setPage(1);
            }}
            className={`pill-luxury ${metaFilter === 'all' ? 'on' : ''}`}
          >
            All Leads ({total})
          </button>

          <button
            onClick={() => {
              setMetaFilter('meta');
              setPage(1);
            }}
            className={`pill-luxury ${metaFilter === 'meta' ? 'on' : ''}`}
          >
            Meta Pixel active
          </button>

          <button
            onClick={() => {
              setMetaFilter('ads');
              setPage(1);
            }}
            className={`pill-luxury ${metaFilter === 'ads' ? 'on' : ''}`}
          >
            Ads running
          </button>

          <button
            onClick={() => {
              setMetaFilter('nopixel');
              setPage(1);
            }}
            className={`pill-luxury ${metaFilter === 'nopixel' ? 'on' : ''}`}
          >
            Missing Meta Pixel (Pitch Angle)
          </button>
        </div>

        {/* Search & Pipeline Stage */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#E5E5E5]">
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-0 relative">
            <Search className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search leads by business name, city, website, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl pl-9 pr-4 py-2 text-xs text-black placeholder-[#737373] focus:outline-none focus:border-black"
            />
          </form>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:border-black font-medium"
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
              className="btn-ghost p-2"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>
      </div>

      {/* Leads Table matching Figma HTML */}
      <div className="card-luxury p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5] text-xs text-[#525252]">
          <span>Found <strong className="text-black">{total}</strong> businesses</span>
          <span className="mono">Page {page}</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[#737373] text-xs">
            Loading leads database...
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center text-[#737373] space-y-3 text-xs">
            <p>No leads found matching your criteria.</p>
            <button
              onClick={handleSeedTestData}
              className="btn-solid text-xs inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Test Leads &amp; Meetings Now</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-black border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-[#E5E5E5] text-[#737373] text-[11px]">
                  <th className="py-2.5 px-3 font-medium">Business</th>
                  <th className="py-2.5 px-3 font-medium">Category</th>
                  <th className="py-2.5 px-3 font-medium">Location</th>
                  <th className="py-2.5 px-3 font-medium">Rating</th>
                  <th className="py-2.5 px-3 font-medium">Phone</th>
                  <th className="py-2.5 px-3 font-medium">WhatsApp</th>
                  <th className="py-2.5 px-3 font-medium">Pixel</th>
                  <th className="py-2.5 px-3 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
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
                  const adLibraryUrl = lead.adsInfo?.adLibraryUrl || `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(lead.name)}`;

                  return (
                    <tr key={lead.id} className="hover:bg-[#F0F0F0] transition">
                      {/* Business */}
                      <td className="py-3 px-3">
                        <div className="serif font-semibold text-black text-sm">{lead.name}</div>
                        {lead.website && (
                          <a
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#737373] hover:text-black flex items-center gap-1 text-[11px] mt-0.5"
                          >
                            <span>{lead.websiteNorm || lead.website}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="pill-luxury text-[11px]">
                          {lead.categoryName?.split('(')[0]?.trim() || 'General Business'}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-3 text-[#525252]">
                        {lead.city}, {lead.country}
                      </td>

                      {/* Rating */}
                      <td className="py-3 px-3 mono text-black font-medium">
                        {lead.rating ? `${lead.rating} ★` : '4.7'}
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-3 mono text-[#525252]">
                        {phone || '—'}
                      </td>

                      {/* WhatsApp */}
                      <td className="py-3 px-3">
                        {waLink ? (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="pill-luxury on text-[11px] inline-flex items-center gap-1"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        ) : (
                          <span className="text-[#737373] text-[11px]">—</span>
                        )}
                      </td>

                      {/* Meta Pixel */}
                      <td className="py-3 px-3">
                        <span className={`pill-luxury text-[11px] ${isMetaIntegrated ? 'on' : ''}`}>
                          {isMetaIntegrated ? 'Active' : 'Missing'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewAdLead(lead)}
                            className="btn-solid text-xs py-1 px-3 flex items-center gap-1"
                            title="Inspect live Ad creative mockup"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ad Pitch</span>
                          </button>
                          <button
                            onClick={() => navigate(`/leads/${lead.id}`)}
                            className="btn-ghost text-xs py-1 px-2.5"
                          >
                            Open
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Live In-App Ad Inspector Modal */}
      {previewAdLead && (
        <AdPreviewModal
          lead={previewAdLead}
          onClose={() => setPreviewAdLead(null)}
        />
      )}
    </div>
  );
};
