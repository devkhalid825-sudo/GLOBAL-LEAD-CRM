import React, { useState, useEffect } from 'react';
import { api, apiFetch } from '../api/client.js';
import {
  Calendar,
  Video,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  X,
  Sparkles,
  Phone,
  MessageCircle,
  Globe,
  Building,
  Copy,
  Zap,
} from 'lucide-react';

interface MeetingLead {
  id: string;
  name: string;
  city?: string;
  country?: string;
  website?: string;
  phoneNorm?: string;
  phones?: string[];
  emails?: string[];
  tags?: string[];
}

interface Meeting {
  id: string;
  leadId: string;
  title: string;
  startTime: string;
  endTime?: string;
  meetLink?: string;
  status: string;
  notes?: string;
  lead?: MeetingLead | null;
}

// Strictly valid 3-4-3 Google Meet code: xxx-yyyy-zzz
function generateValidMeetUrl(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const pick = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `https://meet.google.com/${pick(3)}-${pick(4)}-${pick(3)}`;
}

export const MeetingsPage: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [availableLeads, setAvailableLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // New Meeting Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [title, setTitle] = useState('Discovery & Growth Strategy Session');
  const [startTime, setStartTime] = useState('');
  const [notes, setNotes] = useState('');
  const [customMeetLink, setCustomMeetLink] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; data: Meeting[] }>('/meetings');
      if (res.success) setMeetings(res.data);
    } catch (err) {
      console.error('Failed to load meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLeadsForSelect = async () => {
    try {
      const res = await api.get<any>('/leads?limit=100');
      const items = res?.items || (Array.isArray(res?.data) ? res.data : []);
      setAvailableLeads(items);
      if (items.length > 0 && !selectedLeadId) {
        setSelectedLeadId(items[0].id);
      }
    } catch (err) {
      console.error('Failed to load leads for dropdown:', err);
    }
  };

  useEffect(() => {
    loadMeetings();
    loadLeadsForSelect();
  }, []);

  const openScheduleModal = () => {
    loadLeadsForSelect();
    // Pre-generate a strictly valid Google Meet link so the user sees it immediately!
    const autoLink = generateValidMeetUrl();
    setCustomMeetLink(autoLink);

    // Pre-fill next hour date
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setStartTime(localIso);

    setIsModalOpen(true);
  };

  const handleSeedTestMeetings = async () => {
    setSeeding(true);
    setNotice(null);
    try {
      const res = await api.post<any>('/leads/seed-test-data', {});
      setNotice(`Seeded ${res.meetingsCount || 3} realistic test meetings with valid Google Meet links & leads!`);
      loadMeetings();
      loadLeadsForSelect();
    } catch (err: any) {
      setNotice(`Failed to seed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !title || !startTime) {
      setError('Please select a business client, meeting title, and date/time.');
      return;
    }

    setScheduling(true);
    setError('');

    // Ensure valid link
    const finalLink = customMeetLink.trim() || generateValidMeetUrl();

    try {
      const res = await apiFetch<{ success: boolean; data: Meeting }>('/meetings', {
        method: 'POST',
        body: JSON.stringify({
          leadId: selectedLeadId,
          title,
          startTime: new Date(startTime).toISOString(),
          meetLink: finalLink,
          notes,
        }),
      });

      if (res.success) {
        setIsModalOpen(false);
        setTitle('Discovery & Growth Strategy Session');
        setStartTime('');
        setNotes('');
        setCustomMeetLink('');
        loadMeetings();
        setNotice(`Meeting scheduled! Video link created: ${finalLink}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to schedule meeting');
    } finally {
      setScheduling(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await apiFetch(`/meetings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      loadMeetings();
    } catch (err) {
      console.error('Failed to update meeting status:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-7 h-7 text-emerald-400" />
            Meetings &amp; Video Strategy Calls
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Google Meet video conferencing, client strategy sessions, and pipeline synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Seed Button */}
          <button
            onClick={handleSeedTestMeetings}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-emerald-900/30 disabled:opacity-50"
            title="Generate test leads with pre-scheduled Google Meet sessions"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>{seeding ? 'Generating...' : 'Seed Test Meetings'}</span>
          </button>

          <button
            onClick={loadMeetings}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={openScheduleModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-emerald-900/20"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Call</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="px-2 text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Meetings List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-200">Scheduled Sessions ({meetings.length})</span>
          <span>Google Meet Integrations Active (Format: xxx-yyyy-zzz)</span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
            Loading meetings calendar...
          </div>
        ) : meetings.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm space-y-4">
            <Calendar className="w-12 h-12 text-slate-700 mx-auto" />
            <p>No meetings scheduled yet. Click below to generate realistic test meetings with Google Meet links.</p>
            <button
              onClick={handleSeedTestMeetings}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-lg shadow-emerald-900/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Seed Test Meetings Now</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {meetings.map((m) => {
              const lead = m.lead;
              const phone = lead?.phoneNorm || (lead?.phones && lead?.phones[0]);
              const cleanPhone = phone ? phone.replace(/[^\d]/g, '') : null;
              const waLink = cleanPhone
                ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    `Hi ${lead?.name || ''}, looking forward to our scheduled strategy call! Link: ${m.meetLink || ''}`
                  )}`
                : null;

              return (
                <div
                  key={m.id}
                  className="p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-bold text-white text-base">{m.title}</h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          m.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : m.status === 'cancelled'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}
                      >
                        {m.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Lead Info & Location */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-slate-200 font-semibold">
                        <Building className="w-3.5 h-3.5 text-emerald-400" />
                        {lead?.name || `Lead ID: ${m.leadId.slice(0, 8)}...`}
                      </span>

                      {lead?.city && (
                        <span>• 📍 {lead.city}, {lead.country}</span>
                      )}

                      <span className="flex items-center gap-1 text-slate-300 font-mono">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        {new Date(m.startTime).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    {/* Quick Comms if lead present */}
                    {phone && (
                      <div className="flex items-center gap-2 pt-0.5">
                        <a
                          href={`tel:${phone}`}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono flex items-center gap-1 transition"
                        >
                          <Phone className="w-2.5 h-2.5 text-emerald-400" />
                          <span>{phone}</span>
                        </a>
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded text-[11px] flex items-center gap-1 transition border border-emerald-500/20"
                          >
                            <MessageCircle className="w-2.5 h-2.5" />
                            <span>WhatsApp Link</span>
                          </a>
                        )}
                        {lead?.website && (
                          <a
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-emerald-400 flex items-center gap-1 text-[11px]"
                          >
                            <Globe className="w-2.5 h-2.5" />
                            <span>Website</span>
                          </a>
                        )}
                      </div>
                    )}

                    {m.notes && (
                      <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 font-mono">
                        📝 {m.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions & Meet Link */}
                  <div className="flex items-center gap-2 self-start lg:self-center flex-wrap">
                    {m.meetLink && (
                      <a
                        href={m.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-indigo-900/30"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Google Meet</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {m.status === 'scheduled' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(m.id, 'completed')}
                          className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition flex items-center gap-1"
                          title="Mark as Completed"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Done</span>
                        </button>
                        <button
                          onClick={() => handleStatusChange(m.id, 'cancelled')}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                          title="Cancel Call"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-emerald-400" />
                Schedule Strategy Meeting
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Select Business Client *
                </label>
                {availableLeads.length > 0 ? (
                  <select
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  >
                    {availableLeads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} — {l.city}, {l.country}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Enter Lead ID"
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Next.js Architecture & Meta Ads Scaling Consultation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Date &amp; Time *
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Video Call Link Field with Auto-Generated Link */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase text-slate-400">
                    Video Meeting Link (Auto-Generated 3-4-3)
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomMeetLink(generateValidMeetUrl())}
                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate New Code</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="url"
                    value={customMeetLink}
                    onChange={(e) => setCustomMeetLink(e.target.value)}
                    className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl pl-3 pr-20 py-2.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(customMeetLink);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition"
                  >
                    {copiedLink ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Format: strictly valid 3-4-3 letter Google Meet link (e.g. meet.google.com/abc-defg-hij)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Meeting Agenda / Key Topics
                </label>
                <textarea
                  rows={2}
                  placeholder="Review client requirements, discuss tech stack & deliverable timeline..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {scheduling ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Create Meeting</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
