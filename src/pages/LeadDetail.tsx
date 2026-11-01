import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Mail,
  Calendar,
  FileText,
  Clock,
  Send,
  User,
  Sparkles,
  MapPin,
  Globe,
  Tag,
  CheckCircle2,
  Briefcase,
  ExternalLink,
} from 'lucide-react';

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lead, setLead] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Note form state
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Call log dialog state
  const [showCallModal, setShowCallModal] = useState(false);
  const [callOutcome, setCallOutcome] = useState('connected');
  const [callDuration, setCallDuration] = useState(60);
  const [callNotes, setCallNotes] = useState('');
  const [submittingCall, setSubmittingCall] = useState(false);

  // Email outreach state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [submittingEmail, setSubmittingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Website email scraper state
  const [isScrapingEmail, setIsScrapingEmail] = useState(false);
  const [scrapeMessage, setScrapeMessage] = useState<string | null>(null);

  // AI Needs Analysis state
  const [aiAudit, setAiAudit] = useState<any | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [copiedMetaPitch, setCopiedMetaPitch] = useState(false);
  const [copiedStaffPitch, setCopiedStaffPitch] = useState(false);

  const fetchAiAudit = async () => {
    if (!id) return;
    setLoadingAudit(true);
    try {
      const res = await api.get<any>(`/leads/${id}/ai-audit`);
      setAiAudit(res);
    } catch (err: any) {
      alert(`AI Audit error: ${err.message}`);
    } finally {
      setLoadingAudit(false);
    }
  };

  const fetchLeadData = async () => {
    try {
      setLoading(true);
      const [leadData, timelineData] = await Promise.all([
        api.get<any>(`/leads/${id}`),
        api.get<any[]>(`/leads/${id}/timeline`),
      ]);
      setLead(leadData);
      setTimeline(timelineData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchLeadData();
  }, [id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSubmittingNote(true);

    try {
      await api.post(`/leads/${id}/timeline`, {
        type: 'note',
        payload: { text: newNote.trim() },
      });
      setNewNote('');
      fetchLeadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCall(true);

    try {
      await api.post(`/leads/${id}/calls`, {
        direction: 'outbound',
        outcome: callOutcome,
        durationSec: callDuration,
        notes: callNotes.trim(),
      });
      setShowCallModal(false);
      setCallNotes('');
      fetchLeadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingCall(false);
    }
  };

  const handleSendLeadEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo.trim() || !emailSubject.trim()) {
      setEmailError('Recipient email and subject are required');
      return;
    }
    setSubmittingEmail(true);
    setEmailError('');

    try {
      await api.post('/emails/send', {
        leadId: id,
        to: emailTo.trim(),
        subject: emailSubject.trim(),
        bodyText: emailBody,
        bodyHtml: `<p>${emailBody.replace(/\n/g, '<br/>')}</p>`,
      });
      setShowEmailModal(false);
      setEmailSubject('');
      setEmailBody('');
      fetchLeadData();
    } catch (err: any) {
      setEmailError(err.message || 'Failed to dispatch email');
    } finally {
      setSubmittingEmail(false);
    }
  };

  const handleScrapeEmail = async () => {
    if (!id) return;
    setIsScrapingEmail(true);
    setScrapeMessage(null);
    try {
      const res = await api.post<any>(`/leads/${id}/scrape-email`, {});
      if (res.found > 0) {
        setScrapeMessage(`✅ Discovered ${res.found} email(s): ${res.emails.join(', ')}`);
        fetchLeadData();
      } else {
        setScrapeMessage('ℹ️ No public email found on the website or /contact page.');
      }
    } catch (err: any) {
      setScrapeMessage(`❌ Extraction failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsScrapingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 flex justify-center items-center">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3" />
        Loading lead dossier...
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-white">Lead Not Found</h2>
        <button
          onClick={() => navigate('/leads')}
          className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm"
        >
          Return to Leads Directory
        </button>
      </div>
    );
  }

  const phone = lead.phoneNorm || (lead.phones && lead.phones[0]);
  const cleanPhone = phone ? phone.replace(/[^\d]/g, '') : null;
  const leadEmail = (Array.isArray(lead.emails) && lead.emails[0]) || null;
  const waLink = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Hi ${lead.name}, I wanted to follow up with you regarding our services.`
      )}`
    : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Bar Navigation */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={() => navigate('/leads')}
          className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">{lead.name}</h1>
          <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="truncate">
              {lead.address || `${lead.city}, ${lead.country}`}
            </span>
          </p>
        </div>
      </div>

      {/* Action Bar (One-click Comms) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>Call ({phone})</span>
            </a>
          )}

          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Message</span>
            </a>
          )}

          <button
            onClick={() => {
              setEmailTo(leadEmail || '');
              setEmailSubject(`Inquiry for ${lead.name}`);
              setShowEmailModal(true);
            }}
            className="px-3.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Mail className="w-4 h-4" />
            <span>Send Email {leadEmail ? `(${leadEmail})` : ''}</span>
          </button>

          {lead.website && (
            <button
              onClick={handleScrapeEmail}
              disabled={isScrapingEmail}
              className="px-3.5 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Globe className="w-4 h-4" />
              <span>{isScrapingEmail ? 'Scanning...' : 'Find Website Email'}</span>
            </button>
          )}

          <button
            onClick={() => setShowCallModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Log Call Outcome</span>
          </button>

          <button
            onClick={() => navigate('/meetings')}
            className="px-3.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </button>

          <button
            onClick={() => navigate('/proposals')}
            className="px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <FileText className="w-4 h-4" />
            <span>Create Proposal</span>
          </button>

          <button
            onClick={fetchAiAudit}
            disabled={loadingAudit}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{loadingAudit ? 'Analyzing...' : 'AI Needs & Pitch'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs self-start sm:self-center">
          <span className="text-slate-400">Status:</span>
          <span className="px-3 py-1 rounded-full uppercase font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {lead.status}
          </span>
        </div>
      </div>

      {scrapeMessage && (
        <div className="bg-slate-900 border border-purple-500/40 px-4 py-3 rounded-xl text-xs text-purple-200 flex items-center justify-between shadow-lg">
          <span>{scrapeMessage}</span>
          <button
            onClick={() => setScrapeMessage(null)}
            className="text-slate-400 hover:text-white px-2 py-0.5 rounded text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {aiAudit && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/40 p-4 sm:p-5 rounded-2xl shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <h3 className="font-bold text-white text-sm">
                AI Commercial Audit & Pitch for {lead.name}
              </h3>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <span className="text-xs text-amber-400 font-mono font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                Deal Value: {aiAudit.estimatedDealValue || '$500 - $1,500'}
              </span>
              <button
                onClick={() => setAiAudit(null)}
                className="text-slate-400 hover:text-white px-2 py-0.5 rounded text-sm"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold mb-1.5 uppercase text-[11px] tracking-wider">
                Services This Business Needs
              </span>
              <div className="flex flex-wrap gap-1.5">
                {aiAudit.neededServices?.map((svc: string, i: number) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-lg font-medium"
                  >
                    ✓ {svc}
                  </span>
                ))}
              </div>
              <p className="text-slate-300 mt-3 leading-relaxed">
                {aiAudit.businessOpportunity}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                    WhatsApp Outreach Script
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(aiAudit.whatsappPitchScript);
                      setCopiedPitch(true);
                      setTimeout(() => setCopiedPitch(false), 2000);
                    }}
                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    {copiedPitch ? '✓ Copied!' : 'Copy Pitch'}
                  </button>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-200 font-mono text-[11px] leading-relaxed">
                  "{aiAudit.whatsappPitchScript}"
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold mb-1 uppercase text-[11px] tracking-wider">
                  Cold Call 15-Second Hook
                </span>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 text-[11px]">
                  "{aiAudit.callPitchHook}"
                </div>
              </div>

              {aiAudit.remoteStaffPitch && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400 font-semibold uppercase text-[11px] tracking-wider flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                      <span>Dedicated Remote Staff Pitch</span>
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(aiAudit.remoteStaffPitch);
                        setCopiedStaffPitch(true);
                        setTimeout(() => setCopiedStaffPitch(false), 2000);
                      }}
                      className="text-[11px] text-purple-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      {copiedStaffPitch ? '✓ Copied!' : 'Copy Staff Pitch'}
                    </button>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-200 font-mono text-[11px] leading-relaxed">
                    "{aiAudit.remoteStaffPitch}"
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Meta Ads & Creative Funnel Intelligence */}
          {aiAudit.metaAudit && (
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <span>🎯 Meta (FB/Insta) Ad & Creative Audit</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  {aiAudit.metaAudit.adStatus}
                </span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px] font-semibold">
                    Personalized Meta Outreach Pitch:
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(aiAudit.metaAudit.metaPitchScript);
                      setCopiedMetaPitch(true);
                      setTimeout(() => setCopiedMetaPitch(false), 2000);
                    }}
                    className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    {copiedMetaPitch ? '✓ Copied Meta Pitch!' : 'Copy Meta Pitch'}
                  </button>
                </div>
                <div className="text-slate-200 font-mono text-[11px] leading-relaxed">
                  "{aiAudit.metaAudit.metaPitchScript}"
                </div>
                <div className="text-[11px] text-amber-400 font-mono pt-1">
                  💡 Recommended Service Package: {aiAudit.metaAudit.recommendedService}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Two Column Layout: Details vs Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metadata & Tags */}
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl text-xs">
            <h3 className="font-bold text-white text-sm pb-3 border-b border-slate-800">
              Lead Intelligence
            </h3>

            <div>
              <span className="text-slate-400 block mb-1">Official Website</span>
              {lead.website ? (
                <a
                  href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-mono break-all"
                >
                  <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{lead.website}</span>
                </a>
              ) : (
                <span className="text-slate-500">None detected</span>
              )}
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Google Rating</span>
              <span className="text-white font-bold font-mono">
                {lead.rating ? `⭐ ${lead.rating} / 5.0` : 'Not available'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-2">Applied Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {Array.isArray(lead.tags) && lead.tags.length > 0 ? (
                  lead.tags.map((t: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300"
                    >
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500">No tags assigned</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Lead Key</span>
              <span className="font-mono text-[10px] text-slate-500 bg-slate-950 px-2 py-1 rounded block truncate">
                {lead.placeKey}
              </span>
            </div>

            {/* LinkedIn & Hiring Intent Intelligence */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-slate-400 block font-semibold text-[11px] uppercase tracking-wider">
                💼 LinkedIn & Hiring Intelligence
              </span>
              <div className="space-y-1.5">
                <a
                  href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(lead.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-3 py-2 bg-slate-950 hover:bg-slate-800 text-blue-400 border border-slate-800 rounded-xl flex items-center justify-between text-[11px] font-medium transition"
                >
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Company on LinkedIn</span>
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <a
                  href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(lead.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-3 py-2 bg-slate-950 hover:bg-slate-800 text-amber-400 border border-slate-800 rounded-xl flex items-center justify-between text-[11px] font-medium transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Check Active Job Openings</span>
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(lead.name + ' jobs hiring')}&ibp=htl;jobs`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-3 py-2 bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-800 rounded-xl flex items-center justify-between text-[11px] font-medium transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Google Jobs Search</span>
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Unified Timeline & Activities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Note Input Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                rows={3}
                required
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Leave an internal note, pitch reminder, or mention team members with @name..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-500">
                  Notes are permanently recorded on this lead's timeline.
                </span>
                <button
                  type="submit"
                  disabled={submittingNote || !newNote.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Note</span>
                </button>
              </div>
            </form>
          </div>

          {/* Timeline Feed */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="font-bold text-white text-sm pb-4 border-b border-slate-800">
              Interaction & Activity Timeline
            </h3>

            {timeline.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No timeline events yet. Log a call or add a note above to begin!
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
                {timeline.map((event) => {
                  const isCall = event.type === 'call';
                  const isNote = event.type === 'note';

                  return (
                    <div key={event.id} className="relative flex items-start gap-4 pl-8">
                      <div className="absolute left-1.5 top-0.5 w-4 h-4 rounded-full bg-slate-800 border-2 border-emerald-400" />
                      <div className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-white">
                            {event.actorName || 'Team Member'}
                          </span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            {new Date(event.createdAt).toLocaleString()}
                          </span>
                        </div>

                        {isCall ? (
                          <div className="space-y-1 text-xs">
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-500/10 text-amber-400 uppercase">
                              Call: {event.payload?.outcome || 'Connected'}
                            </span>
                            {event.payload?.notes && (
                              <p className="text-slate-300 mt-2">{event.payload.notes}</p>
                            )}
                          </div>
                        ) : isNote ? (
                          <p className="text-slate-300 text-xs whitespace-pre-wrap">
                            {event.payload?.text}
                          </p>
                        ) : (
                          <span className="text-xs text-slate-400 capitalize">
                            {event.type} event recorded
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Log Outbound Call Outcome</h3>
            <form onSubmit={handleLogCall} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Call Outcome
                </label>
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="connected">Connected & Spoke with Decision Maker</option>
                  <option value="busy">Line Busy</option>
                  <option value="wrong_number">Wrong Number / Invalid</option>
                  <option value="left_voicemail">Left Voicemail</option>
                  <option value="callback_scheduled">Follow-up Callback Scheduled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Duration (Seconds)
                </label>
                <input
                  type="number"
                  min={0}
                  value={callDuration}
                  onChange={(e) => setCallDuration(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Call Notes & Meeting Summary
                </label>
                <textarea
                  rows={3}
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Discussed their advertising requirements, agreed to send proposal..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCallModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCall}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
                >
                  {submittingCall ? 'Saving...' : 'Save to Timeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-400" />
              Send Outreach Email
            </h3>

            {emailError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {emailError}
              </div>
            )}

            <form onSubmit={handleSendLeadEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="e.g. contact@business.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Subject line..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Message Body
                </label>
                <textarea
                  rows={5}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder={`Hi ${lead.name},\n\nI wanted to reach out regarding your business in ${lead.city}...`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-sans"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEmail}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
                >
                  {submittingEmail ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
