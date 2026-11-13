import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { AuditLogDTO } from '@lead-crm/shared';
import { FileCheck2, RefreshCw, User } from 'lucide-react';
import { Card, Button, Pill } from '../../components/ui/index.js';

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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl font-bold text-tx flex items-center gap-3">
            <FileCheck2 className="w-7 h-7 text-tx" />
            <span>Admin Audit Trail</span>
          </h1>
          <p className="text-sm text-tx-muted mt-1 font-sans">
            Immutable log of every administrative modification, key addition, config change, and permission update
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={fetchAuditLogs}
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Trail</span>
        </Button>
      </div>

      {/* Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 className="font-serif text-lg font-bold text-tx">Recorded Actions ({filteredLogs.length})</h2>
            <p className="text-xs text-tx-muted mt-0.5">Secrets and passwords in audit records are masked.</p>
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="input-luxury text-xs py-1.5 px-3 w-auto"
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
          <div className="py-12 flex justify-center items-center text-tx-muted text-xs">
            <span className="w-4 h-4 border-2 border-tx border-t-transparent rounded-full animate-spin mr-2" />
            Loading audit records...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-tx-muted text-xs">
            No audit events recorded yet. Any admin console action will be tracked here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-tx border-collapse">
              <thead>
                <tr className="border-b border-border text-tx-subtle text-[11px]">
                  <th className="py-2.5 px-3 font-medium">Timestamp</th>
                  <th className="py-2.5 px-3 font-medium">Admin actor</th>
                  <th className="py-2.5 px-3 font-medium">Action</th>
                  <th className="py-2.5 px-3 font-medium">Target entity</th>
                  <th className="py-2.5 px-3 font-medium">Masked details</th>
                  <th className="py-2.5 px-3 font-medium">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-sans">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-row-hover transition text-xs">
                    <td className="py-3 px-3 font-mono text-tx-subtle text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-semibold text-tx">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-tx" />
                        <span>{log.actorEmail || 'System'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <Pill active className="text-[10px] font-mono">
                        {log.action}
                      </Pill>
                    </td>
                    <td className="py-3 px-3 font-mono text-tx">{log.target}</td>
                    <td className="py-3 px-3 font-mono text-tx-muted max-w-xs truncate">
                      {log.afterMasked ? JSON.stringify(log.afterMasked) : '—'}
                    </td>
                    <td className="py-3 px-3 font-mono text-tx-subtle">{log.ip || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
