'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SpeakOptions = {
  voice?: string;
};

type UseAssistantSpeechOptions = {
  defaultMuted?: boolean;
  voice?: string;
};

export function useAssistantSpeech({
  defaultMuted = false,
  voice = 'alloy',
}: UseAssistantSpeechOptions = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(defaultMuted);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastUtteranceId, setLastUtteranceId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.autoplay = false;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    async (id: string, text: string, options: SpeakOptions = {}) => {
      if (!audioRef.current) {
        return;
      }

      if (!text.trim()) {
        return;
      }

      if (isMuted) {
        setLastUtteranceId(id);
        return;
      }

      // Prevent replaying the same utterance repeatedly
      if (lastUtteranceId === id && isSpeaking) {
        return;
      }

      try {
        stop();
        setIsSpeaking(true);
        setLastUtteranceId(id);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        const response = await fetch('/api/openai/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: options.voice ?? voice }),
          signal: controller.signal,
        });

        if (!response.ok) {
          setIsSpeaking(false);
          return;
        }

        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = audioRef.current;
        audio.src = audioUrl;
        audio.muted = false;

        await audio.play().catch(() => {
          /* playback can fail if user gesture missing */
        });

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          audio.onended = null;
        };
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.warn('Failed to speak via OpenAI TTS', error);
        }
        setIsSpeaking(false);
      }
    },
    [isMuted, lastUtteranceId, stop, voice, isSpeaking],
  );

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (next) {
        stop();
      }
      return next;
    });
  }, [stop]);

  return {
    isMuted,
    isSpeaking,
    lastUtteranceId,
    speak,
    stop,
    toggleMute,
    setMuted: setIsMuted,
  } as const;
}
