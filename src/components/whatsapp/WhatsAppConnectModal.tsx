import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Smartphone,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  QrCode,
  KeyRound,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { Modal, Button, Pill } from '../ui/index.js';

interface WhatsAppConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (status: { connected: boolean; phone?: string | null }) => void;
}

export const WhatsAppConnectModal: React.FC<WhatsAppConnectModalProps> = ({
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [tab, setTab] = useState<'pairing_code' | 'qr_code'>('pairing_code');
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [phone, setPhone] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const [phoneInput, setPhoneInput] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    } else {
      setError(null);
      setPairingCode(null);
    }
  }, [isOpen]);

  // Polling while connecting or modal open
  useEffect(() => {
    let interval: any;
    if (isOpen && (status === 'connecting' || pairingCode)) {
      interval = setInterval(() => {
        checkStatus(true);
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, status, pairingCode]);

  const checkStatus = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res: any = await api.get('/whatsapp/status');
      const payload = res?.data !== undefined ? res.data : res;
      if (payload) {
        if (payload.status) setStatus(payload.status);
        setPhone(payload.phone || null);
        setName(payload.name || null);
        if (payload.qrCodeUrl) {
          setQrCodeUrl(payload.qrCodeUrl);
        }
        if (onStatusChange) {
          onStatusChange({
            connected: payload.status === 'connected',
            phone: payload.phone || null,
          });
        }
      }
    } catch (err: any) {
      if (!silent) setError(err.message || 'Failed to check WhatsApp status');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleStartConnect = async () => {
    setError(null);
    setLoading(true);
    setStatus('connecting');
    try {
      const res: any = await api.post('/whatsapp/connect', {});
      const payload = res?.data !== undefined ? res.data : res;
      if (payload) {
        if (payload.status) setStatus(payload.status);
        if (payload.qrCodeUrl) setQrCodeUrl(payload.qrCodeUrl);
        if (payload.status === 'connected') {
          setPhone(payload.phone || null);
          if (onStatusChange) onStatusChange({ connected: true, phone: payload.phone });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize WhatsApp session');
      setStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPairingCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneInput || phoneInput.trim().length < 8) {
      setError('Please enter a valid phone number with country code (e.g. 923001234567 or 14155552671)');
      return;
    }

    setError(null);
    setPairingLoading(true);
    setPairingCode(null);
    try {
      const res: any = await api.post('/whatsapp/pairing-code', {
        phone: phoneInput.trim(),
      });
      const payload = res?.data !== undefined ? res.data : res;
      if (payload?.code) {
        setPairingCode(payload.code);
        setStatus('connecting');
      } else if (payload?.status === 'connected') {
        setStatus('connected');
        setPhone(payload.phone);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate WhatsApp pairing code. Please try again.');
    } finally {
      setPairingLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!pairingCode) return;
    const cleanCode = pairingCode.replace('-', '');
    navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setError(null);
    try {
      await api.post('/whatsapp/disconnect', {});
      setStatus('disconnected');
      setPhone(null);
      setName(null);
      setQrCodeUrl(null);
      setPairingCode(null);
      if (onStatusChange) onStatusChange({ connected: false, phone: null });
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Link your WhatsApp Device"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-btn border border-red-500/30 bg-red-500/10 text-xs text-red-500 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* ALREADY CONNECTED STATE */}
        {status === 'connected' ? (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>

            <div>
              <h3 className="serif text-lg font-bold text-tx">WhatsApp Device Linked</h3>
              <p className="mono text-sm text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                +{phone} {name ? `(${name})` : ''}
              </p>
              <p className="text-xs text-tx-muted mt-2 max-w-sm mx-auto leading-relaxed">
                Your mobile WhatsApp is actively connected. Direct messages, client pitches, voice notes, and broadcasts will send from this number, and all client responses will ring on your phone!
              </p>
            </div>

            <div className="pt-4 border-t border-border flex justify-center gap-3">
              <Button
                variant="ghost"
                onClick={handleDisconnect}
                loading={disconnecting}
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                <span>Disconnect / Log out</span>
              </Button>
              <Button
                variant="primary"
                onClick={onClose}
                size="sm"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* NOT CONNECTED: SHOW PAIRING TABS */
          <div className="space-y-4">
            {/* METHOD TABS */}
            <div className="flex border-b border-border">
              <button
                type="button"
                onClick={() => setTab('pairing_code')}
                className={`flex-1 py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                  tab === 'pairing_code'
                    ? 'border-tx text-tx'
                    : 'border-transparent text-tx-muted hover:text-tx'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Pairing Code (Recommended)</span>
                <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded">
                  100% Works
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab('qr_code');
                  if (!qrCodeUrl) handleStartConnect();
                }}
                className={`flex-1 py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                  tab === 'qr_code'
                    ? 'border-tx text-tx'
                    : 'border-transparent text-tx-muted hover:text-tx'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Scan QR Code</span>
              </button>
            </div>

            {/* TAB 1: PAIRING CODE (PHONE NUMBER DIRECT LINK) */}
            {tab === 'pairing_code' && (
              <div className="space-y-4">
                {!pairingCode ? (
                  <form onSubmit={handleRequestPairingCode} className="space-y-4">
                    <div className="p-3 bg-surface-2 rounded-card border border-border text-xs text-tx-muted space-y-1.5">
                      <div className="flex items-center gap-1.5 font-semibold text-tx">
                        <Smartphone className="w-4 h-4 text-tx" />
                        <span>Link without camera glare or QR scan issues</span>
                      </div>
                      <p className="leading-relaxed">
                        Enter your WhatsApp phone number with country code. You will receive an official 8-digit code to type into WhatsApp on your mobile.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-tx">
                        Your WhatsApp Mobile Number (with country code):
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder="e.g. 923001234567 or 14155552671"
                          className="flex-1 px-3 py-2 text-sm bg-surface-1 border border-border rounded-btn focus:outline-none focus:ring-1 focus:ring-tx mono"
                          autoFocus
                        />
                        <Button
                          type="submit"
                          variant="primary"
                          loading={pairingLoading}
                          disabled={!phoneInput.trim()}
                          size="sm"
                        >
                          <KeyRound className="w-3.5 h-3.5 mr-1" />
                          <span>Get Code</span>
                        </Button>
                      </div>
                      <p className="text-[11px] text-tx-subtle">
                        Do not include "+" or spaces. Example: for Pakistan <code>923001234567</code>, for USA <code>14155552671</code>.
                      </p>
                    </div>
                  </form>
                ) : (
                  /* PAIRING CODE GENERATED - SHOW BIG CODE AND STEP-BY-STEP GUIDE */
                  <div className="space-y-4 text-center py-2">
                    <div className="bg-surface-2 border border-border rounded-card p-4 space-y-3">
                      <span className="text-xs uppercase tracking-wider font-semibold text-tx-muted block">
                        Your WhatsApp Pairing Code
                      </span>
                      <div className="flex items-center justify-center gap-3">
                        <span className="mono text-3xl font-extrabold tracking-widest text-tx px-4 py-2 bg-surface-1 border border-border rounded-btn select-all">
                          {pairingCode}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleCopyCode}
                          size="sm"
                          className="h-11 px-3"
                          title="Copy Code"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-tx" />
                          )}
                          <span className="ml-1 text-xs">{copied ? 'Copied!' : 'Copy'}</span>
                        </Button>
                      </div>
                    </div>

                    {/* Step by step mobile guide */}
                    <div className="p-3 bg-surface-2 rounded-card border border-border text-left space-y-2 text-xs">
                      <span className="font-bold text-tx block">How to enter this code on your phone:</span>
                      <ol className="list-decimal list-inside space-y-1 text-tx-muted leading-relaxed">
                        <li>Open <strong>WhatsApp</strong> on your mobile phone.</li>
                        <li>Tap <strong>Settings</strong> (iPhone) or <strong>Menu (⋮)</strong> (Android) ➔ <strong>Linked Devices</strong>.</li>
                        <li>Tap <strong>Link a Device</strong>.</li>
                        <li>At the bottom of the camera screen, tap <strong className="text-tx">"Link with phone number instead"</strong>.</li>
                        <li>Enter the 8-character code shown above: <strong className="mono text-tx">{pairingCode}</strong>.</li>
                      </ol>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-tx-subtle mono animate-pulse pt-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Waiting for code to be entered in your phone...</span>
                    </div>

                    <div className="pt-2 flex justify-between items-center border-t border-border">
                      <button
                        type="button"
                        onClick={() => {
                          setPairingCode(null);
                        }}
                        className="text-xs text-tx-muted hover:text-tx"
                      >
                        ← Change Phone Number
                      </button>
                      <Button variant="ghost" onClick={onClose} size="sm">
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: QR CODE SCAN */}
            {tab === 'qr_code' && (
              <div className="space-y-4 text-center">
                {qrCodeUrl ? (
                  <>
                    <div className="p-3 bg-white rounded-card inline-block border border-border shadow-card mx-auto">
                      <img
                        src={qrCodeUrl}
                        alt="Scan WhatsApp QR"
                        className="w-52 h-52 mx-auto object-contain"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="serif text-sm font-semibold text-tx block">
                        Scan with your WhatsApp mobile app
                      </span>
                      <p className="text-xs text-tx-muted leading-relaxed max-w-sm mx-auto">
                        Open WhatsApp on your phone ➔ <strong>Settings</strong> or <strong>Menu (⋮)</strong> ➔ <strong>Linked Devices</strong> ➔ <strong>Link a Device</strong> and point your camera here.
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-tx-subtle mono animate-pulse pt-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Auto-refreshed live QR code</span>
                    </div>

                    <div className="pt-3 border-t border-border flex justify-between items-center">
                      <button
                        type="button"
                        onClick={handleStartConnect}
                        disabled={loading}
                        className="text-xs text-tx-muted hover:text-tx inline-flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                        <span>Reload QR</span>
                      </button>
                      <Button variant="ghost" onClick={onClose} size="sm">
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center space-y-3">
                    <div className="w-10 h-10 border-2 border-tx border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-tx-muted">
                      Generating secure WhatsApp QR code...
                    </p>
                    <Button variant="ghost" onClick={handleStartConnect} size="sm">
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      <span>Retry</span>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
