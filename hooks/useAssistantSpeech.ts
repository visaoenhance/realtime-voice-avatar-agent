'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SpeakOptions = {
  voice?: string;
};

type UseAssistantSpeechOptions = {
  defaultMuted?: boolean;
  voice?: string;
};

type SpeechJob = {
  id: string;
  text: string;
  voice: string;
};

export function useAssistantSpeech({
  defaultMuted = false,
  voice = 'alloy',
}: UseAssistantSpeechOptions = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(defaultMuted);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastUtteranceId, setLastUtteranceId] = useState<string | null>(null);

  const queueRef = useRef<SpeechJob[]>([]);
  const processingRef = useRef(false);
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

  const resetState = useCallback(() => {
    queueRef.current = [];
    processingRef.current = false;
    abortControllerRef.current = null;
  }, []);

  const processQueue = useCallback(async () => {
    if (processingRef.current) {
      return;
    }

    if (!audioRef.current) {
      queueRef.current = [];
      return;
    }

    processingRef.current = true;

    while (queueRef.current.length > 0) {
      const job = queueRef.current.shift();
      if (!job || !audioRef.current) {
        break;
      }

      setIsSpeaking(true);
      setLastUtteranceId(job.id);

      try {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const response = await fetch('/api/openai/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: job.text,
            voice: job.voice,
            language: 'en',
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          console.warn('OpenAI TTS request failed', await response.json().catch(() => ({})));
          continue;
        }

        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = audioRef.current;
        audio.src = audioUrl;
        audio.muted = false;

        await new Promise<void>((resolve, reject) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            audio.onended = null;
            resolve();
          };
          audio.play().catch(error => {
            console.warn('Failed to play concierge speech', error);
            audio.pause();
            audio.currentTime = 0;
            audio.onended?.(new Event('error') as any);
            reject(error);
          });
        }).catch(() => {
          /* playback error already logged */
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.warn('Unexpected error during concierge speech', error);
        }
      } finally {
        setIsSpeaking(false);
        abortControllerRef.current = null;
      }
    }

    processingRef.current = false;
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    abortControllerRef.current?.abort();
    setIsSpeaking(false);
    resetState();
  }, [resetState]);

  const speak = useCallback(
    (id: string, text: string, options: SpeakOptions = {}) => {
      if (!text.trim()) {
        return;
      }

      if (isMuted) {
        setLastUtteranceId(id);
        return;
      }

      queueRef.current.push({
        id,
        text,
        voice: options.voice ?? voice,
      });

      void processQueue();
    },
    [isMuted, processQueue, voice],
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
