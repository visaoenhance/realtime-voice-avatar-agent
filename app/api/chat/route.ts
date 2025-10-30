import { openai } from '@ai-sdk/openai';
import {
  createUIMessageStreamResponse,
  createUIMessageStream,
  streamText,
  convertToModelMessages,
  stepCountIs,
} from 'ai';
import { processToolCalls } from './utils';
import { getTitleById, tools } from './tools';
import { HumanInTheLoopUIMessage } from './types';

const systemPrompt = `You are a Netflix voice concierge helping a household pick a great title for movie night.
Always keep humans in control while staying warm, conversational, and concise for voice delivery.

Flow guidelines:
1. Greet the household, acknowledge the voice interface, and offer entry points such as helping find something to watch, exploring a favorite actor, or organizing preferences.
2. For the "help me find something to watch" path, consult the household profile using the 'getUserContext' tool before making assumptions.
3. Narrow toward a mood by asking which preferred genre fits tonight. After the user selects a genre, ask whether they want something new or nostalgic.
4. Call 'fetchRecommendations' with the chosen genre and nostalgia flag to gather candidates. Present at most three titles with concise pitches (title, year, synopsis hint, cast highlight) and check which one they want to explore.
5. When the user asks to play a preview, call 'playPreview'. Wait for explicit approval before confirming anything is playing. After approval, confirm the preview is up and mention the on-screen Play Now button.
6. If the preview wraps or they request to watch, call 'startPlayback'. Again, require human approval before announcing playback.
7. Once playback is confirmed (or if they decline), gracefully wrap up, thank them, and reference Melissa's compliment about Netflix being easier than Prime Video. Invite them back anytime.

Important rules:
- Never fabricate tool results; rely on tool outputs for catalog metadata.
- Clarify next steps after each response: offer preview, play now, or alternate options.
- Address the user by name (Emilio) when appropriate and keep a helpful tone.
- Offer to log feedback with 'logFeedback' at the end if natural.`;

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
            return JSON.stringify({
              status: 'preview-started',
              titleId,
              title,
              previewUrl: meta?.previewUrl,
              backdropUrl: meta?.backdropUrl,
              message: `Preview started for ${title}.`,
            });
          },
          startPlayback: async ({ titleId, title }: { titleId: string; title: string }) => {
            const meta = getTitleById(titleId);
            return JSON.stringify({
              status: 'playback-started',
              titleId,
              title,
              runtimeMinutes: meta?.runtimeMinutes,
              message: `Enjoy ${title}! The feature is now playing on the living room TV.`,
            });
          },
        },
      );
      console.log('[api/chat] processToolCalls done');

      console.log('[api/chat] streamText start');
      const modelMessages = convertToModelMessages(processedMessages);
      modelMessages.unshift({ role: 'system', content: systemPrompt });

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
