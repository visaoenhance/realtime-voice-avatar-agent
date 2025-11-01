'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, getToolName, isToolUIPart } from 'ai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { tools } from './api/chat/tools';
import { APPROVAL, getToolsRequiringConfirmation } from './api/chat/utils';
import { HumanInTheLoopUIMessage } from './api/chat/types';
import { MuxPreviewPlayer } from '@/components/MuxPreviewPlayer';
import { useAssistantSpeech } from '@/hooks/useAssistantSpeech';
import { useAudioTranscription } from '@/hooks/useAudioTranscription';

type HouseholdProfilePayload = {
  profile?: {
    primaryViewer?: string;
    partnerName?: string;
    favoriteGenres?: string[];
    comfortShows?: string[];
    favoriteActors?: string[];
    typicalSessionLengthMinutes?: number;
  };
  lastUpdated?: string;
};

type RecommendationPayload = {
  genre: string;
  nostalgia: boolean;
  results: Array<{
    id: string;
    title?: string;
    year?: number;
    synopsis?: string;
    runtimeMinutes?: number;
    cast?: string[];
    tags?: string[];
  }>;
  fallbackApplied?: boolean;
};

type PreviewPayload = {
  status?: string;
  titleId?: string;
  title?: string;
  playbackId?: string;
  previewUrl?: string;
  backdropUrl?: string;
  poster?: string;
  message?: string;
};

type PlaybackPayload = {
  status?: string;
  titleId?: string;
  title?: string;
  playbackId?: string;
  runtimeMinutes?: number;
  message?: string;
};

type FeedbackPayload = {
  status?: string;
  sentiment?: string;
  notes?: string;
  timestamp?: string;
};

const FALLBACK_BACKDROP =
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=80';

function safeJsonParse<T>(value: unknown): T | null {
  if (typeof value !== 'string') {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn('Failed to parse tool output', error);
    return null;
  }
}

function coerceToolPayload<T>(raw: unknown): T | null {
  if (!raw) {
    return null;
  }
  if (typeof raw === 'string') {
    return safeJsonParse<T>(raw);
  }
  if (typeof raw === 'object') {
    return raw as T;
  }
  return null;
}

function extractLatestToolPayload<T>(
  messages: HumanInTheLoopUIMessage[],
  toolName: string,
): T | null {
  for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
    const message = messages[messageIndex];
    if (!message?.parts) {
      continue;
    }

    for (let partIndex = message.parts.length - 1; partIndex >= 0; partIndex -= 1) {
      const part = message.parts[partIndex];
      if (!isToolUIPart(part) || getToolName(part) !== toolName) {
        continue;
      }

      const rawOutput = (part as any).output ?? (part as any).result;
      const payload = coerceToolPayload<T>(rawOutput);
      if (payload) {
        return payload;
      }
    }
  }

  return null;
}

