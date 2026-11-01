import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/client.js';
import {
  Clock,
  Play,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Zap,
  Calendar,
  X,
} from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-7 h-7 text-emerald-400" />
            Automated Lead Follow-up Engine
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Drip sequences, inactivity reminders, and automated sales outreach rules.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunScan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-semibold transition-all"
          >
            <Play className={`w-4 h-4 text-emerald-400 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Scanning...' : 'Run Scan Now'}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-900/20"
          >
            <Plus className="w-4 h-4" />
            New Follow-up Rule
          </button>
        </div>
      </div>

      {scanResult && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {scanResult}
        </div>
      )}

      {/* Rules Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          Active Automation Rules ({rules.length})
        </h2>

        {loading ? (
          <div className="p-8 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
            Loading rules...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rules.map((rule) => {
              const cond = rule.conditionJson as Record<string, any>;
              return (
                <div
                  key={rule.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {rule.triggerOn}
                      </span>
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className={`text-2xl transition-colors ${
                          rule.active ? 'text-emerald-400' : 'text-slate-600'
                        }`}
                        title={rule.active ? 'Disable Rule' : 'Enable Rule'}
                      >
                        {rule.active ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                      </button>
                    </div>

                    <h3 className="font-bold text-white text-base">{rule.name}</h3>
                    <p className="text-xs text-slate-400 mt-2">
                      When lead status is <strong className="text-emerald-400">"{cond?.status || 'new'}"</strong> and no outreach occurs for{' '}
                      <strong className="text-white">{cond?.days || 2} days</strong>.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-500">
                    <span>Delay: {rule.delayHours}h</span>
                    <span
                      className={`font-bold ${
                        rule.active ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {rule.active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scheduled Tasks Queue */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          Scheduled Tasks & Execution History
        </h2>

        {tasks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No pending follow-up tasks. Click "Run Scan Now" to evaluate leads.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Task ID</th>
                  <th className="py-3 px-4">Target Lead</th>
                  <th className="py-3 px-4">Scheduled For</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-400">{task.id.slice(0, 8)}...</td>
                    <td className="py-3 px-4 font-mono text-xs text-emerald-400">{task.leadId.slice(0, 8)}...</td>
                    <td className="py-3 px-4 text-xs text-slate-300">
                      {new Date(task.scheduledFor).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {task.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Add Follow-up Rule
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5-Day Re-engagement Sequence"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Target Lead Status
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="interested">Interested</option>
                  <option value="meeting">Meeting Set</option>
                  <option value="proposal">Proposal Sent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Inactivity Days Delay
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={delayDays}
                  onChange={(e) => setDelayDays(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
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
                  disabled={creating}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {creating ? 'Saving...' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
