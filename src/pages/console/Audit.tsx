import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { AuditLogDTO } from '@lead-crm/shared';
import { FileCheck2, RefreshCw, Shield, User, Globe } from 'lucide-react';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const data = await api.get<AuditLogDTO[]>('/console/audit?limit=100');
      setLogs(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (actionFilter !== 'all' && l.action !== actionFilter) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileCheck2 className="w-7 h-7 text-emerald-400" />
            Admin Audit Trail
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable log of every administrative modification, key addition, config change, and permission update
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-4 py-2.5 rounded-xl border border-slate-700 transition self-start"
        >
          <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Recorded Actions ({filteredLogs.length})</h2>
            <p className="text-xs text-slate-400 mt-0.5">Secrets and passwords in audit records are masked.</p>
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
          >
            <option value="all">All Actions</option>
            <option value="create_key">create_key</option>
            <option value="update_key">update_key</option>
            <option value="delete_key">delete_key</option>
            <option value="test_key_connection">test_key_connection</option>
            <option value="create_user">create_user</option>
            <option value="update_user">update_user</option>
            <option value="import_env">import_env</option>
            <option value="set_config">set_config</option>
          </select>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center text-slate-500">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3" />
            Loading audit records...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            No audit events recorded yet. Any admin console action will be tracked here.
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-800/40 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Admin Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Masked Details</th>
                  <th className="py-3 px-4">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition text-xs">
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{log.actorEmail || 'System'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-300">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{log.target}</td>
                    <td className="py-3 px-4 font-mono text-slate-400 max-w-xs truncate">
                      {log.afterMasked ? JSON.stringify(log.afterMasked) : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{log.ip || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
