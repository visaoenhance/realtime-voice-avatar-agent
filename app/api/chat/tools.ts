import { tool } from 'ai';
import { z } from 'zod';
import { muxTrailers } from '@/data/muxTrailers';

export type HouseholdProfile = {
  primaryViewer: string;
  partnerName: string;
  favoriteGenres: string[];
  comfortShows: string[];
  favoriteActors: string[];
  typicalSessionLengthMinutes: number;
};

export type NetflixTitle = {
  id: string;
  title: string;
  year: number;
  genres: string[];
  synopsis: string;
  runtimeMinutes: number;
  nostalgia: boolean;
  previewUrl: string;
  backdropUrl: string;
  cast: string[];
  tags: string[];
  previewPlaybackId?: string;
  previewPoster?: string;
};

const MUX_FALLBACK_PREVIEW = 'https://storage.googleapis.com/muxdemofiles/mux-video-intro.mp4';

const householdProfile: HouseholdProfile = {
  primaryViewer: 'Emilio',
  partnerName: 'Melissa',
  favoriteGenres: ['Action', 'Fantasy', 'Sci-Fi', 'Martial Arts'],
  comfortShows: ['Planet of the Apes (1968)', 'The Matrix', 'Crouching Tiger, Hidden Dragon'],
  favoriteActors: ['Keanu Reeves', 'Charlton Heston', 'Michelle Yeoh'],
  typicalSessionLengthMinutes: 110,
};

function getMuxPreviewConfig(id: string, fallbackPoster: string) {
  const config = muxTrailers[id];
  return {
    previewPlaybackId: config?.playbackId ?? '',
    previewPoster: config?.poster ?? fallbackPoster,
  };
}

export const netflixCatalog: NetflixTitle[] = [
  {
    id: 'planet-of-the-apes-1968',
    title: 'Planet of the Apes',
    year: 1968,
    genres: ['Sci-Fi', 'Adventure'],
    synopsis:
      'An astronaut crew crash-lands on a mysterious planet ruled by intelligent apes and struggles to survive and uncover the truth.',
    runtimeMinutes: 112,
    nostalgia: true,
    previewUrl: MUX_FALLBACK_PREVIEW,
    backdropUrl: 'https://images.unsplash.com/photo-1527766833261-b09c3163a791?auto=format&fit=crop&w=1200&q=80',
    cast: ['Charlton Heston', 'Roddy McDowall', 'Kim Hunter'],
    tags: ['Classic', 'Thought-Provoking', 'Post-Apocalyptic'],
    ...getMuxPreviewConfig(
      'planet-of-the-apes-1968',
      'https://image.mux.com/nhsfOna5SHcWQDIG01V6CbLC7BLZCd1jZZ01qoJADTn2w/thumbnail.png?width=214&height=121&time=5',
    ),
  },
  {
    id: 'beneath-the-planet-of-the-apes-1970',
    title: 'Beneath the Planet of the Apes',
    year: 1970,
    genres: ['Sci-Fi', 'Adventure'],
    synopsis:
      'The sole survivor of an interstellar rescue mission searches for the missing crew only to discover a subterranean world.',
    runtimeMinutes: 95,
    nostalgia: true,
    previewUrl: MUX_FALLBACK_PREVIEW,
    backdropUrl: 'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=1200&q=80',
    cast: ['James Franciscus', 'Charlton Heston', 'Maurice Evans'],
    tags: ['Classic', 'Sequel', 'Cult Favorite'],
    ...getMuxPreviewConfig(
      'beneath-the-planet-of-the-apes-1970',
      'https://image.mux.com/gfMPYMD3Ij02k68uZKR9Hokz02oybo01sLrSijrXMhMb3Y/thumbnail.png?width=214&height=121&time=2',
    ),
  },
  {
    id: 'the-matrix-1999',
    title: 'The Matrix',
    year: 1999,
    genres: ['Sci-Fi', 'Action'],
    synopsis:
      'A hacker discovers the true nature of his reality and his role in a war against its controllers.',
    runtimeMinutes: 136,
    nostalgia: true,
    previewUrl: MUX_FALLBACK_PREVIEW,
    backdropUrl: 'https://images.unsplash.com/photo-1488229297570-58520851e868?auto=format&fit=crop&w=1200&q=80',
    cast: ['Keanu Reeves', 'Carrie-Anne Moss', 'Laurence Fishburne'],
    tags: ['Cult', 'Mind-Bending', 'Martial Arts'],
    ...getMuxPreviewConfig(
      'the-matrix-1999',
      'https://image.mux.com/02lppsvzZjH01YT029co6BTeMvTrx8c4psMsD9nF7Iw5qo/thumbnail.png?width=214&height=121&time=2',
    ),
  },
  {
    id: 'rebel-moon-2023',
    title: 'Rebel Moon',
    year: 2023,
    genres: ['Sci-Fi', 'Action'],
    synopsis:
      'A peaceful colony on the edge of a galaxy is threatened by armies of a tyrannical regent.',
    runtimeMinutes: 134,
    nostalgia: false,
    previewUrl: MUX_FALLBACK_PREVIEW,
    backdropUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    cast: ['Sofia Boutella', 'Charlie Hunnam'],
    tags: ['New Release', 'Epic', 'Space Opera'],
    ...getMuxPreviewConfig(
      'rebel-moon-2023',
      'https://image.mux.com/7sMT6EvtnbEotftDT3apwdQKsocf01n02U8LNKT7VF68k/thumbnail.png?width=214&height=121&time=5',
    ),
  },
  {
    id: 'everything-everywhere-all-at-once-2022',
    title: 'Everything Everywhere All at Once',
    year: 2022,
    genres: ['Sci-Fi', 'Comedy', 'Martial Arts'],
    synopsis:
      'An aging Chinese immigrant is swept up in an insane adventure across the multiverse where she alone can save whats important to her.',
    runtimeMinutes: 140,
    nostalgia: false,
    previewUrl: MUX_FALLBACK_PREVIEW,
    backdropUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    cast: ['Michelle Yeoh', 'Ke Huy Quan'],
    tags: ['Award-Winning', 'Heartfelt', 'Multiverse'],
    ...getMuxPreviewConfig(
      'everything-everywhere-all-at-once-2022',
      'https://image.tmdb.org/t/p/original/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg',
    ),
  },
];

