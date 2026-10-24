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
  const waLink = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Hi ${lead.name}, I wanted to follow up with you regarding our services.`
      )}`
    : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Bar Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/leads')}
          className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{lead.name}</h1>
          <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {lead.address || `${lead.city}, ${lead.country}`}
            </span>
          </p>
        </div>
      </div>

      {/* Action Bar (One-click Comms) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
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
              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Message</span>
            </a>
          )}

          <button
            onClick={() => setShowCallModal(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Log Call Outcome</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Status:</span>
          <span className="px-3 py-1 rounded-full uppercase font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {lead.status}
          </span>
        </div>
      </div>

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
    </div>
  );
};
