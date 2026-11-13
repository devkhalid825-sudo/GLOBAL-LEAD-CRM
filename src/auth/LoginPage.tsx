import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider.js';
import {
  Mail,
  Lock,
  MessageCircle,
  Smartphone,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { api } from '../api/client.js';
import { Card, Button, Input, Pill } from '../components/ui/index.js';

export const LoginPage: React.FC = () => {
  const { login, verify2FA, loginWithWhatsAppOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'email' or 'whatsapp'
  const [loginMode, setLoginMode] = useState<'email' | 'whatsapp'>('email');

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempToken, setTempToken] = useState<string | null>(null);

  // WhatsApp OTP form state
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [waLink, setWaLink] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const from = location.state?.from?.pathname || '/dashboard';

  // Email Submit
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      if (tempToken) {
        await verify2FA(tempToken, twoFactorCode);
        navigate(from, { replace: true });
      } else {
        const result = await login(email, password);
        if (result.requires2FA && result.tempToken) {
          setTempToken(result.tempToken);
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp OTP Request
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      const res = (await api.post('/auth/whatsapp/request-otp', { phone })) as any;
      setOtpSent(true);
      if (res?.waLink) {
        setWaLink(res.waLink);
      }
      setNotice('6-digit OTP generated. Click below to view in WhatsApp or enter the code.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to request WhatsApp OTP.');
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp OTP Verify
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginWithWhatsAppOtp(phone, otpCode);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid WhatsApp OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 selection:bg-tx selection:text-canvas">
      <Card className="w-full max-w-md p-8 shadow-card relative overflow-hidden">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 bg-tx text-canvas rounded-2xl flex items-center justify-center font-bold text-sm mb-3 font-mono">
            CRM
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-[0.12em] text-tx">
            GLOBAL CRM
          </h1>
          <p className="text-xs text-tx-muted mt-1 font-sans">
            Enterprise Intelligence &amp; B2B Outreach Portal
          </p>
        </div>

        {/* Toggle between Email & WhatsApp Login */}
        {!tempToken && (
          <div className="flex items-center gap-1.5 p-1 bg-surface-2 border border-border rounded-xl mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setLoginMode('email');
                setError(null);
                setNotice(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
                loginMode === 'email'
                  ? 'bg-tx text-canvas shadow-sm font-semibold'
                  : 'text-tx-muted hover:text-tx'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email &amp; Password</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginMode('whatsapp');
                setError(null);
                setNotice(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
                loginMode === 'whatsapp'
                  ? 'bg-tx text-canvas shadow-sm font-semibold'
                  : 'text-tx-muted hover:text-tx'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Login</span>
            </button>
          </div>
        )}

        {error && (
          <Card className="mb-5 p-3.5 text-tx text-xs font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </Card>
        )}

        {notice && (
          <Card className="mb-5 p-3.5 text-tx text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-tx flex-shrink-0" />
            <span>{notice}</span>
          </Card>
        )}

        {/* MODE 1: EMAIL & PASSWORD LOGIN */}
        {loginMode === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {!tempToken ? (
              <>
                <Input
                  type="email"
                  label="Email Address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@crm.local"
                />

                <Input
                  type="password"
                  label="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </>
            ) : (
              <div>
                <label className="block text-xs font-medium text-tx-muted mb-1.5">
                  Two-Factor Authentication (2FA) Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="000000"
                  className="input-luxury text-center text-lg font-mono tracking-widest"
                />
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full text-xs py-3 mt-2"
            >
              {loading ? 'Authenticating...' : tempToken ? 'Verify 2FA' : 'Sign In'}
            </Button>
          </form>
        )}

        {/* MODE 2: WHATSAPP OTP LOGIN */}
        {loginMode === 'whatsapp' && (
          <form onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp} className="space-y-4">
            <Input
              type="text"
              label="Registered Phone / WhatsApp Number"
              required
              disabled={otpSent}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+923001234567 or +971501234567"
              className="font-mono text-xs"
            />

            {otpSent && (
              <>
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-surface-2 border border-border rounded-xl text-tx text-xs font-semibold flex items-center justify-between hover:bg-row-hover transition"
                  >
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4" />
                      <span>Open WhatsApp to view code</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <div>
                  <label className="block text-xs font-medium text-tx-muted mb-1.5">
                    Enter 6-Digit WhatsApp OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="input-luxury text-center text-lg font-mono tracking-widest"
                  />
                </div>
              </>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full text-xs py-3 mt-2"
            >
              {loading ? 'Processing...' : otpSent ? 'Verify OTP & Sign In' : 'Send WhatsApp OTP'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};
