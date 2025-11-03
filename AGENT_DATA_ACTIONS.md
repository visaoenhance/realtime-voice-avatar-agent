# MovieNite Agent-Driven Data Actions

This document outlines the planned Supabase schema and voice-driven flows that allow the MovieNite concierge to personalize the home experience.

## Supabase Data Model

### 1. `profiles`
Represents the single demo household (no auth).
| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | Static UUID seeded in DB |
| primary_viewer | text | "Emilio" |
| partner_name | text | "Melissa" |
| language | text | Current concierge language hint (default `en`) |

### 2. `titles`
Dummy catalog the concierge can reference.
| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | |
| slug | text | e.g. `planet-of-the-apes-1968` |
| name | text | |
| genres | text[] | canonical genres (sci-fi, fantasy, etc.) |
| cast | text[] | |
| year | integer | |
| nostalgic | boolean | |
| maturity_rating | text | e.g. `PG-13` |

### 3. `view_history`
Tracks what the household watched last.
| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | |
| profile_id | uuid (FK profiles.id) | |
| title_id | uuid (FK titles.id) | |
| watched_at | timestamptz | |
| rating | integer | optional thumbs/up down |

### 4. `preferences`
Stores genre/actor affinity the concierge can lean on.
| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | |
| profile_id | uuid | |
| type | text | `genre` or `actor` |
| value | text | |
| weight | integer | optional ranking |

### 5. `parental_controls`
Defines content guardrails.
| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | |
| profile_id | uuid | |
| max_rating | text | e.g. `PG-13` |
| blocked_genres | text[] | |
| notes | text | optional |

## Voice Concierge Flows

### Flow A: Curate Home by History & Preferences
1. **Trigger** — user says: “Show me stuff like what I watch” (any language). Concierge explains it will refresh the home rows.
2. **Data actions**
   - Query `view_history` (recent 30 days) to determine top genres and actors.
   - Merge with `preferences` (weighted list).
   - Produce a home layout payload: hero pick + three rows (e.g., trending genre, actor spotlight, nostalgic favorites).
   - Persist an `homepage_layout` entry (optional) or return the structured payload inline for the UI.
3. **Confirmation** — concierge summarizes the new mix (e.g., “I lined up sci-fi adventures with Keanu Reeves at the top.”).
4. **Redirect offer** — “Want to see the refreshed homepage?” If user says yes → navigate to `/` with query `?layout=personalized`. The home page reads the query and loads the precomputed layout (Supabase fetch).

### Flow B: Apply Parental Controls
1. **Trigger** — user says: “Hide anything above PG-13.”
2. **Data actions**
   - Update `parental_controls` with `max_rating = 'PG-13'` (or adjust blocked genres).
   - Re-compute the home layout filtering `titles` by rating/blocked genres.
3. **Confirmation** — “Done. Everything above PG-13 is hidden.”
4. **Redirect offer** — same as Flow A.

### Implementation Notes
- Supabase client runs server-side (Next.js route handlers) to avoid exposing keys.
- Voice route calls helper endpoints: `/api/data/homepage` (GET) and `/api/data/homepage` (POST) to fetch/update layouts based on voice commands.
- Home page (`/`) checks for personalized layout via Supabase load or fallback to static tiles.
- For demo simplicity, we seed one profile + handful of titles via Supabase SQL script.

### Voice UX Additions
- Add tool definitions: `updateHomeLayout`, `updateParentalControls`, `getHomeLayout`.
- Concierge prompt: include instructions to call these tools instead of explaining logic in free text.
- Post-action prompt: always ask “Do you want to view the updated homepage now?” → if yes, send a UI event (tool result) that UI interprets as redirect.

### Open Questions
- Do we need to persist multiple layout versions (history)? For demo we plan to store only the latest.
- Should we animate the home page when redirected? Optional but could add polish.
- How granular should parental controls be? For now max rating + genre blacklist is enough.
- UI includes a manual “Reset Layout” button so we can revert to the seeded profile state during demos.

