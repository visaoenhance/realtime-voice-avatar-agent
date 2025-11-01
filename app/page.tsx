'use client';

import Link from 'next/link';

type HeroSection = {
  title: string;
  subtitle: string;
  description: string;
  cta: string;
  backdrop: string;
};

type Tile = {
  title: string;
  tag?: string;
  image: string;
};

type Row = {
  title: string;
  tiles: Tile[];
};

const hero: HeroSection = {
  title: 'Dark Winds',
  subtitle: 'Only on MovieNite',
  description:
    'A gritty investigation twists through the desert night. Pick up where you left off or explore something fresh with the concierge.',
  cta: 'Try Voice Concierge',
  backdrop:
    'https://images.unsplash.com/photo-1524334228333-0f6db392f8a1?auto=format&fit=crop&w=1400&q=80',
};

const rows: Row[] = [
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
];

function TileCard({ title, tag, image }: Tile) {
  return (
    <div
      className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black/30 shadow-lg transition hover:-translate-y-1 hover:border-zinc-700"
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

export default function Home() {
  return (
    <div className="min-h-screen bg-netflix-black text-netflix-gray-100">
      <header className="border-b border-black/60 bg-[rgba(0,0,0,0.65)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-10">
            <Link href="/" className="font-display text-3xl tracking-[0.35em] text-netflix-red">
              MovieNite
            </Link>
            <nav className="hidden gap-6 text-xs font-semibold uppercase tracking-[0.4em] text-netflix-gray-300 md:flex">
              <Link href="/" className="text-white">
                Home
              </Link>
              <Link
                href="/voice"
                className="transition hover:text-netflix-gray-100"
              >
                Voice Concierge
              </Link>
            </nav>
          </div>
          <Link
            href="/voice"
            className="rounded-full bg-netflix-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_12px_30px_rgba(229,9,20,0.25)] transition hover:bg-[#b20710]"
          >
            Launch Voice Concierge
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
        <section
          className="relative overflow-hidden rounded-[28px] border border-zinc-900 bg-black/40 shadow-2xl"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.75) 20%, rgba(0,0,0,0.05) 70%), url(${hero.backdrop})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="flex flex-col gap-4 p-10 md:max-w-lg">
            <div className="text-xs uppercase tracking-[0.4em] text-netflix-gray-300">
              {hero.subtitle}
            </div>
            <h1 className="font-display text-4xl tracking-[0.15em] text-white md:text-5xl">
              {hero.title}
            </h1>
            <p className="text-sm text-netflix-gray-200">{hero.description}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/voice"
                className="inline-flex items-center gap-2 rounded-full bg-netflix-red px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-[#b20710]"
              >
                {hero.cta}
              </Link>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-netflix-gray-200 transition hover:border-zinc-500 hover:text-white"
              >
                Continue Watching
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-10">
          {rows.map(row => (
            <div key={row.title} className="space-y-4">
              <div className="text-sm font-semibold uppercase tracking-[0.35em] text-netflix-gray-300">
                {row.title}
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {row.tiles.map(tile => (
                  <TileCard key={`${row.title}-${tile.title}`} {...tile} />
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-[28px] border border-zinc-900 bg-[rgba(18,18,18,0.9)] p-10 shadow-xl">
          <div className="text-xs uppercase tracking-[0.35em] text-netflix-gray-400">New workflow</div>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            Talk through movie night instead of scrolling forever
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-netflix-gray-300">
            Voice Concierge keeps all the approvals in your hands. Ask for genres in any language, request nostalgic or new picks, approve previews, and start playback only when you say so.
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
