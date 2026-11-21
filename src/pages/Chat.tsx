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
  Paperclip,
  FileText,
  Image as ImageIcon,
  Phone,
  Video,
  Download,
  ExternalLink,
  PhoneCall,
  AlertCircle,
  MoreVertical,
} from 'lucide-react';
import { Card, Button, Input, Modal } from '../components/ui/index.js';
import { VoiceNotePlayer } from '../components/timeline/VoiceNoteRecorder.js';
import { PhoneDialerModal } from '../components/leads/PhoneDialerModal.js';

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

  // Attachment Menu & Hidden File Inputs
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // Softphone Dialer Modal
  const [showPhoneDialer, setShowPhoneDialer] = useState(false);

  // In-CRM WebRTC Calling State (Voice or Video CRM-to-CRM)
  const [activeCall, setActiveCall] = useState<{
    isOpen: boolean;
    mode: 'voice' | 'video';
    roomCode: string;
    roomUrl: string;
    title: string;
  } | null>(null);

  // Edit Thread Name Modal
  const [showEditThreadModal, setShowEditThreadModal] = useState(false);
  const [editThreadName, setEditThreadName] = useState('');
  const [savingThreadName, setSavingThreadName] = useState(false);

  // Delete Thread Confirmation Modal
  const [showDeleteThreadModal, setShowDeleteThreadModal] = useState(false);
  const [deletingThread, setDeletingThread] = useState(false);

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
      const res: any = await api.get('/conversations');
      const list = Array.isArray(res) ? res : res?.data || [];
      setConversations(list);
      if (list.length > 0 && !activeConv) {
        setActiveConv(list[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const res: any = await api.get(`/conversations/${convId}/messages`);
      const list = Array.isArray(res) ? res : res?.data || [];
      setMessages(list);
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

    chatSocket.on('conversation_deleted', (data: { conversationId: string }) => {
      setConversations((prev) => prev.filter((c) => c.id !== data.conversationId));
      setActiveConv((curr: any) => (curr?.id === data.conversationId ? null : curr));
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

  // Voice Note Recording
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
      alert('Microphone access denied: ' + err.message);
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

  // Text Message Sending
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeConv) return;

    const bodyText = newMsg.trim();
    setNewMsg('');
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);

    try {
      await api.post(`/conversations/${activeConv.id}/messages`, {
        body: bodyText,
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Document & File Upload
  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>, fileKind: 'document' | 'image') => {
    const file = e.target.files?.[0];
    if (!file || !activeConv) return;
    setShowAttachmentMenu(false);

    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      const payload = JSON.stringify({
        type: fileKind,
        name: file.name,
        size: sizeStr,
        mimeType: file.type,
        data: base64Data,
      });

      try {
        await api.post(`/conversations/${activeConv.id}/messages`, { body: payload });
      } catch (err: any) {
        alert(`File share failed: ${err.message}`);
      }
    };
    e.target.value = '';
  };

  // CRM-to-CRM Internal Audio or Video Call Launcher
  const handleStartInternalCall = async (mode: 'voice' | 'video') => {
    if (!activeConv) return;
    setShowAttachmentMenu(false);
    const roomCode = Math.random().toString(36).substring(2, 9);
    const roomUrl = `https://meet.jit.si/GlobalCRM-Internal-${roomCode}`;
    const callTitle =
      mode === 'voice'
        ? `📞 CRM Voice Call: ${activeConv.name || 'Team'}`
        : `📹 Strategy Meeting: ${activeConv.name || 'Team'}`;

    // Open In-CRM Live Calling Modal immediately
    setActiveCall({
      isOpen: true,
      mode,
      roomCode,
      roomUrl,
      title: callTitle,
    });

    const payload = JSON.stringify({
      type: 'meet_invite',
      callMode: mode,
      title: callTitle,
      link: roomUrl,
      roomCode,
      startedBy: user?.name || 'CRM Team',
      startedAt: new Date().toISOString(),
    });

    try {
      await api.post(`/conversations/${activeConv.id}/messages`, { body: payload });
    } catch {}
  };

  const handleJoinInternalCall = (url: string, title?: string, mode?: 'voice' | 'video') => {
    setActiveCall({
      isOpen: true,
      mode: mode || 'video',
      roomCode: url.split('-').pop() || 'call',
      roomUrl: url,
      title: title || 'Live CRM Session',
    });
  };

  // Save renamed thread
  const handleSaveThreadName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !editThreadName.trim()) return;
    setSavingThreadName(true);
    try {
      const res: any = await api.patch(`/conversations/${activeConv.id}`, {
        name: editThreadName.trim(),
      });
      const updated = res?.data || res;
      setActiveConv(updated);
      setConversations((prev) => prev.map((c) => (c.id === activeConv.id ? updated : c)));
      setShowEditThreadModal(false);
    } catch (err: any) {
      alert(`Rename thread failed: ${err.message}`);
    } finally {
      setSavingThreadName(false);
    }
  };

  // Delete entire conversation thread
  const handleDeleteThread = async () => {
    if (!activeConv) return;
    setDeletingThread(true);
    try {
      await api.delete(`/conversations/${activeConv.id}`);
      const remaining = conversations.filter((c) => c.id !== activeConv.id);
      setConversations(remaining);
      setActiveConv(remaining.length > 0 ? remaining[0] : null);
      setMessages([]);
      setShowDeleteThreadModal(false);
    } catch (err: any) {
      alert(`Delete thread failed: ${err.message}`);
    } finally {
      setDeletingThread(false);
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
      const res: any = await api.patch(`/conversations/${activeConv.id}/messages/${msgId}`, {
        body: editMsgText.trim(),
      });
      const updated = res?.data || res;
      setMessages((prev) => prev.map((m) => (m.id === msgId ? updated : m)));
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
      const res: any = await api.post('/conversations', {
        type: 'channel',
        name: channelName.trim(),
      });
      const conv = res?.data || res;
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
      {/* Hidden File Inputs for Document & Image Sharing */}
      <input
        type="file"
        ref={docInputRef}
        onChange={(e) => handleFileAttachment(e, 'document')}
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
      />
      <input
        type="file"
        ref={imgInputRef}
        onChange={(e) => handleFileAttachment(e, 'image')}
        className="hidden"
        accept="image/*"
      />

      {/* Channels & Direct Conversations Sidebar */}
      <div
        className={`w-full md:w-64 bg-surface-1 border-r border-border flex flex-col flex-shrink-0 ${
          mobileShowChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-serif text-sm font-bold text-tx flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-tx" />
            <span>Outreach Threads</span>
          </h2>
          <button
            onClick={() => setShowNewModal(true)}
            className="p-1.5 text-tx-muted hover:text-tx hover:bg-surface-2 rounded-lg transition"
            title="Create Thread / Channel"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-tx-subtle">
              No threads yet.
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
                      ? 'bg-surface-2 text-tx font-semibold border border-border shadow-xs'
                      : 'text-tx-muted hover:bg-surface-2 hover:text-tx'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-surface-2 border border-border flex items-center justify-center text-[10px] font-bold">
                    {conv.name ? conv.name.charAt(0).toUpperCase() : '#'}
                  </div>
                  <span className="truncate flex-1">{conv.name || 'Outreach Discussion'}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Messages Stream & WhatsApp Chat Window */}
      <div
        className={`flex-1 flex flex-col min-w-0 bg-canvas ${
          mobileShowChat ? 'flex' : 'hidden md:flex'
        }`}
      >
        {/* Chat Header: WhatsApp-style with Calling & Thread Actions */}
        <div className="h-14 px-4 sm:px-6 border-b border-border flex items-center justify-between bg-surface-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileShowChat(false)}
              className="md:hidden p-1.5 -ml-1 text-tx-muted hover:text-tx rounded-lg hover:bg-surface-2 transition"
              title="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {activeConv?.name ? activeConv.name.charAt(0).toUpperCase() : 'W'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-tx text-sm block truncate max-w-[160px] sm:max-w-none">
                  {activeConv?.name || 'Client Outreach Thread'}
                </span>
                {activeConv && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditThreadName(activeConv.name || '');
                      setShowEditThreadModal(true);
                    }}
                    className="p-1 text-tx-subtle hover:text-tx hover:bg-surface-2 rounded transition"
                    title="Edit Thread Name"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <span className="text-[10px] text-tx-subtle flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                <span>WhatsApp Active Sync • CRM Direct Line</span>
              </span>
            </div>
          </div>

          {/* Action Buttons: Voice Call, Video Call, Dialer, Delete Thread */}
          <div className="flex items-center gap-1.5">
            {/* 1. In-CRM Voice Call */}
            <button
              type="button"
              onClick={() => handleStartInternalCall('voice')}
              className="p-2 text-tx-muted hover:text-emerald-500 hover:bg-surface-2 rounded-lg transition"
              title="Start In-CRM Voice Call"
            >
              <Phone className="w-4 h-4 text-tx" />
            </button>

            {/* 2. In-CRM Video Strategy Session */}
            <button
              type="button"
              onClick={() => handleStartInternalCall('video')}
              className="p-2 text-tx-muted hover:text-blue-500 hover:bg-surface-2 rounded-lg transition"
              title="Start In-CRM Video Strategy Meeting"
            >
              <Video className="w-4 h-4 text-tx" />
            </button>

            {/* 3. Softphone Client Dialer */}
            <button
              type="button"
              onClick={() => setShowPhoneDialer(true)}
              className="p-2 text-tx-muted hover:text-tx hover:bg-surface-2 rounded-lg transition"
              title="Open Phone Dialer"
            >
              <PhoneCall className="w-4 h-4 text-tx" />
            </button>

            {/* 4. Delete Thread */}
            {activeConv && (
              <button
                type="button"
                onClick={() => setShowDeleteThreadModal(true)}
                className="p-2 text-tx-muted hover:text-red-500 hover:bg-surface-2 rounded-lg transition"
                title="Delete this thread"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Message Bubble Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-pattern-subtle">
          {messages.length === 0 ? (
            <div className="text-center py-16 text-xs text-tx-subtle space-y-2">
              <div className="w-12 h-12 rounded-full bg-surface-2 border border-border mx-auto flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-tx-muted" />
              </div>
              <p>No messages yet in this thread.</p>
              <p className="text-[11px]">Send text, documents, audio voice notes, or launch a live call below.</p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === user?.id;
              const isEditing = editingMsgId === m.id;
              const reactions = messageReactions[m.id] || [];

              // Parse special message payloads
              let voiceData: { audio: string; duration?: number } | null = null;
              let docData: { name: string; size?: string; data: string; caption?: string } | null = null;
              let imgData: { name?: string; data: string; caption?: string } | null = null;
              let meetData: { title?: string; link: string; startedBy?: string; callMode?: 'voice' | 'video' } | null = null;

              if (typeof m.body === 'string' && m.body.startsWith('{')) {
                try {
                  const parsed = JSON.parse(m.body);
                  if (parsed.type === 'voice') voiceData = parsed;
                  if (parsed.type === 'document') docData = parsed;
                  if (parsed.type === 'image') imgData = parsed;
                  if (parsed.type === 'meet_invite') meetData = parsed;
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
                      {isMe ? (user?.role || 'AGENT').toUpperCase() : 'CLIENT'}
                    </span>
                    <span className="font-mono text-[10px] text-tx-subtle">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Bubble Container */}
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

                      {/* Edit (only for plain text messages) */}
                      {!voiceData && !docData && !imgData && !meetData && (isMe || user?.role === 'admin') && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(m)}
                          className="p-1 hover:text-tx text-tx-subtle transition"
                          title="Edit message"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}

                      {/* Delete Message */}
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

                    {/* Content Rendering */}
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
                    ) : meetData ? (
                      /* 1. Live CRM-to-CRM Internal Call Invite Card */
                      <div className="p-3.5 bg-surface-2 border border-border rounded-2xl space-y-2.5 shadow-sm min-w-[260px]">
                        <div className="flex items-center gap-2 text-xs font-bold text-tx">
                          <div className={`w-7 h-7 rounded-full ${meetData.callMode === 'voice' ? 'bg-emerald-600' : 'bg-blue-600'} text-white flex items-center justify-center`}>
                            {meetData.callMode === 'voice' ? <Phone className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                          </div>
                          <span>{meetData.title || 'Live Strategy Session'}</span>
                        </div>
                        <p className="text-[11px] text-tx-muted leading-relaxed">
                          Started by <strong>{meetData.startedBy || 'Team Member'}</strong>. Audio &amp; video connected.
                        </p>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleJoinInternalCall(meetData.link, meetData.title, meetData.callMode)}
                          className="w-full justify-center text-xs"
                        >
                          {meetData.callMode === 'voice' ? <Phone className="w-3 h-3 mr-1.5" /> : <Video className="w-3 h-3 mr-1.5" />}
                          <span>Join Call In CRM</span>
                        </Button>
                      </div>
                    ) : docData ? (
                      /* 2. WhatsApp Document / PDF Box */
                      <div className="p-3 bg-surface-2 border border-border rounded-2xl space-y-2 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center text-tx flex-shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-tx truncate">{docData.name}</p>
                            <p className="text-[10px] text-tx-muted font-mono">{docData.size || 'Document'}</p>
                          </div>
                        </div>
                        <a
                          href={docData.data}
                          download={docData.name}
                          className="btn-ghost text-xs py-1.5 px-3 flex items-center justify-center gap-1.5 w-full border border-border"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download / Open Document</span>
                        </a>
                      </div>
                    ) : imgData ? (
                      /* 3. Photo / Image Card */
                      <div className="space-y-1">
                        <img
                          src={imgData.data}
                          alt={imgData.name || 'Shared Image'}
                          className="rounded-2xl max-h-64 object-cover border border-border cursor-pointer shadow-sm hover:opacity-95 transition"
                          onClick={() => window.open(imgData!.data, '_blank')}
                        />
                        {imgData.caption && <p className="text-xs text-tx px-1">{imgData.caption}</p>}
                      </div>
                    ) : voiceData ? (
                      /* 4. WhatsApp Voice Note Player */
                      <div className="p-1">
                        <VoiceNotePlayer
                          audioData={voiceData.audio}
                          durationSec={voiceData.duration || 10}
                        />
                      </div>
                    ) : (
                      /* 5. Standard Text Message Bubble */
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

        {/* Attachment Options Popover Menu */}
        {showAttachmentMenu && (
          <div className="absolute bottom-16 left-6 p-2 bg-surface-1 border border-border rounded-2xl shadow-xl space-y-1 z-30 min-w-[200px] animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => docInputRef.current?.click()}
              className="w-full text-left px-3 py-2 text-xs text-tx hover:bg-surface-2 rounded-xl flex items-center gap-2.5 transition"
            >
              <FileText className="w-4 h-4 text-tx" />
              <span>Share Document / PDF</span>
            </button>

            <button
              type="button"
              onClick={() => imgInputRef.current?.click()}
              className="w-full text-left px-3 py-2 text-xs text-tx hover:bg-surface-2 rounded-xl flex items-center gap-2.5 transition"
            >
              <ImageIcon className="w-4 h-4 text-tx" />
              <span>Share Photos &amp; Media</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAttachmentMenu(false);
                handleStartInternalCall('video');
              }}
              className="w-full text-left px-3 py-2 text-xs text-tx hover:bg-surface-2 rounded-xl flex items-center gap-2.5 transition"
            >
              <Video className="w-4 h-4 text-tx" />
              <span>Launch Video Call Room</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAttachmentMenu(false);
                setShowPhoneDialer(true);
              }}
              className="w-full text-left px-3 py-2 text-xs text-tx hover:bg-surface-2 rounded-xl flex items-center gap-2.5 transition"
            >
              <Phone className="w-4 h-4 text-tx" />
              <span>Open Softphone Dialer</span>
            </button>
          </div>
        )}

        {/* Floating Emoji Popover */}
        {showEmojiPicker && (
          <div className="absolute bottom-16 left-12 p-2 bg-surface-1 border border-border rounded-xl shadow-lg flex flex-wrap gap-1.5 max-w-xs z-30">
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
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
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
            /* Standard WhatsApp Input Form */
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              {/* Attachment Paperclip Button */}
              <button
                type="button"
                onClick={() => {
                  setShowAttachmentMenu((p) => !p);
                  setShowEmojiPicker(false);
                }}
                className={`p-2 rounded-lg transition ${
                  showAttachmentMenu ? 'bg-surface-2 text-tx' : 'text-tx-subtle hover:text-tx hover:bg-surface-2'
                }`}
                title="Attach Document, Photo, or Meeting Link"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Emoji Picker Button */}
              <button
                type="button"
                onClick={() => {
                  setShowEmojiPicker((p) => !p);
                  setShowAttachmentMenu(false);
                }}
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
                placeholder={`Message #${activeConv?.name || 'thread'}...`}
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

      {/* Delete Thread Confirmation Modal */}
      <Modal
        isOpen={showDeleteThreadModal}
        onClose={() => setShowDeleteThreadModal(false)}
        title="Delete Conversation Thread"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-surface-2 rounded-xl border border-border">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1 text-tx">
              <span className="font-semibold block">Are you sure?</span>
              <p className="text-tx-muted leading-relaxed">
                This will permanently delete <strong>{activeConv?.name || 'this thread'}</strong> and all associated messages, files, and voice notes.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteThreadModal(false)}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteThread}
              loading={deletingThread}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              <span>Delete Thread</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* In-App Softphone Dialer Modal */}
      <PhoneDialerModal
        isOpen={showPhoneDialer}
        onClose={() => setShowPhoneDialer(false)}
        recipientName={activeConv?.name || 'Prospect'}
        phoneNumber=""
      />

      {/* Create Channel Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Create Team Channel / Outreach Thread"
      >
        <form onSubmit={handleCreateChannel} className="space-y-4">
          <Input
            label="Channel Name"
            required
            placeholder="e.g. dubai-clinics-outreach"
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
              Create thread
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Thread Name Modal */}
      <Modal
        isOpen={showEditThreadModal}
        onClose={() => setShowEditThreadModal(false)}
        title="Edit Thread Name"
      >
        <form onSubmit={handleSaveThreadName} className="space-y-4">
          <Input
            label="Thread Name *"
            required
            value={editThreadName}
            onChange={(e) => setEditThreadName(e.target.value)}
            placeholder="e.g. Khalid & Salam Strategy Discussion"
          />
          <p className="text-[11px] text-tx-muted leading-relaxed">
            Renaming this thread will update the channel title for all participants.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowEditThreadModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={savingThreadName}
            >
              Save Name
            </Button>
          </div>
        </form>
      </Modal>

      {/* In-CRM Live Audio/Video WebRTC Calling Session */}
      {activeCall && (
        <Modal
          isOpen={true}
          onClose={() => setActiveCall(null)}
          title={`CRM-to-CRM Live Call: ${activeConv?.name || 'Team Session'}`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-surface-2 border border-border rounded-xl">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <span className="text-xs font-bold text-tx block">{activeCall.title}</span>
                  <span className="text-[10px] text-tx-muted font-mono">
                    Room: {activeCall.roomCode} • Encrypted In-CRM Direct Line
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(activeCall.roomUrl, '_blank')}
                  title="Open in new window"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveCall(null)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                  <Phone className="w-3.5 h-3.5 mr-1" />
                  <span>End Call</span>
                </Button>
              </div>
            </div>

            {/* Embedded WebRTC Call Window */}
            <div className="rounded-xl overflow-hidden border border-border bg-black aspect-video relative">
              <iframe
                src={`${activeCall.roomUrl}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.disableDeepLinking=true`}
                allow="camera; microphone; display-capture; autoplay; clipboard-write"
                className="w-full h-[460px] border-0"
                title="Internal CRM Call Room"
              />
            </div>
            <p className="text-[11px] text-tx-muted text-center leading-relaxed">
              Internal encrypted call session between {user?.name || 'You'} and thread members. No external app required.
            </p>
          </div>
        </Modal>
      )}
    </Card>
  );
};
