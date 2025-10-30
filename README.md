# Netflix Human-in-the-Loop Voice Concierge

This project refactors the Vercel AI SDK HITL sample into a Netflix-inspired, voice-first agent that helps households pick what to watch. The assistant understands preferred genres, surfaces nostalgic vs. new options, and always requests explicit approval before playing previews or starting playback.

## Highlights

- Voice-centric UI with optional browser speech recognition and typed fallback
- Netflix domain prompt engineering with OpenAI GPT models
- Tooling for household context, recommendations, preview, playback, and feedback
- Human-in-the-loop approvals for preview and playback actions
- Rich media sidebar that reflects current preview and playback state
- Netflix-inspired dark theming using open fonts and a custom palette

## Setup

1. **Install dependencies**
   ```