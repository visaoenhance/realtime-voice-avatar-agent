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
import { tools } from './tools';
import { HumanInTheLoopUIMessage } from './types';

const systemPrompt = `You are the Netflix Voice Concierge for Emilio and Melissa. Stay warm, concise, and always keep humans in control.

Key directives:
- Wait for the household to speak first. If there is no user content yet, do not start the conversation.
- Immediately after the first user request, call 'getUserContext' and reference their preferences in your reply.
- Recommend ONLY titles that exist in the provided catalog. Never mention external sites or off-platform content.
- Follow the scripted flow: confirm or clarify the user goal, narrow to a genre, confirm nostalgia vs new, then call 'fetchRecommendations'. Present at most three options with titles, year, short synopsis, and a cast hook, then ask which to explore.
- After the household picks a title, explicitly ask whether they would like a preview or to start watching. Always call 'playPreview' first. Do not call 'startPlayback' until the preview has been run, human approval has been captured, and the household clearly says they are ready to watch.
- When the household requests a preview, you must call 'playPreview'. Wait for human approval before stating it is playing, then acknowledge the preview in natural language and remind them of on-screen controls.
- When they ask to watch or say yes after a preview, call 'startPlayback'. Again wait for approval before celebrating playback.
- If the household declines, pivot smoothly to alternate suggestions or wrap up.
- When you refresh or adjust the homepage, describe what changed and ask whether they want to see the updated homepage. Only call 'showUpdatedHome' after the household says yes.
- Close the session with gratitude and a nod to Melissa’s “Netflix is easier than Prime Video” compliment.
- Offer 'logFeedback' only near the end if it feels organic.
- Mirror the household's active language hint for every response. Default to fluent English when no hint is provided.

Tool usage rules (always obey):
- Treat tool arguments as canonical. For 'fetchRecommendations', use a genre from {"sci-fi","fantasy","action","martial-arts"} and a boolean nostalgia flag (true = classic/nostalgic, false = new/fresh).
- For 'playPreview' and 'startPlayback', pass the catalog titleId and title exactly as provided in the recommendation results.
- Do not infer genre/nostalgia from raw language keywords; instead, decide the intent and emit the appropriate tool call with the canonical values.

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
      const processedMessages = await processToolCalls({ messages, writer, tools }, {});
      console.log('[api/chat] processToolCalls done');

      const conversationState = analyzeConversationState(processedMessages);
      const requiresCorrection = determineIfCorrectionNeeded(conversationState);
      const languageHint = detectLanguageHint(processedMessages);

      console.log('[api/chat] streamText start');
      const modelMessages = convertToModelMessages(processedMessages);
      modelMessages.unshift({ role: 'system', content: systemPrompt });
      const languageInstruction = buildLanguageInstruction(languageHint);
      if (languageInstruction) {
        modelMessages.unshift({ role: 'system', content: languageInstruction });
      }
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

  const assistantToolCalls: Array<{ toolName: string; payload: any }> = [];

  for (const message of messages) {
    if (message.role === 'user') {
      const userText = (message.parts ?? [])
        .map(part => (part.type === 'text' ? part.text ?? '' : ''))
        .join(' ')
        .trim();
      if (userText) {
        state.lastUserText = userText;
      }
      continue;
    }

    if (message.parts) {
      for (const part of message.parts) {
        if (isToolUIPart(part)) {
          const toolName = getToolName(part);
          state.toolNames.add(toolName);
          const payload = (part as any).input ?? (part as any).arguments ?? {};
          assistantToolCalls.push({ toolName, payload });
        }
      }
    }
  }

  const recommendationCall = assistantToolCalls
    .filter(call => call.toolName === 'fetchRecommendations')
    .pop();
  if (recommendationCall) {
    state.genre = recommendationCall.payload?.genre;
    state.nostalgia = recommendationCall.payload?.nostalgia;
  }

  if (!state.lastUserText) {
    state.phase = 'awaiting-first-user';
    return state;
  }

  if (!state.toolNames.has('getUserContext')) {
    state.phase = 'awaiting-context';
    return state;
  }

  if (!state.toolNames.has('fetchRecommendations')) {
    state.phase = 'awaiting-recommendations';
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
      return { type: 'force-recommendations', genre: 'sci-fi', nostalgia: false };
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
      return `Call fetchRecommendations next with a canonical genre (e.g., "sci-fi", "fantasy", "action", "martial-arts") and nostalgia flag (true for classics, false for new). Choose the values that best match the household's request.`;
    default:
      return null;
  }
}

function detectLanguageHint(messages: HumanInTheLoopUIMessage[]): string | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index] as any;
    if (message?.role === 'user' && message?.metadata?.language) {
      return String(message.metadata.language).toLowerCase();
    }
  }
  return undefined;
}

function buildLanguageInstruction(languageCode?: string): string | null {
  if (!languageCode) {
    return null;
  }
  const normalized = languageCode.toLowerCase().split('-')[0];
  if (normalized === 'en') {
    return null;
  }
  const languageName = languageCodeToName(normalized);
  return `The household is currently speaking ${languageName} (language code: ${normalized}). Reply entirely in ${languageName}, including greetings, confirmations, and follow-ups, while keeping tool names and structured data in English as required.`;
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

function languageCodeToName(code: string): string {
  const mapping: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ja: 'Japanese',
    zh: 'Chinese',
    ko: 'Korean',
  };
  return mapping[code] ?? code.toUpperCase();
}
