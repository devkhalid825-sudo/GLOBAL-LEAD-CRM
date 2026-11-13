import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { AppConfigDTO, ImportEnvPreview } from '@lead-crm/shared';
import { Settings, UploadCloud, RefreshCw, CheckCircle2, Plus } from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Select,
  Textarea,
  Modal,
  Pill,
} from '../../components/ui/index.js';

export const ConfigPage: React.FC = () => {
  const [configs, setConfigs] = useState<AppConfigDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);

  // Env import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [envContent, setEnvContent] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ImportEnvPreview | null>(null);
  const [parsing, setParsing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Manual add config state
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [newGroup, setNewGroup] = useState('general');

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const data = await api.get<AppConfigDTO[]>('/console/config');
      setConfigs(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleReloadCache = async () => {
    try {
      setReloading(true);
      const res = await api.post<{ message: string }>('/console/restart/reload-config');
      setStatusMsg(res.message);
      fetchConfigs();
    } catch (err: unknown) {
      setStatusMsg(err instanceof Error ? err.message : 'Reload failed');
    } finally {
      setReloading(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const handleParseEnv = async () => {
    if (!envContent.trim()) return;
    try {
      setParsing(true);
      const preview = await api.post<ImportEnvPreview>('/console/config/parse-env', {
        content: envContent,
      });
      setParsedPreview(preview);
    } catch (err: unknown) {
      alert(`Error parsing env: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setParsing(false);
    }
  };

  const handleApplyEnv = async () => {
    if (!parsedPreview) return;
    try {
      setApplying(true);
      const res = await api.post<{ message: string }>('/console/config/apply-env', {
        items: parsedPreview.items,
      });
      alert(`SUCCESS: ${res.message}`);
      setShowImportModal(false);
      setEnvContent('');
      setParsedPreview(null);
      fetchConfigs();
    } catch (err: unknown) {
      alert(`Failed to apply config: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setApplying(false);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newVal.trim()) return;

    try {
      await api.post('/console/config', {
        key: newKey.trim(),
        value: newVal.trim(),
        group: newGroup.trim(),
      });
      setNewKey('');
      setNewVal('');
      fetchConfigs();
      setStatusMsg(`Config '${newKey}' saved and encrypted`);
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save config');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl font-bold text-tx flex items-center gap-3">
            <Settings className="w-7 h-7 text-tx" />
            <span>Environment &amp; Runtime Config</span>
          </h1>
          <p className="text-sm text-tx-muted mt-1 font-sans">
            Dynamic database-backed config store with zero-downtime hot reloading
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReloadCache}
            disabled={reloading}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${reloading ? 'animate-spin' : ''}`} />
            <span>Reload Config Cache</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowImportModal(true)}
          >
            <UploadCloud className="w-4 h-4 mr-1.5" />
            <span>Import .env File</span>
          </Button>
        </div>
      </div>

      {statusMsg && (
        <Card className="p-4 flex items-center gap-2 text-xs text-tx">
          <CheckCircle2 className="w-4 h-4 text-tx flex-shrink-0" />
          <span>{statusMsg}</span>
        </Card>
      )}

      {/* Manual Quick Add Form */}
      <Card className="p-5 space-y-3">
        <h3 className="font-serif text-sm font-bold text-tx flex items-center gap-2">
          <Plus className="w-4 h-4 text-tx" />
          <span>Add or Update Configuration Key</span>
        </h3>
        <form onSubmit={handleManualAdd} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            required
            placeholder="KEY_NAME (e.g. SMTP_HOST)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="input-luxury text-xs font-mono"
          />
          <input
            type="text"
            required
            placeholder="Value (stored encrypted)"
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            className="input-luxury text-xs font-mono"
          />
          <select
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            className="input-luxury text-xs cursor-pointer"
          >
            <option value="general">Group: General</option>
            <option value="ai">Group: AI / LLM</option>
            <option value="places">Group: Places &amp; Search</option>
            <option value="email">Group: Email &amp; SMTP</option>
            <option value="comms">Group: Comms &amp; Voice</option>
          </select>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full"
          >
            Save &amp; Encrypt
          </Button>
        </form>
      </Card>

      {/* Configs Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 className="font-serif text-lg font-bold text-tx">Stored Runtime Variables ({configs.length})</h2>
            <p className="text-xs text-tx-muted mt-0.5">
              All secrets are encrypted with AES-256-GCM and masked in API payloads.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center text-tx-muted text-xs">
            <span className="w-4 h-4 border-2 border-tx border-t-transparent rounded-full animate-spin mr-2" />
            Loading configurations...
          </div>
        ) : configs.length === 0 ? (
          <div className="py-12 text-center text-tx-muted text-xs">
            No runtime configuration keys stored in MongoDB yet. Use the form above or Import .env.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-tx border-collapse">
              <thead>
                <tr className="border-b border-border text-tx-subtle text-[11px]">
                  <th className="py-2.5 px-3 font-medium">Key</th>
                  <th className="py-2.5 px-3 font-medium">Encrypted masked value</th>
                  <th className="py-2.5 px-3 font-medium">Group</th>
                  <th className="py-2.5 px-3 font-medium">Version</th>
                  <th className="py-2.5 px-3 font-medium">Updated at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-sans">
                {configs.map((c) => (
                  <tr key={c.id} className="hover:bg-row-hover transition">
                    <td className="py-3 px-3 font-mono font-semibold text-tx">{c.key}</td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-2 border border-border text-tx">
                        {c.maskedValue}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <Pill className="text-[10px] py-0 px-2 font-mono">
                        {c.group}
                      </Pill>
                    </td>
                    <td className="py-3 px-3 font-mono text-tx">v{c.version}</td>
                    <td className="py-3 px-3 text-tx-muted font-mono text-[11px]">
                      {new Date(c.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Import .env Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import & Parse .env File"
      >
        <div className="space-y-4">
          <Textarea
            rows={6}
            label="Paste .env Contents"
            value={envContent}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEnvContent(e.target.value)}
            placeholder="PORT=4000&#10;MONGODB_URI=...&#10;GEMINI_API_KEY=...&#10;SMTP_HOST=..."
            className="font-mono text-xs"
          />

          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleParseEnv}
              disabled={parsing || !envContent.trim()}
              loading={parsing}
            >
              Parse &amp; classify diff
            </Button>
          </div>

          {parsedPreview && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between p-3 bg-surface-2 border border-border rounded-xl text-xs font-mono">
                <span className="text-tx font-semibold">
                  Runtime: {parsedPreview.runtimeCount}
                </span>
                <span className="text-tx-muted font-semibold">
                  Bootstrap: {parsedPreview.bootstrapCount}
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-2 text-tx-subtle border-b border-border text-[11px]">
                    <tr>
                      <th className="p-2.5">Key</th>
                      <th className="p-2.5">Classification</th>
                      <th className="p-2.5">Target Destination</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {parsedPreview.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-row-hover">
                        <td className="p-2.5 font-mono text-tx">{item.key}</td>
                        <td className="p-2.5">
                          <Pill active={item.type === 'runtime'} className="text-[10px]">
                            {item.type.toUpperCase()}
                          </Pill>
                        </td>
                        <td className="p-2.5 text-tx-muted text-[11px]">
                          {item.type === 'runtime'
                            ? 'AES-256-GCM Encrypted in MongoDB'
                            : 'Read-only (Server environment)'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowImportModal(false)}
            >
              Close
            </Button>
            {parsedPreview && parsedPreview.runtimeCount > 0 && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleApplyEnv}
                loading={applying}
              >
                Encrypt &amp; save {parsedPreview.runtimeCount} keys
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
