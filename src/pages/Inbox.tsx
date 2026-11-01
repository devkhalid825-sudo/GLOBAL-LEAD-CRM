import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/client.js';
import {
  Inbox,
  Send,
  Mail,
  Search,
  RefreshCw,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';

interface EmailMessage {
  id: string;
  leadId?: string;
  direction: string;
  from: string;
  to: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  status: string;
  createdAt: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  category: string;
}

export const InboxPage: React.FC = () => {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [sending, setSending] = useState(false);
  const [composeError, setComposeError] = useState('');
  const [composeSuccess, setComposeSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [emailsRes, templatesRes] = await Promise.all([
        apiFetch<{ success: boolean; data: EmailMessage[] }>('/emails'),
        apiFetch<{ success: boolean; data: EmailTemplate[] }>('/emails/templates'),
      ]);

      if (emailsRes.success) setEmails(emailsRes.data);
      if (templatesRes.success) setTemplates(templatesRes.data);
    } catch (err) {
      console.error('Failed to load email inbox:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      setComposeSubject(tpl.subject);
      setComposeBody(tpl.bodyText || tpl.bodyHtml.replace(/<[^>]+>/g, ''));
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeSubject) {
      setComposeError('Recipient email and subject are required');
      return;
    }

    setSending(true);
    setComposeError('');
    setComposeSuccess('');

    try {
      const res = await apiFetch<{ success: boolean; data: EmailMessage }>('/emails/send', {
        method: 'POST',
        body: JSON.stringify({
          to: composeTo,
          subject: composeSubject,
          bodyText: composeBody,
          bodyHtml: `<p>${composeBody.replace(/\n/g, '<br/>')}</p>`,
          templateId: selectedTemplateId || undefined,
        }),
      });

      if (res.success) {
        setComposeSuccess('Email dispatched and logged successfully!');
        setTimeout(() => {
          setIsComposeOpen(false);
          setComposeTo('');
          setComposeSubject('');
          setComposeBody('');
          setSelectedTemplateId('');
          setComposeSuccess('');
          loadData();
        }, 1200);
      }
    } catch (err: any) {
      setComposeError(err.message || 'Failed to dispatch email');
    } finally {
      setSending(false);
    }
  };

  const filteredEmails = emails.filter(
    (m) =>
      m.subject.toLowerCase().includes(search.toLowerCase()) ||
      m.to.toLowerCase().includes(search.toLowerCase()) ||
      m.from.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Inbox className="w-7 h-7 text-emerald-400" />
            Unified Outreach Inbox
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Outbound commercial emails, responses, and automated lead follow-up logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-all border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsComposeOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-900/20"
          >
            <Plus className="w-4 h-4" />
            Compose Email
          </button>
        </div>
      </div>

      {/* Main Inbox Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        {/* Email List Sidebar */}
        <div
          className={`lg:col-span-5 border-r border-slate-800 flex flex-col ${
            selectedEmail ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Search bar */}
          <div className="p-4 border-b border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search subject or recipient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                Loading messages...
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No email messages found. Click Compose Email to initiate outreach.
              </div>
            ) : (
              filteredEmails.map((msg) => {
                const isSelected = selectedEmail?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedEmail(msg)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-slate-800/70' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-white truncate max-w-[180px]">
                        {msg.to}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {new Date(msg.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-slate-200 truncate">
                      {msg.subject}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-400 truncate max-w-[220px]">
                        {msg.bodyText || 'No plain text preview'}
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {msg.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Email Detail Preview */}
        <div
          className={`lg:col-span-7 flex flex-col bg-slate-950/40 ${
            selectedEmail ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {selectedEmail ? (
            <div className="p-4 sm:p-6 flex-1 flex flex-col">
              <div className="border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedEmail(null)}
                      className="lg:hidden p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      title="Back to inbox list"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-base sm:text-xl font-bold text-white leading-tight">
                      {selectedEmail.subject}
                    </h2>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {selectedEmail.status.toUpperCase()}
                  </span>
                </div>
                <div className="mt-3 text-xs text-slate-400 space-y-1">
                  <div>
                    <strong className="text-slate-300">From:</strong> {selectedEmail.from}
                  </div>
                  <div>
                    <strong className="text-slate-300">To:</strong> {selectedEmail.to}
                  </div>
                  <div>
                    <strong className="text-slate-300">Sent Date:</strong>{' '}
                    {new Date(selectedEmail.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Message Body */}
              <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-sm text-slate-200 leading-relaxed overflow-y-auto">
                {selectedEmail.bodyHtml ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
                    className="prose prose-invert prose-sm max-w-none"
                  />
                ) : (
                  <pre className="font-sans whitespace-pre-wrap">{selectedEmail.bodyText}</pre>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <Mail className="w-12 h-12 text-slate-700 mb-3" />
              <p className="text-sm">Select an email message from the list to preview content.</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Email Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-400" />
                Compose Outreach Email
              </h3>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {composeError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {composeError}
              </div>
            )}

            {composeSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {composeSuccess}
              </div>
            )}

            <form onSubmit={handleSendEmail} className="space-y-4">
              {/* Template selector */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Load Template (Optional)
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose pre-built template --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* To field */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. client@example.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quick question regarding your online growth"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Message Body
                </label>
                <textarea
                  rows={6}
                  placeholder="Write your email body or select a template above..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-sans"
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20"
                >
                  {sending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
