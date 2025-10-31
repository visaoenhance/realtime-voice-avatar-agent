'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) {
    console.info('[realtime]', ...args);
  }
}

function warn(...args: any[]) {
  if (DEBUG) {
    console.warn('[realtime]', ...args);
  }
}

function error(...args: any[]) {
  if (DEBUG) {
    console.error('[realtime]', ...args);
  }
}

type RealtimeStatus =
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'listening'
  | 'processing'
  | 'disconnected'
  | 'error';

type UseRealtimeVoiceOptions = {
  onFinalTranscript: (text: string) => void;
  onPartialTranscript?: (text: string) => void;
};

type RealtimeReturn = {
  status: RealtimeStatus;
  error: string | null;
  isSupported: boolean;
  isConnected: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
  disconnect: () => void;
};

export function useRealtimeVoice({
  onFinalTranscript,
  onPartialTranscript,
}: UseRealtimeVoiceOptions): RealtimeReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [status, setStatus] = useState<RealtimeStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const partialRef = useRef('');
  const listeningRef = useRef(false);

  useEffect(() => {
    const supported = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
    setIsSupported(supported);
    if (!supported) {
      setStatus('error');
      setError('Voice capture unsupported in this browser.');
    }
  }, []);

  const cleanupPeerConnection = useCallback(() => {
    dataChannelRef.current?.close();
    dataChannelRef.current = null;

    pcRef.current?.close();
    pcRef.current = null;

    micStreamRef.current?.getTracks().forEach(track => track.stop());
    micStreamRef.current = null;

    partialRef.current = '';
    listeningRef.current = false;
  }, []);

  const disconnect = useCallback(() => {
    cleanupPeerConnection();
    setStatus(isSupported ? 'disconnected' : 'error');
    console.info('[RealtimeVoice] disconnected');
  }, [cleanupPeerConnection, isSupported]);

  useEffect(() => () => disconnect(), [disconnect]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const audio = document.createElement('audio');
    audio.autoplay = true;
    audio.style.display = 'none';
    document.body.appendChild(audio);
    remoteAudioRef.current = audio;

    return () => {
      audio.pause();
      audio.srcObject = null;
      document.body.removeChild(audio);
      remoteAudioRef.current = null;
      log('Disposed remote audio element');
    };
  }, []);

  const handleTranscriptDone = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (trimmed) {
        log('Final transcript ready', trimmed);
        onFinalTranscript(trimmed);
      }
      partialRef.current = '';
      onPartialTranscript?.('');
      setStatus('ready');
    },
    [onFinalTranscript, onPartialTranscript],
  );

  const connect = useCallback(async () => {
    if (!isSupported) {
      setError('Voice capture unsupported in this browser.');
      setStatus('error');
      throw new Error('Realtime voice not supported');
    }
    if (pcRef.current) {
      return;
    }

    setStatus('connecting');
    setError(null);

    try {
      const keyResponse = await fetch('/api/openai/realtime-key');
      if (!keyResponse.ok) {
        const payload = await keyResponse.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Failed to fetch realtime key');
      }
      const { client_secret } = await keyResponse.json();
      if (!client_secret) {
        throw new Error('Realtime key missing from response');
      }
      log('Ephemeral key obtained');

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      pcRef.current = pc;
      console.info('[RealtimeVoice] peer connection created');

      const dataChannel = pc.createDataChannel('oai-events');
      dataChannelRef.current = dataChannel;

      dataChannel.onopen = () => {
        console.info('[RealtimeVoice] data channel open');
        dataChannel.send(
          JSON.stringify({
            type: 'session.update',
            session: {
              instructions:
                'You are a speech recognition service. When the user speaks, respond only with the verbatim transcript as plain text.',
            },
          }),
        );
      };

      dataChannel.onmessage = event => {
        const data = event.data;
        if (typeof data !== 'string') {
          return;
        }
        try {
          const message = JSON.parse(data);
          switch (message.type) {
            case 'response.output_text.delta': {
              const delta: string = message.delta ?? '';
              partialRef.current += delta;
              onPartialTranscript?.(partialRef.current);
              if (delta.trim()) {
                console.debug('[RealtimeVoice] partial delta', delta);
              }
              break;
            }
            case 'response.output_text.done': {
              handleTranscriptDone(partialRef.current);
              console.info('[RealtimeVoice] final transcript ready', partialRef.current);
              break;
            }
            case 'response.completed': {
              handleTranscriptDone(partialRef.current);
              console.info('[RealtimeVoice] response completed');
              break;
            }
            case 'input_audio_buffer.speech_started': {
              setStatus('listening');
              console.debug('[RealtimeVoice] speech started');
              break;
            }
            case 'input_audio_buffer.speech_stopped': {
              setStatus(prev => (prev === 'listening' ? 'processing' : prev));
              console.debug('[RealtimeVoice] speech stopped');
              break;
            }
            case 'error': {
              console.warn('Realtime error', message);
              setError(message.error?.message ?? 'Realtime session error');
              setStatus('error');
              break;
            }
            default: {
              console.debug('[RealtimeVoice] event', message.type);
              break;
            }
          }
        } catch (err) {
          console.warn('Failed to parse realtime message', err, data);
        }
      };

      dataChannel.onerror = event => {
        console.warn('Realtime datachannel error', event);
        setError('Realtime data channel error');
        setStatus('error');
      };

      const remoteAudio = remoteAudioRef.current;
      pc.ontrack = event => {
        if (!remoteAudio) return;
        const [track] = event.streams;
        if (track) {
          remoteAudio.srcObject = track;
        } else {
          remoteAudio.srcObject = new MediaStream([event.track]);
        }
        log('Received remote audio track');
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      stream.getAudioTracks().forEach(track => {
        track.enabled = false;
        pc.addTrack(track, stream);
      });
      console.info('[RealtimeVoice] microphone initialized');

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await new Promise<void>(resolve => {
        if (pc.iceGatheringState === 'complete') {
          resolve();
          return;
        }
        const checkState = () => {
          if (pc.iceGatheringState === 'complete') {
            pc.removeEventListener('icegatheringstatechange', checkState);
            resolve();
          }
        };
        pc.addEventListener('icegatheringstatechange', checkState);
      });

      const sdpResponse = await fetch(
        'https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview&voice=alloy',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${client_secret}`,
            'Content-Type': 'application/sdp',
          },
          body: offer.sdp ?? '',
        },
      );

      if (!sdpResponse.ok) {
        throw new Error('Failed to establish realtime session');
      }

      const answer = await sdpResponse.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answer });

      setStatus('ready');
      console.info('[RealtimeVoice] realtime session ready');
    } catch (err) {
      console.error('Realtime connection failed', err);
      setError((err as Error).message ?? 'Realtime connection failed');
      cleanupPeerConnection();
      setStatus('error');
    }
  }, [cleanupPeerConnection, handleTranscriptDone, isSupported, onPartialTranscript]);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('Voice capture unsupported in this browser');
      setStatus('error');
      return;
    }

    if (!pcRef.current) {
      await connect();
    }

    if (!micStreamRef.current || !dataChannelRef.current) {
      setError('Microphone stream unavailable');
      setStatus('error');
      return;
    }

    partialRef.current = '';
    onPartialTranscript?.('');

    micStreamRef.current.getAudioTracks().forEach(track => {
      track.enabled = true;
    });

    dataChannelRef.current.send(JSON.stringify({ type: 'input_audio_buffer.clear' }));
    listeningRef.current = true;
    setStatus('listening');
    console.info('[RealtimeVoice] listening started');
  }, [connect, isSupported, onPartialTranscript]);

  const stopListening = useCallback(() => {
    if (!dataChannelRef.current) {
      return;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
    }

    if (!listeningRef.current) {
      return;
    }

    listeningRef.current = false;
    setStatus('processing');

    dataChannelRef.current.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
    dataChannelRef.current.send(
      JSON.stringify({
        type: 'response.create',
        response: {
          modalities: ['text'],
          instructions:
            'Transcribe the most recent audio buffer verbatim and respond with only the transcript text.',
        },
      }),
    );
    console.info('[RealtimeVoice] listening stopped, awaiting transcript');
  }, []);

  return {
    status,
    error,
    isSupported,
    isConnected: !!pcRef.current,
    startListening,
    stopListening,
    disconnect,
  };
}
