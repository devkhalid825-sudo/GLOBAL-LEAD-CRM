import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/client.js';
import {
  Clock,
  Play,
  Plus,
  RefreshCw,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Zap,
  Calendar,
} from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Select,
  Modal,
  Pill,
} from '../components/ui/index.js';

interface FollowupRule {
  id: string;
  name: string;
  triggerOn: string;
  conditionJson: Record<string, any>;
  delayHours: number;
  active: boolean;
  createdAt: string;
}

interface FollowupTask {
  id: string;
  ruleId: string;
  leadId: string;
  scheduledFor: string;
  status: string;
  createdAt: string;
}

export const FollowupsPage: React.FC = () => {
  const [rules, setRules] = useState<FollowupRule[]>([]);
  const [tasks, setTasks] = useState<FollowupTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  // New Rule Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [triggerOn, setTriggerOn] = useState('no_contact_days');
  const [targetStatus, setTargetStatus] = useState('new');
  const [delayDays, setDelayDays] = useState(3);
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rulesRes, tasksRes] = await Promise.all([
        apiFetch<{ success: boolean; data: FollowupRule[] }>('/followups/rules'),
        apiFetch<{ success: boolean; data: FollowupTask[] }>('/followups/tasks'),
      ]);

      if (rulesRes.success) setRules(rulesRes.data);
      if (tasksRes.success) setTasks(tasksRes.data);
    } catch (err) {
      console.error('Failed to load follow-up engine:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleRule = async (ruleId: string) => {
    try {
      const res = await apiFetch<{ success: boolean; data: FollowupRule }>(
        `/followups/rules/${ruleId}/toggle`,
        { method: 'PATCH' }
      );
      if (res.success) {
        setRules((prev) =>
          prev.map((r) => (r.id === ruleId ? { ...r, active: res.data.active } : r))
        );
      }
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  const handleRunScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await apiFetch<{
        success: boolean;
        data: { scheduledCount: number; evaluatedCount: number };
      }>('/followups/run-check', { method: 'POST' });

      if (res.success) {
        setScanResult(
          `Scan completed: ${res.data.scheduledCount} new tasks scheduled from ${res.data.evaluatedCount} eligible leads.`
        );
        loadData();
      }
    } catch (err: any) {
      setScanResult(`Scan error: ${err.message || 'Unknown error'}`);
    } finally {
      setScanning(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName) return;

    setCreating(true);
    try {
      const res = await apiFetch<{ success: boolean; data: FollowupRule }>('/followups/rules', {
        method: 'POST',
        body: JSON.stringify({
          name: ruleName,
          triggerOn,
          conditionJson: { status: targetStatus, days: delayDays },
          delayHours: delayDays * 24,
        }),
      });

      if (res.success) {
        setIsModalOpen(false);
        setRuleName('');
        loadData();
      }
    } catch (err) {
      console.error('Failed to create rule:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-tx leading-tight">
            Follow-ups &amp; Drips.
          </h1>
          <p className="text-sm text-tx-muted mt-2 font-sans">
            Drip sequences, inactivity reminders, and automated sales outreach rules.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRunScan}
            disabled={scanning}
            loading={scanning}
          >
            <Play className="w-3.5 h-3.5 mr-1.5" />
            <span>Run Scan Now</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>New Follow-up Rule</span>
          </Button>
        </div>
      </div>

      {scanResult && (
        <Card className="p-3.5 text-xs text-tx flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-tx flex-shrink-0" />
          <span>{scanResult}</span>
        </Card>
      )}

      {/* Rules Grid */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-tx flex items-center gap-2">
          <Zap className="w-5 h-5 text-tx" />
          <span>Active Automation Rules ({rules.length})</span>
        </h2>

        {loading ? (
          <div className="p-8 text-center text-tx-muted text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-tx mb-2" />
            Loading rules...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rules.map((rule) => {
              const cond = rule.conditionJson as Record<string, any>;
              return (
                <Card
                  key={rule.id}
                  className="p-5 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Pill active={rule.active} className="text-[10px] font-mono">
                        {rule.triggerOn}
                      </Pill>
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className="text-tx transition hover:opacity-80"
                        title={rule.active ? 'Disable Rule' : 'Enable Rule'}
                      >
                        {rule.active ? <ToggleRight className="w-7 h-7 text-tx" /> : <ToggleLeft className="w-7 h-7 text-tx-subtle" />}
                      </button>
                    </div>

                    <h3 className="font-serif font-bold text-tx text-base">{rule.name}</h3>
                    <p className="text-xs text-tx-muted mt-2 font-sans leading-relaxed">
                      When lead status is <strong className="text-tx">"{cond?.status || 'new'}"</strong> and no outreach occurs for{' '}
                      <strong className="text-tx font-mono">{cond?.days || 2} days</strong>.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs text-tx-subtle font-mono">
                    <span>Delay: {rule.delayHours}h</span>
                    <span className="font-medium text-tx">
                      {rule.active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Scheduled Tasks Queue */}
      <Card className="p-6 space-y-4">
        <h2 className="font-serif text-lg font-bold text-tx flex items-center gap-2">
          <Calendar className="w-5 h-5 text-tx" />
          <span>Scheduled Tasks &amp; Execution History</span>
        </h2>

        {tasks.length === 0 ? (
          <div className="p-8 text-center text-tx-muted text-xs">
            No pending follow-up tasks. Click "Run Scan Now" to evaluate leads.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-tx border-collapse">
              <thead>
                <tr className="border-b border-border text-tx-subtle text-[11px]">
                  <th className="py-2.5 px-3 font-medium">Task ID</th>
                  <th className="py-2.5 px-3 font-medium">Target Lead</th>
                  <th className="py-2.5 px-3 font-medium">Scheduled For</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-3 font-medium">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-sans">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-row-hover transition">
                    <td className="py-3 px-3 font-mono text-xs text-tx-subtle">{task.id.slice(0, 8)}...</td>
                    <td className="py-3 px-3 font-mono text-xs text-tx">{task.leadId.slice(0, 8)}...</td>
                    <td className="py-3 px-3 font-mono text-xs text-tx">
                      {new Date(task.scheduledFor).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <Pill active={task.status === 'pending'} className="text-[10px]">
                        {task.status}
                      </Pill>
                    </td>
                    <td className="py-3 px-3 text-tx-subtle font-mono text-[11px]">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Rule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Follow-up Rule"
      >
        <form onSubmit={handleCreateRule} className="space-y-4">
          <Input
            label="Rule Name"
            placeholder="e.g. 5-Day Re-engagement Sequence"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            required
          />

          <Select
            label="Target Lead Status"
            value={targetStatus}
            onChange={(e) => setTargetStatus(e.target.value)}
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="interested">Interested</option>
            <option value="meeting">Meeting Set</option>
            <option value="proposal">Proposal Sent</option>
          </Select>

          <Input
            type="number"
            min={1}
            max={30}
            label="Inactivity Days Delay"
            value={delayDays}
            onChange={(e) => setDelayDays(parseInt(e.target.value) || 1)}
            className="font-mono text-xs"
            required
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
              loading={creating}
            >
              Save Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
