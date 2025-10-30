import { openai } from '@ai-sdk/openai';
import {
  createUIMessageStreamResponse,
  createUIMessageStream,
  streamText,
  convertToModelMessages,
  stepCountIs,
} from 'ai';
import { processToolCalls } from './utils';
import { tools } from './tools';
import { HumanInTheLoopUIMessage } from './types';

const systemPrompt = `You are a shopping assistant helping the user buy a backpack from local vendors.
Follow this flow:
1. Confirm you understand they want a backpack and ask about vendor preference (e.g. local store vs online).
2. Ask for the ZIP code to search.
3. Call the tool \'searchLocalBackpacks\' with the collected details to retrieve options.
4. Present the options clearly (mention id, name, price, vendor, distance). Ask the user to choose by id.
5. After the user chooses an option, call the tool \'initiatePurchase\' with the selected item details.
6. Wait for human approval before assuming the purchase is complete. If approved, acknowledge that the purchase has been initiated. If declined, ask whether to modify the selection or cancel.
Keep responses concise and friendly. Do not guess inventory; always use the tool.`;

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: HumanInTheLoopUIMessage[] } =
    await req.json();
  console.log('[api/chat] received', messages?.length ?? 0);

  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      console.log('[api/chat] processToolCalls start');
      const processedMessages = await processToolCalls(
        { messages, writer, tools },
        {
          initiatePurchase: async ({
            itemId,
            price,
            vendor,
            zipCode,
          }: {
            itemId: string;
            price: number;
            vendor: string;
            zipCode: string;
          }) => {
            return `✅ Purchase confirmed for ${itemId} from ${vendor} (ZIP ${zipCode}) totaling $${price}. Receipt sent to the user.`;
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

