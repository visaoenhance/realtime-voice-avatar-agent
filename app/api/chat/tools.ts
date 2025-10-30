import { tool } from 'ai';
import { z } from 'zod';

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
};

const householdProfile: HouseholdProfile = {
  primaryViewer: 'Emilio',
  partnerName: 'Melissa',
  favoriteGenres: ['Action', 'Fantasy', 'Sci-Fi', 'Martial Arts'],
  comfortShows: ['Planet of the Apes (1968)', 'The Matrix', 'Crouching Tiger, Hidden Dragon'],
  favoriteActors: ['Keanu Reeves', 'Charlton Heston', 'Michelle Yeoh'],
  typicalSessionLengthMinutes: 110,
};

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
    previewUrl: 'https://example.com/previews/planet-of-the-apes-1968.mp4',
    backdropUrl: 'https://images.unsplash.com/photo-1527766833261-b09c3163a791?auto=format&fit=crop&w=1200&q=80',
    cast: ['Charlton Heston', 'Roddy McDowall', 'Kim Hunter'],
    tags: ['Classic', 'Thought-Provoking', 'Post-Apocalyptic'],
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
    previewUrl: 'https://example.com/previews/beneath-the-planet-of-the-apes-1970.mp4',
    backdropUrl: 'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=1200&q=80',
    cast: ['James Franciscus', 'Charlton Heston', 'Maurice Evans'],
    tags: ['Classic', 'Sequel', 'Cult Favorite'],
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
    previewUrl: 'https://example.com/previews/the-matrix-1999.mp4',
    backdropUrl: 'https://images.unsplash.com/photo-1488229297570-58520851e868?auto=format&fit=crop&w=1200&q=80',
    cast: ['Keanu Reeves', 'Carrie-Anne Moss', 'Laurence Fishburne'],
    tags: ['Cult', 'Mind-Bending', 'Martial Arts'],
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
    previewUrl: 'https://example.com/previews/rebel-moon-2023.mp4',
    backdropUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    cast: ['Sofia Boutella', 'Charlie Hunnam'],
    tags: ['New Release', 'Epic', 'Space Opera'],
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
    previewUrl: 'https://example.com/previews/everything-everywhere-all-at-once-2022.mp4',
    backdropUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    cast: ['Michelle Yeoh', 'Ke Huy Quan'],
    tags: ['Award-Winning', 'Heartfelt', 'Multiverse'],
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
      return JSON.stringify({
        profile: householdProfile,
        lastUpdated: new Date().toISOString(),
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

      return JSON.stringify({
        genre,
        nostalgia,
        results: unique,
        fallbackApplied: unique.length < limit,
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
  }),
  startPlayback: tool({
    description:
      'Start playback of the selected Netflix title on the living room TV. Requires explicit human confirmation.',
    inputSchema: z.object({
      titleId: z.string(),
      title: z.string(),
    }),
    outputSchema: z.string(),
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
      });
    },
  }),
};

