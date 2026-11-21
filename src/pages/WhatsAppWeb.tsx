import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import {
  MessageCircle,
  ExternalLink,
  Send,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Monitor,
  Smartphone,
  Copy,
  Check,
  Building2,
  MapPin,
  Tag,
  KeyRound,
  ShieldCheck,
  Flame,
  Globe,
  Maximize2,
} from 'lucide-react';
import { Button, Card, Input, Textarea, Select } from '../components/ui/index.js';
import { WhatsAppConnectModal } from '../components/whatsapp/WhatsAppConnectModal.js';

interface Lead {
  id: string;
  name: string;
  phone?: string;
  city?: string;
  category?: string;
  status: string;
  tags?: string[];
  website?: string;
}

const PITCH_TEMPLATES = [
  {
    id: 'web_funnel',
    title: '🚀 Modern Website & Mobile Funnel Revamp',
    template:
      "Hi {{name}}, came across your business in {{city}}! Noticed your website is missing modern mobile funnels and instant WhatsApp ordering. We build lightning-fast web systems that double client inquiries. Would you be open to a quick 2-minute mockup preview?",
  },
  {
    id: 'gmaps_seo',
    title: '📍 Google Maps & Local Top-3 Ranking',
    template:
      "Hi {{name}}, found your business on Maps in {{city}}. You have great reviews, but your profile is missing local SEO optimization to dominate the Top 3 map pack. We help local businesses get 3x more direct phone calls. Open to a brief 3-minute chat?",
  },
  {
    id: 'meta_pixel',
    title: '🎯 Meta Ads & Pixel Retargeting',
    template:
      "Hi {{name}}, noticed you're active in {{city}} but missing Meta Pixel tracking to re-engage visitors who browse without contacting you. We set up automated retargeting that cuts ad acquisition costs in half. Can I send you a quick case study?",
  },
  {
    id: 'wa_store',
    title: '💬 WhatsApp Direct Ordering & Catalog',
    template:
      "Hi {{name}}, we help premier businesses in {{city}} turn WhatsApp into an automated sales machine with instant catalog browsing and automated follow-ups. Would you like to see a quick 60-second interactive demo?",
  },
  {
    id: 'objection_followup',
    title: '🤝 High-Value Closing & Follow-Up',
    template:
      "Hi {{name}}, following up regarding our earlier message about scaling your client acquisition in {{city}}. We have a tailored strategy ready for {{name}} that requires zero upfront disruption. When would be a good time for a 5-minute call?",
  },
];

