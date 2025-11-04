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

