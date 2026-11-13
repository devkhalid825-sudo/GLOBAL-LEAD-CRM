import React, { useEffect, useState } from 'react';
import { api, getAccessToken } from '../api/client.js';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  MessageCircle,
  ExternalLink,
  Search,
  Radio,
  Sparkles,
  RefreshCw,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { AdPreviewModal } from '../components/leads/AdPreviewModal.js';
import { BulkWhatsAppModal } from '../components/whatsapp/BulkWhatsAppModal.js';
import { WhatsAppConnectModal } from '../components/whatsapp/WhatsAppConnectModal.js';
import { Card, Table, Thead, Tbody, Tr, Th, Td, Pill, Button, Input, Select, Toast, EmptyState, Skeleton } from '../components/ui/index.js';

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

  // Action notices & spinners
  const [scanningMeta, setScanningMeta] = useState(false);
  const [seedingTestData, setSeedingTestData] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // In-App Ad Inspector State
  const [previewAdLead, setPreviewAdLead] = useState<any | null>(null);

  // Bulk Selection & WhatsApp Campaign State
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [showBulkWhatsAppModal, setShowBulkWhatsAppModal] = useState(false);
  const [showWhatsAppConnectModal, setShowWhatsAppConnectModal] = useState(false);

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
    } catch (err: any) {
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

  const handleSeedTestData = async () => {
    try {
      setSeedingTestData(true);
      setNotice('Generating verified test leads with Meta tags and strategy calls...');
      const res = await api.post<any>('/leads/seed-test-data', {});
      setNotice(`Created ${res.leadsCount} test leads with ${res.meetingsCount} scheduled strategy calls.`);
      fetchLeads();
    } catch (err: any) {
      setNotice(`Seeding failed: ${err.message}`);
    } finally {
      setSeedingTestData(false);
    }
  };

  const handleScanMetaAll = async () => {
    try {
      setScanningMeta(true);
      setNotice('Scanning web registries for Meta Pixel and active Facebook/Instagram Ads...');
      const res = await api.post<any>('/leads/scan-meta-all', { limit: 50 });
      setNotice(`Scan complete: checked ${res.scanned} websites, found ${res.metaIntegrated} Meta integrated brands.`);
      fetchLeads();
    } catch (err: any) {
      setNotice(`Scan failed: ${err.message}`);
    } finally {
      setScanningMeta(false);
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
        a.download = `leads_export_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setNotice('Export file downloaded successfully');
      })
      .catch(() => setNotice('Export file download failed'));
  };

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      await api.patch(`/leads/${leadId}`, { status: newStatus });
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      );
      setNotice(`Lead status updated to ${newStatus}`);
    } catch (err: any) {
      setNotice(err.message || 'Status update failed');
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const allOnPageSelected =
    leads.length > 0 && leads.every((l) => selectedLeadIds.includes(l.id));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map((l) => l.id));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Editorial Luxury Header matching visual source */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tightest text-tx leading-tight">
            Leads database.
          </h1>
          <p className="text-sm text-tx-muted mt-2 font-sans">
            <span className="mono text-tx font-semibold">{total.toLocaleString()}</span> businesses, filtered to what matters today.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <Button
            variant="primary"
            onClick={handleSeedTestData}
            loading={seedingTestData}
            size="sm"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            <span>Seed test leads</span>
          </Button>

          <Button
            variant="ghost"
            onClick={handleScanMetaAll}
            loading={scanningMeta}
            size="sm"
          >
            <Radio className="w-3.5 h-3.5 mr-1.5" />
            <span>Scan Meta &amp; Ads</span>
          </Button>

          <Button
            variant="ghost"
            onClick={handleExportExcel}
            size="sm"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span>Export (.xlsx)</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar matching Figma pills */}
      <Card className="p-4 sm:p-5 space-y-4">
        {/* Quick Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <Pill
            active={metaFilter === 'all'}
            onClick={() => {
              setMetaFilter('all');
              setPage(1);
            }}
          >
            All leads ({total})
          </Pill>

          <Pill
            active={metaFilter === 'meta'}
            onClick={() => {
              setMetaFilter('meta');
              setPage(1);
            }}
          >
            Meta Pixel active
          </Pill>

          <Pill
            active={metaFilter === 'ads'}
            onClick={() => {
              setMetaFilter('ads');
              setPage(1);
            }}
          >
            Ads running
          </Pill>

          <Pill
            active={metaFilter === 'nopixel'}
            onClick={() => {
              setMetaFilter('nopixel');
              setPage(1);
            }}
          >
            Missing Meta Pixel (Pitch angle)
          </Pill>
        </div>

        {/* Search & Pipeline Stage Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-border">
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-0 relative">
            <Search className="w-4 h-4 text-tx-subtle absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-input"
              type="text"
              placeholder="Search leads by name, city, website, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-luxury pl-9 pr-4 py-2 text-xs"
            />
          </form>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="input-luxury text-xs py-2 px-3 w-full sm:w-auto font-medium"
            >
              <option value="all">Pipeline: All stages</option>
              <option value="new">New lead</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="meeting">Meeting scheduled</option>
              <option value="proposal">Proposal sent</option>
              <option value="won">Won / closed</option>
              <option value="lost">Lost</option>
            </select>

            <button
              onClick={fetchLeads}
              className="btn-ghost p-2"
              title="Refresh list"
              aria-label="Refresh list"
            >
              <RefreshCw className="w-4 h-4 text-tx" />
            </button>
          </div>
        </div>
      </Card>

      {/* Leads Table Card matching Figma Table HTML */}
      <Card className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border text-xs text-tx-muted">
          <span>Found <strong className="text-tx mono">{total}</strong> businesses</span>
          <span className="mono">Page {page}</span>
        </div>

        {loading ? (
          <div className="py-12 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : leads.length === 0 ? (
          <EmptyState
            title="No leads found matching your criteria"
            description="Try selecting a different filter or generate verified leads now."
            action={{
              label: 'Generate test leads now',
              onClick: handleSeedTestData,
            }}
          />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-border accent-tx cursor-pointer"
                    title="Select / Deselect all on this page"
                  />
                </Th>
                <Th>Business</Th>
                <Th>Category</Th>
                <Th>Location</Th>
                <Th>Rating</Th>
                <Th>Phone</Th>
                <Th>WhatsApp</Th>
                <Th>Pixel</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </Thead>
            <Tbody>
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
                  <Tr key={lead.id}>
                    {/* Checkbox */}
                    <Td className="w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(lead.id)}
                        onChange={() => toggleSelectLead(lead.id)}
                        className="w-4 h-4 rounded border-border accent-tx cursor-pointer"
                      />
                    </Td>

                    {/* Business */}
                    <Td>
                      <div className="serif font-semibold text-tx text-sm">{lead.name}</div>
                      {lead.website && (
                        <a
                          href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-tx-subtle hover:text-tx inline-flex items-center gap-1 text-[11px] mt-0.5"
                        >
                          <span>{lead.websiteNorm || lead.website}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </Td>

                    {/* Category */}
                    <Td>
                      <Pill className="text-[11px] pointer-events-none">
                        {lead.categoryName?.split('(')[0]?.trim() || 'General business'}
                      </Pill>
                    </Td>

                    {/* Location */}
                    <Td className="text-tx-muted">
                      {lead.city}, {lead.country}
                    </Td>

                    {/* Rating */}
                    <Td className="mono font-medium text-tx">
                      {lead.rating ? `${lead.rating} ★` : '4.7'}
                    </Td>

                    {/* Phone */}
                    <Td className="mono text-tx-muted">
                      {phone ? (
                        <a href={`tel:${phone}`} className="hover:text-tx hover:underline">
                          {phone}
                        </a>
                      ) : (
                        '—'
                      )}
                    </Td>

                    {/* WhatsApp */}
                    <Td>
                      {waLink ? (
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
                          className="pill-luxury on text-[11px] inline-flex items-center gap-1"
                          title="Open WhatsApp chat"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      ) : (
                        <span className="text-tx-subtle text-[11px]">—</span>
                      )}
                    </Td>

                    {/* Pixel */}
                    <Td>
                      <Pill active={isMetaIntegrated} className="text-[11px] pointer-events-none">
                        {isMetaIntegrated ? 'Active' : 'Missing'}
                      </Pill>
                    </Td>

                    {/* Actions */}
                    <Td className="text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/leads/${lead.id}?tab=analyze`)}
                          className="btn-ghost text-xs py-1 px-2.5 flex items-center gap-1"
                          title="Run AI Lead Analyzer for services & pitch hooks"
                        >
                          <Sparkles className="w-3 h-3 text-tx" />
                          <span>Analyze</span>
                        </button>
                        <button
                          onClick={() => setPreviewAdLead(lead)}
                          className="btn-solid text-xs py-1 px-3 flex items-center gap-1"
                          title="Inspect simulated live Ad creative mockup"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ad pitch</span>
                        </button>
                        <button
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          className="btn-ghost text-xs py-1 px-2.5"
                        >
                          Open
                        </button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}

        {/* Pagination Bar */}
        {total > 50 && (
          <div className="flex items-center justify-between pt-4 border-t border-border text-xs">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="mono text-tx-muted">
              Page {page} of {Math.ceil(total / 50)}
            </span>
            <button
              disabled={page * 50 >= total}
              onClick={() => setPage((p) => p + 1)}
              className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </Card>

      {/* Floating Status Toast */}
      <Toast message={notice} onClose={() => setNotice(null)} />

      {/* Sticky Bottom Floating Bulk Action Bar */}
      {selectedLeadIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-surface-1/95 backdrop-blur-md border border-border shadow-card rounded-card px-5 py-3 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-150">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-tx animate-pulse" />
            <span className="serif font-bold text-tx text-sm">
              {selectedLeadIds.length} businesses selected
            </span>
          </div>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowBulkWhatsAppModal(true)}
            >
              <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
              <span>⚡ Bulk WhatsApp Broadcast</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLeadIds([])}
            >
              Deselect all
            </Button>
          </div>
        </div>
      )}

      {/* In-App Live Ad Inspector Modal */}
      {previewAdLead && (
        <AdPreviewModal
          lead={previewAdLead}
          onClose={() => setPreviewAdLead(null)}
        />
      )}

      {/* Bulk WhatsApp Campaign Modal */}
      {showBulkWhatsAppModal && (
        <BulkWhatsAppModal
          isOpen={showBulkWhatsAppModal}
          onClose={() => setShowBulkWhatsAppModal(false)}
          selectedLeads={leads.filter((l) => selectedLeadIds.includes(l.id))}
          onSuccess={() => {
            setNotice(`Broadcast dispatched to ${selectedLeadIds.length} businesses!`);
            setSelectedLeadIds([]);
            fetchLeads();
          }}
          onOpenConnectModal={() => setShowWhatsAppConnectModal(true)}
        />
      )}

      {/* WhatsApp Link Device QR Modal */}
      <WhatsAppConnectModal
        isOpen={showWhatsAppConnectModal}
        onClose={() => setShowWhatsAppConnectModal(false)}
      />
    </div>
  );
};
