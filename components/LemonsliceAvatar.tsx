'use client';

/**
 * LemonSlice Avatar Component
 * 
 * Automatically detects and displays the avatar video participant
 * from the LiveKit room. The Python agent (food_concierge_agentserver.py)
 * initializes the LemonSlice avatar which joins as a video participant.
 * 
 * Features:
 * - Automatic participant detection (looks for "lemonslice" identity)
 * - Real-time lip-sync (handled by LemonSlice backend)
 * - Graceful error handling (hides if avatar not available)
 * - Loading and error states
 * - Error message display for billing/config issues
 * 
 * Usage:
 *   <LemonsliceAvatar />
 */

import React, { useEffect, useState } from 'react';
import { useParticipants, VideoTrack, useRoomContext } from '@livekit/components-react';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';

interface LemonsliceAvatarProps {
  className?: string;
  onAvatarReady?: (isReady: boolean) => void;
}

interface AvatarStatus {
  status: 'success' | 'error' | 'disabled' | 'loading';
  message?: string;
  error_type?: 'billing_error' | 'auth_error' | 'config_error' | 'server_error' | 'system_error';
  status_code?: number;
}

export default function LemonsliceAvatar({ 
  className = '',
  onAvatarReady 
}: LemonsliceAvatarProps) {
  const participants = useParticipants();
  const room = useRoomContext();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState<AvatarStatus>({ status: 'loading' });
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // Listen for avatar status messages from Python agent
  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array, participant?: any) => {
      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);
        
        if (data.type === 'avatar_status') {
          console.log('[AVATAR] Status update:', data);
          setAvatarStatus({
            status: data.status,
            message: data.message,
            error_type: data.error_type,
            status_code: data.status_code
          });
          
          if (data.status === 'error') {
            setHasError(true);
            setIsLoading(false);
          } else if (data.status === 'success') {
            setHasError(false);
            // Keep loading until video appears
          } else if (data.status === 'disabled') {
            setIsLoading(false);
          }
        }
      } catch (err) {
        // Not a JSON message or not for us
      }
    };

    room.on('dataReceived', handleData);
    return () => {
      room.off('dataReceived', handleData);
    };
  }, [room]);

  // Debug logging
  useEffect(() => {
    console.log('[AVATAR] Participants:', participants.map(p => ({
      identity: p.identity,
      name: p.name,
      hasVideo: p.videoTrackPublications.size > 0,
      videoTracks: [...p.videoTrackPublications.values()].map((pub: any) => ({
        sid: pub.trackSid,
        subscribed: pub.isSubscribed,
        enabled: pub.isEnabled
      }))
    })));
  }, [participants]);

  // Find avatar participant (looks for "lemonslice" in identity)
  const avatarParticipant = participants.find(p => 
    p.identity?.toLowerCase().includes('lemonslice') ||
    p.identity?.toLowerCase().includes('avatar') ||
    p.name?.toLowerCase().includes('lemonslice')
  );

  // Get video track from avatar participant
  let videoPublication: any = undefined;
  if (avatarParticipant?.videoTrackPublications) {
    const iterator = avatarParticipant.videoTrackPublications.values();
    const firstValue = iterator.next();
    if (!firstValue.done) {
      videoPublication = firstValue.value;
      console.log('[AVATAR] Found video publication:', {
        sid: videoPublication.trackSid,
        subscribed: videoPublication.isSubscribed,
        enabled: videoPublication.isEnabled,
        muted: videoPublication.isMuted
      });
    }
  }
  const hasVideo = videoPublication && videoPublication.isSubscribed;

  // Debug logging on mount
  useEffect(() => {
    console.log('[AVATAR] Component mounted');
    return () => console.log('[AVATAR] Component unmounted');
  }, []);

  useEffect(() => {
    console.log('[AVATAR] Avatar state:', {
      hasParticipant: !!avatarParticipant,
      hasVideoPublication: !!videoPublication,
      hasVideo,
      isLoading,
      hasError
    });
    
    if (hasVideo) {
      console.log('[AVATAR] ✅ Avatar video ready!');
      setIsLoading(false);
      setHasError(false);
      onAvatarReady?.(true);
    } else if (avatarParticipant && !hasVideo) {
      console.log('[AVATAR] ⏳ Participant found but no video yet...');
      // Participant exists but no video yet - still loading
      setIsLoading(true);
    } else if (!avatarParticipant) {
      console.log('[AVATAR] ❌ No avatar participant found');
    }
  }, [hasVideo, avatarParticipant, onAvatarReady]);

  // Hide avatar if disabled (not configured)
  if (avatarStatus.status === 'disabled') {
    return null;
  }

  // Show error with detailed message
  if (hasError || avatarStatus.status === 'error') {
    const errorIcon = avatarStatus.error_type === 'billing_error' ? '💳' : '⚠️';
    const errorTitle = avatarStatus.error_type === 'billing_error' 
      ? 'Billing Issue' 
      : avatarStatus.error_type === 'auth_error'
      ? 'Authentication Error'
      : avatarStatus.error_type === 'config_error'
      ? 'Configuration Error'
      : 'Avatar Unavailable';
    
    return (
      <div className={`avatar-error ${className}`}>
        <div className="rounded-xl flex flex-col items-center justify-center bg-white border-2 border-blue-400 p-6">
          <p className="text-3xl mb-3">{errorIcon}</p>
          <p className="text-sm font-bold text-blue-900">{errorTitle}</p>
          <p className="text-xs text-blue-700 text-center mt-2 leading-relaxed">
            {avatarStatus.message || 'Avatar service unavailable'}
          </p>
          
          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            {avatarStatus.error_type === 'billing_error' && (
              <a 
                href="https://lemonslice.com/pricing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Add Credits →
              </a>
            )}
            <button
              onClick={() => setShowErrorDetails(!showErrorDetails)}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-semibold rounded-lg transition-colors"
            >
              {showErrorDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
          
          {/* Error Details (collapsible) */}
          {showErrorDetails && (
            <div className="mt-4 w-full bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
              <p className="text-xs font-semibold text-blue-900 mb-2">Technical Details:</p>
              <div className="text-[11px] text-blue-800 space-y-1 font-mono">
                <div><span className="font-bold">Error Type:</span> {avatarStatus.error_type || 'unknown'}</div>
                {avatarStatus.status_code && (
                  <div><span className="font-bold">Status Code:</span> {avatarStatus.status_code}</div>
                )}
                <div className="mt-2">
                  <span className="font-bold">Raw Message:</span>
                  <pre className="mt-1 whitespace-pre-wrap break-words">{avatarStatus.message}</pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isLoading || !hasVideo) {
    return (
      <div className={`avatar-loading ${className}`}>
        <div className="text-center p-4 text-slate-400">
          <div className="text-2xl mb-2 animate-spin">⟳</div>
          <div className="text-xs">Loading Avatar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`avatar-video relative ${className}`}>
      <VideoTrack
        trackRef={{
          participant: avatarParticipant!,
          source: videoPublication.source,
          publication: videoPublication,
        }}
        className="w-full h-full object-cover rounded-xl"
      />
      
      {/* Status indicator (optional) */}
      <div className="absolute bottom-2 left-2 right-2 text-center">
        <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-[10px] text-white">
          Speaking...
        </div>
      </div>
    </div>
  );
}
