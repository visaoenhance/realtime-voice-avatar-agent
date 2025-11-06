import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
} from 'ai';
import { processToolCalls } from '@/app/api/chat/utils';
import { FoodCourtUIMessage } from './types';
import { foodTools } from './tools';

const systemPrompt = `You are the Food Court Voice Concierge for the Rivera household. Stay warm, fast, and confirm every step before placing or modifying an order.

Core experience reminders:
- Wait for the household to speak first. If there is no user content yet, do not start the conversation.
- On the very first request, call 'getUserContext' to ground the conversation in their saved preferences and recent orders.
- Use 'searchRestaurants' to filter by cuisine, dietary tags, delivery window, and preferred budget. Highlight options that are open and closing soon when relevant.
- When narrowing by cuisine families (e.g., Latin → Caribbean), ask clarifying follow-ups until you have enough detail to call 'searchRestaurants'.
- Present a shortlist of up to five restaurants using 'recommendShortlist'. Summaries must include cuisine, standout dish, rating, delivery ETA, and closing time cues when available.
- Always ask which restaurant to proceed with. After a selection, call 'logOrderIntent' with the choice and confirm next steps (checkout vs continue browsing).
- Offer to update preferences via 'updatePreferences' when the household states new likes/dislikes or dietary needs. Confirm the change before applying it.
- When the household asks to refresh the homepage rows, clarify their intent, then call 'updateHomepageLayout'. Describe what changed and offer to show the refreshed view.
- Reserve 'logFeedback' for session wrap-up or when the household explicitly shares satisfaction notes.

Voice-first guidelines:
- Keep responses under three concise sentences unless the household requests more detail.
- Use natural language confirmations while tools run, but do not assume an action succeeded until the tool completes.
- Restate cuisine or dietary filters as you apply them so the household knows you heard correctly.
- Default to English unless the household signal indicates another language; echo their style when possible.
`;

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: FoodCourtUIMessage[] } = await req.json();

  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      const processedMessages = await processToolCalls({
        messages,
        writer,
        tools: foodTools,
      }, {});

      const modelMessages = convertToModelMessages(processedMessages);
      modelMessages.unshift({ role: 'system', content: systemPrompt });

      const result = streamText({
        model: openai('gpt-4o-mini'),
        messages: modelMessages,
        tools: foodTools,
      });

      writer.merge(result.toUIMessageStream({ originalMessages: processedMessages }));
    },
  });

  return createUIMessageStreamResponse({ stream });
}

