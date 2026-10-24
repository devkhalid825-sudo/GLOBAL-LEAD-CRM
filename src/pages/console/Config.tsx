import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { AppConfigDTO, ImportEnvPreview } from '@lead-crm/shared';
import { Settings, UploadCloud, RefreshCw, CheckCircle2, ShieldAlert, FileText, Plus } from 'lucide-react';

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
      alert(`✅ ${res.message}`);
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-emerald-400" />
            Environment & Runtime Configuration
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Dynamic database-backed config store with zero-downtime hot reloading
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReloadCache}
            disabled={reloading}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-4 py-2.5 rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${reloading ? 'animate-spin' : ''}`} />
            <span>Reload Config Cache</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-900/20 transition"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Import .env File</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Manual Quick Add Form */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-400" />
          Add / Update Configuration Key
        </h3>
        <form onSubmit={handleManualAdd} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            required
            placeholder="KEY_NAME (e.g. SMTP_HOST)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
          />
          <input
            type="text"
            required
            placeholder="Value (stored encrypted)"
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
          <select
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="general">Group: General</option>
            <option value="ai">Group: AI / LLM</option>
            <option value="places">Group: Places & Search</option>
            <option value="email">Group: Email & SMTP</option>
            <option value="comms">Group: Comms & Voice</option>
          </select>
          <button
            type="submit"
            className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2 rounded-xl text-sm transition"
          >
            Save & Encrypt
          </button>
        </form>
      </div>

      {/* Configs Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Stored Runtime Variables ({configs.length})</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              All secrets are encrypted with AES-256-GCM and masked in API payloads.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center text-slate-500">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3" />
            Loading configurations...
          </div>
        ) : configs.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            No runtime configuration keys stored in MongoDB yet. Use the form above or Import .env.
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-800/40 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Key</th>
                  <th className="py-3 px-4">Encrypted Masked Value</th>
                  <th className="py-3 px-4">Group</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Updated At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {configs.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-white">{c.key}</td>
                    <td className="py-3 px-4 font-mono text-xs text-emerald-400 bg-slate-950/40 rounded px-2">
                      {c.maskedValue}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300">
                        {c.group}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">v{c.version}</td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {new Date(c.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Import .env Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-400" />
                Import & Parse .env File
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  Paste .env Contents
                </label>
                <textarea
                  rows={6}
                  value={envContent}
                  onChange={(e) => setEnvContent(e.target.value)}
                  placeholder="PORT=4000&#10;MONGODB_URI=...&#10;GEMINI_API_KEY=...&#10;SMTP_HOST=..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParseEnv}
                  disabled={parsing || !envContent.trim()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium transition"
                >
                  {parsing ? 'Analyzing...' : 'Parse & Classify Diff'}
                </button>
              </div>

              {parsedPreview && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl text-xs">
                    <span className="text-emerald-400 font-semibold">
                      Runtime Keys (Saved to DB Encrypted): {parsedPreview.runtimeCount}
                    </span>
                    <span className="text-amber-400 font-semibold">
                      Bootstrap Keys (Ignored / Server Only): {parsedPreview.bootstrapCount}
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400">
                        <tr>
                          <th className="p-2.5">Key</th>
                          <th className="p-2.5">Classification</th>
                          <th className="p-2.5">Target Destination</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {parsedPreview.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="p-2.5 font-mono text-white">{item.key}</td>
                            <td className="p-2.5">
                              {item.type === 'runtime' ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
                                  RUNTIME
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold">
                                  BOOTSTRAP
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-slate-400">
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
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Close
              </button>
              {parsedPreview && parsedPreview.runtimeCount > 0 && (
                <button
                  type="button"
                  onClick={handleApplyEnv}
                  disabled={applying}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-sm shadow-lg shadow-emerald-900/20 transition disabled:opacity-50"
                >
                  {applying ? 'Applying...' : `Encrypt & Save ${parsedPreview.runtimeCount} Runtime Keys`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
