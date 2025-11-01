## Netflix HITL Voice Agent Project Plan

### Vision
- Deliver a conversational, voice-first interface that guides households through Netflix title discovery without traditional tile browsing.
- Maintain human control over critical actions (e.g., previews, playback) via human-in-the-loop (HITL) confirmations.
- Leverage Vercel AI SDK patterns for streaming UI, tool orchestration, and approvals.

### User Journey (Primary Scenario)
- Couple launches Netflix AI assistant.
- Assistant offers entry points: `Help me find something to watch`, `What has my favorite actor played in`, `Help me organize my preferences`.
- User selects "Help me find something to watch".
- Agent references stored preferences (Action, Fantasy, Sci-Fi, Martial Arts) and asks for current mood.
- User: "Sci-Fi." Agent probes for new vs. nostalgic.
- User: "Let's be nostalgic." Agent surfaces classic recommendations (e.g., 1960s *Planet of the Apes* options).
- User requests preview of first title; assistant issues HITL confirmation before executing preview.
- Preview plays with `Play Now` CTA; upon completion assistant checks for next steps.
- User accepts to watch; assistant requests confirmation, launches playback, closes loop with personalized note.

### High-Level Architecture
- **Frontend (Next.js App Router)**
  - Voice controls (microphone start/stop, real-time transcript).
  - Chat stream UI backed by `useChat` and `DefaultChatTransport`.
  - HITL components rendering tool-call confirmations using `addToolResult`.
  - Playback pane presenting preview video and call-to-action buttons.
  - Text-to-speech for assistant responses to maintain fully voice-driven experience.

- **Backend (Next.js Route Handlers)**
  - `/api/chat` wraps `createUIMessageStream` and `streamText` with OpenAI (target `gpt-4o`).
  - Tool registry with schema definitions (`listGenres`, `fetchRecommendations`, `playPreview`, `startPlayback`, `logFeedback`).
  - `processToolCalls` utility to block execution for tools missing `execute`, awaiting user consent.
  - Context enrichment utilities (preference store lookup, content metadata fetch).

- **External/Supporting Services**
  - Catalog metadata source (mock Netflix API or internal dataset).
  - Playback controller abstraction (stub or integration depending on environment).
  - Preference persistence (Supabase/Redis/Edge Config) storing profiles & watch history.

### Conversation Flow & HITL Touchpoints
1. Voice input captured → speech-to-text result sent as `user` message.
2. Assistant pulls context via `getUserContext` tool (auto-executed).
3. Recommendation candidate generation via `fetchRecommendations` tool.
4. User requests preview → backend emits tool call without execute.
5. Frontend renders confirmation card; upon `APPROVAL.YES`, executes `playPreview` and streams status.
6. Similar flow for `startPlayback` to ensure explicit consent.
7. Agent logs satisfaction via `logFeedback` tool after session closes.

### Data & Schema Considerations
- `UserProfile`: genres, nostalgia preference, favorite actors, recent watches.
- `Recommendation`: id, title, synopsis, runtime, release year, preview URI, nostalgia flag.
- `ToolCallResult`: status, timestamp, confirmation source, execution payload.
- Maintain consistent JSON schemas between frontend and backend to support type-safe `processToolCalls`.

### Technology Stack
- **Models**: OpenAI `gpt-4o` (dialog + tool calls); Whisper or Realtime API for speech recognition; TTS via OpenAI Realtime or compatible service.
- **Framework**: Next.js (App Router), TypeScript, React server components where beneficial.
- **UI Toolkit**: Tailwind CSS + shadcn/ui for dialogs and controls.
- **State Management**: `useChat` hook for conversation; session-level context in React; server-side preference store via edge functions.
- **Testing**: Playwright for conversational UI, Jest/Vitest for tool utilities.

### Security & Governance
- Store OpenAI API key in `.env.local`, access via `process.env`.
- Gate playback actions behind HITL approval; log approvals for auditability.
- Content rating guardrail to avoid inappropriate suggestions.

### Milestone Roadmap
1. **Environment Setup**
   - Clone repo, install dependencies, configure ENV secrets.
   - Verify baseline HITL example runs.

2. **Domain Modeling & Tooling**
   - Define TypeScript interfaces and Zod schemas for Netflix domain.
   - Implement catalog mock service and preference store adapter.
   - Build tool registry with HITL-aware utilities.

3. **Voice Interaction Layer**
   - Integrate speech-to-text and text-to-speech providers.
   - Create microphone control UI and streaming transcript component.

4. **Conversation Orchestration**
   - Implement scenario flow with branching prompts (genre choice, nostalgia).
   - Ensure tool call sequencing matches planned dialogue.

5. **Playback & Preview Experience**
   - Develop preview player component with HUD controls.
   - Confirm HITL approvals gate preview/playback actions.

6. **Testing & Validation**
   - Write integration tests covering approval flows.
   - Conduct usability pass for voice + confirmation UX.

