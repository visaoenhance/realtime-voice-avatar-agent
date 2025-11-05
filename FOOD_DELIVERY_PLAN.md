## Food Court Voice Concierge Plan

### 1. Project Overview
- **Goal**: Reimagine the existing Netflix voice concierge experience for a food delivery marketplace called `Food Court`, inspired by DoorDash/UberEats.
- **Motivation**: Leverage learnings from the MovieNite demo to quickly bootstrap a food discovery and order-assistance template without touching the current codebase.
- **Primary Personas**: Returning customers browsing on TV/tablet, looking for quick meal decisions within closing windows.
- **Core Capabilities**: Rich restaurant tiles, scrollable browsing, conversational search/ordering, preference tuning, and homepage personalization.

### 2. High-Level Experience Flow
- **Browse Tiles**: Display restaurant tiles (images, cuisine tags, distance, rating, delivery ETA) similar to the Netflix row UX.
- **Voice Concierge Entry**: User invokes the agent (“Hey Food Court”) to request meal ideas or help ordering.
- **Conversational Discovery**: Agent narrows down choices by cuisine, dietary preferences, location radius, and closing times.
- **Selection & Confirmation**: Agent presents 3–5 short-listed restaurants (closing within an hour when possible), handles follow-up questions, and confirms the selection.
- **Order Assistance**: Offer to proceed to checkout or continue browsing; optionally hand-off to manual workflow if the user wants to review cart details.
- **Preference & Homepage Updates**: Agent can update saved cuisines, budget ranges, and rearrange homepage rows to emphasize likely picks.

### 3. Data Model Considerations
- **Profiles**: Extend household profile with food-specific preferences (dietary tags, favorite cuisines, spice tolerance, budget, past orders).
- **Restaurants**: Include cuisine taxonomy (Latin → Mexican/Caribbean/etc.), operating hours, delivery coverage, prep time, dynamic availability.
- **Menu Highlights**: Key dishes per restaurant, hero images, pricing, healthy indicators.
- **Order History**: Track last N orders with cuisine, spend, satisfaction rating, feedback comments.
- **Homepage Layout**: Store tile groupings (e.g., `Top Picks`, `Closing Soon`, `Healthy Staples`) and sorting rules for quick re-rendering.
- **Voice Session Logs**: Persist transcripts + decisions for analytics and personalization tuning.

### 4. Agent Workflow Design
- **Intent Detection**: Distinguish between `discover_meal`, `reorder_favorite`, `update_preferences`, `modify_homepage`, `checkout_assistance`.
- **Clarifying Questions**: Leverage history tags (healthy, thai, indian, latin) to suggest follow-up prompts; confirm cuisine narrowing (e.g., “Latin → Caribbean”).
- **Search & Filtering**: Query data service for restaurants matching cuisine, open status, near closing, and preference weights.
- **Result Narration**: Summarize each option with cuisine type, standout dish, closing time, and ETA. Limit to 5 and ask for a choice.
- **Decision Handling**: On selection, log the decision, confirm, and branch to checkout or preference tweaks.
- **Preference Management**: Offer to pin favorites, remove cuisines, adjust spicy level, toggle healthy bias.
- **Homepage Reconfiguration**: Trigger layout updates to surface relevant tiles first (e.g., reorder rows to highlight Caribbean options).

### 5. OpenAI Data Pipelines
- **System Prompt**: Reframe concierge persona (“You are the Food Court Voice Concierge for …”) with brand voice, fallback behavior, and preference summarization.
- **Tool Invocation**: Mirror existing `processToolCalls` pattern; tools include fetching context, searching restaurants, updating preferences, updating homepage layout, logging feedback.
- **Context Packaging**: Provide structured snippets (profile, recent orders, restaurant summaries) in the prompt to reduce hallucinations.
- **Guardrails**: Enforce clarifying questions when intent is ambiguous; ensure confirmation before checkout actions.
- **Telemetry**: Capture token usage and tool-call sequences for later optimization.

### 6. Data Actions
- **`fetchHouseholdContext`**: Return food preferences, recent orders with cuisines (healthy, thai, indian, latin).
- **`searchRestaurants`**: Accept filters for cuisine group, sub-cuisine (e.g., Caribbean), closing window, budget; returns top matches.
- **`recommendShortlist`**: Curate the 5-option response with supporting data (closing time, ratings).
- **`updatePreferences`**: Persist favorite cuisines, dietary tags, delivery notes.
- **`updateHomepageLayout`**: Adjust tile rows (e.g., focus on Caribbean, hide low-signal rows).
- **`logOrderIntent` / `logFeedback`**: Capture decisions, satisfaction, and follow-up suggestions.

