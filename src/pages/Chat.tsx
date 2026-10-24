import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api, getAccessToken } from '../api/client.js';
import { useAuth } from '../auth/AuthProvider.js';
import { MessageSquare, Send, Users, Hash, Plus, Circle } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New Channel Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [channelName, setChannelName] = useState('');

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
    const socketBase = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '') : '';
    const chatSocket = io(`${socketBase}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
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
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Channels & Direct Conversations Sidebar */}
      <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Team Channels</span>
          </h2>
          <button
            onClick={() => setShowNewModal(true)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            title="Create Channel"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No conversations yet.
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = activeConv?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 transition ${
                    isSelected
                      ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
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
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900/40">
        {/* Chat Header */}
        <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white text-sm">
              {activeConv?.name || 'General Outreach'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <Circle className="w-2.5 h-2.5 fill-current" />
            <span className="text-slate-400">Real-time Connected</span>
          </div>
        </div>

        {/* Message Bubble Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans">
          {messages.length === 0 ? (
            <div className="text-center py-16 text-xs text-slate-500">
              No messages yet in this channel. Send the first message below!
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === user?.id;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                    <span className="font-bold text-slate-300">{m.senderName}</span>
                    <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div
                    className={`max-w-md px-4 py-2.5 rounded-2xl text-xs break-words shadow-md ${
                      isMe
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/60'
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
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <input
              type="text"
              required
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder={`Message #${activeConv?.name || 'channel'}...`}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={!newMsg.trim()}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Create Channel Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Create Team Channel</h3>
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Channel Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. dubai-prospecting"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
