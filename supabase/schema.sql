-- MovieNite demo schema
-- Tables are namespaced with mvnte_*

create extension if not exists "uuid-ossp";

drop table if exists mvnte_view_history cascade;
drop table if exists mvnte_preferences cascade;
drop table if exists mvnte_parental_controls cascade;
drop table if exists mvnte_titles cascade;
drop table if exists mvnte_profiles cascade;

create table if not exists mvnte_profiles (
  id uuid primary key,
  primary_viewer text not null,
  partner_name text,
  language text default 'en',
  default_layout jsonb,
  current_layout jsonb,
  updated_at timestamptz default timezone('utc', now())
);

create table if not exists mvnte_titles (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  genres text[] not null default '{}',
  cast_members text[] not null default '{}',
  year integer,
  nostalgic boolean default false,
  maturity_rating text default 'PG',
  hero_backdrop text,
  hero_description text
);

create table if not exists mvnte_view_history (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references mvnte_profiles(id) on delete cascade,
  title_id uuid references mvnte_titles(id) on delete cascade,
  watched_at timestamptz default timezone('utc', now()),
  rating integer
);

create table if not exists mvnte_preferences (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references mvnte_profiles(id) on delete cascade,
  type text not null check (type in ('genre','actor')),
  value text not null,
  weight integer default 1
);

create table if not exists mvnte_parental_controls (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references mvnte_profiles(id) on delete cascade,
  max_rating text default 'R',
  blocked_genres text[] default '{}',
  notes text,
  updated_at timestamptz default timezone('utc', now())
);

-- Seed data --------------------------------------------------------------

