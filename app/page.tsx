'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, getToolName, isToolUIPart } from 'ai';
import { useEffect, useMemo, useRef, useState } from 'react';
import { tools } from './api/chat/tools';
import { APPROVAL, getToolsRequiringConfirmation } from './api/chat/utils';
import { HumanInTheLoopUIMessage } from './api/chat/types';
import { MuxPreviewPlayer } from '@/components/MuxPreviewPlayer';

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
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

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
    if (typeof window === 'undefined') {
      return;
    }

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setVoiceSupported(false);
      return;
    }

    setVoiceSupported(true);
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const text = event.results?.[0]?.[0]?.transcript;
      if (typeof text === 'string' && text.trim()) {
        setTranscript(text);
        void submitMessage(text);
      }
    };
    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error', event?.error);
      recognition.stop();
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  useEffect(() => {
    if (!isListening && transcript) {
      setTranscript('');
    }
  }, [isListening, transcript]);

  const submitMessage = async (value: string) => {
    if (pendingToolCallConfirmation) {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    setInput('');
    await sendMessage({ text: trimmed });
  };

  const handleStartListening = () => {
    if (pendingToolCallConfirmation || !recognitionRef.current) {
      return;
    }
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.warn('Unable to start speech recognition', error);
    }
  };

  const handleStopListening = () => {
    if (!recognitionRef.current) {
      return;
    }
    recognitionRef.current.stop();
    setIsListening(false);
  };

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
          <div className="hidden text-xs text-netflix-gray-300 md:block">
            Human-in-the-loop approvals keep playback in your hands.
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
                  {isListening
                    ? 'Listening… share what you feel like watching.'
                    : 'Tap to ask for a recommendation or share a vibe.'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={isListening ? handleStopListening : handleStartListening}
                  disabled={!voiceSupported || pendingToolCallConfirmation}
                  className={`inline-flex h-14 w-14 items-center justify-center rounded-full border text-lg font-semibold transition ${
                    isListening
                      ? 'border-netflix-red bg-netflix-red text-white shadow-[0_12px_30px_rgba(229,9,20,0.25)] hover:bg-[#b20710]'
                      : voiceSupported && !pendingToolCallConfirmation
                      ? 'border-netflix-red bg-netflix-red text-white shadow-[0_12px_30px_rgba(229,9,20,0.2)] hover:bg-[#b20710]'
                      : 'border-zinc-700 bg-zinc-800 text-netflix-gray-500'
                  }`}
                >
                  {isListening ? '◼' : '🎤'}
                </button>
                <div className="text-xs text-netflix-gray-500">
                  {voiceSupported
                    ? pendingToolCallConfirmation
                      ? 'Approve or decline the current step to keep talking.'
                      : 'Powered by browser speech recognition.'
                    : 'Voice capture unavailable in this browser.'}
                </div>
              </div>
            </div>

            <form
              className="mt-6 flex flex-col gap-3 md:flex-row"
              onSubmit={event => {
                event.preventDefault();
                void submitMessage(input);
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
                disabled={pendingToolCallConfirmation || !input.trim()}
                className="rounded-2xl bg-netflix-red px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(229,9,20,0.25)] transition hover:bg-[#b20710] disabled:cursor-not-allowed disabled:bg-zinc-700"
              >
                Send
              </button>
            </form>

            {transcript && (
              <div className="mt-4 rounded-xl border border-zinc-800 bg-black/40 p-3 text-xs text-netflix-gray-500">
                Transcript: “{transcript}”
              </div>
            )}
          </div>

          <div className="space-y-4">
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
