import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/client.js';
import {
  Inbox,
  Send,
  Mail,
  Search,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Select,
  Textarea,
  Modal,
  Pill,
} from '../components/ui/index.js';

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-tx leading-tight">
            Unified Outreach Inbox.
          </h1>
          <p className="text-sm text-tx-muted mt-2 font-sans">
            Outbound commercial emails, responses, and automated lead follow-up logs.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsComposeOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Compose Email</span>
          </Button>
        </div>
      </div>

      {/* Main Inbox Card */}
      <Card className="p-0 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        {/* Email List Sidebar */}
        <div
          className={`lg:col-span-5 border-r border-border flex flex-col bg-surface-1 ${
            selectedEmail ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Search bar */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-tx-subtle" />
              <input
                type="text"
                placeholder="Search subject or recipient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-luxury pl-9 text-xs"
              />
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {loading ? (
              <div className="p-8 text-center text-tx-muted text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-tx mb-2" />
                Loading messages...
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="p-8 text-center text-tx-muted text-xs">
                No email messages found. Click Compose Email to initiate outreach.
              </div>
            ) : (
              filteredEmails.map((msg) => {
                const isSelected = selectedEmail?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedEmail(msg)}
                    className={`p-4 cursor-pointer transition ${
                      isSelected ? 'bg-surface-2' : 'hover:bg-row-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-tx truncate max-w-[180px]">
                        {msg.to}
                      </span>
                      <span className="text-tx-subtle font-mono text-[11px]">
                        {new Date(msg.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="text-xs font-serif font-semibold text-tx truncate">
                      {msg.subject}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-tx-muted truncate max-w-[220px]">
                        {msg.bodyText || 'No plain text preview'}
                      </span>
                      <Pill active={msg.status === 'sent'} className="text-[10px]">
                        {msg.status}
                      </Pill>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Email Detail Preview */}
        <div
          className={`lg:col-span-7 flex flex-col bg-canvas ${
            selectedEmail ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {selectedEmail ? (
            <div className="p-4 sm:p-6 flex-1 flex flex-col">
              <div className="border-b border-border pb-4 mb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedEmail(null)}
                      className="lg:hidden p-1.5 -ml-1 text-tx-muted hover:text-tx rounded-lg hover:bg-surface-2 transition"
                      title="Back to inbox list"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="font-serif text-base sm:text-xl font-bold text-tx leading-tight">
                      {selectedEmail.subject}
                    </h2>
                  </div>
                  <Pill active={selectedEmail.status === 'sent'} className="text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{selectedEmail.status.toUpperCase()}</span>
                  </Pill>
                </div>
                <div className="mt-3 text-xs text-tx-muted space-y-1 font-mono">
                  <div>
                    <strong className="text-tx font-sans">From:</strong> {selectedEmail.from}
                  </div>
                  <div>
                    <strong className="text-tx font-sans">To:</strong> {selectedEmail.to}
                  </div>
                  <div>
                    <strong className="text-tx font-sans">Sent Date:</strong>{' '}
                    {new Date(selectedEmail.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Message Body */}
              <div className="flex-1 bg-surface-1 border border-border rounded-xl p-5 text-xs text-tx leading-relaxed overflow-y-auto">
                {selectedEmail.bodyHtml ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
                    className="prose prose-sm max-w-none text-tx"
                  />
                ) : (
                  <pre className="font-sans whitespace-pre-wrap">{selectedEmail.bodyText}</pre>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-tx-subtle">
              <Mail className="w-12 h-12 text-tx-subtle mb-3" />
              <p className="text-xs">Select an email message from the list to preview content.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Compose Email Modal */}
      <Modal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        title="Compose Outreach Email"
      >
        {composeError && (
          <Card className="p-3 mb-4 text-xs text-tx flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{composeError}</span>
          </Card>
        )}

        {composeSuccess && (
          <Card className="p-3 mb-4 text-xs text-tx flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{composeSuccess}</span>
          </Card>
        )}

        <form onSubmit={handleSendEmail} className="space-y-4">
          <Select
            label="Load Template (Optional)"
            value={selectedTemplateId}
            onChange={(e) => handleTemplateChange(e.target.value)}
          >
            <option value="">-- Choose pre-built template --</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.category})
              </option>
            ))}
          </Select>

          <Input
            type="email"
            label="Recipient Email *"
            placeholder="e.g. client@example.com"
            value={composeTo}
            onChange={(e) => setComposeTo(e.target.value)}
            className="font-mono text-xs"
            required
          />

          <Input
            label="Subject Line *"
            placeholder="e.g. Quick question regarding your online growth"
            value={composeSubject}
            onChange={(e) => setComposeSubject(e.target.value)}
            required
          />

          <Textarea
            rows={6}
            label="Message Body"
            placeholder="Write your email body or select a template above..."
            value={composeBody}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComposeBody(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsComposeOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={sending}
            >
              Send Message
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
