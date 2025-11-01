import { openai } from '@ai-sdk/openai';
import {
  createUIMessageStreamResponse,
  createUIMessageStream,
  streamText,
  convertToModelMessages,
  stepCountIs,
  getToolName,
  isToolUIPart,
} from 'ai';
import { processToolCalls } from './utils';
import { getTitleById, tools } from './tools';
import { HumanInTheLoopUIMessage } from './types';

const systemPrompt = `You are the Netflix Voice Concierge for Emilio and Melissa. Stay warm, concise, and always keep humans in control.

Key directives:
- Wait for the household to speak first. If there is no user content yet, do not start the conversation.
- Immediately after the first user request, call 'getUserContext' and reference their preferences in your reply.
- Recommend ONLY titles that exist in the provided catalog. Never mention external sites or off-platform content.
- Follow the scripted flow: confirm or clarify the user goal, narrow to a genre, confirm nostalgia vs new, then call 'fetchRecommendations'. Present up to three options with titles, year, short synopsis, and a cast hook, then ask which to explore.
- When the household requests a preview, you must call 'playPreview'. Wait for human approval before stating it is playing, then acknowledge the preview in natural language and remind them of on-screen controls.
- When they ask to watch or say yes after a preview, call 'startPlayback'. Again wait for approval before celebrating playback.
- If the household declines, pivot smoothly to alternate suggestions or wrap up.
- Close the session with gratitude and a nod to Melissa’s “Netflix is easier than Prime Video” compliment.
- Offer 'logFeedback' only near the end if it feels organic.
- Always respond in English; do not switch languages unless explicitly asked.

Voice-first reminders:
- Keep responses under three short sentences unless the household directly asks for detail.
- Preface tool-driven steps with clear choices: offer preview vs play now vs other options.
- Acknowledge confirmations verbally even while tools run, but never claim success until approval is captured.`;

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: HumanInTheLoopUIMessage[] } = await req.json();
  console.log(
    '[api/chat] received',
    messages?.length ?? 0,
    messages?.map(m => {
      const textParts = (m.parts ?? [])
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join(' | ');
      return `${m.id ?? 'no-id'}:${m.role}:${textParts}`;
    }),
  );

  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      console.log('[api/chat] processToolCalls start');
      const processedMessages = await processToolCalls(
        { messages, writer, tools },
        {
          playPreview: async ({ titleId, title }: { titleId: string; title: string }) => {
            const meta = getTitleById(titleId);
            console.log('[api/chat] playPreview approved', { titleId, title, hasMeta: Boolean(meta) });
            if (!meta) {
              return JSON.stringify({
                status: 'preview-error',
                titleId,
                title,
                message:
                  'Preview metadata was unavailable for this title. Offer an alternative from the recommendation list.',
              });
            }

            return JSON.stringify({
              status: 'preview-started',
              titleId,
              title,
              playbackId: meta.previewPlaybackId,
              previewUrl: meta.previewUrl,
              backdropUrl: meta.backdropUrl,
              poster: meta.previewPoster ?? meta.backdropUrl,
              message: `Preview started for ${title}.`,
            });
          },
          startPlayback: async ({ titleId, title }: { titleId: string; title: string }) => {
            const meta = getTitleById(titleId);
            console.log('[api/chat] startPlayback approved', { titleId, title, hasMeta: Boolean(meta) });
            if (!meta) {
              return JSON.stringify({
                status: 'playback-error',
                titleId,
                title,
                message:
                  'Playback metadata was unavailable. Offer a different catalog title or retry the preview.',
              });
            }

            return JSON.stringify({
              status: 'playback-started',
              titleId,
              title,
              playbackId: meta.previewPlaybackId,
              runtimeMinutes: meta.runtimeMinutes,
              message: `Enjoy ${title}! The feature is now playing on the living room TV.`,
            });
          },
        },
      );
      console.log('[api/chat] processToolCalls done');

      const conversationState = analyzeConversationState(processedMessages);
      const requiresCorrection = determineIfCorrectionNeeded(conversationState);

      console.log('[api/chat] streamText start');
      const modelMessages = convertToModelMessages(processedMessages);
      modelMessages.unshift({ role: 'system', content: systemPrompt });
      const correctionInstruction = buildCorrectionInstruction(conversationState, requiresCorrection);
      if (correctionInstruction) {
        modelMessages.unshift({ role: 'system', content: correctionInstruction });
      }

      const result = streamText({
        model: openai('gpt-4o'),
        messages: modelMessages,
        tools,
        stopWhen: stepCountIs(5),
      });

      writer.merge(
        result.toUIMessageStream({ originalMessages: processedMessages }),
      );
      console.log('[api/chat] streamText merged');
    },
  });

  return createUIMessageStreamResponse({ stream });
}

type ConversationPhase =
  | 'awaiting-first-user'
  | 'awaiting-context'
  | 'awaiting-genre'
  | 'awaiting-nostalgia'
  | 'awaiting-recommendations'
  | 'awaiting-selection'
  | 'awaiting-preview-request'
  | 'awaiting-preview-approval'
  | 'awaiting-playback-request'
  | 'awaiting-playback-approval'
  | 'ready-to-wrap';

type CorrectionDirective =
  | { type: 'force-context'; userUtterance: string }
  | { type: 'force-recommendations'; genre: string; nostalgia: boolean }
  | { type: 'force-preview'; title: string }
  | { type: 'force-playback'; title: string }
  | null;