export const WhatsAppWebPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dock' | 'pitcher' | 'gateway'>('dock');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [searchLead, setSearchLead] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Pitch State
  const [selectedTemplateId, setSelectedTemplateId] = useState('web_funnel');
  const [customPhone, setCustomPhone] = useState('');
  const [pitchText, setPitchText] = useState('');
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // WhatsApp Connect Gateway Modal
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [waPhone, setWaPhone] = useState<string | null>(null);

  // Embedded iframe attempt
  const [embedIframe, setEmbedIframe] = useState(false);

  // Load leads
  const fetchLeads = async () => {
    setLoadingLeads(true);
    try {
      const res = await api.get<any>('/leads?limit=100');
      const items = res?.items || (Array.isArray(res?.data) ? res.data : []);
      setLeads(items);
      if (items.length > 0 && !selectedLead) {
        setSelectedLead(items[0]);
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoadingLeads(false);
    }
  };

  // Check WhatsApp server connection
  const checkStatus = async () => {
    try {
      const res = await api.get<any>('/whatsapp/status');
      if (res?.data?.status === 'connected') {
        setWaConnected(true);
        setWaPhone(res.data.phone);
      } else {
        setWaConnected(false);
        setWaPhone(null);
      }
    } catch {
      setWaConnected(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    checkStatus();
  }, []);

  // Update pitch text when template or selected lead changes
  useEffect(() => {
    const tpl = PITCH_TEMPLATES.find((t) => t.id === selectedTemplateId) || PITCH_TEMPLATES[0];
    const name = selectedLead?.name || 'Business Owner';
    const city = selectedLead?.city || 'your area';
    const category = selectedLead?.category || 'business';

    let generated = tpl.template
      .replace(/{{name}}/g, name)
      .replace(/{{city}}/g, city)
      .replace(/{{category}}/g, category);

    setPitchText(generated);

    if (selectedLead?.phone) {
      setCustomPhone(selectedLead.phone.replace(/[^\d]/g, ''));
    }
  }, [selectedTemplateId, selectedLead]);

  // Open official WhatsApp Web in a dedicated docked companion window
  const openWhatsAppWebDock = (phone?: string, text?: string) => {
    const width = 1180;
    const height = 850;
    const left = Math.max(0, (window.screen.width - width) / 2);
    const top = Math.max(0, (window.screen.height - height) / 2);

    let url = 'https://web.whatsapp.com';
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      const encodedMsg = text ? encodeURIComponent(text) : '';
      url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
    }

    window.open(
      url,
      'WhatsAppWebStation',
      `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no,location=yes,resizable=yes,scrollbars=yes`
    );
  };

  // Pitch lead & mark as contacted
  const handleSendPitch = async () => {
    const targetPhone = customPhone || (selectedLead?.phone ? selectedLead.phone.replace(/\D/g, '') : '');
    if (!targetPhone) {
      alert('Please enter or select a valid phone number.');
      return;
    }

    // Launch WhatsApp Web with pre-filled message
    openWhatsAppWebDock(targetPhone, pitchText);

    // Track in CRM
    if (selectedLead?.id) {
      try {
        await api.post(`/leads/${selectedLead.id}/mark-contacted`, { channel: 'whatsapp' });
        setLeads((prev) =>
          prev.map((l) =>
            l.id === selectedLead.id
              ? {
                  ...l,
                  status:
                    l.status === 'contacted_email' || l.status === 'contacted_both'
                      ? 'contacted_both'
                      : 'contacted_whatsapp',
                }
              : l
          )
        );
        setNotice(`WhatsApp pitch opened & "${selectedLead.name}" marked as Contacted in CRM!`);
        setTimeout(() => setNotice(null), 5000);
      } catch {}
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(pitchText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLeads = leads.filter((l) => {
    if (!searchLead) return true;
    const q = searchLead.toLowerCase();
    return (
      l.name?.toLowerCase().includes(q) ||
      l.city?.toLowerCase().includes(q) ||
      l.phone?.includes(q) ||
      l.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Station */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-surface-1 border border-border rounded-card shadow-card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-emerald-500">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="serif text-xl sm:text-2xl font-bold text-tx">WhatsApp Web Workstation</h1>
              <span className="mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                Official Live Web
              </span>
            </div>
            <p className="text-xs text-tx-muted mt-1">
              Directly embed and dock official WhatsApp Web. Pitch leads in 1-click, chat seamlessly, and sync outreach activity with CRM.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="primary"
            onClick={() => openWhatsAppWebDock()}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            <span>Launch WhatsApp Web Dock</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => setShowConnectModal(true)}
            size="sm"
            className="border border-border"
          >
            <KeyRound className="w-3.5 h-3.5 mr-1.5 text-tx-muted" />
            <span>{waConnected ? `Linked: +${waPhone}` : 'Pairing Code Gateway'}</span>
          </Button>

          <Button
            variant="ghost"
            onClick={fetchLeads}
            loading={loadingLeads}
            size="sm"
            title="Refresh Leads"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-btn text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Navigation Mode Tabs */}
      <div className="flex border-b border-border text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('dock')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'dock'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-tx-muted hover:text-tx'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>WhatsApp Web Station &amp; Embed</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pitcher')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'pitcher'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-tx-muted hover:text-tx'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>1-Click Lead Pitcher (Direct Send)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gateway')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'gateway'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-tx-muted hover:text-tx'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Server Multi-Device Pairing</span>
        </button>
      </div>

      {/* TAB 1: DOCKED COMPANION & EMBED STATION */}
      {activeTab === 'dock' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Command Hub Card */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="p-6 bg-surface-1 border border-border space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="serif text-lg font-bold text-tx">Official WhatsApp Web Workspace</h2>
                    <p className="text-xs text-tx-muted mt-1 leading-relaxed">
                      WhatsApp Web operates as a dedicated CRM companion workstation. Once opened, you can scan your QR code or log in directly through WhatsApp's official interface. It stays permanently active, synchronized with your mobile phone, and never drops connection.
                    </p>
                  </div>
                  <span className="mono text-[11px] px-2.5 py-1 rounded bg-surface-2 border border-border text-tx font-bold">
                    v2.3000 Web
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-card border border-border bg-surface-2 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-tx">
                      <Maximize2 className="w-4 h-4 text-emerald-500" />
                      <span>Dedicated Pinned Window</span>
                    </div>
                    <p className="text-[11px] text-tx-muted leading-relaxed">
                      Opens WhatsApp Web in a floating, optimized workspace window alongside CRM. Camera, mic, stickers, media, and voice notes work 100% natively without iframe restrictions.
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => openWhatsAppWebDock()}
                      size="sm"
                      className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      <span>Open WhatsApp Web Window</span>
                    </Button>
                  </div>

                  <div className="p-4 rounded-card border border-border bg-surface-2 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-tx">
                      <Globe className="w-4 h-4 text-blue-500" />
                      <span>In-Page Embedded Iframe</span>
                    </div>
                    <p className="text-[11px] text-tx-muted leading-relaxed">
                      Toggle in-app embedded frame directly below. (Note: Meta default security blocks standard iframes; if your browser blocks it, use the Dedicated Window above).
                    </p>
                    <Button
                      variant="ghost"
                      onClick={() => setEmbedIframe(!embedIframe)}
                      size="sm"
                      className="w-full mt-2 border border-border"
                    >
                      <span>{embedIframe ? 'Hide Embedded Frame' : 'Show In-Page Iframe'}</span>
                    </Button>
                  </div>
                </div>

                {/* Embedded Iframe Container */}
                {embedIframe && (
                  <div className="mt-4 border border-border rounded-card overflow-hidden bg-canvas">
                    <div className="p-2.5 bg-surface-2 border-b border-border flex items-center justify-between text-xs text-tx-muted">
                      <span className="mono">https://web.whatsapp.com</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openWhatsAppWebDock()}
                        className="h-7 text-[11px]"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        <span>Pop-out Window</span>
                      </Button>
                    </div>
                    <div className="relative w-full h-[650px] bg-canvas flex items-center justify-center">
                      <iframe
                        src="https://web.whatsapp.com"
                        title="WhatsApp Web Official Embed"
                        className="w-full h-full border-0"
                        allow="camera; microphone; clipboard-read; clipboard-write; notifications"
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                      />
                    </div>
                    <div className="p-3 bg-surface-2/60 border-t border-border text-[11px] text-tx-subtle leading-relaxed flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-500" />
                      <span>
                        If WhatsApp shows a blank page or "refused to connect", WhatsApp's security header (<code>X-Frame-Options: DENY</code>) is active in your browser. Simply click <strong>"Open WhatsApp Web Window"</strong> above to run it in 1-click companion mode!
                      </span>
                    </div>
                  </div>
                )}
              </Card>

              {/* Quick Instructions Card */}
              <Card className="p-5 bg-surface-1 border border-border space-y-3">
                <h3 className="serif text-sm font-bold text-tx flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>How to connect your WhatsApp in 30 seconds</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-tx-muted pt-1">
                  <div className="p-3 rounded-btn bg-surface-2 border border-border space-y-1">
                    <span className="font-bold text-tx block">1. Open WhatsApp Web</span>
                    <span>Click the green "Launch WhatsApp Web Dock" button above to launch the workspace window.</span>
                  </div>
                  <div className="p-3 rounded-btn bg-surface-2 border border-border space-y-1">
                    <span className="font-bold text-tx block">2. Scan or Link Number</span>
                    <span>Open WhatsApp on mobile ➔ Linked Devices ➔ Scan the QR or tap "Link with phone number".</span>
                  </div>
                  <div className="p-3 rounded-btn bg-surface-2 border border-border space-y-1">
                    <span className="font-bold text-tx block">3. Pitch Leads Instantly</span>
                    <span>Use the 1-Click Lead Pitcher tab to fire luxury pitches directly into WhatsApp Web conversations.</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column: Quick Lead Launcher */}
            <div className="space-y-4">
              <Card className="p-5 bg-surface-1 border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="serif text-sm font-bold text-tx">Quick Contact Lead</h3>
                  <span className="mono text-[10px] text-tx-muted">{leads.length} leads</span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-tx-subtle" />
                  <Input
                    placeholder="Search leads..."
                    value={searchLead}
                    onChange={(e) => setSearchLead(e.target.value)}
                    className="pl-8 text-xs"
                  />
                </div>

                <div className="max-h-[460px] overflow-y-auto space-y-2 pr-1">
                  {filteredLeads.slice(0, 15).map((lead) => {
                    const isSelected = selectedLead?.id === lead.id;
                    const cleanPhone = lead.phone ? lead.phone.replace(/\D/g, '') : '';
                    return (
                      <div
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className={`p-3 rounded-btn border text-xs cursor-pointer transition ${
                          isSelected
                            ? 'bg-surface-2 border-emerald-500 shadow-sm'
                            : 'bg-surface-1 border-border hover:bg-surface-2'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-tx truncate">{lead.name}</span>
                          {lead.status === 'contacted_whatsapp' && (
                            <span className="mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">
                              WA Sent
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-tx-muted mt-1 text-[11px]">
                          {lead.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-tx-subtle" />
                              {lead.city}
                            </span>
                          )}
                          {cleanPhone && <span className="mono text-tx font-medium">+{cleanPhone}</span>}
                        </div>
                        <div className="mt-2 pt-2 border-t border-border/50 flex justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openWhatsAppWebDock(cleanPhone, `Hi ${lead.name}, connecting regarding your business.`);
                            }}
                            className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>Open in WhatsApp</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 1-CLICK LEAD PITCHER */}
      {activeTab === 'pitcher' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Lead List */}
          <div className="lg:col-span-4 space-y-3">
            <Card className="p-4 bg-surface-1 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="serif text-xs font-bold text-tx uppercase tracking-wider">
                  Select Target Lead
                </span>
                <span className="mono text-[10px] text-tx-muted">{leads.length} total</span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-tx-subtle" />
                <Input
                  placeholder="Filter by name, phone, city..."
                  value={searchLead}
                  onChange={(e) => setSearchLead(e.target.value)}
                  className="pl-8 text-xs"
                />
              </div>

              <div className="max-h-[580px] overflow-y-auto space-y-2 pr-1">
                {filteredLeads.map((lead) => {
                  const isSelected = selectedLead?.id === lead.id;
                  const isContacted = lead.status === 'contacted_whatsapp' || lead.status === 'contacted_both';
                  return (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={`p-3 rounded-btn border text-xs cursor-pointer transition ${
                        isSelected
                          ? 'bg-surface-2 border-emerald-500 shadow-sm'
                          : 'bg-surface-1 border-border hover:bg-surface-2'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-tx truncate">{lead.name}</span>
                        {isContacted ? (
                          <span className="mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">
                            Pitched
                          </span>
                        ) : (
                          <span className="mono text-[9px] px-1.5 py-0.5 rounded bg-surface-2 text-tx-muted">
                            New
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-tx-muted text-[11px] mt-1">
                        {lead.city && <span>{lead.city}</span>}
                        {lead.phone && <span className="mono text-tx font-mono">+{lead.phone.replace(/\D/g, '')}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right Column: Pitch Customizer & Direct Sender */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="p-6 bg-surface-1 border border-border space-y-5">
              <div className="flex items-start justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="serif text-base font-bold text-tx">
                    {selectedLead ? selectedLead.name : 'Target Lead'}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-tx-muted mt-1">
                    {selectedLead?.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-tx-subtle" />
                        {selectedLead.city}
                      </span>
                    )}
                    {selectedLead?.category && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-tx-subtle" />
                        {selectedLead.category}
                      </span>
                    )}
                    {selectedLead?.website && (
                      <a
                        href={selectedLead.website.startsWith('http') ? selectedLead.website : `https://${selectedLead.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 hover:text-tx underline text-[11px]"
                      >
                        <Globe className="w-3 h-3 text-tx-subtle" />
                        Website
                      </a>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-tx-muted block">Direct WhatsApp Destination:</span>
                  <input
                    type="text"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="Phone with country code (e.g. 923001234567)"
                    className="mono text-xs px-2.5 py-1.5 rounded-btn bg-surface-2 border border-border mt-1 text-tx font-bold focus:outline-none focus:ring-1 focus:ring-tx w-48 text-right"
                  />
                </div>
              </div>

              {/* Pitch Preset Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-tx flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Select Sales Strategy / Luxury Pitch:</span>
                  </span>
                  <span className="mono text-[10px] text-tx-muted">Auto-personalized for lead</span>
                </label>

                <Select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="text-xs"
                >
                  {PITCH_TEMPLATES.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.title}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Editable Message Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-tx-muted">
                  <span>Pitch Message Content:</span>
                  <span className="mono text-[10px]">{pitchText.length} characters</span>
                </div>
                <Textarea
                  rows={6}
                  value={pitchText}
                  onChange={(e) => setPitchText(e.target.value)}
                  className="text-xs leading-relaxed font-sans"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
                <Button
                  variant="ghost"
                  onClick={handleCopy}
                  size="sm"
                  className="border border-border"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 mr-1.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-tx-muted mr-1.5" />
                  )}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Pitch Text'}</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    onClick={handleSendPitch}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    <span>Launch &amp; Pitch on WhatsApp Web</span>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: SERVER GATEWAY & PAIRING CODE */}
      {activeTab === 'gateway' && (
        <Card className="p-6 bg-surface-1 border border-border space-y-6 max-w-3xl mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="serif text-lg font-bold text-tx">Server Automated WhatsApp Gateway</h2>
              <p className="text-xs text-tx-muted mt-1 leading-relaxed">
                Connect your WhatsApp mobile device to the CRM backend server using an 8-character Pairing Code. This enables background mass broadcasting and AI auto-responders without requiring your browser to stay open.
              </p>
            </div>
            <span
              className={`mono text-[11px] px-2.5 py-1 rounded font-bold uppercase ${
                waConnected
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-surface-2 text-tx-muted'
              }`}
            >
              {waConnected ? `Connected: +${waPhone}` : 'Disconnected'}
            </span>
          </div>

          <div className="p-4 rounded-card bg-surface-2 border border-border space-y-3">
            <span className="font-semibold text-xs text-tx block">How to Link via Pairing Code:</span>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-tx-muted leading-relaxed">
              <li>Click <strong>"Open Pairing Code Modal"</strong> below.</li>
              <li>Enter your phone number (e.g. <code>923001234567</code>).</li>
              <li>Copy the 8-character code shown on screen.</li>
              <li>Open <strong>WhatsApp</strong> on your mobile phone ➔ <strong>Settings</strong> / <strong>Menu (⋮)</strong> ➔ <strong>Linked Devices</strong> ➔ <strong>Link a Device</strong>.</li>
              <li>Tap <strong>"Link with phone number instead"</strong> at the bottom and enter the code.</li>
            </ol>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button
              variant="primary"
              onClick={() => setShowConnectModal(true)}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <Smartphone className="w-3.5 h-3.5 mr-1.5" />
              <span>Open Pairing Code Modal</span>
            </Button>
          </div>
        </Card>
      )}

      {/* WhatsApp Link Modal */}
      <WhatsAppConnectModal
        isOpen={showConnectModal}
        onClose={() => {
          setShowConnectModal(false);
          checkStatus();
        }}
        onStatusChange={(st) => {
          setWaConnected(st.connected);
          setWaPhone(st.phone ?? null);
        }}
      />
    </div>
  );
};