export function getTitleById(id: string): NetflixTitle | undefined {
  return netflixCatalog.find(title => title.id === id);
}

export const tools = {
  getUserContext: tool({
    description:
      'Fetch the household viewing profile including favorite genres, actors, and recent habits.',
    inputSchema: z.object({}).strip(),
    outputSchema: z.string(),
    async execute() {
      const topGenres = householdProfile.favoriteGenres.slice(0, 3).join(', ');
      return JSON.stringify({
        profile: householdProfile,
        lastUpdated: new Date().toISOString(),
        speechSummary: `Loaded your Netflix preferences. You both love ${topGenres} nights.`,
      });
    },
  }),
  fetchRecommendations: tool({
    description:
      'Return a curated list of Netflix titles for the household based on genre and nostalgia mood.',
    inputSchema: z.object({
      genre: z.string().describe('Target genre such as Sci-Fi, Action, Fantasy'),
      nostalgia: z
        .boolean()
        .describe('If true, prefer classics; if false, prefer newer releases'),
      limit: z.number().int().min(1).max(6).default(3),
    }),
    outputSchema: z.string(),
    async execute({ genre, nostalgia, limit }) {
      const normalizedGenre = genre.toLowerCase();
      const candidates = netflixCatalog.filter(title =>
        title.genres.some(g => g.toLowerCase() === normalizedGenre),
      );

      const filtered = candidates
        .filter(title => title.nostalgia === nostalgia)
        .concat(candidates.filter(title => title.nostalgia !== nostalgia));

      const unique: NetflixTitle[] = [];
      for (const title of filtered) {
        if (unique.length >= limit) {
          break;
        }
        if (!unique.some(existing => existing.id === title.id)) {
          unique.push(title);
        }
      }

      const summaryMood = nostalgia ? 'nostalgic' : 'fresh';
      const summaryCount = unique.length === 0 ? 'a few' : unique.length;

      return JSON.stringify({
        genre,
        nostalgia,
        results: unique,
        fallbackApplied: unique.length < limit,
        speechSummary: `Here are ${summaryCount} ${summaryMood} ${genre} picks I think you’ll enjoy.`,
      });
    },
  }),
  playPreview: tool({
    description:
      'Play the preview trailer for a specific Netflix title. Requires explicit household approval before executing.',
    inputSchema: z.object({
      titleId: z.string().describe('Identifier of the title whose preview should play'),
      title: z.string().describe('Human-readable title name'),
    }),
    outputSchema: z.string(),
    async execute({ titleId, title }) {
      const meta = getTitleById(titleId);
      return JSON.stringify({
        status: 'preview-started',
        titleId,
        title,
        playbackId: meta?.previewPlaybackId,
        previewUrl: meta?.previewUrl,
        backdropUrl: meta?.backdropUrl,
        poster: meta?.previewPoster ?? meta?.backdropUrl,
        message: `Preview started for ${title}.`,
        speechSummary: `Preview started for ${title}.`,
      });
    },
  }),
  startPlayback: tool({
    description:
      'Start playback of the selected Netflix title on the living room TV. Requires explicit human confirmation.',
    inputSchema: z.object({
      titleId: z.string(),
      title: z.string(),
    }),
    outputSchema: z.string(),
    async execute({ titleId, title }) {
      const meta = getTitleById(titleId);
      return JSON.stringify({
        status: 'playback-started',
        titleId,
        title,
        playbackId: meta?.previewPlaybackId,
        runtimeMinutes: meta?.runtimeMinutes,
        message: `Enjoy ${title}! The feature is now playing on the living room TV.`,
        speechSummary: `Enjoy ${title}! It's now playing on your TV.`,
      });
    },
  }),
  logFeedback: tool({
    description:
      'Record how the household felt about the recommendation flow and outcome.',
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
        speechSummary: 'Thanks for letting me know how that went!',
      });
    },
  }),
};

