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
    <div className="min-h-screen bg-white flex items-center justify-center p-4 selection:bg-black selection:text-white">
      <div className="w-full max-w-md card-luxury p-8 shadow-xl relative overflow-hidden">
        {/* Brand Header matching Figma */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center font-bold text-sm mb-3">
            CRM
          </div>
          <h1 className="serif text-2xl sm:text-3xl font-bold tracking-[0.12em] text-black">
            GLOBAL CRM
          </h1>
          <p className="text-xs text-[#525252] mt-1 font-sans">
            Enterprise Intelligence &amp; B2B Outreach Portal
          </p>
        </div>

        {/* Toggle between Email & WhatsApp Login */}
        {!tempToken && (
          <div className="flex items-center gap-1.5 p-1 bg-[#F0F0F0] border border-[#E5E5E5] rounded-xl mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setLoginMode('email');
                setError(null);
                setNotice(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
                loginMode === 'email'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-[#737373] hover:text-black'
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
                  ? 'bg-black text-white shadow-sm'
                  : 'text-[#737373] hover:text-black'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Login</span>
            </button>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="mb-5 p-3.5 bg-neutral-100 border border-[#E5E5E5] rounded-xl text-black text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-black flex-shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* MODE 1: EMAIL & PASSWORD LOGIN */}
        {loginMode === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {!tempToken ? (
              <>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#525252] mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@crm.local"
                      className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl pl-10 pr-4 py-2.5 text-black text-xs focus:outline-none focus:border-black transition placeholder-[#737373]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#525252] mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl pl-10 pr-4 py-2.5 text-black text-xs focus:outline-none focus:border-black transition placeholder-[#737373]"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#525252] mb-1.5">
                  Two-Factor Authentication (2FA) Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="000000"
                  className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl px-4 py-2.5 text-black text-center text-lg mono tracking-widest focus:outline-none focus:border-black"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-solid w-full text-xs py-3 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : tempToken ? 'Verify 2FA' : 'Sign In'}</span>
            </button>
          </form>
        )}

        {/* MODE 2: WHATSAPP OTP LOGIN */}
        {loginMode === 'whatsapp' && (
          <form onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#525252] mb-1.5">
                Registered Phone / WhatsApp Number
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  disabled={otpSent}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+923001234567 or +971501234567"
                  className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl pl-10 pr-4 py-2.5 text-black text-xs focus:outline-none focus:border-black transition placeholder-[#737373] mono"
                />
              </div>
            </div>

            {otpSent && (
              <>
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-[#F0F0F0] border border-[#E5E5E5] rounded-xl text-black text-xs font-semibold flex items-center justify-between hover:bg-neutral-200 transition"
                  >
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4" />
                      <span>Open WhatsApp to view code</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#525252] mb-1.5">
                    Enter 6-Digit WhatsApp OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl px-4 py-2.5 text-black text-center text-lg mono tracking-widest focus:outline-none focus:border-black"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-solid w-full text-xs py-3 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : otpSent ? 'Verify OTP & Sign In' : 'Send WhatsApp OTP'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
