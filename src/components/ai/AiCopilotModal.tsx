import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  RotateCcw,
  Bot,
  User,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { Button } from '../ui/index.js';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AiCopilotModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Hi! I am your Global CRM Sales Copilot. Ask me to handle client objections, write cold email & WhatsApp pitches in luxury English, or craft high-ticket closing strategies.',
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== '1')
        .map((m) => ({ role: m.role, content: m.content }));

      const res: any = await api.post('/ai/chat', {
        message: text.trim(),
        history,
      });

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.reply || 'Here is your sales recommendation.',
        timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${err.message || 'Failed to reach AI engine. Check API keys.'}`,
        timestamp: 'Error',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    'Client says "Price is too high" — how to handle?',
    'Write a luxury WhatsApp pitch for a Dental Clinic',
    'How to close a client who says "Send me an email"?',
    'B2B objection: "We already have an in-house team"',
  ];

  return (
    <>
      {/* Floating Launcher Pill */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-4 py-2.5 bg-tx text-canvas rounded-full shadow-card flex items-center gap-2 hover:opacity-90 transition font-medium text-xs select-none"
          title="Open AI Sales Copilot"
        >
          <Sparkles className="w-4 h-4 text-canvas animate-pulse" />
          <span className="serif font-semibold">AI Copilot</span>
        </button>
      )}

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[94vw] sm:w-[420px] h-[580px] bg-surface-1 border border-border rounded-modal shadow-card flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-surface-2 select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-tx text-canvas flex items-center justify-center font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="serif text-sm font-bold text-tx leading-tight">Sales Copilot</h3>
                <span className="text-[10px] text-tx-subtle mono block">
                  Groq Llama 3.3 · Sub-second LPU
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setMessages([
                    {
                      id: '1',
                      role: 'assistant',
                      content: 'Chat session reset. What sales pitch or objection can I help you with?',
                      timestamp: 'Just now',
                    },
                  ])
                }
                title="Reset conversation (Zero disk storage)"
                className="p-1.5 text-tx-subtle hover:text-tx rounded-btn hover:bg-surface-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-tx-subtle hover:text-tx rounded-btn hover:bg-surface-1 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Carousel */}
          <div className="px-3 py-2 border-b border-border bg-surface-1 overflow-x-auto flex items-center gap-1.5 text-[11px] no-scrollbar">
            {quickPrompts.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(q)}
                disabled={loading}
                className="whitespace-nowrap px-2.5 py-1 rounded-btn bg-surface-2 hover:bg-surface-1 border border-border text-tx-muted hover:text-tx transition text-[10px]"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Message List */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-surface-2 border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-tx" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-card p-3 space-y-1 ${
                    m.role === 'user'
                      ? 'bg-tx text-canvas font-medium'
                      : 'bg-surface-2 text-tx border border-border leading-relaxed'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  <div className="flex items-center justify-between pt-1 text-[9px] opacity-60">
                    <span className="mono">{m.timestamp}</span>
                    {m.role === 'assistant' && (
                      <button
                        type="button"
                        onClick={() => handleCopy(m.id, m.content)}
                        className="hover:opacity-100 flex items-center gap-1"
                        title="Copy text"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {m.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-tx text-canvas flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-tx-muted p-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-tx" />
                <span className="mono text-[11px]">Groq LPU thinking at 500 tokens/sec...</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-border bg-surface-2 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask sales objection, pitch, or English advice..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 input-luxury text-xs py-2 px-3"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading || !input.trim()}
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
};
