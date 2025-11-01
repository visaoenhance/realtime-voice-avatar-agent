# MovieNite (Netflix-Inspired) Human-in-the-Loop Voice Concierge

This project refactors the Vercel AI SDK HITL sample into a Netflix-inspired, voice-first agent—rebranded as **MovieNite**—that helps households pick what to watch. The assistant understands preferred genres, surfaces nostalgic vs. new options, and always requests explicit approval before playing previews or starting playback.

## Highlights

- Voice-centric UI with OpenAI Realtime capture (with typed fallback for unsupported browsers)
- Netflix-style domain prompt engineering with OpenAI GPT models
- Tooling for household context, recommendations, preview, playback, and feedback
- Human-in-the-loop approvals for preview and playback actions
- Rich media sidebar that reflects current preview and playback state
- Netflix-inspired dark theming using open fonts and a custom palette
- Spoken concierge replies powered by OpenAI TTS with a mute toggle
- Automatic detection of spoken language (Spanish, etc.) with matching concierge replies

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your OpenAI key (and optionally Mux API credentials if you intend to create assets programmatically):
   ```
   OPENAI_API_KEY=sk-...
   MUX_TOKEN_ID=...
   MUX_TOKEN_SECRET=...
   ```

3. **Point preview clips at your Mux assets**
   Edit `data/muxTrailers.ts` and update the `playbackId` / `poster` pairs for each title with the playback IDs from your Mux dashboard.

4. **Launch the experience**
   Visit [http://localhost:3000](http://localhost:3000) and allow microphone access to try the voice flow.
   The microphone button uses OpenAI Realtime for push-to-talk capture. If the browser blocks WebRTC/mic access, switch to typing (the concierge will still speak responses).

5. When ready to commit, say "Let's watch this"; the assistant triggers `startPlayback`, again asking for approval before confirming the stream is live and speaking the confirmation aloud (unless muted).