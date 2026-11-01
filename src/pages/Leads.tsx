import React, { useEffect, useState } from 'react';
import { api, getAccessToken } from '../api/client.js';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';

export const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Email enrichment state
  const [enriching, setEnriching] = useState(false);
  const [enrichStatus, setEnrichStatus] = useState<string | null>(null);

  const handleEnrichAll = async () => {
    try {
      setEnriching(true);
      setEnrichStatus('Scraping websites for public emails...');
      const res = await api.post<any>('/leads/enrich-all', {});
      setEnrichStatus(`Finished: Scanned ${res.scanned} leads, enriched ${res.enriched} with new emails.`);
      fetchLeads();
    } catch (err: any) {
      setEnrichStatus(`Failed: ${err.message}`);
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

      const res = await api.get<any>(query);
      setLeads(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, statusFilter]);

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
    if (statusFilter !== 'all') url += `?status=${statusFilter}`;
    // Trigger direct download with auth
    const token = getAccessToken();
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `leads_export_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
            Leads Directory & Outreach
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Global verified leads with instant WhatsApp, direct calling, and Excel export
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={handleEnrichAll}
            disabled={enriching}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-semibold px-3.5 py-2 rounded-xl text-xs sm:text-sm transition disabled:opacity-50"
            title="Scan websites of leads to find and update public email addresses"
          >
            <Globe className="w-4 h-4 text-purple-400" />
            <span>{enriching ? 'Finding...' : 'Find Emails'}</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3.5 py-2 rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-900/20 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export (.xlsx)</span>
          </button>
        </div>
      </div>

      {enrichStatus && (
        <div className="bg-slate-900 border border-purple-500/30 px-4 py-3 rounded-xl text-xs text-purple-200 flex items-center justify-between shadow-lg">
          <span>{enrichStatus}</span>
          <button onClick={() => setEnrichStatus(null)} className="text-slate-400 hover:text-white px-2">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-0 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads by business name, address, or website..."
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
            className="w-full sm:w-auto bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
          >
            <option value="all">Status: All Leads</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="interested">Interested</option>
            <option value="meeting">Meeting Scheduled</option>
            <option value="proposal">Proposal Sent</option>
            <option value="won">Won / Closed</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs text-slate-400">
          <span>Found {total} Total Business Leads</span>
          <span>Showing Page {page}</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 flex justify-center items-center">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3" />
            Loading leads directory...
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            No leads found matching your criteria. Use Lead Finder to scrape businesses!
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
                    <th className="py-3 px-4">Business</th>
                    <th className="py-3 px-4">Quick Comms (Phone & WhatsApp)</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Tags</th>
                    <th className="py-3 px-4">Pipeline Status</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {leads.map((lead) => {
                    const phone = lead.phoneNorm || (lead.phones && lead.phones[0]);
                    const cleanPhone = phone ? phone.replace(/[^\d]/g, '') : null;
                    const waLink = cleanPhone
                      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                          `Hi ${lead.name}, I noticed your business in ${lead.city} and would love to connect.`
                        )}`
                      : null;

                    return (
                      <tr key={lead.id} className="hover:bg-slate-800/30 transition text-xs">
                        {/* Name & Website */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-white text-sm">{lead.name}</div>
                          {lead.website ? (
                            <a
                              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px] mt-0.5 truncate max-w-xs"
                            >
                              <span>{lead.websiteNorm || lead.website}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-500 text-[11px]">No website listed</span>
                          )}
                          {Array.isArray(lead.emails) && lead.emails.length > 0 ? (
                            <span className="text-purple-300 font-mono text-[11px] block mt-1 truncate max-w-xs">
                              ✉️ {lead.emails[0]}
                            </span>
                          ) : null}
                        </td>

                        {/* Communications */}
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

                        {/* Tags */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(lead.tags) && lead.tags.length > 0 ? (
                              lead.tags.map((t: string, idx: number) => (
                                <span
                                  key={idx}
                                  className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                    t === 'Running Ads'
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {t}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </div>
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
                            title="Open Lead Timeline & Details"
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
    </div>
  );
};
