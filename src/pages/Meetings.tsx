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

  const loadLeadsForSelection = async () => {
    try {
      const res = await api.get<any>('/leads?limit=50');
      const list = res?.items || (Array.isArray(res?.data) ? res.data : []);
      setAvailableLeads(list);
      if (list.length > 0 && !selectedLeadId) {
        setSelectedLeadId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load leads for modal:', err);
    }
  };

  useEffect(() => {
    loadMeetings();
    loadLeadsForSelection();
  }, []);

  const openScheduleModal = () => {
    setCustomMeetLink(generateValidMeetUrl());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const offset = tomorrow.getTimezoneOffset() * 60000;
    const localISOTime = new Date(tomorrow.getTime() - offset).toISOString().slice(0, 16);
    setStartTime(localISOTime);
    setIsModalOpen(true);
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !startTime) {
      setError('Please select a client and meeting time.');
      return;
    }
    setScheduling(true);
    setError('');

    try {
      const payload = {
        leadId: selectedLeadId,
        title,
        startTime: new Date(startTime).toISOString(),
        notes,
        meetLink: customMeetLink || generateValidMeetUrl(),
      };

      const res = await apiFetch<{ success: boolean; data: Meeting }>('/meetings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setIsModalOpen(false);
        setNotice(`Strategy call scheduled with ${res.data.lead?.name || 'client'}!`);
        loadMeetings();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to schedule meeting');
    } finally {
      setScheduling(false);
    }
  };

  const handleSeedTestMeetings = async () => {
    setSeeding(true);
    setNotice(null);
    try {
      const res = await api.post<any>('/leads/seed-test-data', {});
      setNotice(`Generated test meetings with Google Meet links for ${res.meetingsCount} clients!`);
      loadMeetings();
    } catch (err: any) {
      setNotice(`Failed to seed meetings: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleStatusChange = async (meetingId: string, status: string) => {
    try {
      await apiFetch(`/meetings/${meetingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setMeetings((prev) =>
        prev.map((m) => (m.id === meetingId ? { ...m, status } : m))
      );
    } catch (err) {
      console.error('Failed to update meeting status:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Editorial Luxury Header matching Figma */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-[#E5E5E5]">
        <div>
          <h1 className="serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-black leading-tight">
            Meetings &amp; Video Calls.
          </h1>
          <p className="text-sm text-[#525252] mt-2 font-sans">
            Google Meet video conferencing, client strategy sessions, and pipeline synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleSeedTestMeetings}
            disabled={seeding}
            className="btn-solid text-xs flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{seeding ? 'Generating...' : 'Seed Test Meetings'}</span>
          </button>

          <button
            onClick={loadMeetings}
            disabled={loading}
            className="btn-ghost text-xs p-2.5"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-black ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openScheduleModal}
            className="btn-solid text-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Call</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 bg-[#F8F8F8] border border-[#E5E5E5] rounded-2xl text-black text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-black flex-shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-[#737373] hover:text-black">✕</button>
        </div>
      )}

      {/* Meetings List */}
      <div className="card-luxury p-6 space-y-4">
        <div className="pb-3 border-b border-[#E5E5E5] flex items-center justify-between text-xs text-[#525252]">
          <span className="font-semibold text-black">Scheduled Sessions ({meetings.length})</span>
          <span className="mono">Google Meet Valid Links</span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-[#737373] text-xs">
            Loading meetings calendar...
          </div>
        ) : meetings.length === 0 ? (
          <div className="p-16 text-center text-[#737373] text-xs space-y-4">
            <Calendar className="w-10 h-10 text-[#737373] mx-auto" />
            <p>No meetings scheduled yet. Click below to generate realistic test meetings with Google Meet links.</p>
            <button
              onClick={handleSeedTestMeetings}
              className="btn-solid text-xs inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Seed Test Meetings Now</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E5E5]">
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
                  className="py-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 hover:bg-[#F0F0F0] px-2 rounded-xl transition"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="serif font-semibold text-black text-sm">{m.title}</h3>
                      <span className="pill-luxury text-[10px]">
                        {m.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#525252]">
                      <span className="font-semibold text-black flex items-center gap-1">
                        <Building className="w-3.5 h-3.5" />
                        {lead?.name || `Lead ID: ${m.leadId.slice(0, 8)}...`}
                      </span>

                      {lead?.city && (
                        <span>• 📍 {lead.city}, {lead.country}</span>
                      )}

                      <span className="flex items-center gap-1 mono text-black">
                        <Clock className="w-3 h-3 text-black" />
                        {new Date(m.startTime).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    {phone && (
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={`tel:${phone}`}
                          className="btn-ghost text-[11px] py-1 px-2.5 flex items-center gap-1 mono"
                        >
                          <Phone className="w-2.5 h-2.5" />
                          <span>{phone}</span>
                        </a>
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="pill-luxury on text-[11px] flex items-center gap-1"
                          >
                            <MessageCircle className="w-2.5 h-2.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                        {lead?.website && (
                          <a
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#737373] hover:text-black flex items-center gap-1 text-[11px]"
                          >
                            <Globe className="w-2.5 h-2.5" />
                            <span>Website</span>
                          </a>
                        )}
                      </div>
                    )}

                    {m.notes && (
                      <p className="text-xs text-[#525252] bg-white p-2.5 rounded-xl border border-[#E5E5E5]">
                        📝 {m.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start lg:self-center flex-wrap">
                    {m.meetLink && (
                      <a
                        href={m.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-solid text-xs flex items-center gap-1.5 py-2 px-3.5"
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
                          className="btn-ghost text-xs py-2 px-3 flex items-center gap-1"
                          title="Mark as Completed"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Done</span>
                        </button>
                        <button
                          onClick={() => handleStatusChange(m.id, 'cancelled')}
                          className="btn-ghost p-2 text-[#737373] hover:text-rose-600"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5E5] rounded-[28px] max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#E5E5E5] pb-3">
              <h3 className="serif text-xl font-bold text-black flex items-center gap-2">
                <Video className="w-5 h-5 text-black" />
                Schedule Strategy Meeting
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#737373] hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-[#525252] mb-1">
                  Select Business Client *
                </label>
                {availableLeads.length > 0 ? (
                  <select
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                    className="w-full bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl px-3 py-2.5 text-xs text-black focus:outline-none focus:border-black font-medium"
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
                    className="w-full bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl px-3 py-2 text-xs text-black mono focus:outline-none focus:border-black"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#525252] mb-1">
                  Meeting Topic / Headline
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#525252] mb-1">
                  Date &amp; Time *
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl px-3 py-2 text-xs text-black mono focus:outline-none focus:border-black"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#525252] mb-1">
                  Auto-Generated Google Meet Link
                </label>
                <input
                  type="text"
                  value={customMeetLink}
                  onChange={(e) => setCustomMeetLink(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl px-3 py-2 text-xs text-black mono focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5E5]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="btn-solid text-xs disabled:opacity-50"
                >
                  {scheduling ? 'Scheduling...' : 'Confirm Call'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
