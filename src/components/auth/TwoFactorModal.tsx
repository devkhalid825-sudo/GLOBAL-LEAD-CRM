import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  X,
  QrCode,
  Copy,
  CheckCircle2,
  Lock,
  ArrowRight,
  MessageCircle,
  Download,
  Smartphone,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../auth/AuthProvider.js';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Setup state
  const [step, setStep] = useState<'initial' | 'qr' | 'backup'>('initial');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [waNumber, setWaNumber] = useState(localStorage.getItem('crm_2fa_wa') || '');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Disable 2FA state
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  const is2FAEnabled = user?.twoFactorEnabled;

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(null);
      setStep('initial');
      setShowDisableConfirm(false);
      setVerifyCode('');
      setDisablePassword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Generate 8-digit random backup recovery codes
  const generateBackupCodes = () => {
    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const part1 = Math.floor(1000 + Math.random() * 9000);
      const part2 = Math.floor(1000 + Math.random() * 9000);
      codes.push(`${part1}-${part2}`);
    }
    return codes;
  };

  const handleStartSetup = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = (await api.post('/auth/2fa/setup')) as any;
      if (res?.qrCodeDataUrl && res?.secret) {
        setQrCodeDataUrl(res.qrCodeDataUrl);
        setSecret(res.secret);
        setStep('qr');
      } else {
        setError('Failed to initiate 2FA setup. Please try again.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Error setting up 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret || !verifyCode) return;
    setError(null);
    setLoading(true);

    try {
      await api.post('/auth/2fa/verify', {
        secret,
        token: verifyCode,
      });

      // Save WhatsApp backup number locally
      if (waNumber.trim()) {
        localStorage.setItem('crm_2fa_wa', waNumber.trim());
      }

      const generated = generateBackupCodes();
      setBackupCodes(generated);
      localStorage.setItem(`crm_backup_codes_${user?.id}`, JSON.stringify(generated));

      setStep('backup');
      setSuccess('Two-Factor Authentication successfully enabled!');
      if (user) {
        user.twoFactorEnabled = true;
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Invalid verification code. Please check your Authenticator app.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post('/auth/2fa/disable', { password: disablePassword });
      setSuccess('2FA has been disabled for your account.');
      if (user) {
        user.twoFactorEnabled = false;
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Incorrect password.');
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp Backup Dispatch
  const cleanWaNumber = waNumber.replace(/[^\d]/g, '');
  const waBackupMessage = `🔐 Global Lead CRM - 2FA Emergency Backup Codes for account (${user?.email}):\n\n${backupCodes.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n⚠️ Keep these codes secure. Each code can be used once as an emergency backup if you lose your authenticator.`;
  const waBackupUrl = cleanWaNumber
    ? `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(waBackupMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(waBackupMessage)}`;

  const handleDownloadBackup = () => {
    const content = `GLOBAL LEAD CRM - 2FA EMERGENCY RECOVERY CODES\nAccount: ${user?.email}\nGenerated: ${new Date().toLocaleString()}\n\nCodes:\n${backupCodes.map((c, i) => `[${i + 1}] ${c}`).join('\n')}\n\nStore this file in a safe place.`;
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `crm_2fa_backup_codes_${user?.email}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl flex items-center justify-center ${
              is2FAEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Two-Factor Security (2FA)
              </h3>
              <p className="text-xs text-slate-400">
                Google Authenticator &amp; WhatsApp Backup Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* STEP 1: Current Status & Activate Trigger */}
        {step === 'initial' && (
          <div className="mt-6 space-y-6">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Status
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                  is2FAEnabled
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {is2FAEnabled ? 'ENABLED & PROTECTED' : 'DISABLED'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Two-factor authentication adds an extra security barrier by requiring a 6-digit temporary passcode from your authenticator app (Google Authenticator, Microsoft Authenticator, or 1Password) along with WhatsApp emergency backup codes.
              </p>
            </div>

            {!is2FAEnabled ? (
              <button
                onClick={handleStartSetup}
                disabled={loading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/50 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Setup Two-Factor Authentication Now</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2">
                  <span className="font-semibold text-white block">WhatsApp Backup Sync:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. +923001234567"
                      value={waNumber}
                      onChange={(e) => setWaNumber(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                    <a
                      href={waBackupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Backup</span>
                    </a>
                  </div>
                </div>

                {!showDisableConfirm ? (
                  <button
                    onClick={() => setShowDisableConfirm(true)}
                    className="w-full py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold transition"
                  >
                    Disable Two-Factor Authentication
                  </button>
                ) : (
                  <form onSubmit={handleDisable2FA} className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-2xl space-y-3">
                    <span className="text-xs text-rose-300 font-semibold block">
                      Confirm Account Password to Disable 2FA:
                    </span>
                    <input
                      type="password"
                      required
                      placeholder="Your current password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                      >
                        {loading ? 'Disabling...' : 'Confirm Disable'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDisableConfirm(false)}
                        className="px-3 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: SCAN QR CODE & ENTER 6-DIGIT CODE */}
        {step === 'qr' && (
          <form onSubmit={handleVerifyAndEnable} className="mt-6 space-y-5">
            <div className="text-center space-y-3">
              <span className="text-xs text-slate-400 block">
                Scan this QR code with <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong>:
              </span>

              {qrCodeDataUrl && (
                <div className="inline-block p-3 bg-white rounded-2xl shadow-xl">
                  <img src={qrCodeDataUrl} alt="2FA QR Code" className="w-44 h-44 object-contain" />
                </div>
              )}

              {/* Secret Key Manual Entry */}
              {secret && (
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-2 max-w-sm mx-auto text-xs font-mono">
                  <span className="text-slate-400 truncate">{secret}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(secret);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    {copiedKey ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

            {/* Optional WhatsApp Backup Number */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                WhatsApp Backup Phone (Optional for recovery)
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. +92 300 1234567"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* 6-Digit Code */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Enter 6-Digit Code from Authenticator
              </label>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('initial')}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || verifyCode.length !== 6}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Activate 2FA'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: EMERGENCY BACKUP CODES + WHATSAPP EXPORT */}
        {step === 'backup' && (
          <div className="mt-6 space-y-5">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Save Your Emergency Recovery Codes</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                If you ever lose access to your phone or Google Authenticator, you can use these one-time codes to sign in. Each code can only be used once.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-xs text-emerald-400 text-center select-all">
              {backupCodes.map((c, i) => (
                <div key={i} className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  {c}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={waBackupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/40"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send Codes to my WhatsApp 💬</span>
              </a>

              <button
                type="button"
                onClick={handleDownloadBackup}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download .txt</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition mt-2"
            >
              Done &amp; Finished
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
