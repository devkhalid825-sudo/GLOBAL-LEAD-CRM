import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider.js';
import {
  ShieldCheck,
  KeyRound,
  Mail,
  ArrowRight,
  Lock,
  MessageCircle,
  Smartphone,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { api } from '../api/client.js';

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
      setNotice('6-Digit OTP generated! Click below to view in WhatsApp or enter the code.');
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
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white mb-3 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-tight">Global Lead CRM</h1>
          <p className="text-xs text-neutral-400 mt-1 font-sans">
            Enterprise Intelligence &amp; B2B Outreach Portal
          </p>
        </div>

        {/* Toggle between Email & WhatsApp Login */}
        {!tempToken && (
          <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-2xl mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setLoginMode('email');
                setError(null);
                setNotice(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                loginMode === 'email'
                  ? 'bg-neutral-800 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
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
              className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                loginMode === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Login</span>
            </button>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* MODE 1: EMAIL & PASSWORD LOGIN */}
        {loginMode === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {!tempToken ? (
              <>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@crm.local"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-xs focus:outline-none focus:border-white transition placeholder-neutral-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-xs focus:outline-none focus:border-white transition placeholder-neutral-600"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs text-center font-medium">
                  Two-Factor Authentication is active. Enter the 6-digit code from your authenticator app.
                </div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2 text-center">
                  6-Digit Security Code
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-11 pr-4 py-3 text-white text-center tracking-widest text-lg font-mono focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-white hover:bg-neutral-200 text-black font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : tempToken ? (
                <>
                  <span>Verify 2FA &amp; Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {tempToken && (
              <button
                type="button"
                onClick={() => setTempToken(null)}
                className="mt-3 w-full text-center text-xs text-neutral-400 hover:text-white transition"
              >
                ← Back to email and password
              </button>
            )}
          </form>
        )}

        {/* MODE 2: DIRECT WHATSAPP OTP LOGIN */}
        {loginMode === 'whatsapp' && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                    WhatsApp Phone Number
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +92 300 1234567 or +971 50 1234567"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500 transition placeholder-neutral-600 font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    A 6-digit login verification code will be sent to your WhatsApp.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.trim().length < 8}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/40 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      <span>Send WhatsApp OTP Code</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {waLink && (
                  <div className="p-3 bg-neutral-900 border border-emerald-500/30 rounded-xl text-center space-y-2">
                    <span className="text-xs text-neutral-300 block">
                      Code generated for <strong>{phone}</strong>!
                    </span>
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Open WhatsApp to Confirm Code ↗</span>
                    </a>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2 text-center">
                    Enter 6-Digit WhatsApp Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-4 text-center text-xl font-mono tracking-widest text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/40 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Verify WhatsApp Code &amp; Enter</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                    }}
                    className="text-neutral-400 hover:text-white transition"
                  >
                    ← Change Phone Number
                  </button>

                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