### 7. Navigation Actions
- **Tile Navigation**: Scroll to rows like `Top Caribbean`, `Healthy Staples`, `Closing Soon`; highlight tiles when referenced in conversation.
- **Detail View Launch**: Open restaurant detail pane with menu previews upon request.
- **Cart/Checkout Transition**: Navigate to checkout screen with selected restaurant and recommended dishes.
- **Preference Settings**: Jump to a settings pane when modifying cuisine or dietary filters.
- **Homepage Refresh**: Trigger visual refresh after layout changes to reflect updated rows.

### 8. Conversation Sample
1. User: “Help me find something to eat.”
2. Agent: “Sure, based on your recent orders you’ve enjoyed healthy, Thai, Indian, and Latin dishes. Any of those sound right?”
3. User: “Let’s do Latin.”
4. Agent: “Latin can mean Mexican, Caribbean, and more. What sounds good?”
5. User: “Caribbean.”
6. Agent: “Great. Here are five Caribbean spots that are still open and close within the hour: … Which one should I pull up?”
7. User: “Let’s do Island Breeze.”
8. Agent: “Island Breeze it is. Want me to proceed to checkout or keep browsing similar spots?”

### 9. Assets & References
- **Screenshots**: Add the provided UberEats inspiration image to `docs/assets/food-court-homepage.png`. Capture key cues: horizontal cuisine chips, promo cards above the fold, and restaurant rows with delivery fee, rating, ETA, and promo badges.
- **Design System**: Reuse tile dimensions, typography, and animation cues from the Netflix template while updating palette and iconography for Food Court branding.
- **Look & Feel Summary**: Document hero promotional cards with CTA buttons plus sections like `Featured on Uber Eats` and `Places you might like`; each restaurant tile shows imagery, rating, delivery fee, and time estimates—mirror this hierarchy in Food Court rows.

### 10. Implementation Roadmap
- **Phase 1**: Clone repo → establish Food Court branding → update system prompts and data seeds.
- **Phase 2**: Implement restaurant data model & Supabase schema updates; populate sample restaurants (focus on Caribbean subset).
- **Phase 3**: Build agent tools (`searchRestaurants`, `updatePreferences`, `updateHomepageLayout`).
- **Phase 4**: Integrate voice concierge UX, rehearse conversation flows, and update navigation actions.
- **Phase 5**: QA conversational scenarios (discovery, checkout, preference updates) and document deployment steps.

### 11. Next Steps
- Document required Supabase tables and sample seeds mirroring `mvnte_*` structure.
- Prepare migration script to copy baseline components from MovieNite to Food Court.
- Curate sample restaurant data (Latin/Caribbean emphasis) with operating hours for “closing soon” logic.
- Outline test cases covering intent routing, shortlist generation, and homepage refresh behavior.

### 12. Code Reuse Reference Points
- **System Prompt Pattern**: Mirror the system directive structure defined for MovieNite, swapping title-specific rules for cuisine discovery, shortlist narration, and checkout confirmation.

```15:40:app/api/chat/route.ts
const systemPrompt = `You are the Netflix Voice Concierge for Emilio and Ida. Stay warm, concise, and always keep humans in control.

Key directives:
- Wait for the household to speak first. If there is no user content yet, do not start the conversation.
- Immediately after the first user request, call 'getUserContext' and reference their preferences in your reply.
// ... existing code ...
- Voice-first reminders:
- Keep responses under three short sentences unless the household directly asks for detail.
- Preface tool-driven steps with clear choices: offer preview vs play now vs other options.
- Acknowledge confirmations verbally even while tools run, but never claim success until approval is captured.`
```

- **Context Fetching & Tool Execution**: Reuse the `fetchHouseholdContext` pattern to hydrate Food Court responses with Supabase-backed preferences and recent activity, replacing genre logic with cuisine/order data.

```399:434:app/api/chat/tools.ts
async function fetchHouseholdContext() {
  if (!supabase) {
    return {
      profile: {
        primaryViewer: 'Emilio',
        partnerName: 'Ida',
      },
      preferences: ['Action', 'Fantasy', 'Sci-Fi', 'Martial Arts'],
      comfort: ['Planet of the Apes (1968)', 'The Matrix', 'Crouching Tiger, Hidden Dragon'],
      parental: 'No parental controls configured yet.',
    };
  }

  const [preferences, parental, history] = await Promise.all([
    fetchPreferences(),
    fetchControls(),
    fetchHistory(),
  ]);

  const genrePrefs = preferences.filter(pref => pref.type === 'genre').map(pref => pref.value);
  const actorPrefs = preferences.filter(pref => pref.type === 'actor').map(pref => pref.value);
  const recentTitles = history.slice(0, 3).map(entry => entry.title.name);

  const parentalSummary = parental
    ? `Max rating ${parental.max_rating ?? 'R'}${
        parental.blocked_genres && parental.blocked_genres.length > 0
          ? `, blocking ${parental.blocked_genres.join(', ')}`
          : ''
      }`
    : 'No parental controls configured yet.';

  return {
    preferences: [...genrePrefs, ...actorPrefs],
    comfort: recentTitles,
    parental: parentalSummary,
  };
}
```

