import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/client.js';
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
} from 'lucide-react';

interface Meeting {
  id: string;
  leadId: string;
  title: string;
  startTime: string;
  endTime?: string;
  meetLink?: string;
  status: string;
  notes?: string;
}

export const MeetingsPage: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  // New Meeting Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leadId, setLeadId] = useState('');
  const [title, setTitle] = useState('');
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

  useEffect(() => {
    loadMeetings();
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !title || !startTime) {
      setError('Lead ID, meeting title, and date/time are required');
      return;
    }

    setScheduling(true);
    setError('');

    try {
      const res = await apiFetch<{ success: boolean; data: Meeting }>('/meetings', {
        method: 'POST',
        body: JSON.stringify({
          leadId,
          title,
          startTime,
          meetLink: customMeetLink || undefined,
          notes,
        }),
      });

      if (res.success) {
        setIsModalOpen(false);
        setTitle('');
        setLeadId('');
        setStartTime('');
        setNotes('');
        setCustomMeetLink('');
        loadMeetings();
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
            Meetings & Strategy Calls
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Google Meet video conferencing, strategy sessions, and client syncs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadMeetings}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-all border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-900/20"
          >
            <Plus className="w-4 h-4" />
            Schedule Call
          </button>
        </div>
      </div>

      {/* Meetings List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
            Loading meetings calendar...
          </div>
        ) : meetings.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            No meetings scheduled yet. Click "Schedule Call" to book a session.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {meetings.map((m) => (
              <div
                key={m.id}
                className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-800/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-white text-base">{m.title}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
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
                  <div className="text-xs text-slate-400 flex items-center gap-3">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      {new Date(m.startTime).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-400">Lead: {m.leadId.slice(0, 8)}...</span>
                  </div>
                  {m.notes && <p className="text-xs text-slate-400 mt-1">{m.notes}</p>}
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-center flex-wrap">
                  {m.meetLink && (
                    <a
                      href={m.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-indigo-900/30"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Join Google Meet
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {m.status === 'scheduled' && (
                    <button
                      onClick={() => handleStatusChange(m.id, 'completed')}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400"
                      title="Mark as Completed"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
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
                  Lead ID
                </label>
                <input
                  type="text"
                  placeholder="Lead UUID"
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Meeting Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Discovery & Growth Strategy Call"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Custom Meeting URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="Leave blank to auto-generate Google Meet URL"
                  value={customMeetLink}
                  onChange={(e) => setCustomMeetLink(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Meeting Agenda / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Key topics to discuss..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
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
