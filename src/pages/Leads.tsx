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
  Mail,
  Send,
  SlidersHorizontal,
  Pause,
  Play,
  PauseCircle,
  PlayCircle,
  QrCode,
  CheckCircle2,
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
  const initialStatus = new URLSearchParams(window.location.search).get('status') || 'all';
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [metaFilter, setMetaFilter] = useState<'all' | 'meta' | 'ads' | 'nopixel'>('all');
  const [contactChannelFilter, setContactChannelFilter] = useState<'all' | 'has_whatsapp' | 'has_email' | 'both'>('all');
  const [page, setPage] = useState(1);

  // Action notices & spinners
  const [scanningMeta, setScanningMeta] = useState(false);
  const [seedingTestData, setSeedingTestData] = useState(false);
  const [extractingContacts, setExtractingContacts] = useState(false);
  const [extractingLeadId, setExtractingLeadId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // In-App Ad Inspector State
  const [previewAdLead, setPreviewAdLead] = useState<any | null>(null);

  // Bulk Selection & WhatsApp Campaign State
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [showBulkWhatsAppModal, setShowBulkWhatsAppModal] = useState(false);
  const [showWhatsAppConnectModal, setShowWhatsAppConnectModal] = useState(false);

  const handleWhatsAppClick = async (lead: any, phone: string) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      `Hi ${lead.name}, I noticed your business in ${lead.city} and would love to connect regarding web systems and scaling.`
    )}`;
    window.open(waUrl, '_blank');

    try {
      await api.post(`/leads/${lead.id}/mark-contacted`, { channel: 'whatsapp' });
      // Update local state immediately
      setLeads((prev) =>
        prev.map((l) => {
          if (l.id === lead.id) {
            const currentTags = Array.isArray(l.tags) ? (l.tags as string[]) : [];
            const tags = Array.from(new Set([...currentTags, 'WhatsApp Sent']));
            const newStatus =
              l.status === 'contacted_email' || l.status === 'contacted_both'
                ? 'contacted_both'
                : 'contacted_whatsapp';
            return { ...l, status: newStatus, tags };
          }
          return l;
        })
      );
      setNotice(`"${lead.name}" marked as WhatsApp Contacted.`);
    } catch {}
  };

  const handlePauseLead = async (lead: any) => {
    try {
      await api.post(`/leads/${lead.id}/pause`, {});
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, status: 'paused' } : l))
      );
      setNotice(`"${lead.name}" paused and moved to On Hold.`);
    } catch (err: any) {
      alert(`Pause failed: ${err.message}`);
    }
  };

  const handleResumeLead = async (lead: any) => {
    try {
      await api.post(`/leads/${lead.id}/resume`, {});
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, status: 'new' } : l))
      );
      setNotice(`"${lead.name}" resumed back to active outreach pipeline.`);
    } catch (err: any) {
      alert(`Resume failed: ${err.message}`);
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

      if (contactChannelFilter === 'has_whatsapp') {
        query += '&hasWhatsApp=true';
      } else if (contactChannelFilter === 'has_email') {
        query += '&hasEmail=true';
      } else if (contactChannelFilter === 'both') {
        query += '&bothChannels=true';
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
  }, [page, statusFilter, metaFilter, contactChannelFilter]);

  const handleExtractContactsAll = async () => {
    try {
      setExtractingContacts(true);
      setNotice('Deep scanning websites to extract verified WhatsApp numbers and emails...');
      const res = await api.post<any>('/leads/extract-contacts-all', { limit: 50 });
      setNotice(
        `Extraction complete! Checked ${res.scanned || 0} leads: found ${res.whatsAppFound || 0} WhatsApp numbers and ${res.emailsFound || 0} emails.`
      );
      fetchLeads();
    } catch (err: any) {
      setNotice(`Extraction failed: ${err.message}`);
    } finally {
      setExtractingContacts(false);
    }
  };

  const handleExtractSingleLead = async (leadId: string) => {
    try {
      setExtractingLeadId(leadId);
      const res = await api.post<any>(`/leads/${leadId}/extract-contacts`, {});
      const parts = [];
      if (res.whatsAppFound > 0) parts.push(`${res.whatsAppFound} WhatsApp: ${res.whatsApp.join(', ')}`);
      if (res.emailsFound > 0) parts.push(`${res.emailsFound} email(s): ${res.emails.join(', ')}`);
      if (parts.length > 0) {
        setNotice(`Found: ${parts.join(' | ')}`);
        fetchLeads();
      } else {
        setNotice('No direct WhatsApp or email found on public website pages.');
      }
    } catch (err: any) {
      setNotice(`Extraction failed: ${err.message}`);
    } finally {
      setExtractingLeadId(null);
    }
  };

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
            onClick={handleExtractContactsAll}
            loading={extractingContacts}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            title="Deep scrape business websites for verified WhatsApp numbers and emails"
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
            <span>🔍 Deep Extract WhatsApp &amp; Emails</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => setShowWhatsAppConnectModal(true)}
            size="sm"
            className="border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
            title="Scan QR or enter 8-digit Pairing Code to link WhatsApp device"
          >
            <QrCode className="w-3.5 h-3.5 mr-1.5" />
            <span>Link WhatsApp</span>
          </Button>

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
        {/* Primary Outreach & Pipeline Stage Pills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] mono text-tx-subtle uppercase tracking-wider font-semibold">
              Outreach &amp; Application Pipeline:
            </span>
            <span className="text-[11px] mono text-tx-muted">{total} Total Leads</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <Pill
              active={statusFilter === 'all'}
              onClick={() => {
                setStatusFilter('all');
                setPage(1);
              }}
            >
              All leads ({total})
            </Pill>

            <Pill
              active={statusFilter === 'uncontacted' || statusFilter === 'new'}
              onClick={() => {
                setStatusFilter('uncontacted');
                setPage(1);
              }}
            >
              ○ Fresh / Uncontacted
            </Pill>

            <Pill
              active={statusFilter === 'contacted_whatsapp'}
              onClick={() => {
                setStatusFilter('contacted_whatsapp');
                setPage(1);
              }}
            >
              💬 WhatsApp Applied
            </Pill>

            <Pill
              active={statusFilter === 'contacted_email'}
              onClick={() => {
                setStatusFilter('contacted_email');
                setPage(1);
              }}
            >
              ✉️ Email Applied
            </Pill>

            <Pill
              active={statusFilter === 'contacted_all'}
              onClick={() => {
                setStatusFilter('contacted_all');
                setPage(1);
              }}
            >
              🚀 All Applied (WA + Email)
            </Pill>

            <Pill
              active={statusFilter === 'meeting'}
              onClick={() => {
                setStatusFilter('meeting');
                setPage(1);
              }}
            >
              📅 Meetings Scheduled
            </Pill>

            <Pill
              active={statusFilter === 'proposal'}
              onClick={() => {
                setStatusFilter('proposal');
                setPage(1);
              }}
            >
              📄 Proposals Sent
            </Pill>

            <Pill
              active={statusFilter === 'paused'}
              onClick={() => {
                setStatusFilter('paused');
                setPage(1);
              }}
            >
              ⏸️ Paused / On Hold
            </Pill>

            <Pill
              active={statusFilter === 'interested'}
              onClick={() => {
                setStatusFilter('interested');
                setPage(1);
              }}
            >
              🔥 Hot / Interested
            </Pill>
          </div>
        </div>

        {/* Contact Channel Readiness Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-border text-xs">
          <span className="text-[10px] mono text-tx-subtle uppercase tracking-wider mr-1">Direct Reach:</span>
          <Pill
            active={contactChannelFilter === 'all'}
            onClick={() => {
              setContactChannelFilter('all');
              setPage(1);
            }}
          >
            All Contacts
          </Pill>

          <Pill
            active={contactChannelFilter === 'has_whatsapp'}
            onClick={() => {
              setContactChannelFilter('has_whatsapp');
              setPage(1);
            }}
          >
            💬 WhatsApp Ready Only
          </Pill>

          <Pill
            active={contactChannelFilter === 'has_email'}
            onClick={() => {
              setContactChannelFilter('has_email');
              setPage(1);
            }}
          >
            ✉️ Email Ready Only
          </Pill>

          <Pill
            active={contactChannelFilter === 'both'}
            onClick={() => {
              setContactChannelFilter('both');
              setPage(1);
            }}
          >
            🚀 WhatsApp + Email (Double Reach)
          </Pill>
        </div>

        {/* Secondary Tech Diagnostic Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-border text-xs">
          <span className="text-[10px] mono text-tx-subtle uppercase tracking-wider mr-1">Tech Audit:</span>
          <Pill
            active={metaFilter === 'all'}
            onClick={() => {
              setMetaFilter('all');
              setPage(1);
            }}
          >
            All Tech
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
              <option value="uncontacted">Fresh / Uncontacted</option>
              <option value="contacted_whatsapp">WhatsApp Applied</option>
              <option value="contacted_email">Email Applied</option>
              <option value="contacted_all">All Contacted (Applied)</option>
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
                <Th>Outreach Status</Th>
                <Th>WhatsApp</Th>
                <Th>Pixel</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {leads.map((lead) => {
                const phone = lead.phoneNorm || (lead.phones && lead.phones[0]);
                const cleanPhone = phone ? phone.replace(/[^\d]/g, '') : null;
                const tags = Array.isArray(lead.tags) ? (lead.tags as string[]) : [];
                const isMetaIntegrated = tags.includes('Meta Integrated') || tags.includes('Meta Pixel Active') || lead.adsInfo?.pixelDetected;
                const isAdsRunning = tags.includes('Meta Ads Active') || lead.adsInfo?.running;
                const adLibraryUrl = lead.adsInfo?.adLibraryUrl || `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(lead.name)}`;
                const isWhatsAppContacted = tags.includes('WhatsApp Sent') || lead.status === 'contacted_whatsapp' || lead.status === 'contacted_both';
                const isEmailContacted = tags.includes('Email Sent') || lead.status === 'contacted_email' || lead.status === 'contacted_both';

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
                      <div className="space-y-1">
                        {phone ? (
                          <div className="flex items-center gap-1.5">
                            <a href={`tel:${phone}`} className="hover:text-tx hover:underline text-xs">
                              {phone}
                            </a>
                            {tags.includes('Verified WhatsApp') && (
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
                                title="WhatsApp Verified from website contact link"
                              >
                                WA ✓
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-tx-subtle text-xs">—</span>
                        )}

                        {lead.emails && lead.emails.length > 0 ? (
                          <div className="flex items-center gap-1 text-[11px] text-tx-muted truncate max-w-[170px]" title={lead.emails[0]}>
                            <Mail className="w-2.5 h-2.5 shrink-0 text-tx-subtle" />
                            <span className="truncate">{lead.emails[0]}</span>
                          </div>
                        ) : lead.website ? (
                          <button
                            type="button"
                            onClick={() => handleExtractSingleLead(lead.id)}
                            disabled={extractingLeadId === lead.id}
                            className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-sans"
                            title="Scrape business website for direct WhatsApp and Email"
                          >
                            {extractingLeadId === lead.id ? (
                              <div className="w-2.5 h-2.5 border border-emerald-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span>🔍 Extract Contacts</span>
                            )}
                          </button>
                        ) : null}
                      </div>
                    </Td>

                    {/* Outreach Status */}
                    <Td>
                      {isWhatsAppContacted && isEmailContacted ? (
                        <span className="px-2 py-0.5 rounded text-[10px] mono font-medium bg-surface-2 border border-border text-tx inline-flex items-center gap-1">
                          <MessageCircle className="w-2.5 h-2.5" />
                          <span>WA</span>
                          <span>+</span>
                          <Mail className="w-2.5 h-2.5" />
                          <span>Email</span>
                        </span>
                      ) : isWhatsAppContacted ? (
                        <span className="px-2 py-0.5 rounded text-[10px] mono font-medium bg-surface-2 border border-border text-tx inline-flex items-center gap-1">
                          <MessageCircle className="w-2.5 h-2.5" />
                          <span>WA Applied</span>
                        </span>
                      ) : isEmailContacted ? (
                        <span className="px-2 py-0.5 rounded text-[10px] mono font-medium bg-surface-2 border border-border text-tx inline-flex items-center gap-1">
                          <Mail className="w-2.5 h-2.5" />
                          <span>Email Applied</span>
                        </span>
                      ) : lead.status === 'meeting' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] mono font-medium bg-surface-2 border border-border text-tx">
                          📅 Meeting
                        </span>
                      ) : lead.status === 'proposal' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] mono font-medium bg-surface-2 border border-border text-tx">
                          📄 Proposal
                        </span>
                      ) : lead.status === 'paused' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                          ⏸️ Paused
                        </span>
                      ) : (
                        <span className="text-[10px] mono text-tx-subtle">
                          ○ Fresh
                        </span>
                      )}
                    </Td>

                    {/* WhatsApp */}
                    <Td>
                      {cleanPhone ? (
                        <button
                          onClick={() => handleWhatsAppClick(lead, phone!)}
                          className={`pill-luxury on text-[11px] inline-flex items-center gap-1 cursor-pointer ${
                            tags.includes('Verified WhatsApp') ? 'border-emerald-500/60 text-emerald-600 font-semibold' : ''
                          }`}
                          title="Open WhatsApp chat and track as contacted"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>
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
                        {lead.status === 'paused' ? (
                          <button
                            onClick={() => handleResumeLead(lead)}
                            className="btn-ghost text-xs py-1 px-2 flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                            title="Resume lead back to pipeline"
                          >
                            <Play className="w-3 h-3" />
                            <span>Resume</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePauseLead(lead)}
                            className="btn-ghost text-xs py-1 px-2 flex items-center gap-1 text-tx-muted hover:text-amber-600 hover:bg-amber-500/10"
                            title="Pause outreach for this lead"
                          >
                            <Pause className="w-3 h-3" />
                            <span>Pause</span>
                          </button>
                        )}
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
