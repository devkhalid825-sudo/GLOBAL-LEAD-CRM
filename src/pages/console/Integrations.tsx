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
  Trash2,
  Eye,
  EyeOff,
  KeyRound,
  Shield,
} from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Modal,
  Pill,
  Skeleton,
} from '../../components/ui/index.js';

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
      alert(result.ok ? `SUCCESS: ${result.message}` : `FAILED: ${result.message}`);
      fetchKeys(selectedProvider);
    } catch (err: unknown) {
      alert(`Test Error: ${err instanceof Error ? err.message : String(err)}`);
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl font-bold text-tx flex items-center gap-3">
            <Sliders className="w-7 h-7 text-tx" />
            <span>Integrations &amp; Key Pool</span>
          </h1>
          <p className="text-sm text-tx-muted mt-1 font-sans">
            Manage provider credentials, failover priority, and automated cooldown recovery
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setShowAddModal(true);
            setTestResult(null);
            setError(null);
          }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add Encrypted Key</span>
        </Button>
      </div>

      {/* Providers Grid / Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {providers.map((p) => {
          const isSelected = p.providerId === selectedProvider;
          return (
            <button
              key={p.providerId}
              onClick={() => setSelectedProvider(p.providerId)}
              className={`p-4 rounded-card border text-left transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-surface-2 border-tx shadow-sm'
                  : 'bg-surface-1 border-border hover:border-border-hairline hover:bg-row-hover'
              }`}
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-tx-subtle">
                  {p.kind}
                </span>
                <h3 className="font-serif font-semibold text-tx text-sm mt-0.5 truncate">{p.name}</h3>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-tx-muted">Active:</span>
                <span className="font-mono font-bold text-tx">
                  {p.activeKeysCount} / {p.keysCount}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Provider Details & Keys Table */}
      <Card className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h2 className="font-serif text-lg font-bold text-tx flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-tx" />
              <span>{currentProviderConfig?.name || selectedProvider}</span>
            </h2>
            <p className="text-xs text-tx-muted mt-0.5 font-mono">
              Provider ID: <span className="text-tx font-semibold">{selectedProvider}</span> • Failover Order: #{currentProviderConfig?.chainOrder || 1}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-tx-muted">
            <Shield className="w-4 h-4 text-tx" />
            <span>AES-256-GCM Encrypted at rest • Masked in all outputs</span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center text-tx-muted text-xs">
            <span className="w-4 h-4 border-2 border-tx border-t-transparent rounded-full animate-spin mr-2" />
            Loading keys...
          </div>
        ) : keys.length === 0 ? (
          <div className="py-12 text-center text-tx-muted text-xs space-y-2">
            <p>No keys added for this provider.</p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddModal(true)}
            >
              Add First Key
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-tx border-collapse">
              <thead>
                <tr className="border-b border-border text-tx-subtle text-[11px]">
                  <th className="py-2.5 px-3 font-medium">Label</th>
                  <th className="py-2.5 px-3 font-medium">Masked key</th>
                  <th className="py-2.5 px-3 font-medium">Priority</th>
                  <th className="py-2.5 px-3 font-medium">Usage today</th>
                  <th className="py-2.5 px-3 font-medium">Daily cap</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-sans">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-row-hover transition">
                    <td className="py-3 px-3 font-medium text-tx">{k.label}</td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-2 border border-border text-tx">
                        {k.maskedKey}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-tx">{k.priority}</td>
                    <td className="py-3 px-3 font-mono text-tx">{k.usageToday}</td>
                    <td className="py-3 px-3 font-mono text-tx">{k.dailyCap > 0 ? k.dailyCap : 'Unlimited'}</td>
                    <td className="py-3 px-3">
                      <Pill active={k.status === 'healthy' && k.enabled} className="text-[10px]">
                        {k.enabled ? k.status : 'Disabled'}
                      </Pill>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={testingKeyId === k.id}
                          onClick={() => handleTestSavedKey(k.id)}
                        >
                          {testingKeyId === k.id ? (
                            <span className="w-3 h-3 border-2 border-tx border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Play className="w-3 h-3 mr-1" />
                          )}
                          <span>Test</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleKey(k)}
                        >
                          {k.enabled ? 'Disable' : 'Enable'}
                        </Button>

                        <button
                          onClick={() => handleDeleteKey(k.id)}
                          className="p-1.5 text-tx-subtle hover:text-tx rounded transition"
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
      </Card>

      {/* Add Key Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Add API Key for ${currentProviderConfig?.name || selectedProvider}`}
      >
        {error && (
          <Card className="p-3 mb-4 text-xs text-tx">
            {error}
          </Card>
        )}

        <form onSubmit={handleSaveKey} className="space-y-4">
          <Input
            label="Key Label / Account Name"
            required
            placeholder="e.g. Production Key 1 or Client Account"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />

          <div>
            <label className="block text-xs font-medium text-tx-muted mb-1.5">
              API Key / Secret Token
            </label>
            <div className="relative">
              <input
                type={showPlainKey ? 'text' : 'password'}
                required
                placeholder="Paste full key (encrypted immediately upon saving)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="input-luxury pr-10 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPlainKey(!showPlainKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tx-muted hover:text-tx"
              >
                {showPlainKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[11px] text-tx-subtle mt-1 block">
              Plain key will never be visible again after leaving this dialog.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              min={1}
              label="Priority (1 = highest)"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value, 10) || 1)}
              className="font-mono text-xs"
            />
            <Input
              type="number"
              min={0}
              label="Daily Cap (0 = unlimited)"
              value={dailyCap}
              onChange={(e) => setDailyCap(parseInt(e.target.value, 10) || 0)}
              className="font-mono text-xs"
            />
          </div>

          {/* Live Test Connection section */}
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={testing || !newKey.trim()}
              onClick={handleTestRawKey}
            >
              {testing ? (
                <span className="w-3 h-3 border-2 border-tx border-t-transparent rounded-full animate-spin mr-1.5" />
              ) : (
                <Play className="w-3.5 h-3.5 mr-1.5" />
              )}
              <span>Test Connection Live</span>
            </Button>

            {testResult && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-tx">
                {testResult.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span>{testResult.ok ? 'Success' : 'Failed'}</span>
              </div>
            )}
          </div>

          {testResult && (
            <Card className="p-3 text-xs text-tx font-mono">
              {testResult.message}
            </Card>
          )}

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={saving}
              disabled={!newKey.trim()}
            >
              Save encrypted key
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
