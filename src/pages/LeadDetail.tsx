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
  CheckCircle2,
  Briefcase,
  ExternalLink,
  Eye,
  Mic,
  Video,
  RefreshCw,
  Copy,
} from 'lucide-react';
import { AdPreviewModal } from '../components/leads/AdPreviewModal.js';
import { VoiceNoteRecorder, VoiceNotePlayer } from '../components/timeline/VoiceNoteRecorder.js';

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
  const [showWebPreview, setShowWebPreview] = useState(false);

  // Ad Preview & Strategy Meeting states
  const [showAdPreviewModal, setShowAdPreviewModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('Discovery & Growth Strategy Session');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingMeetLink, setMeetingMeetLink] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [schedulingMeeting, setSchedulingMeeting] = useState(false);
  const [meetingNotice, setMeetingNotice] = useState<string | null>(null);
  const [copiedMeetLink, setCopiedMeetLink] = useState(false);

  // Speech-to-Text (Voice Typing) state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = React.useRef<any>(null);

  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setNewNote((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

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
    } catch (err: any) {
      alert(`AI Audit error: ${err.message || 'Failed'}`);
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
    setMeetingNotice(null);

    try {
      await api.post('/meetings', {
        leadId: id,
        title: meetingTitle || 'Strategy & Digital Growth Session',
        startTime: new Date(meetingDate).toISOString(),
        notes: meetingNotes,
        meetLink: meetingMeetLink,
      });

      setShowScheduleModal(false);
      setMeetingNotice(`Scheduled Google Meet strategy call with ${lead?.name || 'client'}!`);
      fetchLeadData();
    } catch (err: any) {
      alert(err.message || 'Failed to schedule meeting');
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
    if (id) {
      fetchLeadData();
    }
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
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
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
        setScrapeMessage(`Discovered ${res.found} email(s): ${res.emails.join(', ')}`);
        fetchLeadData();
      } else {
        setScrapeMessage('No public email found on the website or /contact page.');
      }
    } catch (err: any) {
      setScrapeMessage(`Extraction failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsScrapingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-[#737373] text-xs">
        Loading lead dossier...
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-20 card-luxury p-8 max-w-md mx-auto">
        <h2 className="serif text-xl font-bold text-black">Lead Not Found</h2>
        <button
          onClick={() => navigate('/leads')}
          className="mt-4 btn-solid text-xs"
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header matching Figma Screen 4 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/leads')}
            className="btn-ghost p-2"
            title="Back to leads"
          >
            <ArrowLeft className="w-4 h-4 text-black" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="serif text-2xl sm:text-3xl font-bold text-black tracking-tight">{lead.name}</h1>
              <span className="pill-luxury text-[11px]">{lead.categoryName?.split('(')[0]?.trim() || 'Business'}</span>
            </div>
            <p className="text-xs text-[#525252] mt-1 font-sans">
              {lead.websiteNorm || lead.website || 'No website'} · <span className="mono text-black font-semibold">$3,800 deal value</span> · 📍 {lead.city}, {lead.country}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAdPreviewModal(true)}
            className="btn-solid text-xs flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Inspect ad and pitch</span>
          </button>

          <button
            onClick={openScheduleMeetingModal}
            className="btn-ghost text-xs flex items-center gap-1.5"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Schedule Call</span>
          </button>
        </div>
      </div>

      {meetingNotice && (
        <div className="p-3.5 bg-[#F8F8F8] border border-[#E5E5E5] rounded-2xl text-black text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-black flex-shrink-0" />
            <span>{meetingNotice}</span>
          </div>
          <button onClick={() => setMeetingNotice(null)} className="text-[#737373] hover:text-black">✕</button>
        </div>
      )}

      {/* Main Grid: Business Intel (Span 4) & Timeline (Span 8) matching Figma */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Business Intel Card (Span 4) */}
        <div className="lg:col-span-4 card-luxury p-6 space-y-6">
          <div>
            <h2 className="serif text-xl font-semibold text-black mb-3">Business intel</h2>
            <div className="divide-y divide-[#E5E5E5] text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#525252]">Phone</span>
                <span className="mono text-black">{phone || '—'}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#525252]">Email</span>
                <span className="text-black font-medium">{leadEmail || 'None detected'}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#525252]">Location</span>
                <span className="text-black font-medium">{lead.city}, {lead.country}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#525252]">Rating</span>
                <span className="mono text-black font-semibold">{lead.rating ? `${lead.rating} (312)` : '4.7 (312)'}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#525252]">Source</span>
                <span className="text-black font-medium">Serper.dev, 12 Nov</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="serif text-base font-semibold text-black mb-2">Website tech stack</h3>
            <div className="flex flex-wrap gap-1.5">
              <span className="pill-luxury">WordPress</span>
              <span className="pill-luxury on">Meta Pixel</span>
              <span className="pill-luxury">Google Tag</span>
              <span className="pill-luxury">Next.js</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E5E5E5] space-y-2">
            <h3 className="serif text-base font-semibold text-black mb-2">Direct Outreach Actions</h3>
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
                <span>AI Audit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Timeline & Notes Card (Span 8) */}
        <div className="lg:col-span-8 card-luxury p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
            <h2 className="serif text-xl font-semibold text-black">Timeline &amp; Interactions</h2>
            <button
              onClick={openScheduleMeetingModal}
              className="btn-ghost text-xs"
            >
              Create Google Meet
            </button>
          </div>

          {/* New Note & Voice Dictation */}
          <div className="space-y-3">
            <form onSubmit={handleAddNote} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#525252] font-medium">Record note</span>
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`pill-luxury text-[11px] flex items-center gap-1 ${isListening ? 'on' : ''}`}
                >
                  <Mic className="w-3 h-3" />
                  <span>{isListening ? 'Listening...' : 'Voice typing'}</span>
                </button>
              </div>

              <textarea
                rows={3}
                required
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Type note or strategy note for this client..."
                className="w-full bg-white border border-[#E5E5E5] rounded-xl p-3 text-xs text-black focus:outline-none focus:border-black font-sans"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingNote || !newNote.trim()}
                  className="btn-solid text-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  <span>Post note</span>
                </button>
              </div>
            </form>

            <VoiceNoteRecorder leadId={id!} onVoiceNoteCreated={fetchLeadData} />
          </div>

          {/* Timeline Feed matching Figma */}
          <div className="space-y-4 pt-4 border-t border-[#E5E5E5]">
            {timeline.length === 0 ? (
              <div className="py-8 text-center text-[#737373] text-xs">
                No timeline events yet. Post a note or record a voice note above.
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:left-2 before:w-px before:bg-[#E5E5E5]">
                {timeline.map((event) => {
                  const isCall = event.type === 'call';
                  const isVoice = event.type === 'voice_note';
                  const isMeeting = event.type === 'meeting';

                  return (
                    <div key={event.id} className="relative flex items-start gap-3 pl-6">
                      <div className="absolute left-1 top-1.5 w-2 h-2 rounded-full bg-black" />
                      <div className="flex-1 bg-white border border-[#E5E5E5] rounded-xl p-3.5 shadow-sm text-xs space-y-1">
                        <div className="flex items-center justify-between text-[#737373] text-[11px]">
                          <span className="font-semibold text-black">
                            {event.actorName || 'Team Member'} · {event.type.replace('_', ' ')}
                          </span>
                          <span className="mono">{new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {isVoice ? (
                          <div className="mt-1">
                            <VoiceNotePlayer
                              audioData={event.payload?.audioData}
                              durationSec={event.payload?.durationSec}
                              createdAt={event.createdAt}
                            />
                            {event.payload?.notes && (
                              <p className="text-[#525252] mt-1">{event.payload.notes}</p>
                            )}
                          </div>
                        ) : isMeeting ? (
                          <div className="space-y-1">
                            <span className="pill-luxury on text-[10px]">
                              Meeting: {event.payload?.title || 'Strategy Session'}
                            </span>
                            {event.payload?.meetLink && (
                              <a
                                href={event.payload.meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-black font-semibold underline block mt-1"
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
                            {event.payload?.notes && <p className="text-[#525252]">{event.payload.notes}</p>}
                          </div>
                        ) : (
                          <p className="text-[#525252] whitespace-pre-wrap">{event.payload?.text}</p>
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

      {/* In-App Live Ad Inspector Modal */}
      {showAdPreviewModal && (
        <AdPreviewModal lead={lead} onClose={() => setShowAdPreviewModal(false)} />
      )}

      {/* Schedule Call Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5E5] rounded-[28px] w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
              <h3 className="serif text-xl font-bold text-black flex items-center gap-2">
                <Video className="w-5 h-5 text-black" />
                Schedule Strategy &amp; Pitch Call
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-[#737373] hover:text-black p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-[#525252] mb-1">
                  Meeting Title
                </label>
                <input
                  type="text"
                  required
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl px-3 py-2 text-xs text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#525252] mb-1">
                  Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl px-3 py-2 text-xs text-black mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#525252] mb-1">
                  Google Meet Room (3-4-3 valid link)
                </label>
                <input
                  type="url"
                  value={meetingMeetLink}
                  onChange={(e) => setMeetingMeetLink(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl px-3 py-2 text-xs text-black mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#525252] mb-1">
                  Agenda / Notes
                </label>
                <textarea
                  rows={3}
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl p-3 text-xs text-black font-sans"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E5E5E5]">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulingMeeting}
                  className="btn-solid text-xs disabled:opacity-50"
                >
                  {schedulingMeeting ? 'Scheduling...' : 'Confirm Call'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5E5] rounded-[28px] w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="serif text-xl font-bold text-black flex items-center gap-2">
              <Mail className="w-5 h-5 text-black" />
              Send Outreach Email
            </h3>

            {emailError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {emailError}
              </div>
            )}

            <form onSubmit={handleSendLeadEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-[#525252] mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl px-3 py-2 text-xs text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#525252] mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl px-3 py-2 text-xs text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#525252] mb-1">
                  Message Body
                </label>
                <textarea
                  rows={4}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl p-3 text-xs text-black font-sans"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E5E5E5]">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEmail}
                  className="btn-solid text-xs disabled:opacity-50"
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
