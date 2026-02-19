'use client';

/**
 * LemonSlice Avatar Container
 * 
 * Responsive wrapper for the avatar with positioning and controls.
 * Handles different layouts for desktop, tablet, and mobile.
 * 
 * Desktop (≥1024px): Fixed overlay in top-right corner
 * Tablet (768-1023px): Top-center with collapse toggle
 * Mobile (<768px): Hidden by default, opens in modal via FAB
 * 
 * Usage:
 *   <LemonsliceAvatarContainer />
 */

import React, { useState, useEffect } from 'react';
import LemonsliceAvatar from './LemonsliceAvatar';
import { useVoiceAssistant } from '@livekit/components-react';

export default function LemonsliceAvatarContainer() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [avatarReady, setAvatarReady] = useState(false);
  
  const { state } = useVoiceAssistant();
  const isSpeaking = state === 'speaking';

  // Detect screen size for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Don't render anything until avatar is ready
  if (!avatarReady) {
    return (
      <div className="hidden">
        <LemonsliceAvatar onAvatarReady={setAvatarReady} />
      </div>
    );
  }

  // Mobile: Floating Action Button + Modal
  if (isMobile) {
    return (
      <>
        {/* FAB Button */}
        <button
          onClick={() => setIsMobileModalOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg flex items-center justify-center text-white text-2xl hover:scale-110 transition-transform"
          aria-label="Show avatar"
        >
          👤
          {isSpeaking && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>

        {/* Modal */}
        {isMobileModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
              onClick={() => setIsMobileModalOpen(false)}
            />
            
            {/* Modal Content */}
            <div className="relative z-10 w-full max-w-sm mx-4">
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Close Button */}
                <button
                  onClick={() => setIsMobileModalOpen(false)}
                  className="absolute top-4 right-4 z-20 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center text-slate-600 hover:bg-white"
                >
                  ✕
                </button>

                {/* Avatar */}
                <div className="aspect-[368/560] bg-slate-100">
                  <LemonsliceAvatar className="w-full h-full" />
                </div>

                {/* Status */}
                <div className="p-4 text-center">
                  <div className="text-sm text-slate-600">
                    {isSpeaking ? '🎤 Speaking...' : '👂 Listening...'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Tablet: Top-center with collapse
  if (isTablet) {
    return (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
        {isMinimized ? (
          <button
            onClick={() => setIsMinimized(false)}
            className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg flex items-center justify-center text-white text-2xl hover:scale-110 transition-transform"
            aria-label="Show avatar"
          >
            👤
          </button>
        ) : (
          <div className="relative">
            {/* Minimize Button */}
            <button
              onClick={() => setIsMinimized(true)}
              className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-slate-600 hover:bg-slate-100"
              aria-label="Minimize avatar"
            >
              −
            </button>

            {/* Avatar */}
            <div className="w-[200px] h-[250px] bg-slate-100 rounded-xl shadow-xl overflow-hidden">
              <LemonsliceAvatar className="w-full h-full" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop: Fixed overlay top-right
  return (
    <div className="fixed top-20 right-6 z-50">
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg flex items-center justify-center text-white text-3xl hover:scale-110 transition-transform"
          aria-label="Show avatar"
        >
          👤
        </button>
      ) : (
        <div className="relative group">
          {/* Controls (show on hover) */}
          <div className="absolute -top-10 left-0 right-0 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsMinimized(true)}
              className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-slate-600 hover:bg-slate-100 text-sm"
              aria-label="Minimize avatar"
              title="Minimize"
            >
              −
            </button>
          </div>

          {/* Avatar */}
          <div className="w-[250px] h-[320px] bg-slate-100 rounded-xl shadow-2xl overflow-hidden border border-slate-200">
            <LemonsliceAvatar className="w-full h-full" />
          </div>

          {/* Status Badge */}
          {isSpeaking && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full shadow-lg animate-pulse">
              Speaking
            </div>
          )}
        </div>
      )}
    </div>
  );
}
