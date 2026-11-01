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
  XCircle,
  Clock,
  ExternalLink,
  DollarSign,
  Trash2,
  X,
} from 'lucide-react';

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

  useEffect(() => {
    loadProposals();
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

      if (res.success) {
        setTitle(res.data.title);
        setItems(res.data.items);
        setNotes(res.data.notes);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'AI proposal draft failed');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !title || items.length === 0) {
      setErrorMessage('Please fill in Lead ID, title, and at least one item');
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
        setTitle('');
        setLeadId('');
        setNotes('');
        setItems([{ item: 'Digital Strategy Setup', qty: 1, rate: 500 }]);
        loadProposals();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Declined
          </span>
        );
      case 'sent':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Viewed by Client
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-400" />
            Client Proposals & Quotes
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Generate itemized proposals with AI and share private tokenized links with clients.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadProposals}
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
            New Proposal
          </button>
        </div>
      </div>

      {/* Proposals Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
            Loading commercial proposals...
          </div>
        ) : proposals.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            No proposals generated yet. Click "New Proposal" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Proposal Title</th>
                  <th className="py-3 px-4">Lead ID</th>
                  <th className="py-3 px-4 text-center">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Public Client Portal</th>
                  <th className="py-3 px-4 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {proposals.map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      {prop.title}
                      {prop.notes && (
                        <p className="text-xs text-slate-500 font-normal line-clamp-1 mt-0.5">
                          {prop.notes}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-emerald-400">
                      {prop.leadId.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-white font-mono">
                      {prop.currency} {prop.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(prop.status)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleCopyLink(prop.token)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700"
                          title="Copy Public Link"
                        >
                          {copiedToken === prop.token ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedToken === prop.token ? 'Copied!' : 'Copy Link'}</span>
                        </button>
                        <a
                          href={`/p/${prop.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                          title="Open Client Portal"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-slate-500 font-mono">
                      {new Date(prop.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Proposal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Build Commercial Proposal
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateProposal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Target Lead ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Lead ID (UUID)"
                    value={leadId}
                    onChange={(e) => setLeadId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAIGenerate}
                    disabled={generatingAI}
                    className="w-full py-2 px-3 bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Sparkles className={`w-4 h-4 ${generatingAI ? 'animate-spin' : ''}`} />
                    {generatingAI ? 'Drafting...' : 'Draft with Gemini'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Proposal Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Digital Marketing & Client Acquisition Scope"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="PKR">PKR (Rs)</option>
                    <option value="AED">AED (AED)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="SAR">SAR (SAR)</option>
                  </select>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold uppercase text-slate-400">
                    Pricing & Deliverables Table
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Service / deliverable description"
                        value={row.item}
                        onChange={(e) => handleItemChange(idx, 'item', e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
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
                        className="w-16 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white text-center font-mono"
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
                        className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white text-center font-mono"
                        required
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2 text-sm font-bold text-white font-mono">
                  Total: {currency} {calculateTotal().toLocaleString()}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Scope & Terms Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary of deliverables, payment milestones, and guarantee..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-sans focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                >
                  {submitting ? 'Generating...' : 'Publish Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
