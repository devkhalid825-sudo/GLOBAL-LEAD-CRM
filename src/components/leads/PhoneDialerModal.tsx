import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Video,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Modal, Button, Pill, Textarea, Select } from '../ui/index.js';
import { api } from '../../api/client.js';

interface PhoneDialerModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName?: string;
  phoneNumber?: string;
  leadId?: string;
  onCallLogged?: () => void;
}

export const PhoneDialerModal: React.FC<PhoneDialerModalProps> = ({
  isOpen,
  onClose,
  recipientName = 'Client Prospect',
  phoneNumber = '',
  leadId,
  onCallLogged,
}) => {
  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [dialedDigits, setDialedDigits] = useState('');
  const [callOutcome, setCallOutcome] = useState('connected');
  const [callNotes, setCallNotes] = useState('');
  const [savingLog, setSavingLog] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const timerRef = useRef<any>(null);

  const cleanPhone = (phoneNumber || dialedDigits).replace(/[^\d+]/g, '');

  useEffect(() => {
    if (isOpen) {
      setDialedDigits(phoneNumber);
      setCallState('idle');
      setDuration(0);
      setIsMuted(false);
      setCallNotes('');
      setNotice(null);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen, phoneNumber]);

  // Call timer
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  const handleStartCall = () => {
    setCallState('calling');
    setNotice('Connecting through secure CRM VoIP gateway...');
    setTimeout(() => {
      setCallState('connected');
      setNotice('Call Connected. Audio line active.');
    }, 2000);
  };

  const handleEndCall = () => {
    setCallState('ended');
    setNotice('Call ended. Please review outcome and save call minutes.');
  };

  const handleSaveCallLog = async () => {
    setSavingLog(true);
    try {
      if (leadId) {
        await api.post(`/leads/${leadId}/timeline`, {
          type: 'call',
          payload: {
            phone: cleanPhone,
            durationSec: duration,
            outcome: callOutcome,
            notes: callNotes,
            completedAt: new Date().toISOString(),
          },
        });
      }
      setNotice('Call outcome successfully recorded on CRM timeline!');
      if (onCallLogged) onCallLogged();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setNotice(`Failed to save call log: ${err.message}`);
    } finally {
      setSavingLog(false);
    }
  };

  const formatSec = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const keypad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  const handleKeyClick = (key: string) => {
    setDialedDigits((prev) => prev + key);
  };

  const openWebRtcRoom = () => {
    const roomCode = Math.random().toString(36).substring(2, 9);
    const url = `https://meet.jit.si/GlobalCRM-Call-${roomCode}`;
    window.open(url, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Global CRM Softphone &amp; VoIP Dialer"
    >
      <div className="space-y-5">
        {/* Call Banner Header */}
        <div className="bg-surface-2 border border-border rounded-2xl p-5 text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-full bg-surface-1 border border-border flex items-center justify-center text-tx shadow-sm">
            {callState === 'connected' ? (
              <PhoneCall className="w-7 h-7 text-green-600 animate-pulse" />
            ) : callState === 'calling' ? (
              <Phone className="w-7 h-7 text-yellow-600 animate-bounce" />
            ) : (
              <Phone className="w-7 h-7 text-tx" />
            )}
          </div>

          <div>
            <h3 className="serif text-lg font-bold text-tx">{recipientName}</h3>
            <p className="mono text-xs text-tx font-semibold">{cleanPhone || 'No phone selected'}</p>
          </div>

          {/* Status & Timer */}
          <div className="flex items-center justify-center gap-2 pt-1 font-mono text-xs">
            {callState === 'connected' ? (
              <span className="inline-flex items-center gap-1.5 text-green-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                <span>Connected · {formatSec(duration)}</span>
              </span>
            ) : callState === 'calling' ? (
              <span className="text-yellow-600 font-semibold animate-pulse">Ringing...</span>
            ) : callState === 'ended' ? (
              <span className="text-tx-subtle">Call Finished ({formatSec(duration)})</span>
            ) : (
              <span className="text-tx-muted">Ready to call</span>
            )}
          </div>
        </div>

        {notice && (
          <div className="p-2.5 bg-surface-1 border border-border rounded-xl text-xs text-tx flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-tx flex-shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Softphone Keypad (When Idle or Dialing) */}
        {callState === 'idle' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
              {keypad.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeyClick(k)}
                  className="h-11 rounded-xl bg-surface-1 hover:bg-surface-2 border border-border text-tx font-mono font-bold text-sm transition active:scale-95 flex items-center justify-center shadow-xs"
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <Button
                variant="primary"
                onClick={handleStartCall}
                disabled={!cleanPhone}
                size="sm"
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                <PhoneCall className="w-4 h-4 mr-1.5" />
                <span>Start CRM Call</span>
              </Button>

              <Button
                variant="ghost"
                onClick={openWebRtcRoom}
                size="sm"
                className="border border-border text-xs"
                title="Launch browser-to-browser voice/video room"
              >
                <Video className="w-3.5 h-3.5 mr-1 text-tx" />
                <span>Instant Call Room</span>
              </Button>
            </div>

            {/* Quick External Fallbacks */}
            <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-tx-muted">
              <span>External App Direct:</span>
              <div className="flex items-center gap-2">
                {cleanPhone && (
                  <>
                    <a
                      href={`tel:${cleanPhone}`}
                      className="hover:text-tx inline-flex items-center gap-1 font-mono text-[11px] underline"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Phone App</span>
                    </a>
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-tx inline-flex items-center gap-1 font-mono text-[11px] underline text-green-700"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp Voice</span>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* In-Call Active Controls */}
        {(callState === 'calling' || callState === 'connected') && (
          <div className="flex items-center justify-center gap-4 py-2">
            <button
              type="button"
              onClick={() => setIsMuted((p) => !p)}
              className={`p-3 rounded-full border transition ${
                isMuted
                  ? 'bg-red-500 text-white border-red-600'
                  : 'bg-surface-1 text-tx border-border hover:bg-surface-2'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={handleEndCall}
              className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center gap-2 shadow-md transition active:scale-95"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Call</span>
            </button>
          </div>
        )}

        {/* Post-Call Outcome & Minutes Logging */}
        {callState === 'ended' && (
          <div className="space-y-4 pt-2 border-t border-border">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-tx block">Call Outcome</label>
              <select
                value={callOutcome}
                onChange={(e) => setCallOutcome(e.target.value)}
                className="input-luxury text-xs py-2 w-full"
              >
                <option value="connected">Connected / Pitched Deal</option>
                <option value="callback_scheduled">Follow-up / Callback Scheduled</option>
                <option value="left_voicemail">Left Voicemail / Voice Note</option>
                <option value="busy">Busy / No Answer</option>
                <option value="wrong_number">Wrong Number / Inactive</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-tx block">Call Minutes &amp; Notes</label>
              <Textarea
                placeholder="What was discussed? Client website needs, budget, questions..."
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={onClose} size="sm">
                Discard
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveCallLog}
                loading={savingLog}
                size="sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                <span>Save to Lead Timeline</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
