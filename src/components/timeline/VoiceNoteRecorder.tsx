import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Send, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client.js';

interface VoiceNoteRecorderProps {
  leadId: string;
  onVoiceNoteCreated: () => void;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  leadId,
  onVoiceNoteCreated,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Timer effect
  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 120) {
            // Auto stop at 2 minutes
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = async () => {
    setError(null);
    setAudioBlob(null);
    setAudioUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setError('Microphone access denied or not available.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
  };

  const togglePreviewPlay = () => {
    if (!audioUrl) return;
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(audioUrl);
      previewAudioRef.current.onended = () => setIsPlayingPreview(false);
    }

    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const handleSendVoiceNote = async () => {
    if (!audioBlob) return;
    setSubmitting(true);
    setError(null);

    try {
      // Convert blob to Base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        await api.post(`/leads/${leadId}/timeline`, {
          type: 'voice_note',
          payload: {
            audioData: base64Audio,
            durationSec: recordingDuration || 1,
            notes: 'Voice memo recorded on client timeline',
          },
        });

        // Reset
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingDuration(0);
        setSubmitting(false);
        onVoiceNoteCreated();
      };
    } catch (err: any) {
      setError(err.message || 'Failed to send voice note');
      setSubmitting(false);
    }
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-surface-2 border border-border rounded-card p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-tx flex items-center gap-1.5 tracking-tight">
          <Mic className="w-3.5 h-3.5 text-tx" />
          <span className="serif">Timeline voice memo</span>
        </span>
        {isRecording && (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-tx font-medium px-2 py-0.5 rounded-full border border-border bg-surface-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-tx" />
            <span>RECORDING ({formatSec(recordingDuration)})</span>
          </span>
        )}
      </div>

      {error && (
        <div className="text-[11px] text-tx-muted bg-surface-1 p-2 rounded-btn border border-border mono">
          {error}
        </div>
      )}

      {/* Control State Bar */}
      {!isRecording && !audioBlob && (
        <button
          type="button"
          onClick={startRecording}
          className="w-full py-2.5 bg-surface-1 hover:bg-surface-2 border border-border text-tx rounded-btn text-xs font-medium flex items-center justify-center gap-2 transition"
        >
          <Mic className="w-3.5 h-3.5 text-tx" />
          <span>Tap to record voice note</span>
        </button>
      )}

      {isRecording && (
        <div className="flex items-center justify-between gap-3 bg-surface-1 p-2.5 rounded-btn border border-border">
          <div className="flex items-center gap-2 text-xs text-tx font-mono">
            <span className="w-2 h-2 rounded-full bg-tx animate-ping" />
            <span>Speaking... {formatSec(recordingDuration)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="p-1.5 text-tx-subtle hover:text-tx rounded-btn hover:bg-surface-2 transition text-xs"
              title="Cancel"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="px-3 py-1.5 bg-tx text-canvas rounded-btn text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Done</span>
            </button>
          </div>
        </div>
      )}

      {audioBlob && !isRecording && (
        <div className="flex items-center justify-between gap-3 bg-surface-1 p-2.5 rounded-btn border border-border">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePreviewPlay}
              className="w-7 h-7 bg-tx text-canvas rounded-full flex items-center justify-center hover:opacity-90 transition"
              title={isPlayingPreview ? 'Pause' : 'Play Preview'}
            >
              {isPlayingPreview ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>
            <span className="text-xs text-tx font-mono">
              Voice Note ({formatSec(recordingDuration)})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              disabled={submitting}
              className="p-1.5 text-tx-subtle hover:text-tx rounded-btn hover:bg-surface-2 transition"
              title="Discard"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleSendVoiceNote}
              disabled={submitting}
              className="px-3.5 py-1.5 bg-tx text-canvas rounded-btn text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40"
            >
              {submitting ? (
                <div className="w-3.5 h-3.5 border-2 border-canvas border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  <span>Send note</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const VoiceNotePlayer: React.FC<{
  audioData: string;
  durationSec?: number;
  createdAt?: string;
}> = ({
  audioData,
  durationSec,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioData);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatSec = (sec?: number) => {
    if (!sec) return '0:15';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-surface-2 border border-border rounded-btn max-w-sm">
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-tx text-canvas flex items-center justify-center flex-shrink-0 transition hover:opacity-90"
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 h-3">
          {/* Animated sound bars */}
          {[40, 70, 30, 90, 60, 45, 80, 55, 75, 40, 65, 30].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-300 ${
                isPlaying ? 'bg-tx animate-pulse' : 'bg-border'
              }`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <span className="text-[10px] text-tx-muted mono mt-1.5 block">
          {isPlaying ? 'Playing Voice Note...' : `Voice Memo • ${formatSec(durationSec)}`}
        </span>
      </div>
    </div>
  );
};
