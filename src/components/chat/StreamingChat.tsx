'use client';

import React, { useState } from 'react';
import { SupportedLanguage } from '@/domain/types';
import { TranslationDictionary } from '@/config/translations';
import { Button } from '@/components/ui/Button';
import { Bot, Send, User } from 'lucide-react';

interface StreamingChatProps {
  currentAqi: number;
  currentPm25: number;
  cityName: string;
  language: SupportedLanguage;
  t: TranslationDictionary;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Conversational AI assistant with real-time stream decoding and aria-live announcements.
 */
export function StreamingChat({
  currentAqi,
  currentPm25,
  cityName,
  language,
  t,
}: StreamingChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello! I am your AirWise AI advisor grounded in current conditions for ${cityName} (AQI ${currentAqi}, PM2.5: ${currentPm25} µg/m³). Ask me about low-emission routines, purifier hacks, or family protection tips.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const sampleQuestions = [
    'Should I run or exercise outside today?',
    'How do I build an effective DIY air cleaner under ₹500?',
    'What precautions should asthma patients take during evening inversions?',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || isStreaming) {
      return;
    }

    setInput('');
    const newHistory: ChatMessage[] = [...messages, { role: 'user', content: textToSend }];
    setMessages(newHistory);
    setIsStreaming(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          language,
          currentAqi,
          currentPm25,
          cityName,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error('Chat service encountered a stream error.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantReply = '';

      setMessages([...newHistory, { role: 'assistant', content: '' }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        assistantReply += decoder.decode(value, { stream: true });
        setMessages([...newHistory, { role: 'assistant', content: assistantReply }]);
      }
    } catch {
      setMessages([
        ...newHistory,
        {
          role: 'assistant',
          content:
            'I encountered a connection disruption. Please refer to your structured action plan above.',
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <section
      className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm space-y-4"
      aria-labelledby="chat-heading"
    >
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
        <Bot className="w-5 h-5 text-emerald-400" aria-hidden="true" />
        <h2 id="chat-heading" className="text-xl font-bold text-white tracking-tight">
          {t.chatTab}
        </h2>
      </div>

      {/* Message Ledger */}
      <div
        className="h-64 overflow-y-auto space-y-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800"
        aria-live="polite"
      >
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-700/60 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              </div>
            )}
            <div
              className={`p-3 rounded-xl text-xs sm:text-sm max-w-[85%] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-none'
                  : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none'
              }`}
            >
              {m.content}
            </div>
            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-slate-400" aria-hidden="true" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Suggested prompts */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {sampleQuestions.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(q)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700 min-h-[36px]"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Chat input form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about air pollution, masking, or hacks..."
          disabled={isStreaming}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
          aria-label="Chat query input"
        />
        <Button type="submit" isLoading={isStreaming} disabled={!input.trim()} className="px-4">
          <Send className="w-4 h-4" aria-hidden="true" />
          <span className="sr-only">Send Message</span>
        </Button>
      </form>
    </section>
  );
}
