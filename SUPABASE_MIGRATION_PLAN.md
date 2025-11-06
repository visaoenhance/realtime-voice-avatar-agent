## Food Court Supabase Checklist

### Environment Variables (`.env.local`)
- `OPENAI_API_KEY` — required for MovieNite and Food Court agents
- `SUPABASE_URL` — project URL with service role access enabled server-side
- `SUPABASE_ANON_KEY` — used on the client for real-time homepage updates (read only)
- `SUPABASE_SERVICE_ROLE_KEY` — used by server actions/tools for writes
- `DEMO_PROFILE_ID` — UUID for the seeded Food Court household (defaults to demo if omitted)

### Core Tables
- `fc_profiles`
  - `id uuid primary key`
  - `household_name text`
  - `default_layout jsonb`
  - `current_layout jsonb`
  - `updated_at timestamptz`

- `fc_preferences`
  - `profile_id uuid references fc_profiles(id) on delete cascade`
  - `favorite_cuisines text[]`
  - `disliked_cuisines text[]`
  - `dietary_tags text[]`
  - `spice_level text`
  - `budget_range text`
  - `notes text`
  - `updated_at timestamptz`
  - **unique constraint** on `profile_id` so the concierge can upsert preferences per household

- `fc_restaurants`
  - `id uuid primary key`
  - `slug text unique`
  - `name text`
  - `cuisine_group text` (e.g., latin, healthy)
  - `cuisine text` (e.g., caribbean)
  - `dietary_tags text[]`
  - `price_tier text` (low/medium/high)
  - `rating numeric`
  - `eta_minutes integer`
  - `closes_at timestamptz`
  - `delivery_fee numeric`
  - `standout_dish text`
  - `promo text`
  - `hero_image text`
  - `is_active boolean default true`

- `fc_orders`
  - `id uuid primary key`
  - `profile_id uuid references fc_profiles(id)`
  - `restaurant_id uuid references fc_restaurants(id)`
  - `restaurant_name text`
  - `cuisine text`
  - `total numeric`
  - `created_at timestamptz default now()`
  - `rating numeric`
  - `satisfaction_notes text`

- `fc_order_events`
  - `id uuid primary key`
  - `profile_id uuid`
  - `restaurant_id uuid`
  - `restaurant_name text`
  - `intent text` (browse/checkout/save/handoff)
  - `notes text`
  - `created_at timestamptz default now()`

- `fc_layouts`
  - `profile_id uuid references fc_profiles(id) primary key`
  - `hero_restaurant_id uuid`
  - `focus_row text`
  - `demote_rows text[]`
  - `highlight_cuisine text`
  - `updated_at timestamptz`

- `fc_feedback`
  - `id uuid primary key`
  - `profile_id uuid`
  - `sentiment text`
  - `notes text`
  - `created_at timestamptz default now()`

### Seed Data Ideas
- Insert Rivera household record into `fc_profiles`
- Seed `fc_preferences` with healthy/latin/medium spice defaults
- Populate `fc_restaurants` with curated Caribbean-heavy sample (match fallback constants)
- Add a handful of historical entries to `fc_orders` for conversational grounding
- Prime `fc_layouts` with baseline hero + row layout mirroring MovieNite structure

### Migration Ordering
1. Create schema and tables above
2. Seed baseline profile, preferences, restaurants, orders, layout
3. Ensure `fc_preferences` has `UNIQUE (profile_id)` (run `alter table fc_preferences add constraint fc_preferences_profile_id_key unique (profile_id);` if upgrading an older schema)
4. Grant RLS policies: allow service-role writes, anon read access to `fc_restaurants` & `fc_layouts`
5. Update Supabase SQL snippets for `fc_order_events` and `fc_feedback` to allow insert via service role

### Follow-Up
- Mirror the fallback sample data with real Supabase rows to keep experience consistent
- Expand `fc_restaurants` with additional cuisines once core Caribbean flow is validated
- Evaluate geographic filtering requirements before adding PostGIS extensions

