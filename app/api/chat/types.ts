import { UIMessage } from 'ai';

export type HumanInTheLoopUIMessage = UIMessage;

export type NetflixTools = {
  getUserContext: {
    input: Record<string, never>;
    output: string;
  };
  fetchRecommendations: {
    input: { genre: string; nostalgia: boolean; limit?: number };
    output: string;
  };
  playPreview: {
    input: { titleId: string; title: string };
    output: string;
  };
  startPlayback: {
    input: { titleId: string; title: string };
    output: string;
  };
  logFeedback: {
    input: { sentiment: 'positive' | 'neutral' | 'negative'; notes?: string };
    output: string;
  };
};

