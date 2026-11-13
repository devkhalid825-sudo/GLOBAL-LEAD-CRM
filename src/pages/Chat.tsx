import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api, getAccessToken } from '../api/client.js';
import { useAuth } from '../auth/AuthProvider.js';
import { MessageSquare, Send, Hash, Plus, ChevronLeft } from 'lucide-react';
import { Card, Button, Input, Modal, Pill } from '../components/ui/index.js';

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeConv) return;

    const bodyText = newMsg.trim();
    setNewMsg('');

    try {
      await api.post(`/conversations/${activeConv.id}/messages`, {
        body: bodyText,
      });
    } catch (err: any) {
      alert(err.message);
    }
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

  return (
    <Card className="flex h-[calc(100vh-8rem)] overflow-hidden p-0">
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-16 text-xs text-tx-subtle">
              No messages yet in this channel. Send the first message below.
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === user?.id;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[11px] text-tx-muted">
                    <span className="font-serif font-semibold text-tx">{m.senderName}</span>
                    <span className="font-mono text-[10px] text-tx-subtle">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div
                    className={`max-w-md px-4 py-2.5 rounded-2xl text-xs break-words shadow-sm ${
                      isMe
                        ? 'bg-tx text-canvas font-medium rounded-br-none'
                        : 'bg-surface-2 text-tx border border-border rounded-bl-none'
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="p-4 border-t border-border bg-surface-1">
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <input
              type="text"
              required
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder={`Message #${activeConv?.name || 'channel'}...`}
              className="flex-1 input-luxury text-xs"
            />
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
