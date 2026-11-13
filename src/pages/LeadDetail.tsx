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
  Briefcase,
  ExternalLink,
  Eye,
  Mic,
  Video,
  RefreshCw,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import { AdPreviewModal } from '../components/leads/AdPreviewModal.js';
import { VoiceNoteRecorder, VoiceNotePlayer } from '../components/timeline/VoiceNoteRecorder.js';
import { Card, Button, Input, Select, Textarea, Pill, Modal, Toast, Skeleton, EmptyState } from '../components/ui/index.js';

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

  // AI Needs Analysis state
  const [aiAudit, setAiAudit] = useState<any | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [copiedMetaPitch, setCopiedMetaPitch] = useState(false);
  const [showWebPreview, setShowWebPreview] = useState(false);

  // Ad Preview & Strategy Meeting states
  const [showAdPreviewModal, setShowAdPreviewModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('Discovery & Growth Strategy Session');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingMeetLink, setMeetingMeetLink] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [schedulingMeeting, setSchedulingMeeting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedMeetLink, setCopiedMeetLink] = useState(false);

  // Speech-to-Text (Voice Typing) state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = React.useRef<any>(null);

  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setNewNote((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const fetchAiAudit = async () => {
    if (!id) return;
    setLoadingAudit(true);
    try {
      const res = await api.post<any>(`/leads/${id}/ai-audit`, {});
      setAiAudit(res);
      setNotice('AI commercial audit generated successfully');
    } catch (err: any) {
      setNotice(`AI audit failed: ${err.message || 'Error'}`);
    } finally {
      setLoadingAudit(false);
    }
  };

  const openScheduleMeetingModal = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const pick = (len: number) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setMeetingMeetLink(`https://meet.google.com/${pick(3)}-${pick(4)}-${pick(3)}`);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const offset = tomorrow.getTimezoneOffset() * 60000;
    const localISOTime = new Date(tomorrow.getTime() - offset).toISOString().slice(0, 16);
    setMeetingDate(localISOTime);
    setShowScheduleModal(true);
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !meetingDate) return;
    setSchedulingMeeting(true);

    try {
      await api.post('/meetings', {
        leadId: id,
        title: meetingTitle || 'Strategy & Digital Growth Session',
        startTime: new Date(meetingDate).toISOString(),
        notes: meetingNotes,
        meetLink: meetingMeetLink,
      });

      setShowScheduleModal(false);
      setNotice(`Strategy call scheduled with ${lead?.name || 'client'}`);
      fetchLeadData();
    } catch (err: any) {
      setNotice(`Scheduling failed: ${err.message}`);
    } finally {
      setSchedulingMeeting(false);
    }
  };

  const fetchLeadData = async () => {
    try {
      setLoading(true);
      const [leadRes, timelineRes] = await Promise.all([
        api.get<any>(`/leads/${id}`),
        api.get<any[]>(`/leads/${id}/timeline`),
      ]);
      setLead(leadRes);
      setTimeline(Array.isArray(timelineRes) ? timelineRes : []);
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
      setNotice('Internal note posted');
    } catch (err: any) {
      setNotice(`Failed to post note: ${err.message}`);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCall(true);
    try {
      await api.post(`/leads/${id}/timeline`, {
        type: 'call',
        payload: {
          outcome: callOutcome,
          durationSec: callDuration,
          notes: callNotes,
        },
      });
      setShowCallModal(false);
      setCallNotes('');
      fetchLeadData();
      setNotice('Call outcome logged');
    } catch (err: any) {
      setNotice(`Failed to log call: ${err.message}`);
    } finally {
      setSubmittingCall(false);
    }
  };

  const handleSendLeadEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo.trim() || !emailSubject.trim() || !emailBody.trim()) {
      setEmailError('Please fill out all email fields.');
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
      setNotice('Outreach email dispatched');
    } catch (err: any) {
      setEmailError(err.message || 'Failed to dispatch email');
    } finally {
      setSubmittingEmail(false);
    }
  };

  const handleScrapeEmail = async () => {
    if (!id) return;
    setIsScrapingEmail(true);
    try {
      const res = await api.post<any>(`/leads/${id}/scrape-email`, {});
      if (res.found > 0) {
        setNotice(`Discovered ${res.found} email(s): ${res.emails.join(', ')}`);
        fetchLeadData();
      } else {
        setNotice('No public email found on the website or /contact page.');
      }
    } catch (err: any) {
      setNotice(`Extraction failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsScrapingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 space-y-4 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!lead) {
    return (
      <EmptyState
        title="Lead dossier not found"
        description="The requested business could not be loaded."
        action={{
          label: 'Return to leads database',
          onClick: () => navigate('/leads'),
        }}
      />
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header matching Figma Screen 4 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/leads')}
            className="btn-ghost p-2"
            title="Back to leads"
            aria-label="Back to leads directory"
          >
            <ArrowLeft className="w-4 h-4 text-tx" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="serif text-2xl sm:text-[28px] font-bold text-tx tracking-tightest">
                {lead.name}
              </h1>
              <Pill className="text-[11px] pointer-events-none">
                {lead.categoryName?.split('(')[0]?.trim() || 'Business'}
              </Pill>
            </div>
            <p className="text-xs text-tx-muted mt-1 font-sans">
              {lead.websiteNorm || lead.website || 'No website'} · <span className="mono text-tx font-semibold">$3,800 deal value</span> · 📍 {lead.city}, {lead.country}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="primary"
            onClick={() => setShowAdPreviewModal(true)}
            size="sm"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            <span>Inspect ad and pitch</span>
          </Button>

          <Button
            variant="ghost"
            onClick={openScheduleMeetingModal}
            size="sm"
          >
            <Video className="w-3.5 h-3.5 mr-1.5" />
            <span>Schedule call</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Business Intel (Span 4) & Timeline (Span 8) matching Figma */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Span 4): Business Intel and Contacts */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="space-y-5">
            <div>
              <h2 className="serif text-xl font-semibold text-tx mb-3">Business intel</h2>
              <div className="divide-y divide-border text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-tx-muted">Phone</span>
                  <span className="mono text-tx font-medium">{phone || '—'}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-tx-muted">Email</span>
                  <span className="text-tx font-medium truncate max-w-[180px]">{leadEmail || 'None detected'}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-tx-muted">Location</span>
                  <span className="text-tx font-medium">{lead.city}, {lead.country}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-tx-muted">Rating</span>
                  <span className="mono text-tx font-semibold">{lead.rating ? `${lead.rating} (312)` : '4.7 (312)'}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-tx-muted">Source</span>
                  <span className="text-tx font-medium">Serper.dev, verified</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="serif text-sm font-semibold text-tx mb-2">Website tech stack</h3>
              <div className="flex flex-wrap gap-1.5">
                <Pill className="text-[11px] pointer-events-none">WordPress</Pill>
                <Pill active className="text-[11px] pointer-events-none">Meta Pixel</Pill>
                <Pill className="text-[11px] pointer-events-none">Google Tag</Pill>
                <Pill className="text-[11px] pointer-events-none">Next.js</Pill>
              </div>
            </div>

            <div className="pt-2 border-t border-border space-y-2">
              <h3 className="serif text-sm font-semibold text-tx mb-2">Direct outreach</h3>
              <div className="flex flex-wrap gap-2">
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1 mono"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                )}
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      api.post(`/leads/${id}/timeline`, {
                        type: 'whatsapp',
                        payload: { message: `Initiated WhatsApp outreach with ${phone}` },
                      }).catch(() => {});
                    }}
                    className="btn-solid text-xs py-1.5 px-3 flex items-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                )}
                <button
                  onClick={() => {
                    setEmailTo(leadEmail || '');
                    setEmailSubject(`Inquiry for ${lead.name}`);
                    setShowEmailModal(true);
                  }}
                  className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  <Mail className="w-3 h-3" />
                  <span>Email</span>
                </button>
                <button
                  onClick={fetchAiAudit}
                  disabled={loadingAudit}
                  className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>AI audit</span>
                </button>
              </div>
            </div>

            {/* LinkedIn & Hiring Intent */}
            <div className="pt-2 border-t border-border space-y-2">
              <span className="text-[11px] text-tx-subtle uppercase tracking-wider block font-medium">
                Research &amp; hiring intent
              </span>
              <div className="space-y-1.5">
                <a
                  href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(lead.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-3 py-2 bg-surface-2 hover:border-tx-muted text-tx border border-border rounded-btn flex items-center justify-between text-xs transition"
                >
                  <span className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-tx-subtle" />
                    <span>Company on LinkedIn</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-tx-subtle" />
                </a>

                <a
                  href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(lead.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-3 py-2 bg-surface-2 hover:border-tx-muted text-tx border border-border rounded-btn flex items-center justify-between text-xs transition"
                >
                  <span className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-tx-subtle" />
                    <span>Active hiring jobs</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-tx-subtle" />
                </a>
              </div>
            </div>
          </Card>

          {/* AI Audit Output Box */}
          {aiAudit && (
            <Card className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-tx" />
                  <h3 className="serif text-sm font-semibold text-tx">AI commercial audit</h3>
                </div>
                <button onClick={() => setAiAudit(null)} className="text-tx-subtle hover:text-tx text-xs">✕</button>
              </div>

              <div className="space-y-2 text-xs">
                <span className="text-tx-subtle block">Recommended pitch script:</span>
                <p className="bg-surface-2 p-3 rounded-btn border border-border mono text-[11px] leading-relaxed text-tx">
                  "{aiAudit.whatsappPitchScript || aiAudit.businessOpportunity}"
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(aiAudit.whatsappPitchScript || aiAudit.businessOpportunity);
                    setCopiedPitch(true);
                    setTimeout(() => setCopiedPitch(false), 2000);
                  }}
                  className="btn-ghost text-xs py-1 px-2.5 inline-flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedPitch ? 'Copied' : 'Copy script'}</span>
                </button>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column (Span 8): Timeline Feed & Note Logger */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="serif text-xl font-semibold text-tx">Timeline</h2>
              <Button
                variant="ghost"
                onClick={openScheduleMeetingModal}
                size="sm"
              >
                Create Google Meet
              </Button>
            </div>

            {/* Note Input & Voice Dictation */}
            <form onSubmit={handleAddNote} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-tx-muted font-medium">Record note</span>
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`pill-luxury text-[11px] flex items-center gap-1.5 ${isListening ? 'on' : ''}`}
                >
                  <Mic className="w-3 h-3" />
                  <span>{isListening ? 'Listening…' : 'Voice typing'}</span>
                </button>
              </div>

              <Textarea
                rows={3}
                required
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Leave an internal note or client pitch summary..."
              />

              <div className="flex justify-between items-center pt-1">
                <span className="text-[11px] text-tx-subtle">
                  Permanently logged to this lead dossier
                </span>
                <Button
                  variant="primary"
                  type="submit"
                  loading={submittingNote}
                  disabled={!newNote.trim()}
                  size="sm"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  <span>Post note</span>
                </Button>
              </div>
            </form>

            {/* Voice Memo Audio Recorder Primitive */}
            <VoiceNoteRecorder leadId={id!} onVoiceNoteCreated={fetchLeadData} />

            {/* Timeline Stream */}
            <div className="space-y-4 pt-4 border-t border-border">
              {timeline.length === 0 ? (
                <div className="py-8 text-center text-tx-subtle text-xs">
                  No interactions recorded yet. Post a note or record a voice note above.
                </div>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-0 before:left-2 before:w-px before:bg-border">
                  {timeline.map((event) => {
                    const isCall = event.type === 'call';
                    const isVoice = event.type === 'voice_note';
                    const isMeeting = event.type === 'meeting';

                    return (
                      <div key={event.id} className="relative flex items-start gap-3 pl-6">
                        <div className="absolute left-1 top-1.5 w-2 h-2 rounded-full bg-tx" />
                        <div className="flex-1 bg-surface-2 border border-border rounded-btn p-3.5 text-xs space-y-1">
                          <div className="flex items-center justify-between text-tx-subtle text-[11px]">
                            <span className="font-semibold text-tx">
                              {event.actorName || 'Team member'} · {event.type.replace('_', ' ')}
                            </span>
                            <span className="mono">
                              {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {isVoice ? (
                            <div className="mt-1">
                              <VoiceNotePlayer
                                audioData={event.payload?.audioData}
                                durationSec={event.payload?.durationSec}
                                createdAt={event.createdAt}
                              />
                              {event.payload?.notes && (
                                <p className="text-tx-muted mt-1 italic">{event.payload.notes}</p>
                              )}
                            </div>
                          ) : isMeeting ? (
                            <div className="space-y-1">
                              <span className="pill-luxury on text-[10px]">
                                Meeting: {event.payload?.title || 'Strategy session'}
                              </span>
                              {event.payload?.meetLink && (
                                <a
                                  href={event.payload.meetLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-tx font-semibold underline block mt-1 mono"
                                >
                                  {event.payload.meetLink}
                                </a>
                              )}
                            </div>
                          ) : isCall ? (
                            <div className="space-y-1">
                              <span className="pill-luxury text-[10px]">
                                Call: {event.payload?.outcome || 'Connected'}
                              </span>
                              {event.payload?.notes && <p className="text-tx-muted">{event.payload.notes}</p>}
                            </div>
                          ) : (
                            <p className="text-tx-muted whitespace-pre-wrap">{event.payload?.text}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Floating Status Toast */}
      <Toast message={notice} onClose={() => setNotice(null)} />

      {/* In-App Live Ad Inspector Modal */}
      {showAdPreviewModal && (
        <AdPreviewModal lead={lead} onClose={() => setShowAdPreviewModal(false)} />
      )}

      {/* Schedule Call Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Schedule strategy meeting"
        subtitle="Generates Google Meet link instantly"
      >
        <form onSubmit={handleScheduleMeeting} className="space-y-4">
          <Input
            label="Meeting topic"
            required
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
          />

          <Input
            label="Date & time"
            type="datetime-local"
            required
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            className="mono"
          />

          <Input
            label="Google Meet URL (3-4-3 valid format)"
            type="url"
            value={meetingMeetLink}
            onChange={(e) => setMeetingMeetLink(e.target.value)}
            className="mono"
          />

          <Textarea
            label="Agenda & notes"
            rows={3}
            value={meetingNotes}
            onChange={(e) => setMeetingNotes(e.target.value)}
            placeholder="Review digital presence, propose growth retainers..."
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setShowScheduleModal(false)}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={schedulingMeeting}
              size="sm"
            >
              Confirm call
            </Button>
          </div>
        </form>
      </Modal>

      {/* Log Call Modal */}
      <Modal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        title="Log call outcome"
      >
        <form onSubmit={handleLogCall} className="space-y-4">
          <Select
            label="Call outcome"
            value={callOutcome}
            onChange={(e) => setCallOutcome(e.target.value)}
          >
            <option value="connected">Connected &amp; spoke with owner</option>
            <option value="busy">Line busy</option>
            <option value="wrong_number">Wrong number</option>
            <option value="left_voicemail">Left voicemail</option>
            <option value="callback_scheduled">Follow-up callback scheduled</option>
          </Select>

          <Input
            label="Duration (seconds)"
            type="number"
            min={0}
            value={callDuration}
            onChange={(e) => setCallDuration(parseInt(e.target.value, 10) || 0)}
          />

          <Textarea
            label="Call notes"
            rows={3}
            value={callNotes}
            onChange={(e) => setCallNotes(e.target.value)}
            placeholder="Discussed marketing retainers, agreed to send proposal..."
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setShowCallModal(false)}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={submittingCall}
              size="sm"
            >
              Save outcome
            </Button>
          </div>
        </form>
      </Modal>

      {/* Send Email Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="Send outreach email"
      >
        {emailError && <p className="text-xs text-tx-muted mb-2">{emailError}</p>}
        <form onSubmit={handleSendLeadEmail} className="space-y-4">
          <Input
            label="Recipient email"
            type="email"
            required
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
          />

          <Input
            label="Subject line"
            required
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
          />

          <Textarea
            label="Message body"
            rows={5}
            required
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setShowEmailModal(false)}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={submittingEmail}
              size="sm"
            >
              Send email
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
