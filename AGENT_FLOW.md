# Agent Voice Workflow Alignment

## Current Observation
- Realtime STT establishes WebRTC channels successfully but can hang on "Connecting microphone" if a previous session remains open.
- Speech is transcribed, yet the concierge occasionally ignores the scripted Netflix flow and responds generically (e.g., "I’m only here to translate spoken word") because GPT-4o is not consistently executing the planned tool sequence.
- Typed interactions still follow the correct AI SDK workflow (context fetch → genre → nostalgia → recommendations → preview/playback HITL cards).

## Guiding Principles
1. **Division of responsibility**
   - OpenAI Realtime: speech-to-text only (no decision-making).
   - AI SDK (chat route + tools): orchestrate the Netflix concierge logic with HITL approvals.
2. **Deterministic flow**
   - The concierge must execute the script we already verified in text mode.
   - Voice input should behave identically by feeding the same transcript into the existing pipeline.
3. **Observability first**
   - Echo transcripts in the UI so we can confirm exactly what was sent.
   - Log tool execution clearly to verify the flow and pinpoint regressions quickly.

## Action Plan

### 1. Simplify Voice Capture
- Replace WebRTC Realtime with a MediaRecorder-based flow that records short clips and uploads to `/api/openai/transcribe`.
- Surface partial status updates (“Listening…”, “Processing…”) and show transcripts once returned.
- Keep permissions and pre-flight indicators so users can diagnose mic issues quickly.

### 2. Guard the Concierge Workflow
- Keep the strengthened system prompt and conversation-state guard in `app/api/chat/route.ts` so the scripted Netflix flow runs whether input arrives via text or transcription.
- Log each phase transition (context fetch, recommendations, preview/playback) so regressions are easy to spot.

### 3. Maintain HITL Controls
- Leave approval cards for `playPreview` / `startPlayback` untouched; voice and text paths funnel into the same AI SDK logic.
- Ensure the sidebar (Mux preview + playback status) updates after approvals arrive.

### 4. Regression Test Scenarios
- Scenario A: voice request → genre → nostalgia → preview approval → playback approval.
- Scenario B: voice request with decline path to alternate recommendations.
- Scenario C: purely typed flow to confirm parity.

### 5. Documentation & Follow-up
- Update `PROJECT_PLAN.md` with the new audio transcription architecture (done).
- Note residual risks (long recordings, background noise) and possible future enhancements (auto VAD, chunked uploads).

Next step: integrate the MediaRecorder + transcription API implementation, validate both voice and typed parity, then capture learnings in the project docs.
