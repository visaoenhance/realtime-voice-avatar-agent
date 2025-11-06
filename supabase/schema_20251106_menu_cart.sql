-- Food Court menu + cart expansion (2025-11-06)
-- Run after the base schema to add menu hierarchy and cart/order item detail tables.

create extension if not exists "uuid-ossp";

create table if not exists fc_menu_sections (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references fc_restaurants(id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  position integer default 0,
  is_active boolean default true,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  unique (restaurant_id, slug)
);

create index if not exists idx_fc_menu_sections_restaurant
  on fc_menu_sections (restaurant_id, position);

create table if not exists fc_menu_items (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references fc_restaurants(id) on delete cascade,
  section_id uuid not null references fc_menu_sections(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  base_price numeric(10, 2) not null,
  image text,
  calories integer,
  rating numeric(3, 2),
  ratings_count integer,
  tags text[] default '{}',
  is_available boolean default true,
  position integer default 0,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  unique (restaurant_id, slug)
);

create index if not exists idx_fc_menu_items_restaurant
  on fc_menu_items (restaurant_id, is_available, position);

create table if not exists fc_menu_item_option_groups (
  id uuid primary key default uuid_generate_v4(),
  menu_item_id uuid not null references fc_menu_items(id) on delete cascade,
  title text not null,
  min integer default 0,
  max integer default 1,
  required boolean default false,
  help_text text,
  position integer default 0,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create index if not exists idx_fc_menu_item_option_groups_item
  on fc_menu_item_option_groups (menu_item_id, position);

create unique index if not exists uq_fc_menu_item_option_groups_title
  on fc_menu_item_option_groups (menu_item_id, title);

create table if not exists fc_menu_item_option_choices (
  id uuid primary key default uuid_generate_v4(),
  option_group_id uuid not null references fc_menu_item_option_groups(id) on delete cascade,
  label text not null,
  price_adjustment numeric(10, 2) default 0,
  is_default boolean default false,
  description text,
  position integer default 0,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create index if not exists idx_fc_menu_item_option_choices_group
  on fc_menu_item_option_choices (option_group_id, position);

create unique index if not exists uq_fc_menu_item_option_choices_label
  on fc_menu_item_option_choices (option_group_id, label);

create table if not exists fc_carts (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references fc_profiles(id) on delete cascade,
  restaurant_id uuid not null references fc_restaurants(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'ordered', 'abandoned')),
  subtotal numeric(10, 2) default 0,
  notes text,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create index if not exists idx_fc_carts_profile_status
  on fc_carts (profile_id, status, updated_at desc);

create table if not exists fc_cart_items (
  id uuid primary key default uuid_generate_v4(),
  cart_id uuid not null references fc_carts(id) on delete cascade,
  menu_item_id uuid not null references fc_menu_items(id),
  quantity integer not null default 1 check (quantity > 0),
  base_price numeric(10, 2) not null,
  total_price numeric(10, 2) not null,
  instructions text,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create index if not exists idx_fc_cart_items_cart
  on fc_cart_items (cart_id);

create table if not exists fc_cart_item_options (
  id uuid primary key default uuid_generate_v4(),
  cart_item_id uuid not null references fc_cart_items(id) on delete cascade,
  option_choice_id uuid not null references fc_menu_item_option_choices(id),
  price_adjustment numeric(10, 2) default 0,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create index if not exists idx_fc_cart_item_options_item
  on fc_cart_item_options (cart_item_id);

create table if not exists fc_order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references fc_orders(id) on delete cascade,
  menu_item_id uuid references fc_menu_items(id),
  name text not null,
  quantity integer not null default 1 check (quantity > 0),
  base_price numeric(10, 2) not null,
  total_price numeric(10, 2) not null,
  notes text,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create index if not exists idx_fc_order_items_order
  on fc_order_items (order_id);

create table if not exists fc_order_item_options (
  id uuid primary key default uuid_generate_v4(),
  order_item_id uuid not null references fc_order_items(id) on delete cascade,
  label text not null,
  price_adjustment numeric(10, 2) default 0,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create index if not exists idx_fc_order_item_options_item
  on fc_order_item_options (order_item_id);

-- Convenience view to expose menu sections with their items in a single query.
create or replace view fc_menu_sections_with_items as
select
  s.id as section_id,
  s.restaurant_id,
  s.slug as section_slug,
  s.title as section_title,
  s.description as section_description,
  s.position as section_position,
  json_agg(
    json_build_object(
      'id', i.id,
      'slug', i.slug,
      'name', i.name,
      'description', i.description,
      'base_price', i.base_price,
      'image', i.image,
      'calories', i.calories,
      'rating', i.rating,
      'ratings_count', i.ratings_count,
      'tags', i.tags,
      'is_available', i.is_available,
      'position', i.position
    )
    order by i.position
  ) filter (where i.id is not null) as items
from fc_menu_sections s
left join fc_menu_items i on i.section_id = s.id and i.is_available = true
where s.is_active = true
group by s.id;


