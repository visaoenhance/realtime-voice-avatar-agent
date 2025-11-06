'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DefaultChatTransport, getToolName, isToolUIPart } from 'ai';
import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { useAssistantSpeech } from '@/hooks/useAssistantSpeech';
import type { FoodCourtUIMessage } from '../../api/food-chat/types';

const QUICK_PROMPTS = [
  'Help me pick a Caribbean dinner that is still open.',
  'Find something healthy that arrives within 30 minutes.',
  'What are my recent orders this week?',
  'Update my preferences to add vegetarian and medium spice.',
];

function extractTextParts(message: UIMessage): string[] {
  if (!message.parts) {
    return [];
  }
  return message.parts
    .filter(part => part.type === 'text' && part.text)
    .map(part => (part.text ?? '').trim())
    .filter(Boolean);
}

export default function FoodCourtConcierge() {
  const { messages, sendMessage, status } = useChat<FoodCourtUIMessage>({
    transport: new DefaultChatTransport({ api: '/api/food-chat' }),
  });

  const [draft, setDraft] = useState('');

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [hasSentInitialMessage, setHasSentInitialMessage] = useState(false);

  const {
    speak: speakAssistant,
    toggleMute: toggleAssistantMute,
    isMuted: isAssistantMuted,
    stop: stopAssistantSpeech,
    lastUtteranceId,
  } = useAssistantSpeech({ defaultMuted: false, voice: 'alloy' });

  const lastAssistantMessageId = useRef<string | null>(null);

  useEffect(() => {
    const lastMessage = [...messages].reverse().find(message => message.role === 'assistant');
    if (!lastMessage?.parts) {
      return;
    }
    if (lastMessage.id && lastMessage.id === lastAssistantMessageId.current) {
      return;
    }

    const textParts = extractTextParts(lastMessage);
    if (textParts.length > 0) {
      speakAssistant(lastMessage.id ?? `assistant-${messages.length}`, textParts.join(' '));
      lastAssistantMessageId.current = lastMessage.id ?? `assistant-${messages.length}`;
    }
  }, [messages, speakAssistant]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, status]);

  const handleQuickPrompt = (prompt: string) => {
    if (!prompt) {
      return;
    }
    void sendMessage({ text: prompt });
    setHasSentInitialMessage(true);
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }
    await sendMessage({ text: trimmed });
    setDraft('');
    setHasSentInitialMessage(true);
  };

  const activeToolSummaries = useMemo(() => {
    return messages
      .filter(message => message.role === 'assistant' && message.parts)
      .flatMap(message =>
        message.parts
          ?.filter(part => isToolUIPart(part))
          .map(part => ({
            id: `${message.id ?? 'assistant'}-${getToolName(part)}`,
            name: getToolName(part),
            output: (() => {
              const raw = (part as any).output ?? (part as any).result;
              if (!raw) {
                return null;
              }
              try {
                return JSON.parse(raw);
              } catch (error) {
                return raw;
              }
            })(),
          })) ?? [],
      );
  }, [messages]);

  const latestSpeechLabel = useMemo(() => {
    if (!lastUtteranceId) {
      return null;
    }
    const match = messages.find(message => message.id === lastUtteranceId);
    if (!match) {
      return null;
    }
    const text = extractTextParts(match).join(' ');
    return text.length > 120 ? `${text.slice(0, 120)}…` : text;
  }, [lastUtteranceId, messages]);

  const isStreaming = status === 'streaming';

  return (
    <div className="min-h-screen bg-[#0f1115] text-[#f7f8fa]">
      <header className="border-b border-white/5 bg-black/40 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-10">
            <Link href="/" className="font-display text-3xl tracking-[0.35em] text-[#4fd1c5]">
              Food Court
            </Link>
            <nav className="hidden gap-6 text-xs font-semibold uppercase tracking-[0.3em] text-white/60 md:flex">
              <Link href="/" className="transition hover:text-white">Home</Link>
              <span className="text-white">Concierge</span>
              <Link href="/voice" className="transition hover:text-white/80">MovieNite</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <button
              type="button"
              onClick={toggleAssistantMute}
              className="rounded-full border border-white/10 px-3 py-1 uppercase tracking-[0.3em] text-white/70 transition hover:border-white/30 hover:text-white"
            >
              {isAssistantMuted ? 'Unmute Agent' : 'Mute Agent'}
            </button>
            {latestSpeechLabel ? (
              <div className="hidden max-w-xs shrink text-right text-white/50 md:block">
                Speaking: {latestSpeechLabel}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <section className="rounded-3xl border border-white/10 bg-black/30 p-8 shadow-xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.35em] text-white/60">Food Court Concierge</div>
              <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Voice-led restaurant discovery</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/70">
                Ask for cuisine ideas, closing soon options, or preference updates. The agent will confirm
                each step and queue live restaurant data when Supabase credentials are connected.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {QUICK_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleQuickPrompt(prompt)}
                  className="rounded-full border border-[#4fd1c5] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#4fd1c5] transition hover:bg-[#4fd1c5] hover:text-black"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[460px] overflow-y-auto rounded-2xl border border-white/5 bg-black/40 p-6" id="food-court-chat">
            {messages.length === 0 && !hasSentInitialMessage ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-white/40">
                <p className="text-lg font-medium">Say “Hey Food Court” to get started.</p>
                <p className="mt-2 text-sm">Ask for dinner ideas, reorder favorites, or tweak your saved preferences.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map(message => {
                  const textParts = extractTextParts(message);
                  return (
                    <div key={message.id ?? Math.random()} className="space-y-2">
                      <div className={`text-xs uppercase tracking-[0.35em] ${message.role === 'user' ? 'text-[#4fd1c5]' : 'text-white/50'}`}>
                        {message.role === 'user' ? 'You' : 'Food Court Concierge'}
                      </div>
                      {textParts.map((text, index) => (
                        <p key={index} className="text-sm leading-relaxed text-white/90">
                          {text}
                        </p>
                      ))}
                      {message.parts
                        ?.filter(part => isToolUIPart(part))
                        .map(part => {
                          const toolName = getToolName(part);
                          const raw = (part as any).output ?? (part as any).result;
                          let parsed: any = null;
                          if (raw) {
                            try {
                              parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                            } catch (error) {
                              parsed = raw;
                            }
                          }
                          return (
                            <div key={`${message.id ?? 'assistant'}-${toolName}`} className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/70">
                              <div className="mb-1 font-semibold uppercase tracking-[0.3em] text-white/60">{toolName}</div>
                              <pre className="whitespace-pre-wrap break-all text-[11px] text-white/80">
                                {typeof parsed === 'string'
                                  ? parsed
                                  : JSON.stringify(parsed, null, 2)}
                              </pre>
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          <form onSubmit={handleFormSubmit} className="mt-6 flex flex-col gap-3 md:flex-row">
            <textarea
              name="input"
              value={draft}
              onChange={event => setDraft(event.target.value)}
              rows={2}
              placeholder="Ask for dinner ideas, e.g., “Find a Caribbean spot that closes soon.”"
              className="flex-1 rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white shadow-inner placeholder:text-white/40 focus:border-[#4fd1c5] focus:outline-none"
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isStreaming}
                className="rounded-full bg-[#4fd1c5] px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-[#38b2ac] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isStreaming ? 'Thinking…' : 'Send'}
              </button>
              <button
                type="button"
                onClick={() => {
                  stopAssistantSpeech();
                }}
                className="rounded-full border border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-white/30 hover:text-white"
              >
                Stop
              </button>
            </div>
          </form>
        </section>

        {activeToolSummaries.length > 0 ? (
          <section className="rounded-3xl border border-white/5 bg-black/30 p-6 text-sm text-white/70">
            <div className="text-xs uppercase tracking-[0.35em] text-white/50">Latest tool activity</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {activeToolSummaries.slice(-4).map(tool => (
                <div key={tool.id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <div className="text-xs uppercase tracking-[0.3em] text-[#4fd1c5]">{tool.name}</div>
                  <pre className="mt-2 whitespace-pre-wrap break-all text-[11px] text-white/80">
                    {typeof tool.output === 'string'
                      ? tool.output
                      : JSON.stringify(tool.output, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}