function formatList(items?: string[]): string {
  if (!items || items.length === 0) {
    return '';
  }
  if (items.length === 1) {
    return items[0];
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  const allButLast = items.slice(0, -1).join(', ');
  const last = items[items.length - 1];
  return `${allButLast}, and ${last}`;
}

export default function Chat() {
  const { messages, addToolResult, sendMessage, status } =
    useChat<HumanInTheLoopUIMessage>({
      transport: new DefaultChatTransport({ api: '/api/chat' }),
    });

  const [input, setInput] = useState('');
  const [transcript, setTranscript] = useState('');
  const [pendingUserEcho, setPendingUserEcho] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const queuedMessageRef = useRef<string | null>(null);
  const sendInFlightRef = useRef(false);
  const lastSendRef = useRef(0);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const chatScrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const MIN_MESSAGE_INTERVAL = 750;

  const {
    speak: speakAssistant,
    toggleMute: toggleAssistantMute,
    isMuted: isAssistantMuted,
    isSpeaking: assistantIsSpeaking,
    lastUtteranceId,
    stop: stopAssistantSpeech,
  } = useAssistantSpeech({ defaultMuted: false, voice: 'alloy' });

  const toolsRequiringConfirmation = getToolsRequiringConfirmation(tools);

  const pendingToolCallConfirmation = messages.some(m =>
    m.parts?.some(
      part =>
        isToolUIPart(part) &&
        part.state === 'input-available' &&
        toolsRequiringConfirmation.includes(getToolName(part)),
    ),
  );

  const latestPreview = useMemo(
    () => extractLatestToolPayload<PreviewPayload>(messages, 'playPreview'),
    [messages],
  );

  const latestPlayback = useMemo(
    () => extractLatestToolPayload<PlaybackPayload>(messages, 'startPlayback'),
    [messages],
  );

  const householdProfile = useMemo(
    () => extractLatestToolPayload<HouseholdProfilePayload>(messages, 'getUserContext'),
    [messages],
  );

  useEffect(() => {
    if (chatScrollAnchorRef.current) {
      chatScrollAnchorRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, transcript, pendingToolCallConfirmation, pendingUserEcho]);

  useEffect(() => {
    if (!isSending && transcript) {
      setTranscript('');
    }
  }, [isSending, transcript]);

  useEffect(() => {
    if (!pendingUserEcho) {
      return;
    }
    const lastUserMessage = [...messages]
      .reverse()
      .find(message => message.role === 'user' && message.parts?.some(part => part.type === 'text'));
    if (!lastUserMessage) {
      return;
    }
    const lastUserText = (lastUserMessage.parts ?? [])
      .map(part => (part.type === 'text' && part.text ? part.text.trim() : ''))
      .filter(Boolean)
      .join(' ')
      .trim();
    if (lastUserText && lastUserText === pendingUserEcho) {
      setPendingUserEcho(null);
    }
  }, [messages, pendingUserEcho]);

  const renderToolResult = (toolName: string, rawOutput: unknown) => {
    switch (toolName) {
      case 'getUserContext': {
        const payload = coerceToolPayload<HouseholdProfilePayload>(rawOutput);
        if (!payload?.profile) {
          return <div className="text-xs text-netflix-gray-500">No household data available.</div>;
        }
        const profile = payload.profile;
        return (
          <div className="text-sm text-netflix-gray-100">
            <div>
              Primary viewer: <span className="font-medium">{profile.primaryViewer ?? '—'}</span>
            </div>
            {profile.partnerName && (
              <div>
                Partner: <span className="font-medium">{profile.partnerName}</span>
              </div>
            )}
            {profile.favoriteGenres && profile.favoriteGenres.length > 0 && (
              <div>
                Favorite genres: <span className="font-medium">{profile.favoriteGenres.join(', ')}</span>
              </div>
            )}
            {profile.favoriteActors && profile.favoriteActors.length > 0 && (
              <div>
                Favorite actors: <span className="font-medium">{profile.favoriteActors.join(', ')}</span>
              </div>
            )}
            {profile.comfortShows && profile.comfortShows.length > 0 && (
              <div>
                Comfort list: <span className="font-medium">{profile.comfortShows.join(', ')}</span>
              </div>
            )}
          </div>
        );
      }
      case 'fetchRecommendations': {
        const payload = coerceToolPayload<RecommendationPayload>(rawOutput);
        if (!payload?.results || payload.results.length === 0) {
          return (
            <div className="rounded-lg border border-zinc-700 bg-[rgba(31,31,31,0.9)] p-3 text-sm text-netflix-gray-300">
              No recommendations returned yet.
            </div>
          );
        }

        return (
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wide text-netflix-gray-500">
              {payload.nostalgia ? 'Nostalgic picks' : 'Fresh picks'} in {payload.genre}
            </div>
            <div className="grid gap-3">
              {payload.results.map(result => (
                <div
                  key={result.id}
                  className="rounded-xl border border-zinc-800 bg-[rgba(31,31,31,0.9)] p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-base font-semibold text-netflix-gray-100">
                        {result.title ?? result.id}
                      </div>
                      <div className="text-xs text-netflix-gray-500">
                        {result.year ? `${result.year} • ` : ''}
                        {result.runtimeMinutes ? `${result.runtimeMinutes} min` : ''}
                      </div>
                    </div>
                  </div>
                  {result.synopsis && (
                    <p className="mt-2 text-sm leading-relaxed text-netflix-gray-300">
                      {result.synopsis}
                    </p>
                  )}
                  {result.cast && result.cast.length > 0 && (
                    <div className="mt-2 text-xs text-netflix-gray-500">
                      Cast: {formatList(result.cast)}
                    </div>
                  )}
                  {result.tags && result.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-[rgba(229,9,20,0.12)] px-2 py-1 text-[11px] font-medium text-netflix-red"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {payload.fallbackApplied && (
              <div className="text-xs text-netflix-gray-500">
                Showing best available matches while we surface more options.
              </div>
            )}
          </div>
        );
      }
      case 'playPreview': {
        const payload = coerceToolPayload<PreviewPayload>(rawOutput);
        if (!payload) {
      return null;
    }
        return (
          <div className="rounded-lg border border-[rgba(229,9,20,0.4)] bg-[rgba(229,9,20,0.12)] p-3 text-sm text-netflix-gray-100">
            {payload.message ?? 'Preview started.'}
          </div>
        );
      }
      case 'startPlayback': {
        const payload = coerceToolPayload<PlaybackPayload>(rawOutput);
        if (!payload) {
          return null;
        }
        return (
          <div className="rounded-lg border border-[rgba(77,225,121,0.4)] bg-[rgba(34,139,76,0.12)] p-3 text-sm text-netflix-gray-100">
            {payload.message ?? 'Playback has started.'}
          </div>
        );
      }
      case 'logFeedback': {
        const payload = coerceToolPayload<FeedbackPayload>(rawOutput);
        if (!payload) {
          return null;
        }
        return (
          <div className="text-xs text-netflix-gray-500">
            Feedback logged ({payload.sentiment ?? 'n/a'}).
          </div>
        );
      }
      default:
          return null;
        }
  };

  const renderConfirmationCard = (part: any) => {
    const toolName = getToolName(part);
    const toolCallId = part.toolCallId;
    const renderedInput = JSON.stringify(part.input ?? {}, null, 2);
    const label =
      toolName === 'playPreview'
        ? 'Start preview'
        : toolName === 'startPlayback'
        ? 'Start playback'
        : 'Execute action';

    return (
      <div className="rounded-xl border border-[rgba(229,9,20,0.45)] bg-[rgba(229,9,20,0.08)] p-4 text-sm text-netflix-gray-100">
        <div className="font-semibold text-netflix-red">Approval required</div>
        <p className="mt-2">
          {label} with args:
        </p>
        <pre className="mt-2 overflow-x-auto rounded bg-black/70 p-3 text-xs text-netflix-gray-300">
{renderedInput}
        </pre>
        <div className="mt-3 flex gap-2">
          <button
            className="inline-flex flex-1 items-center justify-center rounded-md bg-netflix-red px-3 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(229,9,20,0.25)] hover:bg-[#b20710]"
            onClick={async () => {
              await addToolResult({
                toolCallId,
                tool: toolName,
                output: APPROVAL.YES,
              });
              sendMessage();
            }}
          >
            Approve
          </button>
          <button
            className="inline-flex flex-1 items-center justify-center rounded-md border border-zinc-700 bg-black/70 px-3 py-2 text-sm font-semibold text-netflix-gray-300 shadow-sm hover:border-zinc-500"
            onClick={async () => {
              await addToolResult({
                toolCallId,
                tool: toolName,
                output: APPROVAL.NO,
              });
              sendMessage();
            }}
          >
            Decline
          </button>
        </div>
        </div>
    );
  };

  useEffect(() => {
    if (status === 'streaming') {
      return;
    }

    const lastAssistant = [...messages]
      .reverse()
      .find(message =>
        message.role === 'assistant' &&
        message.parts?.some(part => part.type === 'text' && part.text?.trim()),
      );

    if (!lastAssistant) {
      return;
    }

    const messageId = lastAssistant.id ?? `assistant-${messages.length}`;
    if (lastUtteranceId === messageId) {
      return;
    }

    if (isAssistantMuted) {
      return;
    }

    const fullText = (lastAssistant.parts ?? [])
      .map(part => (part.type === 'text' && part.text ? part.text : ''))
      .filter(Boolean)
      .join(' ')
      .trim();

    if (!fullText) {
      return;
    }

    const sentences = fullText.split(/(?<=[.!?])\s+/).filter(Boolean);
    const trimmed = sentences.slice(0, 3).join(' ').trim();

    const speechText = trimmed || sentences[0] || fullText;
    speakAssistant(messageId, speechText);
  }, [messages, lastUtteranceId, isAssistantMuted, speakAssistant, status]);

  const submitMessage = useCallback(
    async (
      value: string,
      options: { bypassThrottle?: boolean; clearInput?: boolean } = {},
    ) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

      if (options.clearInput) {
        setInput('');
      }

      if (pendingToolCallConfirmation) {
        queuedMessageRef.current = trimmed;
        return;
      }

      const now = Date.now();
      if (!options.bypassThrottle && now - lastSendRef.current < MIN_MESSAGE_INTERVAL) {
        console.info('[chat] throttled outgoing message');
        return;
      }

      if (sendInFlightRef.current) {
        console.info('[chat] send in flight, queueing next message');
        queuedMessageRef.current = trimmed;
      return;
    }

      sendInFlightRef.current = true;
      setIsSending(true);
      lastSendRef.current = now;
      console.info('[chat] sending message', trimmed);

      try {
        setPendingUserEcho(trimmed);
        await sendMessage({ text: trimmed });
      } finally {
        sendInFlightRef.current = false;
        setIsSending(false);
        const next = queuedMessageRef.current;
        queuedMessageRef.current = null;
        if (next) {
          void submitMessage(next, { bypassThrottle: true });
        }
      }
    },
    [MIN_MESSAGE_INTERVAL, pendingToolCallConfirmation, sendMessage],
  );

  const handlePartialTranscript = useCallback((partial: string) => {
    if (partial) {
      console.info('[voice->chat] partial transcript', partial);
    }
    setTranscript(partial);
  }, []);

  const handleFinalTranscript = useCallback(
    (text: string) => {
      console.info('[voice->chat] final transcript', text);
      stopAssistantSpeech();
      void submitMessage(text);
      setTranscript('');
    },
    [stopAssistantSpeech, submitMessage],
  );

  const {
    status: voiceStatus,
    error: voiceError,
    isSupported: voiceSupported,
    permission: voicePermission,
    startRecording,
    stopRecording,
    isRecording,
  } = useAudioTranscription({
    onFinalTranscript: handleFinalTranscript,
    onPartialTranscript: handlePartialTranscript,
  });

  const isProcessingVoice = voiceStatus === 'processing';
  const micDisabled =
    !voiceSupported ||
    pendingToolCallConfirmation ||
    voiceStatus === 'processing';

  const voicePreflightChecks = useMemo(
    () => [
      {
        label: 'Transcription engine',
        value: voiceSupported ? 'ready' : 'unsupported',
        state: voiceSupported ? 'ok' : 'error',
      },
      {
        label: 'Mic permission',
        value: voicePermission,
        state: voicePermission === 'granted' ? 'ok' : voicePermission === 'denied' ? 'error' : 'warn',
      },
      {
        label: 'Session status',
        value: voiceStatus,
        state:
          voiceStatus === 'error'
            ? 'error'
            : voiceStatus === 'processing'
            ? 'warn'
            : 'ok',
      },
      ...(voiceError
        ? [{ label: 'Error', value: voiceError, state: 'error' as const }]
        : []),
    ],
    [voiceError, voicePermission, voiceStatus, voiceSupported],
  );

  const voiceStatusText = useMemo(() => {
    if (voiceError) {
      return voiceError;
    }

    switch (voiceStatus) {
      case 'recording':
        return 'Listening… share what you feel like watching.';
      case 'processing':
        return 'Processing what you said…';
      case 'error':
        return 'Voice capture unavailable — please check microphone permissions.';
      default:
        return 'Tap to ask for a recommendation or share a vibe.';
    }
  }, [voiceError, voiceStatus]);

  const handleMicButton = useCallback(() => {
    if (!voiceSupported || pendingToolCallConfirmation) {
      return;
    }

    if (isRecording || isProcessingVoice) {
      stopRecording();
    } else {
      stopAssistantSpeech();
      void startRecording();
    }
  }, [
    isRecording,
    isProcessingVoice,
    pendingToolCallConfirmation,
    startRecording,
    stopAssistantSpeech,
    stopRecording,
    voiceSupported,
  ]);

  return (
    <div className="min-h-screen bg-netflix-black text-netflix-gray-100">
      <header className="border-b border-zinc-900/80 bg-black/40">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <div className="font-display text-3xl text-netflix-red tracking-[0.45em]">
              Netflix
            </div>
            <h1 className="mt-1 text-sm uppercase tracking-[0.6em] text-netflix-gray-300">
              Voice Concierge
          </h1>
        </div>
          <div className="flex items-center gap-3 text-xs text-netflix-gray-300">
            <span className="hidden md:block">
              Human-in-the-loop approvals keep playback in your hands.
            </span>
            <button
              type="button"
              onClick={toggleAssistantMute}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold transition ${
                isAssistantMuted
                  ? 'border-zinc-700 bg-zinc-800 text-netflix-gray-300 hover:border-zinc-500'
                  : 'border-netflix-red bg-netflix-red text-white hover:bg-[#b20710]'
              }`}
            >
              <span>{isAssistantMuted ? 'Enable Voice' : 'Mute Voice'}</span>
              {!isAssistantMuted && assistantIsSpeaking && (
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              )}
            </button>
                    </div>
                  </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 lg:flex-row">
        <section className="flex-1 space-y-6">
          <div className="rounded-3xl border border-zinc-800 bg-[rgba(20,20,20,0.92)] p-6 shadow-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm uppercase tracking-widest text-netflix-gray-500">
                  Voice link
                  </div>
                <p className="mt-1 text-lg font-medium text-netflix-gray-100">
                  {voiceStatusText}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleMicButton}
                  disabled={micDisabled}
                  className={`inline-flex h-14 w-14 items-center justify-center rounded-full border text-lg font-semibold transition ${
                    isRecording
                      ? 'border-netflix-red bg-netflix-red text-white shadow-[0_12px_30px_rgba(229,9,20,0.25)] hover:bg-[#b20710]'
                      : !micDisabled
                      ? 'border-netflix-red bg-netflix-red text-white shadow-[0_12px_30px_rgba(229,9,20,0.2)] hover:bg-[#b20710]'
                      : 'border-zinc-700 bg-zinc-800 text-netflix-gray-500'
                  }`}
                >
                  {isRecording ? '◼' : '🎤'}
                </button>
                <div className="text-xs text-netflix-gray-500">
                  {voiceSupported
                    ? voiceError
                      ? voiceError
                      : isRecording
                      ? 'Recording your request…'
                      : isProcessingVoice
                      ? 'Transcribing your request…'
                      : 'Powered by OpenAI Voice API.'
                    : 'Voice capture unavailable in this browser.'}
                  <div className="mt-1 space-y-1">
                    {voicePreflightChecks.map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span
                          className={`inline-flex h-2.5 w-2.5 items-center justify-center rounded-full ${
                            item.state === 'ok'
                              ? 'bg-green-500'
                              : item.state === 'warn'
                              ? 'bg-amber-400'
                              : 'bg-red-500'
                          }`}
                        />
                        <span>
                          {item.label}: {item.value}
                        </span>
                            </div>
                    ))}
                            </div>
                            </div>
                            </div>
                              </div>

            <form
              className="mt-6 flex flex-col gap-3 md:flex-row"
              onSubmit={event => {
                event.preventDefault();
                void submitMessage(input, { clearInput: true });
              }}
            >
              <input
                value={input}
                onChange={event => setInput(event.target.value)}
                              disabled={pendingToolCallConfirmation}
                className="flex-1 rounded-2xl border border-zinc-800 bg-black/60 px-4 py-3 text-sm text-netflix-gray-100 placeholder-zinc-500 focus:border-netflix-red focus:outline-none focus:ring-2 focus:ring-[rgba(229,9,20,0.35)]"
                placeholder={
                                pendingToolCallConfirmation
                    ? 'Awaiting your approval first…'
                    : 'Prefer typing? Tell the concierge what you feel like watching.'
                }
              />
              <button
                type="submit"
                disabled={pendingToolCallConfirmation || !input.trim() || isSending}
                className="rounded-2xl bg-netflix-red px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(229,9,20,0.25)] transition hover:bg-[#b20710] disabled:cursor-not-allowed disabled:bg-zinc-700"
              >
                {isSending ? 'Sending…' : 'Send'}
                            </button>
            </form>

            {transcript && (
              <div className="mt-4 rounded-xl border border-zinc-800 bg-black/40 p-3 text-xs text-netflix-gray-500">
                Transcript: “{transcript}”
                  </div>
                )}
                    </div>

          <div ref={chatScrollRef} className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
            {messages.map(message => {
              const roleLabel = message.role === 'user' ? 'You' : 'Concierge';
              return (
                <div
                  key={message.id}
                  className={`rounded-3xl border bg-[rgba(31,31,31,0.85)] px-6 py-5 shadow-inner shadow-black/20 ${
                    message.role === 'assistant'
                      ? 'border-[rgba(229,9,20,0.35)] text-netflix-gray-100'
                      : 'border-zinc-800 text-zinc-100'
                  }`}
                >
                  <div className="text-xs uppercase tracking-[0.4em] text-netflix-gray-500">
                    {roleLabel}
              </div>
                  <div className="mt-3 space-y-3 text-sm leading-relaxed">
                    {message.parts?.map((part, index) => {
                      if (part.type === 'text') {
                        return <p key={index}>{part.text}</p>;
                      }

                      if (isToolUIPart(part)) {
                        const toolName = getToolName(part);
                        if (
                          toolsRequiringConfirmation.includes(toolName) &&
                          part.state === 'input-available'
                        ) {
                          return <div key={index}>{renderConfirmationCard(part)}</div>;
                        }

                        const output = (part as any).output ?? (part as any).result;
                        if (output) {
                          return <div key={index}>{renderToolResult(toolName, output)}</div>;
                        }
                      }

                      return null;
                    })}
                  </div>
                  </div>
              );
            })}

            {pendingUserEcho && (
              <div className="rounded-3xl border border-zinc-800 bg-[rgba(31,31,31,0.85)] px-6 py-5 shadow-inner shadow-black/20 text-zinc-100">
                <div className="text-xs uppercase tracking-[0.4em] text-netflix-gray-500">You</div>
                <div className="mt-3 text-sm leading-relaxed text-netflix-gray-200">
                  {pendingUserEcho}
              </div>
                <div className="mt-2 text-xs text-netflix-gray-500">Sending…</div>
            </div>
          )}

            {status === 'streaming' && !pendingToolCallConfirmation && (
              <div className="flex items-center gap-3 rounded-full border border-[rgba(229,9,20,0.35)] bg-[rgba(229,9,20,0.12)] px-4 py-2 text-xs text-netflix-gray-300">
              <span className="flex h-3 w-12 items-end justify-between">
                <span
                    className="h-full w-2 animate-bounce rounded-full bg-netflix-red"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                    className="h-full w-2 animate-bounce rounded-full bg-netflix-red"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                    className="h-full w-2 animate-bounce rounded-full bg-netflix-red"
                  style={{ animationDelay: '300ms' }}
                />
              </span>
                Concierge is thinking…
            </div>
          )}

          {pendingToolCallConfirmation && (
              <div className="rounded-2xl border border-[rgba(229,9,20,0.4)] bg-[rgba(229,9,20,0.12)] px-4 py-3 text-sm text-netflix-gray-100">
                Approve or decline the requested action to continue the conversation.
            </div>
          )}
            <div ref={chatScrollAnchorRef} />
          </div>
        </section>

        <aside className="w-full max-w-xl space-y-6 rounded-3xl border border-zinc-800 bg-[rgba(20,20,20,0.92)] p-6 shadow-2xl">
          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-netflix-gray-500">
              Now playing
            </div>
            {latestPreview ? (
              <div
                className="mt-3 overflow-hidden rounded-2xl border border-zinc-800 bg-black/60"
                style={{
                  backgroundImage: `linear-gradient(0deg, rgba(0,0,0,0.65), rgba(0,0,0,0.25)), url(${
                    latestPreview.backdropUrl ?? FALLBACK_BACKDROP
                  })`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="p-5 text-zinc-100">
                  <div className="text-xs uppercase tracking-[0.3em] text-netflix-gray-300">
                    Preview
                  </div>
                  <div className="mt-3">
                    {latestPreview.playbackId ? (
                      <MuxPreviewPlayer
                        playbackId={latestPreview.playbackId}
                        title={latestPreview.title ?? latestPreview.titleId ?? 'Preview'}
                        poster={latestPreview.poster ?? latestPreview.backdropUrl}
                      />
                    ) : latestPreview.previewUrl ? (
                      <video
                        key={latestPreview.previewUrl}
                        className="w-full rounded-xl border border-black/40"
                        src={latestPreview.previewUrl}
                        controls
                        autoPlay
                        playsInline
                      />
                    ) : null}
                  </div>
                  <div className="mt-3 text-sm text-netflix-gray-300 opacity-80">
                    {latestPreview.message ??
                      'Your preview is playing on the TV. Tap Play Now on-screen or ask me to start it.'}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
            <button
                      type="button"
                      className="rounded-full bg-netflix-red px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_30px_rgba(229,9,20,0.25)] hover:bg-[#b20710]"
                      onClick={() => void submitMessage('Play this now')}
            >
                      Play now
            </button>
                    <button
                      type="button"
                      className="rounded-full border border-zinc-600 px-4 py-2 text-xs font-semibold text-netflix-gray-300 hover:border-zinc-400 hover:text-white"
                      onClick={() => void submitMessage('Show me other options')}
                    >
                      See other options
                    </button>
          </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-zinc-700 p-6 text-sm text-netflix-gray-500">
                Ask for a preview and we will cue it up here.
        </div>
      )}
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-netflix-gray-500">
              Playback status
            </div>
            {latestPlayback ? (
              <div className="mt-3 rounded-2xl border border-[rgba(77,225,121,0.4)] bg-[rgba(34,139,76,0.12)] p-4 text-sm text-netflix-gray-100">
                {latestPlayback.message ?? 'Playback confirmed.'}
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-zinc-700 p-6 text-sm text-netflix-gray-500">
                When you approve playback you will see confirmation here.
              </div>
            )}
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-netflix-gray-500">
              Household favorites
            </div>
            {householdProfile?.profile ? (
              <div className="mt-3 space-y-2 text-sm text-netflix-gray-100">
                <div>
                  👥 Emilio & {householdProfile.profile.partnerName ?? 'partner'}
                </div>
                {householdProfile.profile.favoriteGenres && (
                  <div>
                    🎬 Genres: {formatList(householdProfile.profile.favoriteGenres)}
                  </div>
                )}
                {householdProfile.profile.comfortShows && (
                  <div>
                    🛋️ Comfort picks: {formatList(householdProfile.profile.comfortShows)}
                  </div>
                )}
                {householdProfile.profile.favoriteActors && (
                  <div>
                    🌟 Actors: {formatList(householdProfile.profile.favoriteActors)}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-zinc-700 p-6 text-sm text-netflix-gray-500">
                Once the concierge checks your profile it will appear here.
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
