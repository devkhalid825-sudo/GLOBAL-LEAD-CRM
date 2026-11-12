import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  KeyRound,
  X,
  Copy,
  CheckCircle2,
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

      const codes = generateBackupCodes();
      setBackupCodes(codes);
      if (waNumber) {
        localStorage.setItem('crm_2fa_wa', waNumber);
      }
      setSuccess('Two-Factor Authentication is now ENABLED!');
      setStep('backup');
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Invalid 6-digit code. Please verify time sync.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) return;
    setError(null);
    setLoading(true);

    try {
      await api.post('/auth/2fa/disable', {
        password: disablePassword,
      });
      setSuccess('Two-Factor Authentication has been disabled.');
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Incorrect password.');
    } finally {
      setLoading(false);
    }
  };

  const cleanWaNumber = waNumber.replace(/[^\d]/g, '');
  const waBackupMessage = `*GLOBAL LEAD CRM - 2FA Emergency Backup Codes*\nAccount: ${user?.email}\nGenerated: ${new Date().toLocaleDateString()}\n\n${backupCodes
    .map((c, i) => `${i + 1}. \`${c}\``)
    .join('\n')}\n\n_Keep these emergency codes safe._`;

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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E5E5] rounded-[28px] w-full max-w-lg p-6 shadow-2xl relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F8F8F8] border border-[#E5E5E5] flex items-center justify-center text-black">
              <ShieldCheck className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="serif text-lg font-bold text-black">
                Two-Factor Security (2FA)
              </h3>
              <p className="text-xs text-[#525252]">
                Google Authenticator &amp; WhatsApp Backup Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#737373] hover:text-black rounded-lg hover:bg-[#F0F0F0]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3.5 bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl text-black text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-black" />
            <span>{success}</span>
          </div>
        )}

        {/* STEP 1: Current Status & Activate Trigger */}
        {step === 'initial' && (
          <div className="mt-5 space-y-5">
            <div className="p-4 rounded-2xl bg-[#F8F8F8] border border-[#E5E5E5] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#525252] uppercase tracking-wider">
                  Status
                </span>
                <span className={`pill-luxury ${is2FAEnabled ? 'on' : ''}`}>
                  {is2FAEnabled ? 'ACTIVE & PROTECTED' : 'DISABLED'}
                </span>
              </div>
              <p className="text-xs text-[#525252] leading-relaxed">
                Two-factor authentication adds an extra security barrier by requiring a 6-digit temporary passcode from your authenticator app (Google Authenticator, Microsoft Authenticator) along with WhatsApp emergency backup codes.
              </p>
            </div>

            {!is2FAEnabled ? (
              <button
                onClick={handleStartSetup}
                disabled={loading}
                className="btn-solid w-full text-xs py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Setup Two-Factor Authentication Now</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl text-xs space-y-2">
                  <span className="font-semibold text-black block">WhatsApp Backup Sync:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. +923001234567"
                      value={waNumber}
                      onChange={(e) => setWaNumber(e.target.value)}
                      className="flex-1 bg-white border border-[#E5E5E5] rounded-lg px-3 py-1.5 text-xs text-black"
                    />
                    <a
                      href={waBackupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-solid text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Backup</span>
                    </a>
                  </div>
                </div>

                {!showDisableConfirm ? (
                  <button
                    onClick={() => setShowDisableConfirm(true)}
                    className="w-full btn-ghost text-xs py-2 text-rose-600 hover:border-rose-400"
                  >
                    Disable Two-Factor Authentication
                  </button>
                ) : (
                  <form onSubmit={handleDisable2FA} className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
                    <span className="text-xs text-rose-700 font-semibold block">
                      Confirm Account Password to Disable 2FA:
                    </span>
                    <input
                      type="password"
                      required
                      placeholder="Your current password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      className="w-full bg-white border border-rose-300 rounded-xl px-3 py-2 text-xs text-black focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2 bg-black text-white rounded-xl text-xs font-bold"
                      >
                        {loading ? 'Disabling...' : 'Confirm Disable'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDisableConfirm(false)}
                        className="btn-ghost text-xs py-2 px-3"
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
          <form onSubmit={handleVerifyAndEnable} className="mt-5 space-y-4">
            <div className="text-center space-y-3">
              <span className="text-xs text-[#525252] block">
                Scan this QR code with <strong>Google Authenticator</strong>:
              </span>

              {qrCodeDataUrl && (
                <div className="inline-block p-3 bg-white border border-[#E5E5E5] rounded-2xl shadow-md">
                  <img src={qrCodeDataUrl} alt="2FA QR Code" className="w-40 h-40 object-contain mx-auto" />
                </div>
              )}

              {secret && (
                <div className="p-2.5 bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl flex items-center justify-between gap-2 max-w-sm mx-auto text-xs mono">
                  <span className="text-[#525252] truncate">{secret}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(secret);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="p-1 text-[#737373] hover:text-black"
                  >
                    {copiedKey ? <CheckCircle2 className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#525252] mb-1">
                WhatsApp Backup Phone (Optional)
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. +92 300 1234567"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl pl-9 pr-3 py-2 text-xs text-black focus:outline-none focus:border-black mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#525252] mb-1">
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
                className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl py-2 px-3 text-center text-lg mono tracking-widest text-black focus:outline-none focus:border-black"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('initial')}
                className="btn-ghost text-xs"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || verifyCode.length !== 6}
                className="btn-solid flex-1 text-xs py-2.5 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Activate 2FA'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: EMERGENCY BACKUP CODES + WHATSAPP EXPORT */}
        {step === 'backup' && (
          <div className="mt-5 space-y-4">
            <div className="p-4 bg-[#F8F8F8] border border-[#E5E5E5] rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-black font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-black" />
                <span>Save Your Emergency Recovery Codes</span>
              </div>
              <p className="text-xs text-[#525252] leading-relaxed">
                If you ever lose access to your phone or Google Authenticator, you can use these one-time codes to sign in.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-[#F8F8F8] border border-[#E5E5E5] rounded-2xl mono text-xs text-black text-center select-all">
              {backupCodes.map((c, i) => (
                <div key={i} className="p-2 bg-white rounded-lg border border-[#E5E5E5]">
                  {c}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={waBackupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-solid flex-1 text-xs py-2.5 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send Codes to WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleDownloadBackup}
                className="btn-ghost text-xs py-2.5 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download .txt</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full btn-ghost text-xs py-2.5 mt-2"
            >
              Done &amp; Finished
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
