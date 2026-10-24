import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import {
  ProviderConfigDTO,
  ProviderKeyDTO,
  CreateProviderKeyInput,
  TestConnectionResult,
  ProviderId,
} from '@lead-crm/shared';
import {
  Sliders,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  Eye,
  EyeOff,
  KeyRound,
  Shield,
  Layers,
} from 'lucide-react';

export const IntegrationsPage: React.FC = () => {
  const [providers, setProviders] = useState<ProviderConfigDTO[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('google_places');
  const [keys, setKeys] = useState<ProviderKeyDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Key Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newKey, setNewKey] = useState('');
  const [showPlainKey, setShowPlainKey] = useState(false);
  const [priority, setPriority] = useState(1);
  const [dailyCap, setDailyCap] = useState(0);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Status of running tests on saved keys
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);

  const fetchProviders = async () => {
    try {
      const data = await api.get<ProviderConfigDTO[]>('/providers');
      setProviders(data);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const fetchKeys = async (providerId: string) => {
    try {
      setLoading(true);
      const data = await api.get<ProviderKeyDTO[]>(`/providers/${providerId}/keys`);
      setKeys(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    if (selectedProvider) {
      fetchKeys(selectedProvider);
    }
  }, [selectedProvider]);

  const handleTestRawKey = async () => {
    if (!newKey.trim()) {
      setError('Please paste an API key first');
      return;
    }
    setError(null);
    setTesting(true);
    setTestResult(null);

    try {
      const res = await api.post<TestConnectionResult>(`/providers/${selectedProvider}/test`, {
        apiKey: newKey.trim(),
      });
      setTestResult(res);
    } catch (err: unknown) {
      setTestResult({
        ok: false,
        message: err instanceof Error ? err.message : 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const payload: CreateProviderKeyInput = {
        providerId: selectedProvider as ProviderId,
        label: newLabel || `${selectedProvider} key`,
        apiKey: newKey.trim(),
        priority,
        dailyCap,
        enabled: true,
      };

      await api.post(`/providers/${selectedProvider}/keys`, payload);
      setShowAddModal(false);
      setNewKey('');
      setNewLabel('');
      setTestResult(null);
      fetchKeys(selectedProvider);
      fetchProviders();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save key');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSavedKey = async (keyId: string) => {
    setTestingKeyId(keyId);
    try {
      const result = await api.post<TestConnectionResult>(`/keys/${keyId}/test`);
      alert(result.ok ? `✅ SUCCESS: ${result.message}` : `❌ FAILED: ${result.message}`);
      fetchKeys(selectedProvider);
    } catch (err: unknown) {
      alert(`❌ Test Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTestingKeyId(null);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;
    try {
      await api.delete(`/keys/${keyId}`);
      fetchKeys(selectedProvider);
      fetchProviders();
    } catch (err: unknown) {
      alert(`Failed to delete: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleToggleKey = async (key: ProviderKeyDTO) => {
    try {
      await api.patch(`/keys/${key.id}`, { enabled: !key.enabled });
      fetchKeys(selectedProvider);
      fetchProviders();
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const currentProviderConfig = providers.find((p) => p.providerId === selectedProvider);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Sliders className="w-7 h-7 text-emerald-400" />
            Integrations & Key Pool
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage provider credentials, failover priority, and automated cooldown recovery
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddModal(true);
            setTestResult(null);
            setError(null);
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-900/20 transition self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add Encrypted Key</span>
        </button>
      </div>

      {/* Providers Grid / Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {providers.map((p) => {
          const isSelected = p.providerId === selectedProvider;
          return (
            <button
              key={p.providerId}
              onClick={() => setSelectedProvider(p.providerId)}
              className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800 border-emerald-500/50 shadow-lg shadow-emerald-500/5'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {p.kind}
                </span>
                <h3 className="font-semibold text-white text-sm mt-0.5 truncate">{p.name}</h3>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-slate-400">Active keys:</span>
                <span className={`font-mono font-bold ${p.activeKeysCount > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {p.activeKeysCount} / {p.keysCount}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Provider Details & Keys Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-400" />
              <span>{currentProviderConfig?.name || selectedProvider}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Provider ID: <code className="text-emerald-300 font-mono">{selectedProvider}</code> • Failover Chain Order: #{currentProviderConfig?.chainOrder || 1}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>AES-256-GCM Encrypted at rest • Masked in all outputs</span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center text-slate-500">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3" />
            Loading keys...
          </div>
        ) : keys.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500 mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-300">No keys added for this provider</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Add your API key to enable live operations with automatic failover and rotation.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
            >
              Add First Key
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-800/40 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Label</th>
                  <th className="py-3 px-4">Masked Key</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Today Usage</th>
                  <th className="py-3 px-4">Daily Cap</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-medium text-white">{k.label}</td>
                    <td className="py-3 px-4 font-mono text-xs text-emerald-400 bg-slate-950/40 rounded px-2">
                      {k.maskedKey}
                    </td>
                    <td className="py-3 px-4 font-mono">{k.priority}</td>
                    <td className="py-3 px-4 font-mono">{k.usageToday}</td>
                    <td className="py-3 px-4 font-mono">{k.dailyCap > 0 ? k.dailyCap : 'Unlimited'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          k.status === 'healthy' && k.enabled
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : k.status === 'cooling_down'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : k.status === 'quota_over'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          k.status === 'healthy' && k.enabled ? 'bg-emerald-400' : 'bg-current'
                        }`} />
                        {k.enabled ? k.status : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTestSavedKey(k.id)}
                          disabled={testingKeyId === k.id}
                          className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
                        >
                          {testingKeyId === k.id ? (
                            <div className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Play className="w-3 h-3 text-emerald-400" />
                          )}
                          <span>Test</span>
                        </button>

                        <button
                          onClick={() => handleToggleKey(k)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-lg transition ${
                            k.enabled
                              ? 'bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400'
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          {k.enabled ? 'Disable' : 'Enable'}
                        </button>

                        <button
                          onClick={() => handleDeleteKey(k.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                          title="Delete Key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Key Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-400" />
                Add API Key for {currentProviderConfig?.name || selectedProvider}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveKey} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Key Label / Account Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production Key 1 or Client Account"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  API Key / Secret Token
                </label>
                <div className="relative">
                  <input
                    type={showPlainKey ? 'text' : 'password'}
                    required
                    placeholder="Paste full key (encrypted immediately upon saving)"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPlainKey(!showPlainKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPlainKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Plain key will never be visible again after leaving this dialog.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Priority (1 = highest)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Daily Cap (0 = unlimited)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={dailyCap}
                    onChange={(e) => setDailyCap(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Live Test Connection section */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleTestRawKey}
                  disabled={testing || !newKey.trim()}
                  className="px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {testing ? (
                    <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Test Connection Live</span>
                </button>

                {testResult && (
                  <div
                    className={`flex items-center gap-1.5 text-xs font-medium ${
                      testResult.ok ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {testResult.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span>{testResult.ok ? 'Success' : 'Failed'}</span>
                  </div>
                )}
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs ${
                    testResult.ok
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                  }`}
                >
                  {testResult.message}
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !newKey.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-sm transition shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                >
                  {saving ? 'Encrypting & Storing...' : 'Save Encrypted Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
