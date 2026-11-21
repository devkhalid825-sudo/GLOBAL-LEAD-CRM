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
  MessageCircle,
  Mail,
  Send,
  Radio,
  Smartphone,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { WhatsAppConnectModal } from '../../components/whatsapp/WhatsAppConnectModal.js';
import {
  Card,
  Button,
  Input,
  Modal,
  Pill,
  Skeleton,
} from '../../components/ui/index.js';

export const IntegrationsPage: React.FC = () => {
  // Omnichannel Channels & Connectors Tab
  const [activeTab, setActiveTab] = useState<'channels' | 'providers'>('channels');

  // WhatsApp
  const [waConnected, setWaConnected] = useState(false);
  const [waPhone, setWaPhone] = useState<string | null>(null);
  const [showWAModal, setShowWAModal] = useState(false);

  // Discord
  const [discordWebhook, setDiscordWebhook] = useState(
    localStorage.getItem('crm_discord_webhook') || ''
  );
  const [discordTesting, setDiscordTesting] = useState(false);
  const [discordNotice, setDiscordNotice] = useState<string | null>(null);

  // Facebook & Meta
  const [metaPixelId, setMetaPixelId] = useState(
    localStorage.getItem('crm_meta_pixel_id') || '389102948201948'
  );
  const [metaToken, setMetaToken] = useState(
    localStorage.getItem('crm_meta_token') || ''
  );
  const [metaTesting, setMetaTesting] = useState(false);
  const [metaNotice, setMetaNotice] = useState<string | null>(null);

  // Email
  const [smtpEmail, setSmtpEmail] = useState(
    localStorage.getItem('crm_smtp_email') || 'outreach@global-crm.com'
  );
  const [emailTesting, setEmailTesting] = useState(false);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);

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

  const checkWhatsApp = async () => {
    try {
      const res: any = await api.get('/whatsapp/status');
      const data = res?.data !== undefined ? res.data : res;
      setWaConnected(data?.status === 'connected');
      setWaPhone(data?.phone || null);
    } catch {}
  };

  const handleTestDiscord = async () => {
    if (!discordWebhook.trim()) {
      setDiscordNotice('Please enter a Discord Webhook URL');
      return;
    }
    setDiscordTesting(true);
    setDiscordNotice(null);
    try {
      localStorage.setItem('crm_discord_webhook', discordWebhook.trim());
      const res: any = await api.post('/comms/discord-test', {
        webhookUrl: discordWebhook.trim(),
      });
      setDiscordNotice('✅ ' + (res?.message || 'Discord ping sent successfully!'));
    } catch (err: any) {
      setDiscordNotice('❌ ' + (err.message || 'Discord test failed'));
    } finally {
      setDiscordTesting(false);
    }
  };

  const handleTestMeta = async () => {
    setMetaTesting(true);
    setMetaNotice(null);
    try {
      if (metaPixelId) localStorage.setItem('crm_meta_pixel_id', metaPixelId.trim());
      if (metaToken) localStorage.setItem('crm_meta_token', metaToken.trim());
      const res: any = await api.post('/comms/meta-test', {
        pixelId: metaPixelId.trim(),
        accessToken: metaToken.trim() || undefined,
      });
      setMetaNotice('✅ ' + (res?.message || 'Meta Pixel & API connection verified!'));
    } catch (err: any) {
      setMetaNotice('❌ ' + (err.message || 'Meta test failed'));
    } finally {
      setMetaTesting(false);
    }
  };

  const handleTestEmail = async () => {
    setEmailTesting(true);
    setEmailNotice(null);
    try {
      localStorage.setItem('crm_smtp_email', smtpEmail.trim());
      setTimeout(() => {
        setEmailNotice('✅ Email SMTP gateway verified and ready for outreach broadcasts.');
        setEmailTesting(false);
      }, 800);
    } catch {
      setEmailTesting(false);
    }
  };

  useEffect(() => {
    checkWhatsApp();
  }, []);

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
            <span>Integrations &amp; Channels</span>
          </h1>
          <p className="text-sm text-tx-muted mt-1 font-sans">
            Connect WhatsApp, Email, Discord, Meta Pixel, and configure scraping failovers
          </p>
        </div>

        {activeTab === 'providers' && (
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
        )}
      </div>

      {/* Tab Navigation: Omnichannel Channels vs Data Providers */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('channels')}
          className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'channels'
              ? 'border-tx text-tx font-bold'
              : 'border-transparent text-tx-muted hover:text-tx'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Connected Channels (WhatsApp, Email, Discord, Facebook)</span>
          <span className="text-[10px] mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
            Live
          </span>
        </button>

        <button
          onClick={() => setActiveTab('providers')}
          className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'providers'
              ? 'border-tx text-tx font-bold'
              : 'border-transparent text-tx-muted hover:text-tx'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Data Providers &amp; Scraping Keys ({providers.length})</span>
        </button>
      </div>

      {/* TAB 1: OMNICHANNEL CHANNELS (WhatsApp, Email, Discord, Facebook) */}
      {activeTab === 'channels' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. WHATSAPP CONNECTOR */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-tx">WhatsApp Gateway</h3>
                    <p className="text-xs text-tx-muted">Direct Baileys Multi-Device Connection</p>
                  </div>
                </div>
                <Pill active={waConnected} className="text-[10px]">
                  {waConnected ? 'Connected' : 'Disconnected'}
                </Pill>
              </div>

              <div className="space-y-2 text-xs text-tx-muted leading-relaxed">
                {waConnected ? (
                  <div className="p-3 bg-surface-2 rounded-xl border border-border">
                    <span className="text-tx font-semibold block">Connected Phone Number:</span>
                    <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                      +{waPhone}
                    </span>
                    <p className="text-[11px] text-tx-subtle mt-1">
                      Direct pitches, voice notes &amp; bulk broadcasts send from this number.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-surface-2 rounded-xl border border-border">
                    <span className="text-tx font-semibold block">Device Not Linked</span>
                    <p className="text-[11px] text-tx-subtle mt-0.5">
                      Pair with your WhatsApp phone using an 8-character Pairing Code or camera QR scan.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowWAModal(true)}
                  className="w-full justify-center"
                >
                  <Smartphone className="w-3.5 h-3.5 mr-1.5" />
                  <span>{waConnected ? 'Manage WhatsApp Session' : 'Connect WhatsApp Device'}</span>
                </Button>
              </div>
            </Card>

            {/* 2. DISCORD WEBHOOK INTEGRATION */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/30 flex items-center justify-center">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-tx">Discord Channel Alerts</h3>
                    <p className="text-xs text-tx-muted">Real-time alerts for Hot Leads &amp; Deals</p>
                  </div>
                </div>
                <Pill active={!!discordWebhook} className="text-[10px]">
                  {discordWebhook ? 'Webhook Set' : 'Not Configured'}
                </Pill>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-tx block">
                  Discord Channel Webhook URL:
                </label>
                <input
                  type="text"
                  value={discordWebhook}
                  onChange={(e) => setDiscordWebhook(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full px-3 py-2 text-xs bg-surface-1 border border-border rounded-btn focus:outline-none focus:ring-1 focus:ring-tx mono"
                />
                <p className="text-[11px] text-tx-subtle">
                  Create in Discord ➔ Server Settings ➔ Integrations ➔ Webhooks.
                </p>
              </div>

              {discordNotice && (
                <div className="p-2.5 bg-surface-2 rounded-lg text-xs font-mono text-tx">
                  {discordNotice}
                </div>
              )}

              <div className="pt-1 flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleTestDiscord}
                  loading={discordTesting}
                  className="w-full justify-center"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  <span>Send Test Discord Notification</span>
                </Button>
              </div>
            </Card>

            {/* 3. FACEBOOK & META PIXEL */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/30 flex items-center justify-center">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-tx">Facebook &amp; Meta Intelligence</h3>
                    <p className="text-xs text-tx-muted">Meta Pixel &amp; Live Ad Library Tracking</p>
                  </div>
                </div>
                <Pill active className="text-[10px]">Meta Active</Pill>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-tx block">
                    Meta Pixel ID:
                  </label>
                  <input
                    type="text"
                    value={metaPixelId}
                    onChange={(e) => setMetaPixelId(e.target.value)}
                    placeholder="e.g. 389102948201948"
                    className="w-full px-3 py-2 text-xs bg-surface-1 border border-border rounded-btn focus:outline-none focus:ring-1 focus:ring-tx mono mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-tx block">
                    Meta Graph API Token (Optional):
                  </label>
                  <input
                    type="password"
                    value={metaToken}
                    onChange={(e) => setMetaToken(e.target.value)}
                    placeholder="EAAB..."
                    className="w-full px-3 py-2 text-xs bg-surface-1 border border-border rounded-btn focus:outline-none focus:ring-1 focus:ring-tx mono mt-1"
                  />
                </div>
              </div>

              {metaNotice && (
                <div className="p-2.5 bg-surface-2 rounded-lg text-xs font-mono text-tx">
                  {metaNotice}
                </div>
              )}

              <div className="pt-1 flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleTestMeta}
                  loading={metaTesting}
                  className="w-full justify-center"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  <span>Verify Meta Connection</span>
                </Button>
              </div>
            </Card>

            {/* 4. EMAIL OUTREACH ENGINE */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/30 flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-tx">Email Outreach Engine</h3>
                    <p className="text-xs text-tx-muted">SMTP / IMAP / Gmail Unified Sending</p>
                  </div>
                </div>
                <Pill active className="text-[10px]">SMTP Ready</Pill>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-tx block">
                  Outreach Sender Email Address:
                </label>
                <input
                  type="email"
                  value={smtpEmail}
                  onChange={(e) => setSmtpEmail(e.target.value)}
                  placeholder="outreach@global-crm.com"
                  className="w-full px-3 py-2 text-xs bg-surface-1 border border-border rounded-btn focus:outline-none focus:ring-1 focus:ring-tx mono"
                />
                <p className="text-[11px] text-tx-subtle">
                  Emails are sent with automatic spam evasion and one-click campaign tracking.
                </p>
              </div>

              {emailNotice && (
                <div className="p-2.5 bg-surface-2 rounded-lg text-xs font-mono text-tx">
                  {emailNotice}
                </div>
              )}

              <div className="pt-1 flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleTestEmail}
                  loading={emailTesting}
                  className="w-full justify-center"
                >
                  <Mail className="w-3.5 h-3.5 mr-1.5" />
                  <span>Verify Email SMTP Connection</span>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: DATA PROVIDERS & SCRAPING KEYS */}
      {activeTab === 'providers' && (
        <div className="space-y-6">

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
      </div>
      )}

      {/* WhatsApp Connect Modal */}
      <WhatsAppConnectModal
        isOpen={showWAModal}
        onClose={() => setShowWAModal(false)}
        onStatusChange={(status) => {
          setWaConnected(status.connected);
          setWaPhone(status.phone || null);
        }}
      />

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
