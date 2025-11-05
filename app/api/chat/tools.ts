import { tool } from 'ai';
import { z } from 'zod';
import { muxTrailers } from '@/data/muxTrailers';
import { DEMO_PROFILE_ID, supabase } from '@/lib/supabaseServer';

const RATING_ORDER: string[] = [
  'TV-Y',
  'TV-Y7',
  'G',
  'TV-G',
  'PG',
  'TV-PG',
  'PG-13',
  'TV-14',
  'R',
  'NC-17',
  'TV-MA',
];

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

type ParentalControls = {
  max_rating: string | null;
  blocked_genres: string[] | null;
};

type SupabaseTitle = {
  id: string;
  slug: string;
  name: string;
  genres: string[];
  cast_members: string[];
  year: number | null;
  nostalgic: boolean | null;
  maturity_rating: string | null;
  hero_backdrop: string | null;
  hero_description: string | null;
};

type RecommendationItem = {
  id: string;
  title: string;
  year?: number | null;
  synopsis?: string | null;
  runtimeMinutes?: number | null;
  genres?: string[];
  cast?: string[];
  tags?: string[];
};

const FALLBACK_LAYOUT: HomeLayout = {
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

const MAX_ROW_TILES = 12;

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to use data-driven actions.');
  }
  return supabase;
}

function ratingAllowed(titleRating: string | null | undefined, controls: ParentalControls | null): boolean {
  if (!controls) {
    return true;
  }
  const { max_rating, blocked_genres } = controls;
  if (blocked_genres && blocked_genres.length > 0) {
    if ((titleRating ?? '').length === 0) {
      // allow unknown rating
    }
  }
  if (blocked_genres && blocked_genres.some(genre => (genre ?? '').toLowerCase() !== '' )) {
    const blockedSet = new Set(blocked_genres.map(g => g.toLowerCase()));
    // blockedSet used by caller when filtering by genres array
  }
  if (!max_rating) {
    return true;
  }
  const normalized = titleRating ?? max_rating;
  const index = RATING_ORDER.indexOf(normalized.toUpperCase());
  const maxIndex = RATING_ORDER.indexOf(max_rating.toUpperCase());
  if (index === -1 || maxIndex === -1) {
    return true;
  }
  return index <= maxIndex;
}

function filterByParentalControls(titles: SupabaseTitle[], controls: ParentalControls | null): SupabaseTitle[] {
  if (!controls) {
    return titles;
  }
  const blocked = new Set((controls.blocked_genres ?? []).map(g => g.toLowerCase()));
  return titles.filter(title => {
    const ratingOk = ratingAllowed(title.maturity_rating, controls);
    const genreOk = !title.genres?.some(genre => blocked.has(genre.toLowerCase()));
    return ratingOk && genreOk;
  });
}

async function fetchControls() {
  const client = ensureSupabase();
  const { data } = await client
    .from('mvnte_parental_controls')
    .select('max_rating, blocked_genres')
    .eq('profile_id', DEMO_PROFILE_ID)
    .maybeSingle();
  return (data as ParentalControls | null) ?? null;
}

async function fetchTitles(): Promise<SupabaseTitle[]> {
  const client = ensureSupabase();
  const { data, error } = await client.from('mvnte_titles').select('*');
  if (error) {
    throw error;
  }
  return (data as SupabaseTitle[]) ?? [];
}

async function fetchHistory(): Promise<{ title: SupabaseTitle; watched_at: string }[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('mvnte_view_history')
    .select('watched_at, title:mvnte_titles(*)')
    .eq('profile_id', DEMO_PROFILE_ID)
    .order('watched_at', { ascending: false })
    .limit(25);
  if (error) {
    throw error;
  }
  return (data ?? [])
    .map(item => ({
      title: (item as any)?.title as SupabaseTitle | null,
      watched_at: item?.watched_at as string,
    }))
    .filter(entry => entry.title) as { title: SupabaseTitle; watched_at: string }[];
}

async function fetchPreferences() {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('mvnte_preferences')
    .select('*')
    .eq('profile_id', DEMO_PROFILE_ID)
    .order('weight', { ascending: false });
  if (error) {
    throw error;
  }
  return data ?? [];
}

function fallbackSpeech(summary: string) {
  return summary || 'Home experience updated.';
}

function toTileFromTitle(title: SupabaseTitle): HomeTile {
  const mux = muxTrailers[title.slug];
  return {
    title: title.name,
    image:
      title.hero_backdrop ??
      mux?.poster ??
      'https://images.unsplash.com/photo-1525097487452-6278ff080c31?auto=format&fit=crop&w=800&q=80',
    titleId: title.slug,
  };
}

