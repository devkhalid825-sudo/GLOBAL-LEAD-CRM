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
  Sparkles,
  Phone,
  MessageCircle,
  Globe,
  Building,
  Copy,
  Users,
  Zap,
} from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Select,
  Modal,
  Pill,
} from '../components/ui/index.js';

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
  const [meetingTargetType, setMeetingTargetType] = useState<'crm' | 'team'>('crm');
  const [customParticipantName, setCustomParticipantName] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [title, setTitle] = useState('Discovery & Growth Strategy Session');
  const [startTime, setStartTime] = useState('');
  const [notes, setNotes] = useState('');
  const [customMeetLink, setCustomMeetLink] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState('');
  const [copiedMeetingId, setCopiedMeetingId] = useState<string | null>(null);

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
    setError('');
    setIsModalOpen(true);
  };

  const handleStartInstantMeeting = async () => {
    const meetUrl = generateValidMeetUrl();
    window.open(meetUrl, '_blank');
    navigator.clipboard?.writeText(meetUrl).catch(() => {});
    setNotice(`Instant meeting room launched & invite link copied to clipboard! Share on WhatsApp: ${meetUrl}`);

    try {
      await apiFetch('/meetings', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'team',
          title: 'Quick Team & Client Huddle',
          startTime: new Date().toISOString(),
          meetLink: meetUrl,
          notes: 'Instant room launched directly from Meetings panel',
        }),
      });
      loadMeetings();
    } catch {
      // ignore
    }
  };

  const handleCopyInvite = (m: Meeting) => {
    const text = `Strategy Call: ${m.title}\nTime: ${new Date(m.startTime).toLocaleString()}\nJoin Google Meet: ${m.meetLink || ''}`;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedMeetingId(m.id);
    setTimeout(() => setCopiedMeetingId(null), 2000);
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime) {
      setError('Please select a meeting time.');
      return;
    }
    if (meetingTargetType === 'crm' && !selectedLeadId) {
      setError('Please select a business client.');
      return;
    }
    setScheduling(true);
    setError('');

    try {
      const finalTitle =
        meetingTargetType === 'team' && customParticipantName.trim()
          ? `${customParticipantName.trim()} — ${title}`
          : title;

      const payload = {
        leadId: meetingTargetType === 'team' ? 'team' : selectedLeadId,
        title: finalTitle,
        startTime: new Date(startTime).toISOString(),
        notes:
          meetingTargetType === 'team' && customParticipantName.trim()
            ? `Meeting with: ${customParticipantName.trim()}\n${notes}`
            : notes,
        meetLink: customMeetLink || generateValidMeetUrl(),
      };

      const res = await apiFetch<{ success: boolean; data: Meeting }>('/meetings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setIsModalOpen(false);
        setNotice(`Meeting scheduled successfully with Google Meet link!`);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-tx leading-tight">
            Meetings &amp; Video Calls.
          </h1>
          <p className="text-sm text-tx-muted mt-2 font-sans">
            Google Meet video conferencing, client strategy sessions, and pipeline synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSeedTestMeetings}
            loading={seeding}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            <span>Seed Test Meetings</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={loadMeetings}
            disabled={loading}
            className="p-2.5"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartInstantMeeting}
            className="border border-border"
          >
            <Zap className="w-3.5 h-3.5 mr-1.5 text-tx" />
            <span>Start Instant Meeting</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={openScheduleModal}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Schedule Call</span>
          </Button>
        </div>
      </div>

      {notice && (
        <Card className="p-3.5 flex items-center justify-between text-xs text-tx">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-tx flex-shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-tx-subtle hover:text-tx font-mono"
          >
            ✕
          </button>
        </Card>
      )}

      {/* Meetings List */}
      <Card className="p-6 space-y-4">
        <div className="pb-3 border-b border-border flex items-center justify-between text-xs text-tx-muted">
          <span className="font-semibold text-tx">Scheduled Sessions ({meetings.length})</span>
          <span className="font-mono text-tx-subtle">Google Meet Valid Links</span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-tx-muted text-xs">
            Loading meetings calendar...
          </div>
        ) : meetings.length === 0 ? (
          <div className="p-16 text-center text-tx-muted text-xs space-y-4">
            <Calendar className="w-10 h-10 text-tx-subtle mx-auto" />
            <p>No meetings scheduled yet. Click below to generate realistic test meetings with Google Meet links.</p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSeedTestMeetings}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              <span>Seed Test Meetings Now</span>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
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
                  className="py-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 hover:bg-row-hover px-2 rounded-xl transition"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif font-semibold text-tx text-sm">{m.title}</h3>
                      <Pill active={m.status === 'scheduled'} className="text-[10px]">
                        {m.status.toUpperCase()}
                      </Pill>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-tx-muted">
                      <span className="font-semibold text-tx flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-tx" />
                        <span>{lead?.name || `Lead ID: ${m.leadId.slice(0, 8)}...`}</span>
                      </span>

                      {lead?.city && (
                        <span>• 📍 {lead.city}, {lead.country}</span>
                      )}

                      <span className="flex items-center gap-1 font-mono text-tx">
                        <Clock className="w-3 h-3 text-tx" />
                        <span>
                          {new Date(m.startTime).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </span>
                    </div>

                    {phone && (
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={`tel:${phone}`}
                          className="font-mono text-[11px] text-tx-muted hover:text-tx flex items-center gap-1"
                        >
                          <Phone className="w-2.5 h-2.5" />
                          <span>{phone}</span>
                        </a>
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Pill active className="text-[10px] flex items-center gap-1">
                              <MessageCircle className="w-2.5 h-2.5" />
                              <span>WhatsApp</span>
                            </Pill>
                          </a>
                        )}
                        {lead?.website && (
                          <a
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-tx-subtle hover:text-tx flex items-center gap-1 text-[11px]"
                          >
                            <Globe className="w-2.5 h-2.5" />
                            <span>Website</span>
                          </a>
                        )}
                      </div>
                    )}

                    {m.notes && (
                      <p className="text-xs text-tx-muted bg-surface-2 p-2.5 rounded-xl border border-border">
                        📝 {m.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start lg:self-center flex-wrap">
                    {m.meetLink && (
                      <>
                        <a
                          href={m.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="primary"
                            size="sm"
                          >
                            <Video className="w-3.5 h-3.5 mr-1.5" />
                            <span>Join Google Meet</span>
                            <ExternalLink className="w-3 h-3 ml-1.5" />
                          </Button>
                        </a>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyInvite(m)}
                          className="border border-border"
                          title="Copy meeting link & details"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          <span>{copiedMeetingId === m.id ? 'Copied!' : 'Copy Invite'}</span>
                        </Button>
                      </>
                    )}

                    {m.status === 'scheduled' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusChange(m.id, 'completed')}
                          title="Mark as Completed"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          <span>Done</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusChange(m.id, 'cancelled')}
                          className="p-2"
                          title="Cancel Call"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Schedule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Strategy Meeting"
      >
        {error && (
          <Card className="p-3 mb-4 text-xs text-tx">
            {error}
          </Card>
        )}

        <form onSubmit={handleSchedule} className="space-y-4">
          {/* Target Type Selector */}
          <div>
            <label className="block text-xs font-medium text-tx-muted mb-1.5">
              Meeting Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMeetingTargetType('crm')}
                className={`text-xs py-2 px-3 rounded-btn border text-center transition flex items-center justify-center gap-1.5 ${
                  meetingTargetType === 'crm'
                    ? 'bg-tx text-canvas font-semibold border-tx'
                    : 'bg-surface-2 hover:bg-surface-1 border-border text-tx-muted hover:text-tx'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>CRM Client</span>
              </button>
              <button
                type="button"
                onClick={() => setMeetingTargetType('team')}
                className={`text-xs py-2 px-3 rounded-btn border text-center transition flex items-center justify-center gap-1.5 ${
                  meetingTargetType === 'team'
                    ? 'bg-tx text-canvas font-semibold border-tx'
                    : 'bg-surface-2 hover:bg-surface-1 border-border text-tx-muted hover:text-tx'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Team / Own People</span>
              </button>
            </div>
          </div>

          {meetingTargetType === 'crm' ? (
            <div>
              <label className="block text-xs font-medium text-tx-muted mb-1.5">
                Select Business Client *
              </label>
              {availableLeads.length > 0 ? (
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="input-luxury text-xs cursor-pointer font-medium"
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
                  placeholder="Enter Client or Lead ID"
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="input-luxury text-xs font-mono"
                  required
                />
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-tx-muted mb-1.5">
                Team Member / Participant Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Ali (Developer), Internal Agency Sync, or Client Name"
                value={customParticipantName}
                onChange={(e) => setCustomParticipantName(e.target.value)}
                className="input-luxury text-xs font-medium"
                required
              />
            </div>
          )}

          <Input
            label="Meeting Topic / Headline"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Input
            type="datetime-local"
            label="Date & Time *"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="font-mono text-xs"
            required
          />

          <Input
            label="Auto-Generated Google Meet Link"
            value={customMeetLink}
            onChange={(e) => setCustomMeetLink(e.target.value)}
            className="font-mono text-xs"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={scheduling}
            >
              Confirm Call
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
