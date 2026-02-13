import {
  ToolSet,
  UIMessage,
  UIMessageStreamWriter,
} from 'ai';

export async function processVoiceToolCalls<T extends ToolSet>(
  {
    messages,
    writer,
    tools,
  }: {
    messages: UIMessage[];
    writer: UIMessageStreamWriter;
    tools: T;
  },
  executeFunctions: Record<string, any> = {}
): Promise<UIMessage[]> {
  // For voice chat, we want immediate processing without approval delays
  // Just return the messages as-is since tools will execute automatically
  return messages;
}