function toRecommendationItem(title: SupabaseTitle): RecommendationItem {
  return {
    id: title.slug,
    title: title.name,
    year: title.year,
    synopsis: title.hero_description,
    runtimeMinutes: null,
    genres: title.genres,
    cast: title.cast_members,
    tags: title.nostalgic ? ['Classic'] : ['Fresh'],
  };
}

async function buildPersonalizedLayout(options: { focus?: 'genre' | 'actor'; reason?: string } = {}) {
  const client = ensureSupabase();
  const [controls, titles, history, preferences, profile] = await Promise.all([
    fetchControls(),
    fetchTitles(),
    fetchHistory(),
    fetchPreferences(),
    client.from('mvnte_profiles').select('default_layout').eq('id', DEMO_PROFILE_ID).maybeSingle(),
  ]);

  const allowedTitles = filterByParentalControls(titles, controls);

  if (allowedTitles.length === 0) {
    return {
      layout: (profile.data?.default_layout as HomeLayout) ?? FALLBACK_LAYOUT,
      summary: 'No titles met the current parental controls, so the default home view is unchanged.',
    };
  }

  const genreCounts = new Map<string, number>();
  history.forEach(entry => {
    entry.title.genres?.forEach(genre => {
      const lower = genre.toLowerCase();
      if (!allowedTitles.some(t => t.slug === entry.title.slug)) {
        return;
      }
      genreCounts.set(lower, (genreCounts.get(lower) ?? 0) + 1);
    });
  });

  const topGenre = [...genreCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const topGenreTitle = allowedTitles.find(title => title.genres?.map(g => g.toLowerCase()).includes(topGenre ?? ''));
  const preferredActor = preferences.find(pref => pref.type === 'actor');
  const preferredGenre = preferences.find(pref => pref.type === 'genre');

  const heroTitle = history.find(entry => allowedTitles.some(t => t.slug === entry.title.slug))?.title ?? topGenreTitle ?? allowedTitles[0];

  const rows: HomeRow[] = [];

  if (topGenre) {
    const tiles = allowedTitles
      .filter(title => title.genres?.map(g => g.toLowerCase()).includes(topGenre))
      .slice(0, MAX_ROW_TILES)
      .map(toTileFromTitle);
    if (tiles.length > 0) {
      rows.push({
        title: `Because you watched ${topGenre.replace(/(^|\s)\S/g, t => t.toUpperCase())}`,
        tiles,
      });
    }
  }

  if (preferredActor) {
    const actorTiles = allowedTitles
      .filter(title =>
        title.cast_members?.some(actor => actor.toLowerCase() === preferredActor.value.toLowerCase()),
      )
      .slice(0, MAX_ROW_TILES)
      .map(toTileFromTitle);
    if (actorTiles.length > 0) {
      rows.push({
        title: `Starring ${preferredActor.value}`,
        tiles: actorTiles,
      });
    }
  }

  const freshTiles = allowedTitles
    .filter(title => title.nostalgic === false)
    .slice(0, MAX_ROW_TILES)
    .map(toTileFromTitle);
  if (freshTiles.length > 0) {
    rows.push({ title: 'Fresh Picks for Tonight', tiles: freshTiles });
  }

  if (rows.length === 0) {
    rows.push(...FALLBACK_LAYOUT.rows);
  }

  const layout: HomeLayout = {
    hero: {
      title: heroTitle?.name ?? FALLBACK_LAYOUT.hero.title,
      subtitle: 'Curated by MovieNite Concierge',
      description:
        heroTitle?.hero_description ??
        'I refreshed your homepage with titles that match your recent cravings. Take a look or keep chatting with me.',
      cta: 'See Updated Homepage',
      backdrop:
        heroTitle?.hero_backdrop ??
        muxTrailers[heroTitle?.slug ?? '']?.poster ??
        FALLBACK_LAYOUT.hero.backdrop,
    },
    rows,
  };

  const summaryPieces: string[] = [];
  if (topGenre) {
    summaryPieces.push(`leaning into ${topGenre.replace(/(^|\s)\S/g, t => t.toUpperCase())} adventures`);
  }
  if (preferredActor) {
    summaryPieces.push(`featuring ${preferredActor.value}`);
  }
  if (controls && controls.max_rating) {
    summaryPieces.push(`respecting the ${controls.max_rating} rating limit`);
  }

  const summary = summaryPieces.length
    ? `Refreshed your homepage ${summaryPieces.join(' and ')}.`
    : 'Refreshed your homepage with a balanced mix of your favorites.';

  return { layout, summary };
}

async function updateProfileLayout(layout: HomeLayout) {
  const client = ensureSupabase();
  await client
    .from('mvnte_profiles')
    .update({ current_layout: layout, updated_at: new Date().toISOString() })
    .eq('id', DEMO_PROFILE_ID);
}

async function fetchHouseholdContext() {
  if (!supabase) {
    return {
      profile: {
        primaryViewer: 'Emilio',
        partnerName: 'Ida',
      },
      preferences: ['Action', 'Fantasy', 'Sci-Fi', 'Martial Arts'],
      comfort: ['Planet of the Apes (1968)', 'The Matrix', 'Crouching Tiger, Hidden Dragon'],
      parental: 'No parental controls configured yet.',
    };
  }

  const [preferences, parental, history] = await Promise.all([
    fetchPreferences(),
    fetchControls(),
    fetchHistory(),
  ]);

  const genrePrefs = preferences.filter(pref => pref.type === 'genre').map(pref => pref.value);
  const actorPrefs = preferences.filter(pref => pref.type === 'actor').map(pref => pref.value);
  const recentTitles = history.slice(0, 3).map(entry => entry.title.name);

  const parentalSummary = parental
    ? `Max rating ${parental.max_rating ?? 'R'}${
        parental.blocked_genres && parental.blocked_genres.length > 0
          ? `, blocking ${parental.blocked_genres.join(', ')}`
          : ''
      }`
    : 'No parental controls configured yet.';

  return {
    preferences: [...genrePrefs, ...actorPrefs],
    comfort: recentTitles,
    parental: parentalSummary,
  };
}

async function getTitleRecord(slug: string) {
  if (!supabase) {
    return null;
  }
  const { data } = await supabase
    .from('mvnte_titles')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  return (data as SupabaseTitle | null) ?? null;
}

function getMuxConfig(slug: string) {
  const mux = muxTrailers[slug];
  return {
    playbackId: mux?.playbackId ?? '',
    poster:
      mux?.poster ??
      'https://images.unsplash.com/photo-1524334228333-0f6db392f8a1?auto=format&fit=crop&w=1200&q=80',
  };
}

export const tools = {
  getUserContext: tool({
    description: 'Fetch household viewing profile, preferences, and parental guardrails.',
    inputSchema: z.object({}).strip(),
    outputSchema: z.string(),
    async execute() {
      const context = await fetchHouseholdContext();
      const summary = `Profiles loaded. Preferences: ${context.preferences?.slice(0, 3).join(', ') ?? 'n/a'}. Recent watches: ${
        context.comfort?.join(', ') ?? 'n/a'
      }. Parental controls: ${context.parental}.`;
      return JSON.stringify({
        profile: context,
        lastUpdated: new Date().toISOString(),
        speechSummary: summary,
      });
    },
  }),
  fetchRecommendations: tool({
    description: 'Return titles for a canonical genre and nostalgia flag.',
    inputSchema: z.object({
      genre: z.string().describe('Genre using canonical values: sci-fi, fantasy, action, martial-arts'),
      nostalgia: z.boolean().describe('If true, prefer classics; if false, prefer newer releases'),
      limit: z.number().int().min(1).max(6).default(4),
    }),
    outputSchema: z.string(),
    async execute({ genre, nostalgia, limit }) {
      if (!supabase) {
        return JSON.stringify({
          results: [],
          genre,
          nostalgia,
          fallbackApplied: true,
          speechSummary: 'I need Supabase configured before I can fetch live catalog data.',
        });
      }
      const { data, error } = await supabase
        .from('mvnte_titles')
        .select('*')
        .contains('genres', [genre])
        .limit(40);
      if (error) {
        console.error('[tools.fetchRecommendations]', error);
      }
      const controls = await fetchControls();
      const titles = filterByParentalControls((data as SupabaseTitle[]) ?? [], controls)
        .filter(title => (nostalgia ? title.nostalgic === true : title.nostalgic === false))
        .slice(0, limit);
      const items = titles.map(toRecommendationItem);
      return JSON.stringify({
        genre,
        nostalgia,
        results: items,
        fallbackApplied: items.length < limit,
        speechSummary: items.length
          ? `Here are ${items.length} ${nostalgia ? 'nostalgic' : 'fresh'} ${genre} picks.`
          : `I could not find ${genre} titles that meet your filters.`,
      });
    },
  }),
  updateHomeLayout: tool({
    description:
      'Generate a personalized homepage layout from view history and preferences. Use canonical genres and respect parental controls.',
    inputSchema: z.object({
      focus: z.enum(['genre', 'actor']).optional(),
      reason: z.string().optional(),
    }),
    outputSchema: z.string(),
    async execute(args) {
      if (!supabase) {
        return JSON.stringify({
          success: false,
          speechSummary:
            'I need Supabase configured before I can refresh the homepage layout. Please set it up and try again.',
        });
      }
      const { layout, summary } = await buildPersonalizedLayout(args ?? {});
      await updateProfileLayout(layout);
      return JSON.stringify({
        success: true,
        layout,
        summary,
        action: 'offer-home',
        speechSummary: fallbackSpeech(summary),
      });
    },
  }),
  updateParentalControls: tool({
    description:
      'Update parental controls (max rating, blocked genres) and refresh the homepage layout accordingly.',
    inputSchema: z.object({
      maxRating: z
        .enum(['TV-Y', 'TV-Y7', 'G', 'TV-G', 'PG', 'TV-PG', 'PG-13', 'TV-14', 'R', 'NC-17', 'TV-MA'])
        .optional(),
      blockedGenres: z.array(z.string()).optional(),
    }),
    outputSchema: z.string(),
    async execute({ maxRating, blockedGenres }) {
      if (!supabase) {
        return JSON.stringify({
          success: false,
          speechSummary: 'Parental controls require Supabase configuration. Please add your Supabase keys first.',
        });
      }
      const client = ensureSupabase();
      await client
        .from('mvnte_parental_controls')
        .upsert(
          {
            profile_id: DEMO_PROFILE_ID,
            max_rating: maxRating,
            blocked_genres: blockedGenres ?? [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'profile_id' },
        );
      const { layout, summary } = await buildPersonalizedLayout();
      await updateProfileLayout(layout);
      return JSON.stringify({
        success: true,
        layout,
        summary,
        action: 'offer-home',
        speechSummary: fallbackSpeech(`Parental controls updated. ${summary}`),
      });
    },
  }),
  showUpdatedHome: tool({
    description: 'Navigate the UI to display the updated homepage layout after the household confirms they want to see it.',
    inputSchema: z.object({
      confirmed: z.literal(true).describe('Must be true and only set after the household says they want to see the updated homepage.'),
    }),
    outputSchema: z.string(),
    async execute() {
      return JSON.stringify({
        action: 'navigate-home',
        speechSummary: 'Opening your personalized home now.',
      });
    },
  }),
  playPreview: tool({
    description: 'Play a preview trailer for a given title slug.',
    inputSchema: z.object({
      titleId: z.string().describe('Use the canonical slug from mvnte_titles (e.g., planet-of-the-apes-1968)'),
      title: z.string().describe('Human-readable title name'),
    }),
    outputSchema: z.string(),
    async execute({ titleId, title }) {
      const record = (await getTitleRecord(titleId)) as SupabaseTitle | null;
      const mux = getMuxConfig(titleId);
      return JSON.stringify({
        status: 'preview-started',
        titleId,
        title,
        playbackId: mux.playbackId,
        previewUrl: mux.playbackId ? undefined : 'https://storage.googleapis.com/muxdemofiles/mux-video-intro.mp4',
        backdropUrl: record?.hero_backdrop ?? mux.poster,
        poster: mux.poster,
        message: `Preview started for ${title}.`,
        speechSummary: `Preview started for ${title}.`,
      });
    },
  }),
  startPlayback: tool({
    description:
      'Start playback for a selected title slug. Only use after a preview has been approved and the household explicitly said they are ready to watch.',
    inputSchema: z.object({
      titleId: z.string(),
      title: z.string(),
    }),
    outputSchema: z.string(),
    async execute({ titleId, title }) {
      const mux = getMuxConfig(titleId);
      const record = await getTitleRecord(titleId);
      return JSON.stringify({
        status: 'playback-started',
        titleId,
        title,
        playbackId: mux.playbackId,
        runtimeMinutes: record?.year ?? null,
        message: `Enjoy ${title}! The feature is now playing on the living room TV.`,
        speechSummary: `Enjoy ${title}! It's now playing on your TV.`,
      });
    },
  }),
  logFeedback: tool({
    description: 'Record feedback about the concierge flow.',
    inputSchema: z.object({
      sentiment: z.enum(['positive', 'neutral', 'negative']),
      notes: z.string().optional(),
    }),
    outputSchema: z.string(),
    async execute({ sentiment, notes }) {
      return JSON.stringify({
        status: 'logged',
        sentiment,
        notes,
        timestamp: new Date().toISOString(),
        speechSummary: 'Thanks for letting me know how that went! I logged your feedback.',
      });
    },
  }),
};