function analyzeConversationState(messages: HumanInTheLoopUIMessage[]): {
  phase: ConversationPhase;
  lastUserText?: string;
  genre?: string;
  nostalgia?: boolean;
  requestedTitle?: string;
  toolNames: Set<string>;
} {
  const state: {
    phase: ConversationPhase;
    lastUserText?: string;
    genre?: string;
    nostalgia?: boolean;
    requestedTitle?: string;
    toolNames: Set<string>;
  } = { phase: 'awaiting-first-user', toolNames: new Set() };

  const genreKeywords = ['sci-fi', 'science fiction', 'action', 'fantasy', 'martial arts'];
  const nostalgiaKeywords = ['nostalgic', 'nostalgia', 'classic', 'old'];
  const freshKeywords = ['new', 'recent', 'latest'];

  for (const message of messages) {
    if (message.role === 'user') {
      const userText = (message.parts ?? [])
        .map(part => (part.type === 'text' ? part.text ?? '' : ''))
        .join(' ')
        .trim();
      if (userText) {
        state.lastUserText = userText;
        const lower = userText.toLowerCase();
        if (!state.genre) {
          const foundGenre = genreKeywords.find(keyword => lower.includes(keyword));
          if (foundGenre) {
            if (foundGenre === 'science fiction') {
              state.genre = 'Sci-Fi';
            } else {
              state.genre = capitalizeWords(foundGenre.replace('-', ' '));
            }
          }
        }
        if (state.nostalgia == null) {
          if (nostalgiaKeywords.some(keyword => lower.includes(keyword))) {
            state.nostalgia = true;
          } else if (freshKeywords.some(keyword => lower.includes(keyword))) {
            state.nostalgia = false;
          }
        }
        if (lower.includes('preview') || lower.includes('trailer')) {
          state.requestedTitle = extractTitleFromText(userText);
        } else if (lower.includes('play') || lower.includes('watch')) {
          state.requestedTitle = extractTitleFromText(userText);
        }
      }
      continue;
    }

    if (message.parts) {
      for (const part of message.parts) {
        if (isToolUIPart(part)) {
          const toolName = getToolName(part);
          state.toolNames.add(toolName);
        }
      }
    }
  }

  const lastUserLower = state.lastUserText?.toLowerCase() ?? '';

  if (!state.lastUserText) {
    state.phase = 'awaiting-first-user';
    return state;
  }

  if (!state.toolNames.has('getUserContext')) {
    state.phase = 'awaiting-context';
    return state;
  }

  if (!state.genre) {
    state.phase = 'awaiting-genre';
    return state;
  }

  if (state.nostalgia == null) {
    state.phase = 'awaiting-nostalgia';
    return state;
  }

  if (!state.toolNames.has('fetchRecommendations')) {
    state.phase = 'awaiting-recommendations';
    return state;
  }

  if (lastUserLower.includes('preview') || lastUserLower.includes('trailer')) {
    if (!state.toolNames.has('playPreview')) {
      state.phase = 'awaiting-preview-request';
      return state;
    }
  }

  if (state.toolNames.has('playPreview')) {
    if (!(lastUserLower.includes('play') || lastUserLower.includes('watch')) && !state.toolNames.has('startPlayback')) {
      state.phase = 'awaiting-preview-approval';
      return state;
    }
  }

  if ((lastUserLower.includes('play') || lastUserLower.includes('watch')) && !state.toolNames.has('startPlayback')) {
    state.phase = 'awaiting-playback-request';
    return state;
  }

  if (state.toolNames.has('startPlayback')) {
    state.phase = 'awaiting-playback-approval';
    return state;
  }

  state.phase = 'ready-to-wrap';
  return state;
}

function determineIfCorrectionNeeded(state: ReturnType<typeof analyzeConversationState>): CorrectionDirective {
  switch (state.phase) {
    case 'awaiting-context':
      return state.lastUserText ? { type: 'force-context', userUtterance: state.lastUserText } : null;
    case 'awaiting-recommendations':
      if (state.genre && typeof state.nostalgia === 'boolean') {
        return { type: 'force-recommendations', genre: state.genre, nostalgia: state.nostalgia };
      }
      return null;
    case 'awaiting-preview-request':
      if (state.requestedTitle) {
        return { type: 'force-preview', title: state.requestedTitle };
      }
      return null;
    case 'awaiting-playback-request':
      if (state.requestedTitle) {
        return { type: 'force-playback', title: state.requestedTitle };
      }
      return null;
    default:
      return null;
  }
}

function buildCorrectionInstruction(
  state: ReturnType<typeof analyzeConversationState>,
  directive: CorrectionDirective,
): string | null {
  if (!directive) {
    return null;
  }

  switch (directive.type) {
    case 'force-context':
      return `You must call the getUserContext tool immediately before answering. The household just said: "${state.lastUserText ?? ''}"`;
    case 'force-recommendations':
      return `You already captured the genre (${directive.genre}) and nostalgia preference (${directive.nostalgia}). Call fetchRecommendations with those values before responding.`;
    case 'force-preview':
      return `The household asked for a preview (${directive.title}). Ensure your next message issues a playPreview tool call and waits for human approval.`;
    case 'force-playback':
      return `The household asked to start playback (${directive.title}). Your next step must be a startPlayback tool call gated by approval.`;
    default:
      return null;
  }
}

function extractTitleFromText(text: string): string | undefined {
  const quotedMatch = text.match(/"([^"]+)"/);
  if (quotedMatch) {
    return quotedMatch[1];
  }
  const words = text.split(' ');
  if (words.length >= 3) {
    return words.slice(-3).join(' ');
  }
  return text;
}

function capitalizeWords(input: string): string {
  return input
    .split(' ')
    .map(word => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}
