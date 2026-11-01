import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../api/client.js';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Building,
  RefreshCw,
  Send,
} from 'lucide-react';

interface ProposalItem {
  item: string;
  qty: number;
  rate: number;
}

interface ProposalData {
  id: string;
  token: string;
  title: string;
  currency: string;
  items: ProposalItem[];
  totalAmount: number;
  status: string;
  notes?: string;
  validUntil?: string;
  createdAt: string;
  lead?: {
    name: string;
    city: string;
    country: string;
    website?: string;
  };
}

export const PublicProposalPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Action states
  const [clientNotes, setClientNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchProposal = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; data: ProposalData }>(
        `/proposals/public/${token}`
      );
      if (res.success) {
        setProposal(res.data);
      } else {
        setError('Proposal not found or expired');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load proposal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposal();
  }, [token]);

  const handleAction = async (action: 'accept' | 'reject') => {
    if (!token) return;
    setSubmittingAction(true);
    try {
      const res = await apiFetch<{ success: boolean; data: any }>(
        `/proposals/public/${token}/action`,
        {
          method: 'POST',
          body: JSON.stringify({ action, notes: clientNotes }),
        }
      );

      if (res.success) {
        setActionSuccess(
          action === 'accept'
            ? 'Thank you! The proposal has been successfully accepted and approved.'
            : 'Proposal has been declined.'
        );
        fetchProposal();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit decision');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
        <p className="text-sm font-medium">Loading commercial proposal...</p>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Proposal Unavailable</h1>
        <p className="text-slate-400 text-sm max-w-sm">
          {error || 'This proposal link may be invalid or has expired.'}
        </p>
      </div>
    );
  }

  const isAccepted = proposal.status === 'accepted';
  const isRejected = proposal.status === 'rejected';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Top Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
            <div>
              <span className="text-xs uppercase font-mono font-bold text-emerald-400 tracking-wider">
                Official Business Proposal
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                {proposal.title}
              </h1>
            </div>

            <div>
              {isAccepted ? (
                <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Approved & Signed
                </span>
              ) : isRejected ? (
                <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Declined
                </span>
              ) : (
                <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Pending Client Decision
                </span>
              )}
            </div>
          </div>

          {/* Client & Date Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-sm">
            <div>
              <span className="text-xs uppercase font-semibold text-slate-500 block">
                Prepared For
              </span>
              <div className="font-bold text-white text-base mt-0.5 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-emerald-400" />
                {proposal.lead?.name || 'Valued Client'}
              </div>
              {proposal.lead?.city && (
                <div className="text-xs text-slate-400 mt-0.5">
                  {proposal.lead.city}, {proposal.lead.country}
                </div>
              )}
            </div>

            <div className="sm:text-right">
              <span className="text-xs uppercase font-semibold text-slate-500 block">
                Proposal Date
              </span>
              <div className="font-mono text-slate-300 mt-0.5">
                {new Date(proposal.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Scope and Deliverables Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Deliverables & Investment Schedule
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Service Description</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Rate</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {proposal.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-medium text-slate-200">{it.item}</td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">{it.qty}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                      {proposal.currency} {it.rate.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      {proposal.currency} {(it.qty * it.rate).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-800 text-base font-bold text-white">
                  <td colSpan={3} className="py-4 px-4 text-right uppercase tracking-wider text-xs text-slate-400">
                    Total Investment:
                  </td>
                  <td className="py-4 px-4 text-right text-xl font-mono text-emerald-400">
                    {proposal.currency} {proposal.totalAmount.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Scope Notes */}
          {proposal.notes && (
            <div className="mt-6 pt-6 border-t border-slate-800">
              <h3 className="text-xs uppercase font-semibold text-slate-400 mb-2">
                Scope & Agreement Terms
              </h3>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                {proposal.notes}
              </div>
            </div>
          )}
        </div>

        {/* Client Decision Section */}
        {!isAccepted && !isRejected && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Sign & Approve Proposal
            </h2>
            <p className="text-xs text-slate-400">
              By accepting this proposal, you authorize our team to initiate onboarding and deliver the services outlined above.
            </p>

            <textarea
              rows={2}
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="Optional notes, preferred start date, or billing remarks..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-sans"
            />

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleAction('reject')}
                disabled={submittingAction}
                className="px-5 py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition"
              >
                Decline Proposal
              </button>
              <button
                type="button"
                onClick={() => handleAction('accept')}
                disabled={submittingAction}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {submittingAction ? 'Processing...' : 'Approve & Accept Proposal'}
              </button>
            </div>
          </div>
        )}

        {actionSuccess && (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>
    </div>
  );
};
