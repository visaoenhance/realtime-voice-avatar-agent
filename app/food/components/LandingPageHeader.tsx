'use client';

import React, { useState } from 'react';
import FoodCourtHeader from '@/components/FoodCourtHeader';
import HomeCartControls from './HomeCartControls';

export default function LandingPageHeader() {
  // For landing page, we'll use HomeCartControls separately
  // So we create a dummy function since FoodCourtHeader requires it
  // but we'll hide the default cart button
  const [showDummyCart, setShowDummyCart] = useState(false);

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="font-display text-3xl tracking-[0.3em] text-emerald-600 transition hover:text-emerald-500">
            Food Court
          </a>
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600">
            <span className="text-slate-400">📍</span>
            <span>1234 Main Street, Orlando, FL</span>
          </div>
          <a 
            href="/food/concierge-agentserver"
            className="hidden md:flex items-center gap-2 rounded-full border border-slate-300 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600"
          >
            🎙️ Concierge
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em]">
          <HomeCartControls />
        </div>
      </div>
    </header>
  );
}
