'use client';

import Link from 'next/link';
import React from 'react';

interface FoodCourtHeaderProps {
  pageTitle?: string;
  totalCartItems?: number;
  onCartClick: () => void;
}

export default function FoodCourtHeader({ 
  pageTitle, 
  totalCartItems = 0, 
  onCartClick 
}: FoodCourtHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-display text-3xl tracking-[0.35em] text-emerald-600">
            Food Court
          </Link>
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600">
            <span className="text-slate-400">📍</span>
            <span>1234 Main Street, Orlando, FL</span>
          </div>
          <Link 
            href="/food/concierge-agentserver"
            className="hidden md:flex items-center gap-2 rounded-full border border-slate-300 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600"
          >
            🎙️ Concierge
          </Link>
        </div>
        
        {/* Desktop Cart Button */}
        <button
          className="hidden md:flex rounded-full border border-slate-300 px-6 py-2 text-xs uppercase tracking-[0.3em] text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600 items-center gap-2"
          onClick={onCartClick}
        >
          🛒 Cart{totalCartItems > 0 ? ` (${totalCartItems})` : ''}
        </button>
        
        {/* Mobile Cart Button */}
        <button
          type="button"
          onClick={onCartClick}
          className="flex md:hidden items-center gap-2 rounded-full border border-slate-300 px-3 py-1 uppercase tracking-[0.3em] text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600"
        >
          <span role="img" aria-label="cart">🛒</span>
          Cart
          {totalCartItems > 0 && (
            <span className="ml-1 inline-flex h-4 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-semibold text-white">
              {totalCartItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
