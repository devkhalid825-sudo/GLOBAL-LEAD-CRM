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
} from 'lucide-react';
import { Card, Button, Pill, Textarea } from '../components/ui/index.js';

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
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 text-tx-muted">
        <RefreshCw className="w-8 h-8 animate-spin text-tx mb-3" />
        <p className="text-sm font-medium">Loading commercial proposal...</p>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border text-tx flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-xl font-bold text-tx mb-2">Proposal Unavailable</h1>
        <p className="text-tx-muted text-sm max-w-sm">
          {error || 'This proposal link may be invalid or has expired.'}
        </p>
      </div>
    );
  }

  const isAccepted = proposal.status === 'accepted';
  const isRejected = proposal.status === 'rejected';

  return (
    <div className="min-h-screen bg-canvas text-tx py-12 px-4 sm:px-6 lg:px-8 selection:bg-tx selection:text-canvas">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Top Header Card */}
        <Card className="p-8 shadow-card relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
            <div>
              <span className="text-xs uppercase font-mono font-bold text-tx-subtle tracking-wider">
                Official Business Proposal
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tx mt-1">
                {proposal.title}
              </h1>
            </div>

            <div>
              {isAccepted ? (
                <Pill active className="text-xs font-semibold flex items-center gap-1.5 py-1 px-3">
                  <CheckCircle2 className="w-4 h-4" /> Approved &amp; Signed
                </Pill>
              ) : isRejected ? (
                <Pill className="text-xs font-semibold flex items-center gap-1.5 py-1 px-3">
                  <XCircle className="w-4 h-4" /> Declined
                </Pill>
              ) : (
                <Pill className="text-xs font-semibold flex items-center gap-1.5 py-1 px-3">
                  <Clock className="w-4 h-4" /> Pending Client Decision
                </Pill>
              )}
            </div>
          </div>

          {/* Client & Date Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-sm">
            <div>
              <span className="text-xs uppercase font-semibold text-tx-muted block">
                Prepared For
              </span>
              <div className="font-serif font-bold text-tx text-base mt-0.5 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-tx" />
                <span>{proposal.lead?.name || 'Valued Client'}</span>
              </div>
              {proposal.lead?.city && (
                <div className="text-xs text-tx-muted mt-0.5 font-sans">
                  {proposal.lead.city}, {proposal.lead.country}
                </div>
              )}
            </div>

            <div className="sm:text-right">
              <span className="text-xs uppercase font-semibold text-tx-muted block">
                Proposal Date
              </span>
              <div className="font-mono text-tx-subtle mt-0.5 text-xs">
                {new Date(proposal.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Scope and Deliverables Table */}
        <Card className="p-8 shadow-card space-y-6">
          <h2 className="font-serif text-lg font-bold text-tx flex items-center gap-2">
            <FileText className="w-5 h-5 text-tx" />
            <span>Deliverables &amp; Investment Schedule</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-tx border-collapse">
              <thead>
                <tr className="border-b border-border text-tx-subtle text-[11px] bg-surface-2">
                  <th className="py-3 px-4 font-medium">Service Description</th>
                  <th className="py-3 px-4 text-center font-medium">Qty</th>
                  <th className="py-3 px-4 text-right font-medium">Rate</th>
                  <th className="py-3 px-4 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-sans">
                {proposal.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-row-hover transition">
                    <td className="py-3.5 px-4 font-medium text-tx">{it.item}</td>
                    <td className="py-3.5 px-4 text-center font-mono text-tx-muted">{it.qty}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-tx-muted">
                      {proposal.currency} {it.rate.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-tx">
                      {proposal.currency} {(it.qty * it.rate).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border text-base font-bold text-tx">
                  <td colSpan={3} className="py-4 px-4 text-right uppercase tracking-wider text-xs text-tx-muted">
                    Total Investment:
                  </td>
                  <td className="py-4 px-4 text-right text-xl font-mono text-tx font-bold">
                    {proposal.currency} {proposal.totalAmount.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Scope Notes */}
          {proposal.notes && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-xs uppercase font-semibold text-tx-muted mb-2">
                Scope &amp; Agreement Terms
              </h3>
              <div className="bg-surface-2 border border-border rounded-2xl p-4 text-xs text-tx-muted leading-relaxed font-sans whitespace-pre-wrap">
                {proposal.notes}
              </div>
            </div>
          )}
        </Card>

        {/* Client Decision Section */}
        {!isAccepted && !isRejected && (
          <Card className="p-8 shadow-card space-y-4">
            <h2 className="font-serif text-lg font-bold text-tx flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-tx" />
              <span>Sign &amp; Approve Proposal</span>
            </h2>
            <p className="text-xs text-tx-muted">
              By accepting this proposal, you authorize our team to initiate onboarding and deliver the services outlined above.
            </p>

            <Textarea
              rows={2}
              value={clientNotes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setClientNotes(e.target.value)}
              placeholder="Optional notes, preferred start date, or billing remarks..."
            />

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAction('reject')}
                disabled={submittingAction}
              >
                Decline Proposal
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleAction('accept')}
                loading={submittingAction}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                <span>Approve &amp; Accept Proposal</span>
              </Button>
            </div>
          </Card>
        )}

        {actionSuccess && (
          <Card className="p-5 text-tx text-sm flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </Card>
        )}
      </div>
    </div>
  );
};
