import {
  ToolSet,
  UIMessage,
  UIMessageStreamWriter,
  isToolUIPart,
  getToolName,
} from 'ai';

// Constants for approval status
export const APPROVAL = {
  YES: 'APPROVED',
  NO: 'DECLINED',
} as const;

export type ExecuteFunctions<T extends ToolSet> = {
  [K in keyof T as T[K] extends { execute?: (...args: any[]) => any }
    ? T[K]['execute'] extends undefined
      ? K
      : never
    : never]: T[K] extends { execute?: undefined }
    ? (
        args: T[K] extends { inputSchema: infer S }
          ? S extends z.ZodType<infer I>
            ? I
            : never
          : never,
      ) => Promise<
        T[K] extends { outputSchema: infer S }
          ? S extends z.ZodType<infer O>
            ? O
            : never
          : never
      >
    : never;
};

// Import zod for type inference
import { z } from 'zod';

export async function processToolCalls<T extends ToolSet>(
  {
    messages,
    writer,
    tools,
  }: {
    messages: UIMessage[];
    writer: UIMessageStreamWriter;
    tools: T;
  },
  executeFunctions: {
    [K in keyof T as T[K] extends { execute?: (...args: any[]) => any }
      ? T[K]['execute'] extends undefined
        ? K
        : never
      : never]: T[K] extends { execute?: undefined }
      ? (args: any) => Promise<any>
      : never;
  },
): Promise<UIMessage[]> {
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage?.parts) {
    return messages;
  }

  const processedParts = await Promise.all(
    lastMessage.parts.map(async part => {
      // Skip if not a tool UI part or if it doesn't have a decision/result yet
      const decision = (part as any).output ?? (part as any).result;
      if (!isToolUIPart(part) || decision == null) {
        return part;
      }

      const toolName = getToolName(part) as keyof typeof executeFunctions;

      // Check if this tool requires confirmation
      if (!(toolName in executeFunctions)) {
        return part;
      }

      // Check the decision for approval status
      const output = decision as string;

      // If declined, return an error in the tool result
      if (output === APPROVAL.NO) {
        const errorResult = 'User declined to execute this tool.';
        writer.write({
          type: 'tool-output-available',
          toolCallId: part.toolCallId,
          output: errorResult,
        });

        return { ...part, output: errorResult } as any;
      }

      // If approved, execute the tool
      if (output === APPROVAL.YES && part.input) {
        const executeFunction = executeFunctions[toolName];

        if (!executeFunction) {
          return part;
        }

        const result = await executeFunction(part.input as any);

        // Forward updated tool result to the client
        writer.write({
          type: 'tool-output-available',
          toolCallId: part.toolCallId,
          output: result,
        });

        // Return updated toolInvocation with the actual result
        return { ...part, output: result } as any;
      }

      // If neither approved nor declined, return the original part
      return part;
    }),
  );

  // Finally return the processed messages
  return [...messages.slice(0, -1), { ...lastMessage, parts: processedParts }];
}

export function getToolsRequiringConfirmation<T extends ToolSet>(
  tools: T,
): string[] {
  return (Object.keys(tools) as (keyof T)[]).filter(key => {
    const maybeTool = tools[key];
    if (typeof maybeTool !== 'object' || maybeTool == null) {
      return false;
    }
    const execute = (maybeTool as any).execute;
    return typeof execute !== 'function';
  }) as string[];
}

