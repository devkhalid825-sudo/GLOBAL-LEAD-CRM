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
import { Card, Button, Input, Pill } from '../ui/index.js';

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
      setSuccess('Two-Factor Authentication is now enabled.');
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-surface-1 border border-border rounded-modal w-full max-w-lg p-6 shadow-card relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-surface-2 border border-border flex items-center justify-center text-tx">
              <ShieldCheck className="w-5 h-5 text-tx" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-tx">
                Two-Factor Security (2FA)
              </h3>
              <p className="text-xs text-tx-muted font-sans">
                Google Authenticator &amp; WhatsApp Backup Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-tx-subtle hover:text-tx rounded-lg hover:bg-surface-2 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <Card className="mt-4 p-3.5 text-tx text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-tx" />
            <span>{error}</span>
          </Card>
        )}

        {success && (
          <Card className="mt-4 p-3.5 text-tx text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-tx" />
            <span>{success}</span>
          </Card>
        )}

        {/* STEP 1: Current Status & Activate Trigger */}
        {step === 'initial' && (
          <div className="mt-5 space-y-5">
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-tx-muted uppercase tracking-wider">
                  Status
                </span>
                <Pill active={is2FAEnabled} className="text-[10px]">
                  {is2FAEnabled ? 'ACTIVE & PROTECTED' : 'DISABLED'}
                </Pill>
              </div>
              <p className="text-xs text-tx-muted leading-relaxed">
                Two-factor authentication adds an extra security barrier by requiring a 6-digit temporary passcode from your authenticator app (Google Authenticator, Microsoft Authenticator) along with WhatsApp emergency backup codes.
              </p>
            </Card>

            {!is2FAEnabled ? (
              <Button
                variant="primary"
                onClick={handleStartSetup}
                loading={loading}
                className="w-full text-xs py-3"
              >
                <KeyRound className="w-4 h-4 mr-1.5" />
                <span>Setup Two-Factor Authentication Now</span>
              </Button>
            ) : (
              <div className="space-y-3">
                <Card className="p-3.5 text-xs space-y-2">
                  <span className="font-semibold text-tx block">WhatsApp Backup Sync:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. +923001234567"
                      value={waNumber}
                      onChange={(e) => setWaNumber(e.target.value)}
                      className="input-luxury text-xs py-1.5 flex-1 font-mono"
                    />
                    <a
                      href={waBackupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="primary" size="sm">
                        <MessageCircle className="w-3.5 h-3.5 mr-1" />
                        <span>WhatsApp</span>
                      </Button>
                    </a>
                  </div>
                </Card>

                {!showDisableConfirm ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDisableConfirm(true)}
                    className="w-full justify-center"
                  >
                    Disable Two-Factor Authentication
                  </Button>
                ) : (
                  <form onSubmit={handleDisable2FA} className="p-4 bg-surface-2 border border-border rounded-card space-y-3">
                    <span className="text-xs text-tx font-semibold block">
                      Confirm Account Password to Disable 2FA:
                    </span>
                    <input
                      type="password"
                      required
                      placeholder="Your current password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      className="input-luxury text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        loading={loading}
                        className="flex-1"
                      >
                        Confirm disable
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDisableConfirm(false)}
                      >
                        Cancel
                      </Button>
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
              <span className="text-xs text-tx-muted block">
                Scan this QR code with <strong>Google Authenticator</strong>:
              </span>

              {qrCodeDataUrl && (
                <div className="inline-block p-3 bg-white border border-border rounded-2xl shadow-md">
                  <img src={qrCodeDataUrl} alt="2FA QR Code" className="w-40 h-40 object-contain mx-auto" />
                </div>
              )}

              {secret && (
                <div className="p-2.5 bg-surface-2 border border-border rounded-xl flex items-center justify-between gap-2 max-w-sm mx-auto text-xs font-mono">
                  <span className="text-tx truncate">{secret}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(secret);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="p-1 text-tx-muted hover:text-tx"
                  >
                    {copiedKey ? <CheckCircle2 className="w-4 h-4 text-tx" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

            <div>
              <Input
                label="WhatsApp Backup Phone (Optional)"
                placeholder="e.g. +92 300 1234567"
                value={waNumber}
                onChange={(e) => setWaNumber(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-tx-muted mb-1.5">
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
                className="input-luxury py-2 text-center text-lg font-mono tracking-widest"
              />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep('initial')}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={loading}
                disabled={loading || verifyCode.length !== 6}
                className="flex-1"
              >
                Verify &amp; Activate 2FA
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: EMERGENCY BACKUP CODES + WHATSAPP EXPORT */}
        {step === 'backup' && (
          <div className="mt-5 space-y-4">
            <Card className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-tx font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-tx" />
                <span>Save Your Emergency Recovery Codes</span>
              </div>
              <p className="text-xs text-tx-muted leading-relaxed">
                If you ever lose access to your phone or Google Authenticator, you can use these one-time codes to sign in.
              </p>
            </Card>

            <div className="grid grid-cols-2 gap-2 p-3 bg-surface-2 border border-border rounded-2xl font-mono text-xs text-tx text-center select-all">
              {backupCodes.map((c, i) => (
                <div key={i} className="p-2 bg-surface-1 rounded-lg border border-border">
                  {c}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={waBackupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="primary" size="sm" className="w-full">
                  <MessageCircle className="w-4 h-4 mr-1.5" />
                  <span>Send Codes to WhatsApp</span>
                </Button>
              </a>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDownloadBackup}
              >
                <Download className="w-4 h-4 mr-1.5" />
                <span>Download .txt</span>
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-full justify-center mt-2"
            >
              Done &amp; Finished
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
