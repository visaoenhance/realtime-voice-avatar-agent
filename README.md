# Human-in-the-Loop Agent with Vercel AI SDK

A Next.js application demonstrating Human-in-the-Loop (HITL) functionality using the Vercel AI SDK. This allows users to approve or decline tool calls before they are executed.

## Features

- Human-in-the-Loop tool execution
- Type-safe tool definitions
- Real-time chat interface
- Automatic tool call interception
- User confirmation UI

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your OpenAI API key:**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   
   Then edit `.env.local` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_actual_api_key_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## How It Works

1. When the AI agent wants to execute a tool (like `getWeatherInformation`), it sends a tool call to the frontend.
2. The frontend intercepts the tool call and displays a confirmation UI with "Yes" and "No" buttons.
3. The user can approve or decline the tool execution.
4. Upon approval, the tool executes on the backend and returns the result.
5. The result is sent back to the AI model for further processing.

## Example Usage

Try asking: "What's the weather like in New York?"

The system will prompt you to confirm before executing the weather tool.

## Project Structure

- `app/page.tsx` - Main chat interface
- `app/api/chat/route.ts` - API route handler
- `app/api/chat/tools.ts` - Tool definitions
- `app/api/chat/utils.ts` - Utility functions for processing tool calls
- `app/api/chat/types.ts` - TypeScript type definitions

## Reference

Based on the [Vercel AI SDK Human-in-the-Loop guide](https://ai-sdk.dev/cookbook/next/human-in-the-loop).