insert into mvnte_profiles (id, primary_viewer, partner_name, language, default_layout, current_layout)
values (
  '00000000-0000-0000-0000-000000000001',
  'Emilio',
  'Melissa',
  'en',
  '{
    "hero": {
      "title": "Dark Winds",
      "subtitle": "Only on MovieNite",
      "description": "A gritty investigation twists through the desert night. Pick up where you left off or explore something fresh with the concierge.",
      "cta": "Try Voice Concierge",
      "backdrop": "https://images.unsplash.com/photo-1524334228333-0f6db392f8a1?auto=format&fit=crop&w=1400&q=80"
    },
    "rows": [
      {
        "title": "Only on MovieNite",
        "tiles": [
          { "title": "Untamed", "tag": "Recently Added", "image": "https://images.unsplash.com/photo-1517816428104-797678c7cf0d?auto=format&fit=crop&w=800&q=80" },
          { "title": "Wednesday", "tag": "Top 10", "image": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80" },
          { "title": "Genie Make a Wish", "image": "https://images.unsplash.com/photo-1514790193030-c89d266d5a9d?auto=format&fit=crop&w=800&q=80" },
          { "title": "The Sandman", "image": "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=800&q=80" }
        ]
      },
      {
        "title": "Catch Up on Unwatched Episodes",
        "tiles": [
          { "title": "S.W.A.T.", "tag": "Top 10", "image": "https://images.unsplash.com/photo-1525097487452-6278ff080c31?auto=format&fit=crop&w=800&q=80" },
          { "title": "Blacklist", "image": "https://images.unsplash.com/photo-1461800919507-79b16743b257?auto=format&fit=crop&w=800&q=80" },
          { "title": "Mystery of Aaravos", "image": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80" },
          { "title": "Alice in Borderland", "image": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80" }
        ]
      },
      {
        "title": "Trending in Sci-Fi",
        "tiles": [
          { "title": "Rebel Moon", "image": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80" },
          { "title": "Everything Everywhere", "image": "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=800&q=80" },
          { "title": "Planet of the Apes", "image": "https://images.unsplash.com/photo-1505685296765-3a2736de412f?auto=format&fit=crop&w=800&q=80" },
          { "title": "The Matrix", "image": "https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=800&q=80" }
        ]
      }
    ]
  }'::jsonb,
  NULL
) on conflict (id) do update set default_layout = excluded.default_layout;

with title_seed as (
  insert into mvnte_titles (slug, name, genres, cast_members, year, nostalgic, maturity_rating, hero_backdrop, hero_description) values
  ('planet-of-the-apes-1968', 'Planet of the Apes', '{"sci-fi","adventure"}', '{"Charlton Heston","Roddy McDowall"}', 1968, true, 'PG-13', 'https://images.unsplash.com/photo-1505685296765-3a2736de412f?auto=format&fit=crop&w=1600&q=80', 'Astronauts crash on a world ruled by intelligent apes.'),
  ('the-matrix-1999', 'The Matrix', '{"sci-fi","action"}', '{"Keanu Reeves","Carrie-Anne Moss"}', 1999, true, 'R', 'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=1600&q=80', 'A hacker discovers the nature of reality.'),
  ('rebel-moon-2023', 'Rebel Moon', '{"sci-fi","action"}', '{"Sofia Boutella","Charlie Hunnam"}', 2023, false, 'PG-13', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=80', 'A peaceful colony faces a tyrannical regent.'),
  ('everything-everywhere-2022', 'Everything Everywhere All at Once', '{"sci-fi","comedy"}', '{"Michelle Yeoh","Ke Huy Quan"}', 2022, false, 'R', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1600&q=80', 'A multiverse adventure with heartfelt stakes.'),
  ('crouching-tiger-2000', 'Crouching Tiger, Hidden Dragon', '{"martial-arts","fantasy"}', '{"Michelle Yeoh","Chow Yun-Fat"}', 2000, true, 'PG-13', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80', 'A legendary sword and unspoken love in ancient China.'),
  ('the-witcher-2023', 'The Witcher', '{"fantasy","action"}', '{"Henry Cavill"}', 2023, false, 'TV-MA', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1600&q=80', 'A monster hunter struggles with destiny.'),
  ('blacklist-2019', 'The Blacklist', '{"thriller","crime"}', '{"James Spader"}', 2019, false, 'TV-14', 'https://images.unsplash.com/photo-1461800919507-79b16743b257?auto=format&fit=crop&w=1600&q=80', 'A master criminal works with the FBI.'),
  ('swat-2020', 'S.W.A.T.', '{"action"}', '{"Shemar Moore"}', 2020, false, 'TV-14', 'https://images.unsplash.com/photo-1525097487452-6278ff080c31?auto=format&fit=crop&w=1600&q=80', 'A Los Angeles SWAT lieutenant balances loyalty to the streets and loyalty to his brothers in blue.'),
  ('dark-winds-2023', 'Dark Winds', '{"thriller","mystery"}', '{"Zahn McClarnon"}', 2023, false, 'TV-MA', 'https://images.unsplash.com/photo-1524334228333-0f6db392f8a1?auto=format&fit=crop&w=1600&q=80', 'Navajo police investigate a double murder.'),
  ('sandman-2022', 'The Sandman', '{"fantasy","drama"}', '{"Tom Sturridge"}', 2022, false, 'TV-MA', 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80', 'Dream escapes and must reclaim his kingdom.')
  on conflict (slug) do update set
    name = excluded.name,
    genres = excluded.genres,
    cast_members = excluded.cast_members,
    year = excluded.year,
    nostalgic = excluded.nostalgic,
    maturity_rating = excluded.maturity_rating,
    hero_backdrop = excluded.hero_backdrop,
    hero_description = excluded.hero_description
  returning id, slug
)
select 1;

insert into mvnte_view_history (profile_id, title_id, watched_at)
select '00000000-0000-0000-0000-000000000001', id, timezone('utc', now()) - (row_number() over () * interval '2 days')
from mvnte_titles
where slug in ('planet-of-the-apes-1968','the-matrix-1999','rebel-moon-2023','crouching-tiger-2000');

insert into mvnte_preferences (profile_id, type, value, weight) values
('00000000-0000-0000-0000-000000000001', 'genre', 'sci-fi', 5),
('00000000-0000-0000-0000-000000000001', 'genre', 'fantasy', 3),
('00000000-0000-0000-0000-000000000001', 'actor', 'Michelle Yeoh', 4),
('00000000-0000-0000-0000-000000000001', 'actor', 'Keanu Reeves', 3);

insert into mvnte_parental_controls (profile_id, max_rating, blocked_genres)
values ('00000000-0000-0000-0000-000000000001', 'R', '{}');

update mvnte_profiles
set current_layout = default_layout,
    updated_at = timezone('utc', now())
where id = '00000000-0000-0000-0000-000000000001';