- **Homepage Refresh Workflow**: Adapt the layout update utilities (e.g., `updateProfileLayout`) to drive restaurant row ordering and promotional slots.
- **Voice UX Hooks**: Carry over `hooks/useAssistantSpeech.ts` and related utilities to maintain consistent microphone controls and transcription flows.

### 13. Scaffolding Pseudocode

```ts
// server/app/api/food-chat/route.ts
import { processToolCalls } from '../shared/processToolCalls';
import { foodTools } from './tools';
import { streamText } from 'ai';

const foodCourtSystemPrompt = `You are the Food Court Voice Concierge for the Rivera household. Stay helpful, confirm every order step, and surface restaurants that match their cravings.`;

export async function POST(request: Request) {
  const { messages } = await request.json();
  return streamText({
    model: 'gpt-4o-mini',
    system: foodCourtSystemPrompt,
    messages,
    tools: foodTools,
    onToolCall: processToolCalls,
  });
}

// server/app/api/food-chat/tools.ts
export const foodTools = {
  getUserContext: async () => fetchFoodContext(),
  searchRestaurants: async ({ cuisine, closesWithinMinutes, locationBounds }) => {
    const candidates = await db.searchRestaurants({ cuisine, closesWithinMinutes, locationBounds });
    return candidates.slice(0, 5);
  },
  updatePreferences: async payload => db.updatePreferences(payload),
  updateHomepageLayout: async layout => updateRestaurantRows(layout),
  logOrderIntent: async info => analytics.logOrderIntent(info),
};

async function fetchFoodContext() {
  const profile = await supabase.from('fc_profiles').select('*').single();
  const history = await supabase
    .from('fc_orders')
    .select('restaurant_name,cuisine,closed_at,created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  return {
    profile,
    preferences: profile.favorite_cuisines,
    orderHistory: history.map(order => ({
      restaurant: order.restaurant_name,
      cuisine: order.cuisine,
      closedAt: order.closed_at,
    })),
  };
}

// ui/components/FoodTiles.tsx
export function FoodTiles({ rows }: { rows: FoodTileRow[] }) {
  return (
    <div>
      {rows.map(row => (
        <section key={row.id}>
          <header>{row.title}</header>
          <HorizontalScroller>
            {row.tiles.map(tile => (
              <RestaurantTile key={tile.id} {...tile} />
            ))}
          </HorizontalScroller>
        </section>
      ))}
    </div>
  );
}
```

**Scaffolding Notes**
- Maintain the MovieNite server entry-point structure while swapping to a `food-chat` namespace so existing middleware and streaming logic carry over.
- Map Supabase table names (`mvnte_*`) to `fc_*` equivalents (`fc_profiles`, `fc_restaurants`, `fc_orders`, `fc_layouts`) to keep data-access layers predictable.
- UI layer reuses carousel components from the Netflix template but surfaces restaurant metadata, offer badges, and closing-time alerts derived from the new dataset.

### 14. Copy/Paste Kickoff Prompt
- Use the following prompt in the new Food Court repo to align the agent assistant on this plan:

```
You are migrating the MovieNite voice concierge template into a new food-delivery experience called Food Court.

1. Read `/FOOD_DELIVERY_PLAN.md` in this repo and summarize each section (overview, data model, workflows, OpenAI pipelines, data actions, navigation actions, assets, roadmap, reuse references, pseudocode).
2. Identify which existing Netflix components should be reused or adapted, citing file paths (e.g., `app/api/chat/route.ts`, `app/api/chat/tools.ts`, `hooks/useAssistantSpeech.ts`).
3. Produce a step-by-step implementation checklist that respects the plan’s phases and notes required Supabase schema/table changes (`fc_profiles`, `fc_restaurants`, `fc_orders`, `fc_layouts`).
4. Highlight any open questions or assumptions about restaurant data, closing-time logic, or checkout flows that need clarification before building.

Respond with a concise briefing and the checklist so the team can begin execution immediately.
```
