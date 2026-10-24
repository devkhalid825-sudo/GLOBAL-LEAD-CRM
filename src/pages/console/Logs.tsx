import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api, getAccessToken } from '../../api/client.js';
import { SystemLogDTO } from '@lead-crm/shared';
import { Terminal, Filter, RefreshCw, Trash2, ArrowDown } from 'lucide-react';

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
    const socket: Socket = io('/logs', {
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
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Terminal className="w-7 h-7 text-emerald-400" />
            Live System Logs
          </h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
            <span>Tail of 100MB capped MongoDB system logs</span>
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-emerald-400 shadow-emerald-400/50 shadow-md' : 'bg-rose-500'
              }`}
            />
            <span className="text-xs font-mono">{connected ? 'STREAM ACTIVE' : 'RECONNECTING'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLogs([])}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition"
            title="Clear display logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Recent</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold uppercase text-slate-400">Filters:</span>
        </div>

        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
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
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
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
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 flex-1 min-w-[200px]"
        />

        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
          />
          <span>Auto-scroll to bottom</span>
        </label>
      </div>

      {/* Terminal View */}
      <div
        ref={logContainerRef}
        className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs overflow-y-auto space-y-1 shadow-inner select-text"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-slate-600 text-center py-12">No logs matching current criteria...</div>
        ) : (
          filteredLogs.map((l, idx) => {
            const levelColor =
              l.level === 'error'
                ? 'text-rose-400 bg-rose-500/10'
                : l.level === 'warn'
                ? 'text-amber-400 bg-amber-500/10'
                : l.level === 'debug'
                ? 'text-blue-400'
                : 'text-emerald-400';

            return (
              <div key={idx} className="flex items-start gap-3 py-0.5 hover:bg-slate-900/40 rounded px-2">
                <span className="text-slate-500 flex-shrink-0 select-none">
                  {new Date(l.createdAt).toLocaleTimeString()}
                </span>
                <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[10px] flex-shrink-0 ${levelColor}`}>
                  {l.level}
                </span>
                <span className="text-slate-400 flex-shrink-0 font-semibold">[{l.module}]</span>
                <span className="text-slate-200 break-all">{l.msg}</span>
                {l.meta && Object.keys(l.meta).length > 0 && (
                  <span className="text-slate-500 text-[11px] truncate max-w-sm">
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
