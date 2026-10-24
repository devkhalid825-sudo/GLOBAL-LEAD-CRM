import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Activity, RefreshCw, Database, Cpu, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';

interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  mongo: { connected: boolean; pingMs: number };
  uptimeSeconds: number;
  memoryUsageMB: number;
  keysSummary: { total: number; healthy: number; invalid: number };
  version: string;
}

export const HealthPage: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const data = await api.get<HealthData>('/console/health');
      setHealth(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="w-7 h-7 text-emerald-400" />
            System Health & Telemetry
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time infrastructure status, database ping, memory utilization, and key pool vitality
          </p>
        </div>

        <button
          onClick={fetchHealth}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-4 py-2.5 rounded-xl border border-slate-700 transition self-start"
        >
          <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {health ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400">System Status</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white capitalize">{health.status}</span>
              <span className="text-xs font-mono text-emerald-400">v{health.version}</span>
            </div>
            <span className="text-xs text-slate-500 mt-1 block">Cluster operational</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400">Database (MongoDB)</span>
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-mono">{health.mongo.pingMs} ms</span>
              <span className="text-xs text-emerald-400 font-medium">Connected</span>
            </div>
            <span className="text-xs text-slate-500 mt-1 block">Standard Mongoose Driver</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400">Memory Utilization</span>
              <Cpu className="w-5 h-5 text-blue-400" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-mono">{health.memoryUsageMB} MB</span>
              <span className="text-xs text-slate-400">RSS</span>
            </div>
            <span className="text-xs text-slate-500 mt-1 block">Uptime: {Math.floor(health.uptimeSeconds / 60)}m</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400">Key Pool Vitality</span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-mono">{health.keysSummary.healthy}</span>
              <span className="text-xs text-slate-400">/ {health.keysSummary.total} keys ready</span>
            </div>
            <span className="text-xs text-slate-500 mt-1 block">
              {health.keysSummary.invalid} invalid or exhausted
            </span>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-slate-500">Checking system telemetry...</div>
      )}
    </div>
  );
};
