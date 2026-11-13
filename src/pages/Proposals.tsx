import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/client.js';
import {
  FileText,
  Plus,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  Trash2,
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

interface ProposalItem {
  item: string;
  qty: number;
  rate: number;
}

interface Proposal {
  id: string;
  leadId: string;
  token: string;
  title: string;
  currency: string;
  items: ProposalItem[];
  totalAmount: number;
  status: string;
  notes?: string;
  createdAt: string;
}

export const ProposalsPage: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // New Proposal Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableLeads, setAvailableLeads] = useState<any[]>([]);
  const [leadId, setLeadId] = useState('');
  const [title, setTitle] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [items, setItems] = useState<ProposalItem[]>([
    { item: 'Digital Strategy & Acquisition Setup', qty: 1, rate: 500 },
  ]);
  const [notes, setNotes] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadProposals = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; data: Proposal[] }>('/proposals');
      if (res.success) setProposals(res.data);
    } catch (err) {
      console.error('Failed to load proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLeadsForSelection = async () => {
    try {
      const res = await apiFetch<any>('/leads?limit=50');
      const list = res?.items || (Array.isArray(res?.data) ? res.data : []);
      setAvailableLeads(list);
      if (list.length > 0 && !leadId) {
        setLeadId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load leads for proposals:', err);
    }
  };

  useEffect(() => {
    loadProposals();
    loadLeadsForSelection();
  }, []);

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/p/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleAddItem = () => {
    setItems([...items, { item: '', qty: 1, rate: 100 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ProposalItem, val: any) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: val };
    setItems(next);
  };

  const calculateTotal = () => {
    return items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
  };

  const handleAIGenerate = async () => {
    if (!leadId) {
      setErrorMessage('Please enter a Lead ID to generate a proposal with AI');
      return;
    }
    setGeneratingAI(true);
    setErrorMessage('');
    try {
      const res = await apiFetch<{
        success: boolean;
        data: { title: string; items: ProposalItem[]; notes: string };
      }>('/proposals/ai-generate', {
        method: 'POST',
        body: JSON.stringify({ leadId }),
      });

      if (res.success && res.data) {
        setTitle(res.data.title || title);
        if (res.data.items && res.data.items.length > 0) setItems(res.data.items);
        if (res.data.notes) setNotes(res.data.notes);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'AI proposal generation failed');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !title || items.length === 0) {
      setErrorMessage('Please fill out all required fields');
      return;
    }
    setSubmitting(true);
    setErrorMessage('');

    try {
      const res = await apiFetch<{ success: boolean; data: Proposal }>('/proposals', {
        method: 'POST',
        body: JSON.stringify({
          leadId,
          title,
          currency,
          items,
          notes,
        }),
      });

      if (res.success) {
        setIsModalOpen(false);
        setLeadId('');
        setTitle('');
        setNotes('');
        setItems([{ item: 'Digital Strategy & Acquisition Setup', qty: 1, rate: 500 }]);
        loadProposals();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create proposal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-tx leading-tight">
            Commercial Proposals.
          </h1>
          <p className="text-sm text-tx-muted mt-2 font-sans">
            Generate itemized proposals with AI and share private tokenized links with clients.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadProposals}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>New Proposal</span>
          </Button>
        </div>
      </div>

      {/* Proposals Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-tx-muted text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-tx mb-2" />
            Loading commercial proposals...
          </div>
        ) : proposals.length === 0 ? (
          <div className="p-12 text-center text-tx-muted text-xs">
            <FileText className="w-10 h-10 text-tx-subtle mx-auto mb-3" />
            No proposals generated yet. Click "New Proposal" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-tx border-collapse">
              <thead>
                <tr className="border-b border-border text-tx-subtle text-[11px] bg-surface-2">
                  <th className="py-3 px-4 font-medium">Proposal Title</th>
                  <th className="py-3 px-4 font-medium">Lead ID</th>
                  <th className="py-3 px-4 font-medium text-center">Amount</th>
                  <th className="py-3 px-4 font-medium text-center">Status</th>
                  <th className="py-3 px-4 font-medium text-center">Client Portal</th>
                  <th className="py-3 px-4 font-medium text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-sans">
                {proposals.map((prop) => (
                  <tr key={prop.id} className="hover:bg-row-hover transition">
                    <td className="py-3.5 px-4 font-semibold text-tx">
                      <div className="font-serif text-sm">{prop.title}</div>
                      {prop.notes && (
                        <p className="text-[11px] text-tx-muted font-normal truncate max-w-xs mt-0.5">
                          {prop.notes}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-tx">
                      {availableLeads.find((l) => l.id === prop.leadId)?.name || `${prop.leadId.slice(0, 8)}...`}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-tx font-mono text-xs">
                      {prop.currency} {prop.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Pill active={prop.status === 'accepted'} className="text-[10px]">
                        {prop.status}
                      </Pill>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(prop.token)}
                          title="Copy Public Link"
                        >
                          {copiedToken === prop.token ? (
                            <Check className="w-3.5 h-3.5 mr-1 text-tx" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 mr-1" />
                          )}
                          <span>{copiedToken === prop.token ? 'Copied!' : 'Copy Link'}</span>
                        </Button>
                        <a
                          href={`/p/${prop.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-tx-muted hover:text-tx"
                          title="Open Client Portal"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-tx-subtle font-mono">
                      {new Date(prop.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* New Proposal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Build Commercial Proposal"
      >
        {errorMessage && (
          <Card className="p-3 mb-4 text-xs text-tx">
            {errorMessage}
          </Card>
        )}

        <form onSubmit={handleCreateProposal} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-tx-muted mb-1.5">
                Target Business Client *
              </label>
              {availableLeads.length > 0 ? (
                <select
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  className="input-luxury text-xs cursor-pointer font-medium"
                  required
                >
                  {availableLeads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} — {l.city || 'Local'}, {l.country || 'Global'}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Enter Client or Lead ID"
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  className="input-luxury text-xs font-mono"
                  required
                />
              )}
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAIGenerate}
                loading={generatingAI}
                className="w-full"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                <span>Draft with AI</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                label="Proposal Title *"
                placeholder="e.g. Digital Marketing & Client Acquisition Scope"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <Select
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="USD">USD ($)</option>
                <option value="PKR">PKR (Rs)</option>
                <option value="AED">AED (AED)</option>
                <option value="GBP">GBP (£)</option>
                <option value="SAR">SAR (SAR)</option>
              </Select>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-medium text-tx-muted uppercase">
                Pricing &amp; Deliverables
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddItem}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Add Row</span>
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Service description"
                    value={row.item}
                    onChange={(e) => handleItemChange(idx, 'item', e.target.value)}
                    className="input-luxury text-xs flex-1"
                    required
                  />
                  <input
                    type="number"
                    min={1}
                    placeholder="Qty"
                    value={row.qty}
                    onChange={(e) =>
                      handleItemChange(idx, 'qty', parseInt(e.target.value, 10) || 1)
                    }
                    className="input-luxury text-xs w-16 text-center font-mono"
                    required
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Rate"
                    value={row.rate}
                    onChange={(e) =>
                      handleItemChange(idx, 'rate', parseFloat(e.target.value) || 0)
                    }
                    className="input-luxury text-xs w-24 text-center font-mono"
                    required
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-tx-subtle hover:text-tx transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 text-sm font-bold text-tx font-mono">
              Total: {currency} {calculateTotal().toLocaleString()}
            </div>
          </div>

          {/* Notes */}
          <Textarea
            rows={3}
            label="Scope & Terms Summary"
            placeholder="Summary of deliverables, payment milestones, and guarantee..."
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
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
              loading={submitting}
            >
              Publish Proposal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
