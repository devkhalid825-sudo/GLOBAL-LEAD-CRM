import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Activity, RefreshCw, Database, Cpu, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Card, Button, Pill } from '../../components/ui/index.js';

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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl font-bold text-tx flex items-center gap-3">
            <Activity className="w-7 h-7 text-tx" />
            <span>System Health &amp; Telemetry</span>
          </h1>
          <p className="text-sm text-tx-muted mt-1 font-sans">
            Real-time infrastructure status, database ping, memory utilization, and key pool vitality
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={fetchHealth}
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </Button>
      </div>

      {health ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase text-tx-muted">System Status</span>
              <CheckCircle2 className="w-4 h-4 text-tx" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-tx font-serif capitalize">{health.status}</span>
              <span className="text-xs font-mono text-tx-subtle">v{health.version}</span>
            </div>
            <span className="text-xs text-tx-subtle block">Cluster operational</span>
          </Card>

          <Card className="p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase text-tx-muted">Database (MongoDB)</span>
              <Database className="w-4 h-4 text-tx" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-tx font-mono">{health.mongo.pingMs} ms</span>
              <Pill active className="text-[10px]">Connected</Pill>
            </div>
            <span className="text-xs text-tx-subtle block">Standard Mongoose Driver</span>
          </Card>

          <Card className="p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase text-tx-muted">Memory Utilization</span>
              <Cpu className="w-4 h-4 text-tx" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-tx font-mono">{health.memoryUsageMB} MB</span>
              <span className="text-xs text-tx-subtle font-mono">RSS</span>
            </div>
            <span className="text-xs text-tx-subtle block font-mono">Uptime: {Math.floor(health.uptimeSeconds / 60)}m</span>
          </Card>

          <Card className="p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase text-tx-muted">Key Pool Vitality</span>
              <ShieldCheck className="w-4 h-4 text-tx" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-tx font-mono">{health.keysSummary.healthy}</span>
              <span className="text-xs text-tx-muted font-mono">/ {health.keysSummary.total} ready</span>
            </div>
            <span className="text-xs text-tx-subtle block font-mono">
              {health.keysSummary.invalid} invalid or exhausted
            </span>
          </Card>
        </div>
      ) : (
        <div className="py-12 text-center text-tx-muted text-xs">Checking system telemetry...</div>
      )}
    </div>
  );
};
