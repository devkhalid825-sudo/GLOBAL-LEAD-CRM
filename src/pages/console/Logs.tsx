import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api, getAccessToken } from '../../api/client.js';
import { SystemLogDTO } from '@lead-crm/shared';
import { Terminal, Filter, RefreshCw, Trash2 } from 'lucide-react';
import { Card, Button, Input, Select } from '../../components/ui/index.js';

export const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<SystemLogDTO[]>([]);
  const [levelFilter, setLevelFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [connected, setConnected] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Initial fetch from REST API
  const fetchLogs = async () => {
    try {
      const data = await api.get<SystemLogDTO[]>('/console/logs?limit=150');
      setLogs(data.reverse()); // Oldest to newest for terminal view
    } catch (err: unknown) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();

    // Setup Socket.IO live tail
    const token = getAccessToken();
    const rawBase = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).trim().replace(/\/$/, '') : '';
    let socketBase = rawBase.endsWith('/api') ? rawBase.slice(0, -4) : rawBase;
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && socketBase.startsWith('http://')) {
      socketBase = socketBase.replace(/^http:\/\//, 'https://');
    }
    const socket: Socket = io(`${socketBase}/logs`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('log', (entry: any) => {
      setLogs((prev) => [...prev.slice(-300), entry]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((l) => {
    if (levelFilter !== 'all' && l.level !== levelFilter) return false;
    if (moduleFilter !== 'all' && l.module !== moduleFilter) return false;
    if (search && !l.msg.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)] max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0 pb-4 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl font-bold text-tx flex items-center gap-3">
            <Terminal className="w-7 h-7 text-tx" />
            <span>Live System Logs</span>
          </h1>
          <p className="text-sm text-tx-muted mt-1 flex items-center gap-2">
            <span>Tail of 100MB capped MongoDB system logs</span>
            <span className="font-mono text-xs text-tx-subtle flex items-center gap-1.5 ml-2">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-tx animate-pulse' : 'border border-tx-subtle'}`} />
              <span>{connected ? 'STREAM ACTIVE' : 'RECONNECTING'}</span>
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLogs([])}
            title="Clear display logs"
            className="p-2"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchLogs}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Reload Recent</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex flex-wrap items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2 text-tx-muted text-xs">
          <Filter className="w-4 h-4 text-tx" />
          <span className="text-xs font-semibold uppercase">Filters:</span>
        </div>

        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="input-luxury text-xs py-1.5 px-3 w-auto"
        >
          <option value="all">Level: All</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
          <option value="debug">Debug</option>
        </select>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="input-luxury text-xs py-1.5 px-3 w-auto"
        >
          <option value="all">Module: All</option>
          <option value="server">Server</option>
          <option value="keyPool">Key Pool</option>
          <option value="failover">Failover</option>
          <option value="runtimeConfig">Runtime Config</option>
          <option value="audit">Audit</option>
          <option value="notify">Notify</option>
        </select>

        <input
          type="text"
          placeholder="Search log messages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-luxury text-xs py-1.5 px-3 flex-1 min-w-[200px]"
        />

        <label className="flex items-center gap-2 text-xs text-tx-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="rounded border-border bg-surface-2 text-tx focus:ring-0"
          />
          <span>Auto-scroll to bottom</span>
        </label>
      </Card>

      {/* Terminal View */}
      <div
        ref={logContainerRef}
        className="flex-1 bg-surface-1 border border-border rounded-card p-4 font-mono text-xs overflow-y-auto space-y-1 shadow-inner select-text"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-tx-subtle text-center py-12">No logs matching current criteria...</div>
        ) : (
          filteredLogs.map((l, idx) => {
            return (
              <div key={idx} className="flex items-start gap-3 py-1 hover:bg-row-hover rounded px-2 transition">
                <span className="text-tx-subtle flex-shrink-0 select-none">
                  {new Date(l.createdAt).toLocaleTimeString()}
                </span>
                <span className="flex-shrink-0">
                  {l.level === 'error' ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-tx text-canvas">
                      ERROR
                    </span>
                  ) : l.level === 'warn' ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium border border-border text-tx">
                      WARN
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] text-tx-muted">
                      {l.level.toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="text-tx flex-shrink-0 font-semibold">[{l.module}]</span>
                <span className="text-tx break-all">{l.msg}</span>
                {l.meta && Object.keys(l.meta).length > 0 && (
                  <span className="text-tx-subtle text-[11px] truncate max-w-sm">
                    {JSON.stringify(l.meta)}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
