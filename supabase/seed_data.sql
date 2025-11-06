-- MovieNite supplemental seed data
-- Run after schema.sql to enrich the demo catalog without disturbing the base schema.

-- Additional titles covering more genres for fuller carousels
insert into mvnte_titles (slug, name, genres, cast_members, year, nostalgic, maturity_rating, hero_backdrop, hero_description)
values
  ('arrival-2016', 'Arrival', '{"sci-fi","drama"}', '{"Amy Adams","Jeremy Renner"}', 2016, false, 'PG-13', 'https://images.unsplash.com/photo-1501703979959-797917eb21c8?auto=format&fit=crop&w=1600&q=80', 'A linguist races to communicate with visiting aliens before tensions escalate.'),
  ('blade-runner-1982', 'Blade Runner', '{"sci-fi","neo-noir"}', '{"Harrison Ford","Rutger Hauer"}', 1982, true, 'R', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80', 'A weary detective hunts rogue replicants across a neon-soaked future Los Angeles.'),
  ('the-fifth-element-1997', 'The Fifth Element', '{"sci-fi","action"}', '{"Bruce Willis","Milla Jovovich"}', 1997, true, 'PG-13', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80', 'A cab driver becomes humanity’s unlikely savior with the help of a mysterious supreme being.'),
  ('dune-2021', 'Dune', '{"sci-fi","adventure"}', '{"Timothée Chalamet","Zendaya"}', 2021, false, 'PG-13', 'https://images.unsplash.com/photo-1529927066849-17d1d4e5a97d?auto=format&fit=crop&w=1600&q=80', 'Paul Atreides faces destiny on the desert planet Arrakis amidst warring noble houses.'),
  ('edge-of-tomorrow-2014', 'Edge of Tomorrow', '{"sci-fi","action"}', '{"Tom Cruise","Emily Blunt"}', 2014, false, 'PG-13', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1600&q=80', 'A soldier relives the same battle against alien invaders, perfecting his strategy each reset.'),
  ('akira-1988', 'Akira', '{"anime","sci-fi"}', '{"Mitsuo Iwata","Nozomu Sasaki"}', 1988, true, 'R', 'https://images.unsplash.com/photo-1447433819943-74a20887a81e?auto=format&fit=crop&w=1600&q=80', 'In Neo-Tokyo, a biker’s latent psychic powers threaten to destabilize the city.'),
  ('guardians-2014', 'Guardians of the Galaxy', '{"sci-fi","comedy"}', '{"Chris Pratt","Zoe Saldana"}', 2014, false, 'PG-13', 'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=1600&q=80', 'Misfit heroes band together to protect a mysterious orb—and the galaxy itself.'),
  ('moonlight-2016', 'Moonlight', '{"drama"}', '{"Trevante Rhodes","Mahershala Ali"}', 2016, false, 'R', 'https://images.unsplash.com/photo-1522778526097-0a03a6b9409b?auto=format&fit=crop&w=1600&q=80', 'A young man reckons with identity and connection across three defining chapters of his life.'),
  ('everything-everywhere-2000s', 'Everything Everywhere: Director’s Cut', '{"sci-fi","comedy"}', '{"Michelle Yeoh","Stephanie Hsu"}', 2023, false, 'R', 'https://images.unsplash.com/photo-1528763380143-65b3ac0575b9?auto=format&fit=crop&w=1600&q=80', 'An expanded edit of the multiverse odyssey packed with bonus gags and heart.'),
  ('enter-the-dragon-1973', 'Enter the Dragon', '{"martial-arts","action"}', '{"Bruce Lee","John Saxon"}', 1973, true, 'R', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1600&q=80', 'A martial artist infiltrates a crime lord’s island tournament to seek justice.'),
  ('house-of-flying-daggers-2004', 'House of Flying Daggers', '{"martial-arts","romance"}', '{"Zhang Ziyi","Takeshi Kaneshiro"}', 2004, false, 'PG-13', 'https://images.unsplash.com/photo-1499678329028-101435549a4e?auto=format&fit=crop&w=1600&q=80', 'An undercover officer’s mission becomes tangled with love and loyalty in the Tang dynasty.'),
  ('the-raid-2011', 'The Raid: Redemption', '{"martial-arts","thriller"}', '{"Iko Uwais","Joe Taslim"}', 2011, false, 'R', 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1600&q=80', 'An elite unit fights floor by floor through a crime boss’s high-rise fortress.'),
  ('kubo-and-the-two-strings-2016', 'Kubo and the Two Strings', '{"fantasy","family"}', '{"Art Parkinson","Charlize Theron"}', 2016, false, 'PG', 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80', 'A young storyteller wields a magical shamisen to reunite with his family.'),
  ('princess-mononoke-1997', 'Princess Mononoke', '{"anime","fantasy"}', '{"Yōji Matsuda","Yuriko Ishida"}', 1997, true, 'PG-13', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80', 'A prince caught between humans and forest spirits fights for balance.'),
  ('coherence-2013', 'Coherence', '{"sci-fi","thriller"}', '{"Emily Baldoni","Maury Sterling"}', 2013, false, 'NR', 'https://images.unsplash.com/photo-1505685296765-3a2736de412f?auto=format&fit=crop&w=1600&q=80', 'Dinner party friends face reality-bending chaos after a comet passes overhead.'),
  ('raya-and-the-last-dragon-2021', 'Raya and the Last Dragon', '{"fantasy","adventure"}', '{"Kelly Marie Tran","Awkwafina"}', 2021, false, 'PG', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1600&q=80', 'A guardian warrior seeks the last dragon to unite her fractured kingdom.'),
  ('knives-out-2019', 'Knives Out', '{"mystery","comedy"}', '{"Daniel Craig","Ana de Armas"}', 2019, false, 'PG-13', 'https://images.unsplash.com/photo-1542206395-9feb3edaa68c?auto=format&fit=crop&w=1600&q=80', 'A master detective untangles a wealthy family’s secrets after a death in the manor.')
on conflict (slug) do update
set
  genres = excluded.genres,
  cast_members = excluded.cast_members,
  year = excluded.year,
  nostalgic = excluded.nostalgic,
  maturity_rating = excluded.maturity_rating,
  hero_backdrop = excluded.hero_backdrop,
  hero_description = excluded.hero_description;

-- Expand the demo viewing history to fuel personalization
with ranked_history as (
  select
    t.id as title_id,
    timezone('utc', now()) - (row_number() over (order by t.slug)) * interval '3 days' as watched_at,
    (array[5,4,5,3])[((row_number() over (order by t.slug)) - 1) % 4 + 1] as rating
  from mvnte_titles t
  where t.slug in (
    'arrival-2016',
    'blade-runner-1982',
    'the-fifth-element-1997',
    'edge-of-tomorrow-2014',
    'akira-1988',
    'enter-the-dragon-1973',
    'house-of-flying-daggers-2004',
    'guardians-2014',
    'princess-mononoke-1997',
    'knives-out-2019'
  )
)
insert into mvnte_view_history (id, profile_id, title_id, watched_at, rating)
select
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  r.title_id,
  r.watched_at,
  r.rating
from ranked_history r
where not exists (
  select 1
  from mvnte_view_history existing
  where existing.profile_id = '00000000-0000-0000-0000-000000000001'
    and existing.title_id = r.title_id
);

with ranked_history as (
  select
    t.id as title_id,
    timezone('utc', now()) - (row_number() over (order by t.slug)) * interval '3 days' as watched_at,
    (array[5,4,5,3])[((row_number() over (order by t.slug)) - 1) % 4 + 1] as rating
  from mvnte_titles t
  where t.slug in (
    'arrival-2016',
    'blade-runner-1982',
    'the-fifth-element-1997',
    'edge-of-tomorrow-2014',
    'akira-1988',
    'enter-the-dragon-1973',
    'house-of-flying-daggers-2004',
    'guardians-2014',
    'princess-mononoke-1997',
    'knives-out-2019'
  )
)
update mvnte_view_history vh
set watched_at = r.watched_at,
    rating = r.rating
from ranked_history r
where vh.profile_id = '00000000-0000-0000-0000-000000000001'
  and vh.title_id = r.title_id;

-- Reinforce preferences for new genres and actors surfaced in the layout
with new_prefs as (
  select * from (values
    ('genre', 'anime', 3),
    ('genre', 'neo-noir', 2),
    ('genre', 'family', 1),
    ('actor', 'Michelle Yeoh', 4),
    ('actor', 'Bruce Lee', 2)
  ) as v(pref_type, pref_value, pref_weight)
)
insert into mvnte_preferences (id, profile_id, type, value, weight)
select
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  pref_type,
  pref_value,
  pref_weight
from new_prefs np
where not exists (
  select 1 from mvnte_preferences existing
  where existing.profile_id = '00000000-0000-0000-0000-000000000001'
    and existing.type = np.pref_type
    and existing.value = np.pref_value
);

update mvnte_preferences p
set weight = v.pref_weight
from (
  values
    ('genre', 'anime', 3),
    ('genre', 'neo-noir', 2),
    ('genre', 'family', 1),
    ('actor', 'Michelle Yeoh', 4),
    ('actor', 'Bruce Lee', 2)
) as v(pref_type, pref_value, pref_weight)
where p.profile_id = '00000000-0000-0000-0000-000000000001'
  and p.type = v.pref_type
  and p.value = v.pref_value;

-- Optional: gentle parental control tweak for demo variety
update mvnte_parental_controls
set max_rating = 'R', updated_at = timezone('utc', now())
where profile_id = '00000000-0000-0000-0000-000000000001';

-- Food Court demo seed data ---------------------------------------------

insert into fc_profiles (id, household_name, default_layout, current_layout)
values (
  '00000000-0000-0000-0000-0000000000fc',
  'Rivera Household',
  '{
    "hero": {
      "title": "Island Breeze Caribbean",
      "subtitle": "Dinner in under 40 minutes",
      "description": "Need something bold and still open? Ask the concierge to line up Caribbean spots, healthy bowls, or grab-and-go favorites tonight.",
      "cta": "Ask Food Court Concierge",
      "backdrop": "https://images.unsplash.com/photo-1604908176970-ef3ee68c1801?auto=format&fit=crop&w=1600&q=80"
    },
    "rows": [
      {
        "title": "Closing Soon Caribbean",
        "tiles": [
          { "title": "Island Breeze Caribbean", "tag": "Closes in 45 min", "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80" },
          { "title": "Sabor Latino Cantina", "tag": "Free Chips Tonight", "image": "https://images.unsplash.com/photo-1606755962773-0e7d4be90a77?auto=format&fit=crop&w=1200&q=80" }
        ]
      },
      {
        "title": "Healthy Staples",
        "tiles": [
          { "title": "Green Garden Bowls", "tag": "ETA 24 min", "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80" },
          { "title": "Harvest & Hearth", "image": "https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=1200&q=80" }
        ]
      },
      {
        "title": "Comfort Favorites",
        "tiles": [
          { "title": "Noodle Express", "tag": "2 for $20", "image": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80" },
          { "title": "Brick Oven Slice", "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80" }
        ]
      }
    ]
  }'::jsonb,
  null
)
on conflict (id) do update set
  household_name = excluded.household_name,
  default_layout = excluded.default_layout,
  default_location = jsonb_build_object(
    'city', coalesce(fc_profiles.default_location->>'city', 'Orlando'),
    'state', coalesce(fc_profiles.default_location->>'state', 'FL'),
    'lat', coalesce((fc_profiles.default_location->>'lat')::numeric, 28.538336),
    'lng', coalesce((fc_profiles.default_location->>'lng')::numeric, -81.379234)
  );

insert into fc_preferences (
  id,
  profile_id,
  favorite_cuisines,
  disliked_cuisines,
  dietary_tags,
  spice_level,
  budget_range,
  notes
)
values (
  '00000000-0000-0000-0000-0000000001fc',
  '00000000-0000-0000-0000-0000000000fc',
  '{"caribbean","thai","indian"}',
  '{"fried"}',
  '{"healthy","high-protein"}',
  'medium',
  'standard',
  'Prefers options that arrive under 40 minutes.'
)
on conflict (id) do update set
  favorite_cuisines = excluded.favorite_cuisines,
  disliked_cuisines = excluded.disliked_cuisines,
  dietary_tags = excluded.dietary_tags,
  spice_level = excluded.spice_level,
  budget_range = excluded.budget_range,
  notes = excluded.notes,
  updated_at = timezone('utc', now());

with inserted_restaurants as (
  insert into fc_restaurants (
    slug,
    name,
    cuisine_group,
    cuisine,
    dietary_tags,
    price_tier,
    rating,
    eta_minutes,
    closes_at,
    delivery_fee,
    standout_dish,
    promo,
    hero_image,
    address,
    phone,
    highlights
  )
  values
    (
      'island-breeze-caribbean',
      'Island Breeze Caribbean',
      'latin',
      'caribbean',
      '{"gluten-free","spicy"}',
      'medium',
      4.7,
      32,
      timezone('utc', now()) + interval '45 minutes',
      2.49,
      'Jerk Chicken with Pineapple Slaw',
      'Free delivery over $30',
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=80',
      '135 Island Breeze Ave, Orlando, FL',
      '407-555-0134',
      '{"Closes in under an hour","Signature jerk marinades","Combo-friendly sides"}'
    ),
    (
      'sabor-latino-cantina',
      'Sabor Latino Cantina',
      'latin',
      'mexican',
      '{"gluten-free"}',
      'low',
      4.5,
      28,
      timezone('utc', now()) + interval '90 minutes',
      1.99,
      'Al Pastor Tacos',
      '15% off tonight',
      'https://images.unsplash.com/photo-1606755962773-0e7d4be90a77?auto=format&fit=crop&w=1600&q=80',
      '205 Fiesta Blvd, Orlando, FL',
      '407-555-0142',
      '{"House-made tortillas","Family bundle specials","Late-night bites"}'
    ),
    (
      'green-garden-bowls',
      'Green Garden Bowls',
      'healthy',
      'plant-forward',
      '{"vegetarian","gluten-free"}',
      'medium',
      4.8,
      24,
      timezone('utc', now()) + interval '60 minutes',
      0,
      'Caribbean Quinoa Bowl',
      'BOGO 50% off bowls',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1600&q=80',
      '47 Fresh Market Way, Winter Park, FL',
      '407-555-0110',
      '{"Build-your-own bowl","Juice cleanse add-ons","Macro-friendly portions"}'
    ),
    (
      'harvest-hearth-kitchen',
      'Harvest & Hearth Kitchen',
      'healthy',
      'farm-to-table',
      '{"vegetarian"}',
      'high',
      4.6,
      38,
      timezone('utc', now()) + interval '70 minutes',
      4.5,
      'Roasted Squash Grain Bowl',
      'Free dessert with orders over $40',
      'https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=1600&q=80',
      '892 Hearthstone Ave, Maitland, FL',
      '407-555-0188',
      '{"Seasonal produce","Chef-curated pairings","Craft mocktails"}'
    ),
    (
      'noodle-express',
      'Noodle Express',
      'asian',
      'thai',
      '{"spicy"}',
      'medium',
      4.4,
      35,
      timezone('utc', now()) + interval '110 minutes',
      3.25,
      'Drunken Noodles',
      '2 entrees for $20',
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1600&q=80',
      '512 Spice Lane, Altamonte Springs, FL',
      '407-555-0165',
      '{"Hand-pulled noodles","Late-night happy hour","Thai iced tea combos"}'
    ),
    (
      'brick-oven-slice',
      'Brick Oven Slice',
      'comfort',
      'pizza',
      '{"vegetarian"}',
      'low',
      4.2,
      29,
      timezone('utc', now()) + interval '120 minutes',
      1.5,
      'Grandma Square Pie',
      'Family meal $24.99',
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=80',
      '75 Brickstone Plaza, Orlando, FL',
      '407-555-0177',
      '{"Wood-fired crust","By-the-slice classics","Overnight dough ferment"}'
    )
  on conflict (slug) do update set
    name = excluded.name,
    cuisine_group = excluded.cuisine_group,
    cuisine = excluded.cuisine,
    dietary_tags = excluded.dietary_tags,
    price_tier = excluded.price_tier,
    rating = excluded.rating,
    eta_minutes = excluded.eta_minutes,
    closes_at = excluded.closes_at,
    delivery_fee = excluded.delivery_fee,
    standout_dish = excluded.standout_dish,
    promo = excluded.promo,
    hero_image = excluded.hero_image,
    address = coalesce(excluded.address, fc_restaurants.address),
    phone = coalesce(excluded.phone, fc_restaurants.phone),
    highlights = excluded.highlights,
    updated_at = timezone('utc', now())
  returning id, slug, name, cuisine
)
select 1;

with restaurants as (
  select id, slug, name, cuisine from fc_restaurants
),
orders as (
  select r.id, r.slug, r.name, r.cuisine
  from restaurants r
  where r.slug in ('island-breeze-caribbean','green-garden-bowls','noodle-express')
)
insert into fc_orders (profile_id, restaurant_id, restaurant_name, cuisine, total, created_at, rating, satisfaction_notes)
select
  '00000000-0000-0000-0000-0000000000fc',
  o.id,
  o.name,
  o.cuisine,
  (array[32.75, 24.0, 18.5])[row_number() over (order by o.slug)],
  timezone('utc', now()) - (row_number() over (order by o.slug)) * interval '6 days',
  (array[5,4,5])[row_number() over (order by o.slug)],
  (array['Loved the ginger glaze','Great crunch, a bit light on sauce','Perfect spice level'])[row_number() over (order by o.slug)]
from orders o
where not exists (
  select 1 from fc_orders existing
  where existing.profile_id = '00000000-0000-0000-0000-0000000000fc'
    and existing.restaurant_id = o.id
);

with restaurants as (
  select id, slug from fc_restaurants where slug = 'island-breeze-caribbean'
)
insert into fc_layouts (profile_id, hero_restaurant_id, focus_row, demote_rows, highlight_cuisine)
select
  '00000000-0000-0000-0000-0000000000fc',
  r.id,
  'Closing Soon Caribbean',
  '{"Comfort Favorites"}',
  'caribbean'
from restaurants r
on conflict (profile_id) do update set
  hero_restaurant_id = excluded.hero_restaurant_id,
  focus_row = excluded.focus_row,
  demote_rows = excluded.demote_rows,
  highlight_cuisine = excluded.highlight_cuisine,
  updated_at = timezone('utc', now());