### Next Actions
- Clone existing HITL baseline repo to this workspace.
- Install dependencies (`pnpm`/`npm`/`yarn` per repo).
- Configure `.env.local` with OpenAI credentials.
- Prototype initial conversational loop and HITL confirmation UI.

### Repository Assessment (Post-Clone)
- **Environment config**: `.env.local` not present; repository also lacks `.env.example`. Need to add guidance plus create `.env.local` with at least `OPENAI_API_KEY` before development.
- **Backend prompt/logic**: `app/api/chat/route.ts` still implements backpack shopping persona. Must replace `systemPrompt` and `processToolCalls` execution map with Netflix voice-agent flow (genre + nostalgia dialog, preview/playback HITL actions, gratitude outro).
- **Tool definitions**: `app/api/chat/tools.ts` exposes `searchLocalBackpacks` and `initiatePurchase`. Replace with Netflix-specific tools (`getUserContext`, `fetchRecommendations`, `playPreview`, `startPlayback`, `logFeedback`, etc.) and ensure HITL gating on preview/playback.
- **Types**: `app/api/chat/types.ts` typed for backpack use case; redefine types to cover new tool schemas and conversation messages.
- **Frontend experience**: `app/page.tsx` is a guided multi-step form for backpack purchasing. Redesign into voice-first assistant UI with microphone controls, streaming transcript, media preview pane, and HITL confirmation components tailored to preview/playback actions.
- **Utilities**: `processToolCalls` in `app/api/chat/utils.ts` is generic enough but may require minor enhancements (e.g., richer logging or typed execution mapping). `APPROVAL` constants remain reusable.
- **Documentation**: `README.md` references weather/backpack examples. Update to describe Netflix voice HITL scenario, setup steps (including new `.env.example`), and voice capabilities.

### Implementation Notes (Current Status)
- Added `.env.example` template and updated README/setup guidance for OpenAI configuration.
- Replaced backpack inventory tools with Netflix household context, recommendation, preview, playback, and feedback tools plus sample catalog metadata.
- Hardened the concierge system prompt to require the scripted flow: wait for the first user utterance, immediately load household preferences, constrain recommendations to the curated catalog, and mandate tool usage for preview/playback.
- Updated HITL routing logic with richer logging plus metadata hand-off so approved preview/playback calls surface Mux `playbackId`, posters, and guard-rail messaging when metadata is missing.
- Rebuilt the frontend into a voice-first interface with microphone controls, transcript display, confirmation cards, and media sidebar reflecting preview/playback state.
- Added optimistic voice echo + auto-scroll behaviour so spoken utterances appear in the chat feed immediately while the assistant replies stream underneath.
- Pivoted voice capture from WebRTC Realtime to a simpler MediaRecorder + OpenAI Transcription API loop (`/api/openai/transcribe`), keeping the AI SDK workflow unchanged while avoiding WebRTC flakiness.
- Added concise `speechSummary` strings to tool outputs so concierge TTS delivers short prompts while the UI retains full detail.
- Applied Netflix-inspired theming (palette, typography, header treatment) while relying on open-source fonts and custom styles rather than proprietary assets.
- Integrated Mux-based preview playback via `data/muxTrailers.ts` and a reusable `MuxPreviewPlayer` component for configurable trailers.

### Voice Enhancements Roadmap
- ✅ Replace the browser Web Speech API with server-side OpenAI transcription (MediaRecorder ➝ `/api/openai/transcribe` ➝ AI SDK chat).
  - Implemented a reusable `useAudioTranscription` hook that handles mic permissions, recording state, upload, and transcript delivery.
  - Added `/api/openai/transcribe` to call `gpt-4o-mini-transcribe`, keeping control in our workflow while avoiding WebRTC complexities.
- Enable spoken concierge responses for a fully conversational loop.
  - Continue using `/api/openai/speak` (`gpt-4o-mini-tts`) to synthesize audio for assistant messages with queueing + mute toggle.
  - Goal: allow end-to-end voice navigation—user speaks to the concierge, approvals gate actions, and the agent replies audibly unless muted.

### Voice Iteration TODOs
- ✅ Stabilize OpenAI TTS playback by queueing utterances, logging `audio.play()` failures, and avoiding abrupt stops when the user reopens the mic.
- ✅ Enforce English TTS output by passing `voice: 'alloy'` with `language: 'en'` and trimming speech to concise summaries before playback.
- ✅ Shorten spoken replies to the first ~3 sentences so confirmations are snappy while the full text remains in chat.
- ✅ Migrate speech capture to OpenAI transcription API (MediaRecorder → HTTP upload) with client-side status indicators.
- 🔄 Future: add optional on-device VAD (voice activity detection) to auto-stop listening when silence exceeds threshold, and persist transcript segments for quality review.

### Future Enhancements
- Multi-language conversation support
  - Allow the concierge to detect the user’s language (or let the user pick) and pass the appropriate locale to Realtime, GPT-4o, and TTS.
  - Surface translated or localized prompts/responses while preserving HITL controls.
  - Ensure playback voice matches the selected language/locale and update UI copy accordingly.

