'use client';

// Legacy MovieNite home experience retained for reference only.
// This component is no longer mounted in the app router, but it remains here
// so the Food Court migration can reuse patterns and styling cues as needed.

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type HomeTile = {
  title: string;
  image: string;
  tag?: string;
  titleId?: string;
};

export type HomeRow = {
  title: string;
  tiles: HomeTile[];
};

export type HomeLayout = {
  hero: {
    title: string;
    subtitle: string;
    description: string;
    cta: string;
    backdrop: string;
  };
  rows: HomeRow[];
};

const DEFAULT_LAYOUT: HomeLayout = {
  hero: {
    title: 'Dark Winds',
    subtitle: 'Only on MovieNite',
    description:
      'A gritty investigation twists through the desert night. Pick up where you left off or explore something fresh with the concierge.',
    cta: 'Try Voice Concierge',
    backdrop: 'https://images.unsplash.com/photo-1524334228333-0f6db392f8a1?auto=format&fit=crop&w=1400&q=80',
  },
  rows: [
    {
      title: 'Only on MovieNite',
      tiles: [
        {
          title: 'Untamed',
          tag: 'Recently Added',
          image: 'https://images.unsplash.com/photo-1517816428104-797678c7cf0d?auto=format&fit=crop&w=800&q=80',
        },
        {
          title: 'Wednesday',
          tag: 'Top 10',
          image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
        },
        {
          title: 'Genie Make a Wish',
          image: 'https://images.unsplash.com/photo-1514790193030-c89d266d5a9d?auto=format&fit=crop&w=800&q=80',
        },
        {
          title: 'The Sandman',
          image: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
    {
      title: 'Catch Up on Unwatched Episodes',
      tiles: [
        {
          title: 'S.W.A.T.',
          tag: 'Top 10',
          image: 'https://images.unsplash.com/photo-1525097487452-6278ff080c31?auto=format&fit=crop&w=800&q=80',
        },
        {
          title: 'Blacklist',
          image: 'https://images.unsplash.com/photo-1461800919507-79b16743b257?auto=format&fit=crop&w=800&q=80',
        },
        {
          title: 'Mystery of Aaravos',
          image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
        },
        {
          title: 'Alice in Borderland',
          image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
    {
      title: 'Trending in Sci-Fi',
      tiles: [
        {
          title: 'Rebel Moon',
          image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80',
        },
        {
          title: 'Everything Everywhere',
          image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=800&q=80',
        },
        {
          title: 'Planet of the Apes',
          image: 'https://images.unsplash.com/photo-1505685296765-3a2736de412f?auto=format&fit=crop&w=800&q=80',
        },
        {
          title: 'The Matrix',
          image: 'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
  ],
};

type TileCardProps = HomeTile & { className?: string };

function TileCard({ title, tag, image, className }: TileCardProps) {
  return (
    <div
      className={`group relative aspect-video min-w-[200px] max-w-[280px] shrink-0 overflow-hidden rounded-2xl border border-zinc-800 bg-black/30 shadow-lg transition hover:-translate-y-1 hover:border-zinc-700 ${className ?? ''}`}
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 100%), url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {tag ? (
        <span className="absolute left-3 top-3 rounded-full bg-netflix-red px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
          {tag}
        </span>
      ) : null}
      <div className="absolute inset-x-3 bottom-3">
        <div className="font-semibold text-sm text-slate-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
          {title}
        </div>
      </div>
    </div>
  );
}

function RowCarousel({ row }: { row: HomeRow }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < maxScrollLeft - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    updateScrollState();
    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateScrollState, row.tiles.length]);

  const handleScroll = useCallback(() => {
    updateScrollState();
  }, [updateScrollState]);

  const scrollByAmount = useCallback(
    (direction: 'left' | 'right') => {
      const el = scrollRef.current;
      if (!el) {
        return;
      }
      const scrollDistance = Math.max(el.clientWidth * 0.8, 240);
      const delta = direction === 'left' ? -scrollDistance : scrollDistance;
      el.scrollBy({ left: delta, behavior: 'smooth' });
    },
    [],
  );

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold uppercase tracking-[0.35em] text-netflix-gray-300">{row.title}</div>
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="no-scrollbar flex gap-4 overflow-x-auto pb-4 pr-4 snap-x snap-mandatory scroll-smooth"
        >
          {row.tiles.map(tile => (
            <TileCard key={`${row.title}-${tile.title}`} {...tile} className="w-[220px] flex-none snap-start" />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-netflix-black/95 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-netflix-black/95 to-transparent" />
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollByAmount('left')}
          disabled={!canScrollLeft}
          className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-2xl font-semibold text-white shadow-lg transition hover:bg-black/90 disabled:cursor-default disabled:bg-black/40"
        >
          <span className="-translate-x-[1px]">&lt;</span>
        </button>
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollByAmount('right')}
          disabled={!canScrollRight}
          className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-2xl font-semibold text-white shadow-lg transition hover:bg-black/90 disabled:cursor-default disabled:bg-black/40"
        >
          <span className="translate-x-[1px]">&gt;</span>
        </button>
      </div>
    </div>
  );
}

export function MovieNiteHomeReference() {
  const [layout, setLayout] = useState<HomeLayout>(DEFAULT_LAYOUT);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animateKey, setAnimateKey] = useState(0);

  const fetchLayout = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/data/homepage', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load layout');
      }
      const json = (await response.json()) as { layout?: HomeLayout };
      if (json.layout) {
        setLayout(json.layout);
        setAnimateKey(prev => prev + 1);
      }
      setError(null);
    } catch (err: any) {
      console.error('[MovieNite reference] load layout error', err);
      setError(err.message ?? 'Unable to load personalized layout.');
      setLayout(DEFAULT_LAYOUT);
      setAnimateKey(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLayout();
  }, [fetchLayout]);

  const handleReset = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/data/homepage/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error('Failed to reset layout');
      }
      const json = (await response.json()) as { layout?: HomeLayout };
      if (json.layout) {
        setLayout(json.layout);
        setAnimateKey(prev => prev + 1);
      }
      setError(null);
    } catch (err: any) {
      console.error('[MovieNite reference] reset layout error', err);
      setError('Unable to reset layout.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hero = layout.hero;
  const rows = layout.rows ?? [];

  const statusLabel = useMemo(() => {
    if (error) {
      return error;
    }
    if (isLoading) {
      return 'Refreshing your layout…';
    }
    return 'Powered by OpenAI Voice API.';
  }, [error, isLoading]);

  return (
    <div className="min-h-screen bg-netflix-black text-netflix-gray-100">
      <header className="border-b border-black/60 bg-[rgba(0,0,0,0.65)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-10">
            <Link href="/" className="font-display text-3xl tracking-[0.35em] text-netflix-red">
              MovieNite
            </Link>
            <nav className="hidden gap-6 text-xs font-semibold uppercase tracking-[0.4em] text-netflix-gray-300 md:flex">
              <span className="text-white">Home</span>
              <Link href="/food" className="transition hover:text-netflix-gray-100">
                Food Court
              </Link>
              <Link href="/voice" className="transition hover:text-netflix-gray-100">
                Voice Concierge
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-xs text-netflix-gray-400 md:block">{statusLabel}</div>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-netflix-gray-200 transition hover:border-zinc-500 hover:text-white"
              disabled={isLoading}
            >
              Reset Layout
            </button>
            <Link
              href="/voice"
              className="rounded-full bg-netflix-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_12px_30px_rgba(229,9,20,0.25)] transition hover:bg-[#b20710]"
            >
              Launch Voice Concierge
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
        <section
          key={`hero-${animateKey}`}
          className="animate-fade-up relative overflow-hidden rounded-[28px] border border-zinc-900 bg-black/40 shadow-2xl"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.75) 20%, rgba(0,0,0,0.05) 70%), url(${hero.backdrop})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="flex flex-col gap-4 p-10 md:max-w-lg">
            <div className="text-xs uppercase tracking-[0.4em] text-netflix-gray-300">{hero.subtitle}</div>
            <h1 className="font-display text-4xl tracking-[0.15em] text-white md:text-5xl">{hero.title}</h1>
            <p className="text-sm text-netflix-gray-200">{hero.description}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/voice"
                className="inline-flex items-center gap-2 rounded-full bg-netflix-red px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-[#b20710]"
              >
                {hero.cta}
              </Link>
              <Link
                href="/food"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-netflix-gray-200 transition hover:border-zinc-500 hover:text-white"
              >
                Explore Food Court
              </Link>
              <button
                type="button"
                onClick={handleReset}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-netflix-gray-200 transition hover:border-zinc-500 hover:text-white"
              >
                Continue Watching
              </button>
            </div>
          </div>
        </section>

        <section key={`rows-${animateKey}`} className="space-y-10 animate-fade-up">
          {rows.map(row => (
            <RowCarousel key={row.title} row={row} />
          ))}
        </section>

        <section className="rounded-[28px] border border-zinc-900 bg-[rgba(18,18,18,0.9)] p-10 shadow-xl animate-fade-up">
          <div className="text-xs uppercase tracking-[0.35em] text-netflix-gray-400">New workflow</div>
          <h2 className="mt-3 text-2xl font-semibold text-white">Talk through movie night instead of scrolling forever</h2>
          <p className="mt-3 max-w-3xl text-sm text-netflix-gray-300">
            Voice Concierge keeps all the approvals in your hands. Ask for genres in any language, request nostalgic or new
            picks, approve previews, and start playback only when you say so.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/voice"
              className="rounded-full bg-netflix-red px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_12px_30px_rgba(229,9,20,0.25)] transition hover:bg-[#b20710]"
            >
              Try the Voice Concierge
            </Link>
            <a
              href="https://www.netflix.com/browse"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-zinc-700 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-netflix-gray-200 transition hover:border-zinc-500 hover:text-white"
            >
              Compare with Netflix UI
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

export default MovieNiteHomeReference;

