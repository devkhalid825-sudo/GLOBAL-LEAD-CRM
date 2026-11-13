import React, { useState } from 'react';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { Modal, Button, Textarea, Pill, Progress } from '../ui/index.js';

interface BulkWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeads: Array<{
    id: string;
    name: string;
    phone?: string;
    phoneNorm?: string;
    phones?: string[];
    city?: string;
    country?: string;
    categoryName?: string;
  }>;
  onSuccess?: () => void;
  onOpenConnectModal?: () => void;
}

export const BulkWhatsAppModal: React.FC<BulkWhatsAppModalProps> = ({
  isOpen,
  onClose,
  selectedLeads,
  onSuccess,
  onOpenConnectModal,
}) => {
  const defaultTemplate =
    "Hi {{name}} team, noticed your business in {{city}}! We help top {{category}} operations scale customer acquisition with high-converting web systems and digital funnels. Would you be open to a quick 2-minute overview this week?";

  const [template, setTemplate] = useState(defaultTemplate);
  const [delaySec, setDelaySec] = useState(4);
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validLeads = selectedLeads.filter(
    (l) => l.phoneNorm || (Array.isArray(l.phones) && l.phones[0]) || l.phone
  );

  const handleStartBroadcast = async () => {
    if (validLeads.length === 0) {
      setError('None of the selected leads have a valid phone number.');
      return;
    }

    setError(null);
    setIsSending(true);
    setProgress(10);

    try {
      const res: any = await api.post('/whatsapp/broadcast', {
        leads: validLeads,
        template,
        delaySeconds: delaySec,
      });

      setProgress(100);
      setResults(res.data?.results || []);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const errMsg = err.message || 'Failed to dispatch broadcast';
      setError(errMsg);
      if (errMsg.toLowerCase().includes('not connected') && onOpenConnectModal) {
        onOpenConnectModal();
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSending) onClose();
      }}
      title="Bulk WhatsApp broadcast"
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 rounded-btn border border-border bg-surface-2 text-xs text-tx flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-tx flex-shrink-0" />
              <span>{error}</span>
            </div>
            {error.toLowerCase().includes('not connected') && onOpenConnectModal && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenConnectModal();
                }}
              >
                <QrCode className="w-3.5 h-3.5 mr-1" />
                <span>Link Device</span>
              </Button>
            )}
          </div>
        )}

        {/* Lead Count Overview */}
        <div className="flex items-center justify-between pb-3 border-b border-border text-xs">
          <div>
            <span className="text-tx font-semibold serif text-sm">
              Target Audience: {selectedLeads.length} leads
            </span>
            <span className="text-tx-subtle block mono text-[11px] mt-0.5">
              {validLeads.length} with direct dialable phone numbers
            </span>
          </div>
          <Pill active className="text-[11px]">
            Anti-Ban Protected
          </Pill>
        </div>

        {/* RESULTS SCREEN AFTER DISPATCH */}
        {results ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-surface-2 rounded-card border border-border text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-tx mx-auto" />
              <h3 className="serif text-base font-bold text-tx">Broadcast Completed!</h3>
              <p className="text-xs text-tx-muted">
                Sent to <strong className="text-tx mono">{results.filter((r) => r.status === 'sent').length}</strong> businesses. When clients reply, they will ring straight on your phone!
              </p>
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-border border border-border rounded-btn bg-surface-1 text-xs">
              {results.map((r, i) => (
                <div key={i} className="p-2.5 flex items-center justify-between">
                  <span className="font-medium text-tx truncate max-w-[180px]">{r.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="mono text-tx-muted text-[11px]">{r.phone}</span>
                    <Pill active={r.status === 'sent'} className="text-[10px]">
                      {r.status === 'sent' ? 'Sent' : 'Failed'}
                    </Pill>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <Button variant="primary" onClick={onClose} size="sm">
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* BROADCAST CONFIGURATION SCREEN */
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-tx">Message pitch template</span>
                <span className="text-[10px] text-tx-subtle mono">Dynamic tags supported</span>
              </div>
              <Textarea
                rows={5}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                disabled={isSending}
                className="text-xs font-sans leading-relaxed"
              />
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[10px] text-tx-subtle font-medium">Click tag to insert:</span>
                {['{{name}}', '{{city}}', '{{category}}'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setTemplate((prev) => `${prev} ${tag}`)}
                    disabled={isSending}
                    className="mono text-[10px] px-2 py-0.5 rounded bg-surface-2 hover:bg-surface-1 border border-border text-tx transition"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Anti-Ban Human Jitter Pacing */}
            <div className="p-3 bg-surface-2 rounded-card border border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-tx" />
                <div>
                  <span className="font-medium text-tx block">Anti-Ban Pacing Delay</span>
                  <span className="text-tx-subtle text-[11px]">Human-like interval between sends</span>
                </div>
              </div>
              <select
                value={delaySec}
                onChange={(e) => setDelaySec(Number(e.target.value))}
                disabled={isSending}
                className="input-luxury text-xs py-1 px-2.5 font-mono"
              >
                <option value={4}>4-6 seconds (Fast)</option>
                <option value={7}>7-9 seconds (Recommended)</option>
                <option value={12}>12-15 seconds (High safety)</option>
              </select>
            </div>

            {/* Progress Bar while Sending */}
            {isSending && (
              <div className="space-y-2 py-2">
                <div className="flex items-center justify-between text-xs mono">
                  <span className="text-tx flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-tx animate-spin" />
                    <span>Sending broadcast campaign...</span>
                  </span>
                  <span className="text-tx-muted">{progress}%</span>
                </div>
                <Progress value={progress} />
                <span className="text-[10px] text-tx-subtle block text-center mono">
                  Messages are being sent from your linked WhatsApp number. Keep this window open.
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={isSending}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleStartBroadcast}
                loading={isSending}
                disabled={isSending || validLeads.length === 0}
                size="sm"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                <span>Launch {validLeads.length} WhatsApp Messages</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
