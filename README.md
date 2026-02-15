# Food Court Voice Concierge (with MovieNite Legacy Route)

This repository now centers on a human-in-the-loop **Food Court** concierge: a voice-forward agent that guides households to open restaurants, surfaces fallback suggestions, and gathers approvals before taking action. The original **MovieNite** Netflix experiment still ships as a legacy `/voice` route for comparison, but Food Court is the primary experience.

## Highlights

- Conversational restaurant discovery with OpenAI GPT models and AI SDK tool orchestration
- Voice-first interaction layer with typed fallback, Supabase-backed context, and Sample data for offline demos
- Clarifies delivery area before searching, mirrors the household’s language, and speaks concise confirmations
- Human-in-the-loop approvals remain for critical actions (preferences, order intent, playback)
- Fallback catalogue (including Colombian, Caribbean, and healthy options) keeps demos working without Supabase
- Legacy MovieNite flow preserved at `/voice` to showcase the earlier Netflix prompt stack

## Project Structure

- `/` – Food Court marketplace landing page
- `/food/concierge` – Food Court voice + chat concierge (current focus)
- `/food/stores/[slug]` – Store detail with menu browsing and HITL item cards
- `/food/stores/[slug]/items/[itemSlug]` – Item customization flow
- `/voice` – MovieNite legacy voice concierge for streaming recommendations

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp env.local.example .env.local
   ```
   
   **Environment Switching**: This project supports both local (Docker) and remote (Supabase Cloud) databases.
   
   Set `SUPABASE_ENV` in `.env.local`:
   - `SUPABASE_ENV=local` – Uses local Docker Supabase (127.0.0.1:54321)
   - `SUPABASE_ENV=remote` – Uses production Supabase Cloud
   
   Quick switch:
   ```bash
   ./scripts/switch-env.sh local   # Switch to local
   ./scripts/switch-env.sh remote  # Switch to remote
   ```
   
   Required keys:
   ```
   # Environment selector
   SUPABASE_ENV=local
   
   # Local Supabase (Docker)
   LOCAL_SUPABASE_URL=http://127.0.0.1:54321
   LOCAL_SUPABASE_ANON_KEY=...
   LOCAL_SUPABASE_SERVICE_ROLE_KEY=...
   
   # Remote Supabase (Production)
   REMOTE_SUPABASE_URL=https://...supabase.co
   REMOTE_SUPABASE_ANON_KEY=...
   REMOTE_SUPABASE_SERVICE_ROLE_KEY=...
   
   # Other
   OPENAI_API_KEY=sk-...
   DEMO_PROFILE_ID=00000000-0000-0000-0000-0000000000fc
   ```
   
   **Benefits of dual environments**:
   - **Local**: Fast development, offline work, experimenting with schema changes
   - **Remote**: Demos, production, external access, team collaboration
   - **Disaster recovery**: Keep both synced so you can instantly switch if one fails

3. **Seed Supabase (for live restaurant data)**
   - Create a Supabase project.
   - Run `supabase/schema.sql` to create the `fc_*` tables (preferences, restaurants, orders, layout, etc.).
   - Optionally run `supabase/seed_data.sql` for richer demo records.

   Without Supabase, the concierge falls back to the curated dataset in `data/foodCourtSamples.ts`.

4. **Voice & speech configuration**
   - `/api/openai/transcribe` handles recorded audio clips from the browser.
   - `/api/openai/speak` uses OpenAI TTS; the concierge mirrors the user’s language when replying aloud.
   - `hooks/useAssistantSpeech.ts` contains speech queueing logic and mute toggles.

5. **Legacy MovieNite assets (optional)**
   - Update `data/muxTrailers.ts` with your Mux playback IDs if you plan to demo the `/voice` route.

## Usage

- `npm run dev` – Start the Next.js dev server.
- Visit [http://localhost:3000/food/concierge](http://localhost:3000/food/concierge) to try the Food Court agent. It will:
  - Call `getUserContext` on the first turn to ground preferences and recent orders.
  - Ask for the current city/delivery area before searching.
  - Use `searchRestaurants` + `recommendShortlist` to present conversational summaries (“three spots open: Sabor Colombiano Kitchen stays open until 9:30…”).
  - Log order intent and feedback only after explicit acknowledgements.
- Visit [http://localhost:3000/voice](http://localhost:3000/voice) to compare the MovieNite legacy experience.

## Testing & Observability

- `scripts/test-chat.js` and `scripts/smoke-chat.js` simulate chat flows.
- The concierge logs tool executions in the UI, helping verify HITL approvals and speech outputs.
- Voice status indicators help debug microphone permissions and transcription state.

## Contributing Notes

- Keep Supabase schema and sample data aligned when adding new restaurant attributes.
- Update the Food Court system prompt (`app/api/food-chat/route.ts`) when introducing new policies or tool sequences.
- Maintain fallback data so the demo remains useful without Supabase credentials.

## License

MIT – see [LICENSE](LICENSE) for details.