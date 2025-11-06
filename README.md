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
- Classic “tile” homepage for contrast, plus a dedicated voice concierge route (`/voice`)
- Parallel Food Court experience featuring:
  - Marketplace home at `/`
  - Store detail and menu flows at `/food/stores/[slug]`
  - Item detail customizer at `/food/stores/[slug]/items/[itemSlug]`
  - Voice concierge relocated to `/food/concierge`

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp env.local.example .env.local
   ```
   Edit `.env.local` and add your OpenAI key. Add Supabase environment variables if you want the data-driven personalization flows (MovieNite + Food Court):
   ```
   OPENAI_API_KEY=sk-...
   NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_URL=https://...supabase.co
   SUPABASE_SERVICE_ROLE_KEY=...
   DEMO_PROFILE_ID=00000000-0000-0000-0000-0000000000fc
   ```

3. **Seed Supabase (optional but recommended)**
   - Create a new Supabase project.
   - Open the SQL editor and run the script in `supabase/schema.sql` to create the `mvnte_` tables and seed demo data.

4. **Point preview clips at your Mux assets**
   Edit `data/muxTrailers.ts` and update the `playbackId` / `poster` pairs for each title with the playback IDs from your Mux dashboard.

5. **Explore both flows**
   - Visit [http://localhost:3000](http://localhost:3000) to browse the Food Court marketplace home.
   - Launch the Food Court concierge at [http://localhost:3000/food/concierge](http://localhost:3000/food/concierge).
   - Jump to [http://localhost:3000/voice](http://localhost:3000/voice) to run the original MovieNite voice-driven experience.
6. When ready to commit, say "Let's watch this"; the assistant triggers `startPlayback`, again asking for approval before confirming the stream is live and speaking the confirmation aloud (unless muted).