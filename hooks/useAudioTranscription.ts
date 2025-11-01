'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type VoiceStatus = 'idle' | 'recording' | 'processing' | 'error';

type UseAudioTranscriptionOptions = {
  onFinalTranscript: (text: string) => void;
  onPartialTranscript?: (text: string) => void;
};

type UseAudioTranscriptionReturn = {
  status: VoiceStatus;
  error: string | null;
  isSupported: boolean;
  permission: PermissionState | 'unknown';
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
};

export function useAudioTranscription({
  onFinalTranscript,
  onPartialTranscript,
}: UseAudioTranscriptionOptions): UseAudioTranscriptionReturn {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionState | 'unknown'>('unknown');
  const [isSupported, setIsSupported] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    const supported = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
    setIsSupported(supported);

    if (!supported) {
      setStatus('error');
      setError('Voice capture unsupported in this browser.');
      return;
    }

    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then(result => {
          setPermission(result.state);
          result.onchange = () => setPermission(result.state);
        })
        .catch(() => setPermission('unknown'));
    }

    return () => {
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
      mediaStreamRef.current = null;
    };
  }, []);

  const ensureStream = useCallback(async () => {
    if (mediaStreamRef.current) {
      return mediaStreamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    return stream;
  }, []);

  const uploadRecording = useCallback(
    async (blob: Blob) => {
      setStatus('processing');
      setError(null);
      onPartialTranscript?.('');

      try {
        const formData = new FormData();
        formData.append('audio', blob, 'speech.webm');

        const response = await fetch('/api/openai/transcribe', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || 'Failed to transcribe audio');
        }

        const payload = (await response.json()) as { transcript?: string };
        const transcript = payload?.transcript?.trim();
        if (transcript) {
          console.info('[voice->chat] final transcript', transcript);
          onFinalTranscript(transcript);
        } else {
          throw new Error('Transcription succeeded but returned empty text.');
        }

        setStatus('idle');
      } catch (err) {
        console.error('[voice] transcription error', err);
        setError(err instanceof Error ? err.message : String(err));
        setStatus('error');
      }
    },
    [onFinalTranscript, onPartialTranscript],
  );

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('Voice capture unsupported in this browser.');
      setStatus('error');
      return;
    }

    if (status === 'recording') {
      return;
    }

    try {
      const stream = await ensureStream();
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = event => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = event => {
        console.error('[voice] recorder error', event.error);
        setError(event.error?.message ?? 'Microphone recording error');
        setStatus('error');
      };

      recorder.onstart = () => {
        console.info('[voice] recording started');
        setStatus('recording');
        setError(null);
        onPartialTranscript?.('Listening…');
      };

      recorder.onstop = () => {
        console.info('[voice] recording stopped, uploading');
        const blob = new Blob(chunksRef.current, { type: mimeType });
        void uploadRecording(blob);
      };

      recorder.start();
    } catch (err) {
      console.error('[voice] startRecording error', err);
      setError(err instanceof Error ? err.message : 'Could not access microphone');
      setStatus('error');
    }
  }, [ensureStream, isSupported, onPartialTranscript, status, uploadRecording]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
    mediaStreamRef.current?.getAudioTracks().forEach(track => {
      track.stop();
    });
    mediaStreamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
      mediaStreamRef.current = null;
    };
  }, []);

  const isRecording = useMemo(() => status === 'recording', [status]);

  return {
    status,
    error,
    isSupported,
    permission,
    isRecording,
    startRecording,
    stopRecording,
  };
}

