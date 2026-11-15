import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api, getAccessToken } from '../api/client.js';
import { useAuth } from '../auth/AuthProvider.js';
import {
  MessageSquare,
  Send,
  Hash,
  Plus,
  ChevronLeft,
  Mic,
  Square,
  Trash2,
  Edit2,
  Smile,
  CheckCheck,
  X,
  Check,
  Volume2,
} from 'lucide-react';
import { Card, Button, Input, Modal } from '../components/ui/index.js';
import { VoiceNotePlayer } from '../components/timeline/VoiceNoteRecorder.js';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '🚀', '🎉', '👏', '💯', '🤝', '📞', '💬', '💼', '⚡', '🏢', '🎯', '✨', '🙏', '🙌', '😍', '🤩'];
const REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥', '🚀', '🎉'];

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New Channel Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [creatingChannel, setCreatingChannel] = useState(false);

  // Edit Message State
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editMsgText, setEditMsgText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Emoji Popover
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Message Reactions Map: msgId -> array of emojis
  const [messageReactions, setMessageReactions] = useState<Record<string, string[]>>({});

  // Voice Note Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const fetchConversations = async () => {
    try {
      const data = await api.get<any[]>('/conversations');
      setConversations(data);
      if (data.length > 0 && !activeConv) {
        setActiveConv(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const data = await api.get<any[]>(`/conversations/${convId}/messages`);
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();

    const token = getAccessToken();
    const rawBase = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).trim().replace(/\/$/, '') : '';
    let socketBase = rawBase.endsWith('/api') ? rawBase.slice(0, -4) : rawBase;
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && socketBase.startsWith('http://')) {
      socketBase = socketBase.replace(/^http:\/\//, 'https://');
    }
    const chatSocket = io(`${socketBase}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    chatSocket.on('connect', () => {
      setIsConnected(true);
    });

    chatSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    chatSocket.on('new_message', (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    });

    chatSocket.on('message_updated', (updated: any) => {
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    });

    chatSocket.on('message_deleted', (data: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    });

    setSocket(chatSocket);

    return () => {
      chatSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv.id);
      if (socket) {
        socket.emit('join_conversation', activeConv.id);
      }
    }
  }, [activeConv, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice Note Recording Functions
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());

        if (audioBlob.size > 0 && activeConv) {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            const payload = JSON.stringify({
              type: 'voice',
              audio: base64Audio,
              duration: recordingDuration || 5,
            });
            try {
              await api.post(`/conversations/${activeConv.id}/messages`, { body: payload });
            } catch (err) {
              console.error(err);
            }
          };
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((p) => p + 1);
      }, 1000);
    } catch (err: any) {
      alert('Microphone access denied or not available: ' + err.message);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      audioChunksRef.current = [];
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeConv) return;

    const bodyText = newMsg.trim();
    setNewMsg('');
    setShowEmojiPicker(false);

    try {
      await api.post(`/conversations/${activeConv.id}/messages`, {
        body: bodyText,
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Edit Message
  const handleStartEdit = (msg: any) => {
    setEditingMsgId(msg.id);
    setEditMsgText(msg.body);
  };

  const handleSaveEdit = async (msgId: string) => {
    if (!editMsgText.trim() || !activeConv) return;
    setSavingEdit(true);
    try {
      const res = await api.patch<any>(`/conversations/${activeConv.id}/messages/${msgId}`, {
        body: editMsgText.trim(),
      });
      setMessages((prev) => prev.map((m) => (m.id === msgId ? res : m)));
      setEditingMsgId(null);
    } catch (err: any) {
      alert(`Edit failed: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Message
  const handleDeleteMessage = async (msgId: string) => {
    if (!activeConv) return;
    try {
      await api.delete(`/conversations/${activeConv.id}/messages/${msgId}`);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Emoji Reaction
  const handleToggleReaction = (msgId: string, emoji: string) => {
    setMessageReactions((prev) => {
      const current = prev[msgId] || [];
      const updated = current.includes(emoji)
        ? current.filter((e) => e !== emoji)
        : [...current, emoji];
      return { ...prev, [msgId]: updated };
    });
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) return;
    setCreatingChannel(true);

    try {
      const conv = await api.post<any>('/conversations', {
        type: 'channel',
        name: channelName.trim(),
      });
      setShowNewModal(false);
      setChannelName('');
      setConversations((prev) => [conv, ...prev]);
      setActiveConv(conv);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreatingChannel(false);
    }
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Card className="flex h-[calc(100vh-8rem)] overflow-hidden p-0 relative">
      {/* Channels & Direct Conversations Sidebar */}
      <div
        className={`w-full md:w-64 bg-surface-1 border-r border-border flex flex-col flex-shrink-0 ${
          mobileShowChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-serif text-sm font-bold text-tx flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-tx" />
            <span>Team Channels</span>
          </h2>
          <button
            onClick={() => setShowNewModal(true)}
            className="p-1 text-tx-muted hover:text-tx hover:bg-surface-2 rounded-lg transition"
            title="Create Channel"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-tx-subtle">
              No channels yet.
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = activeConv?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveConv(conv);
                    setMobileShowChat(true);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition ${
                    isSelected
                      ? 'bg-surface-2 text-tx font-semibold border border-border'
                      : 'text-tx-muted hover:bg-surface-2 hover:text-tx'
                  }`}
                >
                  <Hash className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{conv.name || 'General Outreach'}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Messages Stream & Chat Window */}
      <div
        className={`flex-1 flex flex-col min-w-0 bg-canvas ${
          mobileShowChat ? 'flex' : 'hidden md:flex'
        }`}
      >
        {/* Chat Header */}
        <div className="h-14 px-4 sm:px-6 border-b border-border flex items-center justify-between bg-surface-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileShowChat(false)}
              className="md:hidden p-1.5 -ml-1 mr-1 text-tx-muted hover:text-tx rounded-lg hover:bg-surface-2 transition"
              title="Back to Channels"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <Hash className="w-4 h-4 text-tx" />
            <span className="font-serif font-bold text-tx text-sm truncate max-w-[180px] sm:max-w-none">
              {activeConv?.name || 'General Outreach'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {isConnected ? (
              <span className="flex items-center gap-1.5 text-tx font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full bg-tx inline-block animate-pulse" />
                <span className="hidden sm:inline">Online</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-tx-subtle font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full border border-tx-subtle inline-block" />
                <span className="hidden sm:inline">Disconnected</span>
              </span>
            )}
          </div>
        </div>

        {/* Message Bubble Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-16 text-xs text-tx-subtle">
              No messages yet in this channel. Send the first message or voice note below.
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === user?.id;
              const isEditing = editingMsgId === m.id;
              const reactions = messageReactions[m.id] || [];

              // Check if body is a Voice Note
              let voiceData: { audio: string; duration?: number } | null = null;
              if (typeof m.body === 'string' && m.body.startsWith('{"type":"voice"')) {
                try {
                  const parsed = JSON.parse(m.body);
                  if (parsed.type === 'voice') voiceData = parsed;
                } catch {}
              } else if (typeof m.body === 'string' && m.body.startsWith('data:audio')) {
                voiceData = { audio: m.body, duration: 15 };
              }

              return (
                <div
                  key={m.id}
                  className={`flex flex-col group relative ${isMe ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender Info & Role Badge */}
                  <div className="flex items-center gap-2 mb-1 text-[11px] text-tx-muted">
                    <span className="font-serif font-semibold text-tx">{m.senderName}</span>
                    <span className="text-[9px] mono px-1.5 py-0.2 bg-surface-2 border border-border rounded text-tx-subtle">
                      {isMe ? (user?.role || 'TEAM').toUpperCase() : 'TEAM'}
                    </span>
                    <span className="font-mono text-[10px] text-tx-subtle">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Bubble & Actions Container */}
                  <div className="relative max-w-md">
                    {/* Floating WhatsApp Action Menu (Edit, Delete, React) */}
                    <div
                      className={`absolute -top-7 ${
                        isMe ? 'right-0' : 'left-0'
                      } hidden group-hover:flex items-center gap-1 bg-surface-1 border border-border rounded-lg shadow-sm px-1.5 py-0.5 z-10 text-xs`}
                    >
                      {/* Quick Reactions */}
                      {REACTION_EMOJIS.slice(0, 4).map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleToggleReaction(m.id, emoji)}
                          className="hover:scale-125 transition text-xs p-0.5"
                          title={`React ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}

                      {/* Edit (only for text messages by author/admin) */}
                      {!voiceData && (isMe || user?.role === 'admin') && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(m)}
                          className="p-1 hover:text-tx text-tx-subtle transition"
                          title="Edit message"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}

                      {/* Delete */}
                      {(isMe || user?.role === 'admin') && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(m.id)}
                          className="p-1 hover:text-tx text-tx-subtle transition"
                          title="Delete message"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Content: Edit Mode vs Normal View */}
                    {isEditing ? (
                      <div className="p-2 bg-surface-2 border border-border rounded-xl space-y-2 w-72">
                        <input
                          type="text"
                          value={editMsgText}
                          onChange={(e) => setEditMsgText(e.target.value)}
                          className="w-full input-luxury text-xs py-1.5 px-2"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingMsgId(null)}
                            className="btn-ghost text-[10px] py-1 px-2"
                          >
                            <X className="w-3 h-3 mr-0.5" />
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(m.id)}
                            disabled={savingEdit}
                            className="btn-primary text-[10px] py-1 px-2.5"
                          >
                            <Check className="w-3 h-3 mr-0.5" />
                            Save
                          </button>
                        </div>
                      </div>
                    ) : voiceData ? (
                      /* WhatsApp Style Voice Note Player */
                      <div className="p-1">
                        <VoiceNotePlayer
                          audioData={voiceData.audio}
                          durationSec={voiceData.duration || 10}
                        />
                      </div>
                    ) : (
                      /* Standard Message Bubble */
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-xs break-words shadow-sm leading-relaxed ${
                          isMe
                            ? 'bg-tx text-canvas font-medium rounded-br-none'
                            : 'bg-surface-2 text-tx border border-border rounded-bl-none'
                        }`}
                      >
                        <span>{m.body}</span>
                        {isMe && (
                          <span className="inline-flex items-center ml-1.5 text-[9px] opacity-75">
                            <CheckCheck className="w-3 h-3 inline" />
                          </span>
                        )}
                      </div>
                    )}

                    {/* Reactions Display */}
                    {reactions.length > 0 && (
                      <div
                        className={`flex items-center gap-1 mt-1 ${
                          isMe ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {reactions.map((emoji, idx) => (
                          <span
                            key={idx}
                            onClick={() => handleToggleReaction(m.id, emoji)}
                            className="text-[11px] px-1.5 py-0.5 bg-surface-2 border border-border rounded-full cursor-pointer hover:scale-110 transition"
                          >
                            {emoji}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Emoji Popover */}
        {showEmojiPicker && (
          <div className="absolute bottom-16 left-6 p-2 bg-surface-1 border border-border rounded-xl shadow-lg flex flex-wrap gap-1.5 max-w-xs z-30">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setNewMsg((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                className="text-base p-1.5 hover:bg-surface-2 rounded-lg transition"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar / Voice Recording Bar */}
        <div className="p-3 sm:p-4 border-t border-border bg-surface-1">
          {isRecording ? (
            /* Active WhatsApp Voice Note Bar */
            <div className="flex items-center justify-between bg-surface-2 border border-border p-2.5 rounded-btn">
              <div className="flex items-center gap-2.5 text-xs text-tx">
                <span className="w-2.5 h-2.5 rounded-full bg-tx animate-ping" />
                <span className="mono font-semibold text-tx">Recording Voice Note...</span>
                <span className="mono text-[11px] text-tx-muted">{formatSec(recordingDuration)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelVoiceRecording}
                  className="btn-ghost text-xs p-1.5 text-tx-subtle hover:text-tx"
                  title="Discard voice note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={stopVoiceRecording}
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  title="Send voice note"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          ) : (
            /* Standard Text Message Form */
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              {/* Emoji Picker Button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker((p) => !p)}
                className={`p-2 rounded-lg transition ${
                  showEmojiPicker ? 'bg-surface-2 text-tx' : 'text-tx-subtle hover:text-tx hover:bg-surface-2'
                }`}
                title="Add emoji"
              >
                <Smile className="w-4 h-4" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder={`Message #${activeConv?.name || 'channel'}...`}
                className="flex-1 input-luxury text-xs"
              />

              {/* Voice Note Button */}
              <button
                type="button"
                onClick={startVoiceRecording}
                className="p-2 text-tx-subtle hover:text-tx hover:bg-surface-2 rounded-lg transition"
                title="Record voice note"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Send Button */}
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!newMsg.trim()}
                className="p-2.5"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Create Channel Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Create Team Channel"
      >
        <form onSubmit={handleCreateChannel} className="space-y-4">
          <Input
            label="Channel Name"
            required
            placeholder="e.g. dubai-prospecting"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowNewModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={creatingChannel}
            >
              Create channel
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
};
