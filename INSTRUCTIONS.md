## Human-in-the-Loop Template Playbook

This guide explains how to run, customize, and extend the backpack Human-in-the-Loop (HITL) flow built with the Vercel AI SDK. Use it as a template for future agent workflows that require human approval.

---

### 1. Environment & Tooling
- **Framework**: Next.js App Router (pages under `app/`)
- **AI SDK**: `@ai-sdk/react` + `ai` streaming utilities (v6+)
- **Model Provider**: OpenAI via `@ai-sdk/openai`
- **Styling**: Tailwind CSS (configured globally)
- **Testing**: Playwright script in `scripts/verify-form.js`

#### Required environment variables
Create `.env.local` (see `README.md` for commands) and set:
```
OPENAI_API_KEY=<your-key>
```

---

### 2. High-Level Flow
1. User interacts with the staged wizard UI in `app/page.tsx`.
2. `useChat` (with `DefaultChatTransport`) streams messages to `/api/chat`.
3. The API route (`app/api/chat/route.ts`) converts messages to model format and streams responses from OpenAI.
4. Tool calls are intercepted by `processToolCalls` (`app/api/chat/utils.ts`).
5. Tools that **lack** an `execute` implementation require human approval. The client surfaces approval UI for those calls.
6. Approved calls execute via handlers passed into `processToolCalls`; declined calls short-circuit with a user-visible message.
7. The Decision Tree sidebar reflects progress across intent detection, tool usage, approval, and completion stages.

---

### 3. Key Files & Responsibilities
- `app/page.tsx`
  - Manages staged conversation wizard (`intent`, `preference`, `zip`, `select`, `confirm`).
  - Syncs chat state via `useChat`, tracks stage responses, and controls the decision tree sidebar.
  - Derives dynamic backpack options from recent `searchLocalBackpacks` tool outputs.
  - Shows HITL “Thinking…” indicator, approval alerts, session summary, and mobile-friendly sidebar overlay.

- `app/api/chat/route.ts`
  - Implements `POST` handler returning `createUIMessageStreamResponse`.
  - Applies system prompt outlining the purchase flow.
  - Passes custom approval handler for `initiatePurchase` into `processToolCalls`.
  - Streams OpenAI output via `streamText`, capped with `stepCountIs(5)` to avoid runaway responses.

- `app/api/chat/tools.ts`
  - Defines `searchLocalBackpacks` (mock data) and `initiatePurchase` (approval-only) tool descriptors.
  - Uses Zod schemas for type safety and tool contract clarity.

- `app/api/chat/utils.ts`
  - Exposes `processToolCalls` to watch tool UI parts for approval decisions.
  - Publishes `APPROVAL` constants and `getToolsRequiringConfirmation` helper used on the client.

- `app/api/chat/types.ts`
  - Provides `HumanInTheLoopUIMessage` alias and `MyTools` interface used for generics.

- `scripts/verify-form.js`
  - Example Playwright smoke test that submits the wizard.

---

### 4. How HITL Is Enforced
1. **Mark tools requiring approval**: omit `execute` in the tool definition (e.g. `initiatePurchase`).
2. **Client detection**: `getToolsRequiringConfirmation` returns the set of tools without `execute`. `app/page.tsx` checks messages for pending approvals and disables input while awaiting decision.
3. **Approval UI**: When the server returns a tool call with `state: 'input-available'`, the frontend surfaces approve/decline buttons. User choice is sent back as tool output (`APPROVAL.YES` / `APPROVAL.NO`).
4. **Server handler**: `processToolCalls` waits for approval output. If `APPROVAL.YES`, it runs the supplied execute handler; if `APPROVAL.NO`, it responds with an error message to the model.

To add another approval step, define a tool without `execute`, update the `systemPrompt` to describe the decision, and pass an execute callback for the approval case into `processToolCalls` in `route.ts`.

---

### 5. User Experience Model
- **70/30 layout**: Chat wizard (70%) + Decision Tree sidebar (30%), responsive to mobile via overlay toggle.
- **Stage cards**: Only completed and active steps render; completed steps are greyed to show progress without overwhelming the user.
- **Auto-population**: Input boxes update when the user selects predefined options; no values are prefilled unless triggered by a selection, keeping demos organic.
- **Decision tree**: Displays labeled milestones and “Agent Flow” indicator whenever tool logic engages.
- **Session summary**: Appears after confirmation with a recap of each captured value and final action.
- **Fallback handling**: Negative responses (e.g. “No, show me other options”) reset later stages and instruct the model to re-offer inventory.

---

### 6. Adapting for New HITL Scenarios
1. **Define your flow**: Update `stageConfig` (labels, autofill hints, options) and adjust `systemPrompt` to describe the new domain.
2. **Add/replace tools**:
   - Implement mock or real integrations in `tools.ts`.
   - Maintain descriptive `inputSchema` / `outputSchema` for traceability.
3. **Customize approval logic**:
   - For new approval-required tools, leave `execute` undefined and extend `processToolCalls` configuration in `route.ts` with appropriate handler.
   - Extend UI to show context-specific approval prompts if needed.
4. **Update decision tree**: Modify the `conversationStages` memo and list to reflect new checkpoints.
5. **Revise summary**: Update `summaryItems` mapping to capture domain-specific highlights.
6. **Test**: Adjust or create additional Playwright tests under `scripts/` to cover the new flow.

Tip: keep business logic and tool wiring in the API layer; keep the UI declarative, reading from chat state rather than hardcoded sequences.

---

### 7. Troubleshooting Checklist
- **“Duplicate item found with id”**: Ensure each outbound user message uses a unique ID (handled automatically by `useChat`) and avoid manually injecting duplicate message IDs.
- **User input disabled**: Check for pending tool confirmations; the UI intentionally locks stages while approvals are outstanding.
- **No tool results**: Confirm the tool returns JSON with `options` array; the UI falls back to `DEFAULT_BACKPACK_CARDS` if parsing fails.
- **Model runaway**: Adjust `stopWhen: stepCountIs(n)` or limit prompt length to bound conversation depth.

---

### 8. References & Further Reading
- Vercel AI SDK Human-in-the-Loop Cookbook: https://ai-sdk.dev/cookbook/next/human-in-the-loop
- `@ai-sdk/react` documentation: https://ai-sdk.dev/reference/ai-sdk-react/use-chat
- `createUIMessageStream` API: https://ai-sdk.dev/reference/ai/create-ui-message-stream
- Tailwind CSS: https://tailwindcss.com/docs
- Playwright Testing: https://playwright.dev/docs/intro

---

### 9. Quick Start Commands
```bash
npm install
cp .env.example .env.local
# add OPENAI_API_KEY to .env.local
npm run dev
# open http://localhost:3000
```

Use this document to replicate the structure for other HITL agents—swap the tools, prompts, and stage configuration to match your workflow while reusing the approval logic and decision tree UX.

