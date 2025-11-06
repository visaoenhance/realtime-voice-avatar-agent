-- Food Court menu + cart seed data (2025-11-06)
-- Populates sample menu sections, items, and option sets for the concierge demo.

with restaurant as (
  select id from fc_restaurants where slug = 'island-breeze-caribbean'
), section_rows as (
  select r.id as restaurant_id, v.section_slug, v.section_title, v.section_description, v.section_position
  from restaurant r
  cross join (
    values
      ('featured-items', 'Featured Items', null, 1),
      ('soups-and-greens', 'Soups & Greens', null, 2),
      ('sides', 'Sides', null, 3)
  ) as v(section_slug, section_title, section_description, section_position)
), upsert_sections as (
  insert into fc_menu_sections (restaurant_id, slug, title, description, position)
  select restaurant_id, section_slug, section_title, section_description, section_position
  from section_rows
  on conflict (restaurant_id, slug) do update
    set title = excluded.title,
        description = excluded.description,
        position = excluded.position,
        updated_at = timezone('utc', now())
  returning id, restaurant_id, slug
), item_rows as (
  select
    us.restaurant_id,
    us.id as section_id,
    v.item_slug,
    v.item_name,
    v.item_description,
    v.base_price::numeric(10, 2),
    v.image,
    v.calories::integer,
    v.rating::numeric(3, 2),
    v.ratings_count::integer,
    v.tags,
    v.position
  from upsert_sections us
  join (
    values
      (
        'featured-items',
        'chimichurri-bistro-filet',
        'Chimichurri Bistro Filet',
        '8oz sliced, chef-crafted chimichurri served with two sides and temperature preference.',
        30.90,
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1400&q=80',
        1400,
        4.80,
        24,
        array['#1 most liked', 'Gluten-free friendly']::text[],
        1
      ),
      (
        'featured-items',
        'dynamite-salmon',
        'Dynamite Salmon',
        'Wood-grilled Atlantic salmon topped with dynamite aioli. Comes with two signature sides.',
        27.90,
        'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1400&q=80',
        930,
        4.70,
        16,
        array['#3 most liked']::text[],
        2
      ),
      (
        'featured-items',
        'bourbon-glazed-salmon',
        'Bourbon Glazed Salmon',
        'Pan-seared salmon finished with a smoky bourbon glaze, served with green beans and potatoes.',
        28.90,
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80',
        930,
        4.60,
        21,
        array[]::text[],
        3
      ),
      (
        'soups-and-greens',
        'corn-chowder',
        'Corn Chowder & Lump Crab – Cup',
        'Roasted corn chowder finished with lump crab and a touch of sherry.',
        6.50,
        null,
        null,
        4.50,
        12,
        array['Comfort classic']::text[],
        1
      ),
      (
        'soups-and-greens',
        'house-salad',
        'House Salad',
        'Romaine, tomatoes, kalamata olives, hearts of palm, citrus herb vinaigrette.',
        6.50,
        null,
        null,
        4.20,
        9,
        array['Vegetarian']::text[],
        2
      ),
      (
        'sides',
        'french-fries',
        'French Fries',
        'Crispy golden fries seasoned with sea salt.',
        4.50,
        null,
        null,
        4.30,
        18,
        array[]::text[],
        1
      ),
      (
        'sides',
        'garlic-whipped-potatoes',
        'Garlic Whipped Potatoes',
        'Creamy potatoes whipped with roasted garlic.',
        4.50,
        null,
        null,
        4.60,
        15,
        array[]::text[],
        2
      ),
      (
        'sides',
        'broccoli-side',
        'Broccoli',
        'Steamed broccoli with a squeeze of citrus.',
        4.00,
        null,
        null,
        4.10,
        11,
        array['Vegetarian', 'Gluten-free friendly']::text[],
        3
      )
  ) as v(section_slug, item_slug, item_name, item_description, base_price, image, calories, rating, ratings_count, tags, position)
  on v.section_slug = us.slug
), upsert_items as (
  insert into fc_menu_items (
    restaurant_id,
    section_id,
    slug,
    name,
    description,
    base_price,
    image,
    calories,
    rating,
    ratings_count,
    tags,
    position
  )
  select
    restaurant_id,
    section_id,
    item_slug,
    item_name,
    item_description,
    base_price,
    image,
    calories,
    rating,
    ratings_count,
    tags,
    position
  from item_rows
  on conflict (restaurant_id, slug) do update
    set name = excluded.name,
        description = excluded.description,
        base_price = excluded.base_price,
        image = excluded.image,
        calories = excluded.calories,
        rating = excluded.rating,
        ratings_count = excluded.ratings_count,
        tags = excluded.tags,
        is_available = true,
        position = excluded.position,
        updated_at = timezone('utc', now())
  returning id, restaurant_id, slug
), option_group_values as (
  select * from (
    values
      ('chimichurri-bistro-filet', 'Temperature Options', 1, 1, true, null, 1),
      ('chimichurri-bistro-filet', 'Side Option #1', 1, 1, true, null, 2),
      ('chimichurri-bistro-filet', 'Side Option #2', 1, 1, true, null, 3),
      ('chimichurri-bistro-filet', 'Entrée Add-On', 0, 4, false, 'Choose up to 4', 4),
      ('chimichurri-bistro-filet', 'Soup or Salad Add-on', 0, 1, false, null, 5),
      ('dynamite-salmon', 'Side Option', 1, 1, true, null, 1)
  ) as v(item_slug, group_title, min, max, required, help_text, position)
), option_group_rows as (
  select
    ui.id as menu_item_id,
    v.item_slug,
    v.group_title,
    v.min,
    v.max,
    v.required,
    v.help_text,
    v.position
  from upsert_items ui
  join option_group_values v on v.item_slug = ui.slug
), upsert_option_groups as (
  insert into fc_menu_item_option_groups (menu_item_id, title, min, max, required, help_text, position)
  select menu_item_id, group_title, min, max, required, help_text, position
  from option_group_rows
  on conflict (menu_item_id, title) do update
    set min = excluded.min,
        max = excluded.max,
        required = excluded.required,
        help_text = excluded.help_text,
        position = excluded.position,
        updated_at = timezone('utc', now())
  returning id, menu_item_id, title
), option_choice_values as (
  select * from (
    values
      ('chimichurri-bistro-filet', 'Temperature Options', 'Rare: Cool Red Center', 0, false, null, 1),
      ('chimichurri-bistro-filet', 'Temperature Options', 'Medium Rare: Warm Red Center', 0, true, null, 2),
      ('chimichurri-bistro-filet', 'Temperature Options', 'Medium: Warm Pink Center/Touch of Red', 0, false, null, 3),
      ('chimichurri-bistro-filet', 'Temperature Options', 'Medium Well: Warm Brown/Pink Center', 0, false, null, 4),
      ('chimichurri-bistro-filet', 'Temperature Options', 'Well: Hot Brown Center/No Pink', 0, false, null, 5),
      ('chimichurri-bistro-filet', 'Side Option #1', 'French Fries', 0, true, null, 1),
      ('chimichurri-bistro-filet', 'Side Option #1', 'Jasmine Rice', 0, false, null, 2),
      ('chimichurri-bistro-filet', 'Side Option #1', 'Garlic Whipped Potatoes', 0, false, null, 3),
      ('chimichurri-bistro-filet', 'Side Option #1', 'Steamed Asparagus', 0, false, null, 4),
      ('chimichurri-bistro-filet', 'Side Option #1', 'Broccoli', 0, false, null, 5),
      ('chimichurri-bistro-filet', 'Side Option #1', 'Pumpkin Ravioli', 4.50, false, null, 6),
      ('chimichurri-bistro-filet', 'Side Option #2', 'French Fries', 0, true, null, 1),
      ('chimichurri-bistro-filet', 'Side Option #2', 'Jasmine Rice', 0, false, null, 2),
      ('chimichurri-bistro-filet', 'Side Option #2', 'Garlic Whipped Potatoes', 0, false, null, 3),
      ('chimichurri-bistro-filet', 'Side Option #2', 'Steamed Asparagus', 0, false, null, 4),
      ('chimichurri-bistro-filet', 'Side Option #2', 'Broccoli', 0, false, null, 5),
      ('chimichurri-bistro-filet', 'Entrée Add-On', 'Add Crab Cake', 8.90, false, null, 1),
      ('chimichurri-bistro-filet', 'Entrée Add-On', 'Add Bang Bang Shrimp', 9.90, false, null, 2),
      ('chimichurri-bistro-filet', 'Entrée Add-On', 'Add Lobster Tail', 13.90, false, null, 3),
      ('chimichurri-bistro-filet', 'Soup or Salad Add-on', 'House Salad', 6.50, false, null, 1),
      ('chimichurri-bistro-filet', 'Soup or Salad Add-on', 'Caesar Salad', 6.50, false, null, 2),
      ('chimichurri-bistro-filet', 'Soup or Salad Add-on', 'Corn Chowder & Lump Crab – Cup', 6.50, false, null, 3),
      ('chimichurri-bistro-filet', 'Soup or Salad Add-on', 'Corn Chowder & Lump Crab – Bowl', 7.50, false, null, 4),
      ('dynamite-salmon', 'Side Option', 'Jasmine Rice', 0, true, null, 1),
      ('dynamite-salmon', 'Side Option', 'Garlic Whipped Potatoes', 0, false, null, 2),
      ('dynamite-salmon', 'Side Option', 'Seasonal Vegetables', 0, false, null, 3)
  ) as v(item_slug, group_title, label, price_adjustment, is_default, description, position)
)
insert into fc_menu_item_option_choices (option_group_id, label, price_adjustment, is_default, description, position)
select
  og.id,
  v.label,
  v.price_adjustment,
  v.is_default,
  v.description,
  v.position
from upsert_option_groups og
join option_group_rows ogr on ogr.menu_item_id = og.menu_item_id and ogr.group_title = og.title
join option_choice_values v on v.item_slug = ogr.item_slug and v.group_title = ogr.group_title
on conflict (option_group_id, label) do update
  set price_adjustment = excluded.price_adjustment,
      is_default = excluded.is_default,
      description = excluded.description,
      position = excluded.position,
      updated_at = timezone('utc', now());

-- Green Garden Bowls menu -------------------------------------------------

with restaurant as (
  select id from fc_restaurants where slug = 'green-garden-bowls'
), section_rows as (
  select r.id as restaurant_id, v.section_slug, v.section_title, v.section_description, v.section_position
  from restaurant r
  cross join (
    values
      ('signature-bowls', 'Signature Bowls', null, 1),
      ('fresh-press-juices', 'Fresh Press Juices', null, 2)
  ) as v(section_slug, section_title, section_description, section_position)
), upsert_sections as (
  insert into fc_menu_sections (restaurant_id, slug, title, description, position)
  select restaurant_id, section_slug, section_title, section_description, section_position
  from section_rows
  on conflict (restaurant_id, slug) do update
    set title = excluded.title,
        description = excluded.description,
        position = excluded.position,
        updated_at = timezone('utc', now())
  returning id, restaurant_id, slug
), item_rows as (
  select
    us.restaurant_id,
    us.id as section_id,
    v.item_slug,
    v.item_name,
    v.item_description,
    v.base_price,
    v.image,
        v.calories,
    v.rating,
    v.ratings_count,
    v.tags,
    v.position
  from upsert_sections us
  join (
    values
      (
        'signature-bowls',
        'caribbean-quinoa-bowl',
        'Caribbean Quinoa Bowl',
        'Citrus-marinated shrimp, quinoa, grilled pineapple, pickled slaw, citrus vinaigrette.',
        15.50,
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1400&q=80',
        640,
        4.80,
        112,
        array['Gluten-free friendly']::text[],
        1
      ),
      (
        'signature-bowls',
        'harissa-chickpea-bowl',
        'Harissa Chickpea Bowl',
        'Harissa-roasted chickpeas, smoky hummus, ancient grains, charred broccoli.',
        13.25,
        null,
        520,
        4.60,
        89,
        array['Vegetarian']::text[],
        2
      ),
      (
        'fresh-press-juices',
        'pineapple-ginger-refresh',
        'Pineapple Ginger Refresh',
        'Cold-pressed pineapple, ginger, mint, and sparkling water.',
        6.50,
        null,
        null,
        4.50,
        47,
        array[]::text[],
        1
      )
  ) as v(section_slug, item_slug, item_name, item_description, base_price, image, calories, rating, ratings_count, tags, position)
  on v.section_slug = us.slug
)
insert into fc_menu_items (
  restaurant_id,
  section_id,
  slug,
  name,
  description,
  base_price,
  image,
  calories,
  rating,
  ratings_count,
  tags,
  position
)
select
  restaurant_id,
  section_id,
  item_slug,
  item_name,
  item_description,
  base_price,
  image,
  calories,
  rating,
  ratings_count,
  tags,
  position
from item_rows
on conflict (restaurant_id, slug) do update
  set name = excluded.name,
      description = excluded.description,
      base_price = excluded.base_price,
      image = excluded.image,
      calories = excluded.calories,
      rating = excluded.rating,
      ratings_count = excluded.ratings_count,
      tags = excluded.tags,
      is_available = true,
      position = excluded.position,
      updated_at = timezone('utc', now());

-- Noodle Express menu -----------------------------------------------------

with restaurant as (
  select id from fc_restaurants where slug = 'noodle-express'
), section_rows as (
  select r.id as restaurant_id, v.section_slug, v.section_title, v.section_description, v.section_position
  from restaurant r
  cross join (
    values
      ('noodle-favorites', 'Noodle Favorites', null, 1)
  ) as v(section_slug, section_title, section_description, section_position)
), upsert_sections as (
  insert into fc_menu_sections (restaurant_id, slug, title, description, position)
  select restaurant_id, section_slug, section_title, section_description, section_position
  from section_rows
  on conflict (restaurant_id, slug) do update
    set title = excluded.title,
        description = excluded.description,
        position = excluded.position,
        updated_at = timezone('utc', now())
  returning id, restaurant_id, slug
), item_rows as (
  select
    us.restaurant_id,
    us.id as section_id,
    v.item_slug,
    v.item_name,
    v.item_description,
    v.base_price::numeric(10, 2),
    v.image,
    v.calories::integer,
    v.rating::numeric(3, 2),
    v.ratings_count::integer,
    v.tags,
    v.position
  from upsert_sections us
  join (
    values
      (
        'noodle-favorites',
        'drunken-noodles',
        'Drunken Noodles',
        'Wide rice noodles, Thai basil, bell peppers, and chili garlic sauce.',
        14.50,
        null,
        null,
        4.40,
        132,
        array['Spicy']::text[],
        1
      ),
      (
        'noodle-favorites',
        'pad-thai',
        'Pad Thai',
        'Tamarind sauce, crushed peanuts, bean sprouts, choice of protein.',
        13.75,
        null,
        null,
        4.50,
        118,
        array[]::text[],
        2
      )
  ) as v(section_slug, item_slug, item_name, item_description, base_price, image, calories, rating, ratings_count, tags, position)
  on v.section_slug = us.slug
)
insert into fc_menu_items (
  restaurant_id,
  section_id,
  slug,
  name,
  description,
    base_price,
  image,
    calories,
    rating,
    ratings_count,
  tags,
  position
)
select
  restaurant_id,
  section_id,
  item_slug,
  item_name,
  item_description,
  base_price,
  image,
  calories,
  rating,
  ratings_count,
  tags,
  position
from item_rows
on conflict (restaurant_id, slug) do update
  set name = excluded.name,
      description = excluded.description,
      base_price = excluded.base_price,
      image = excluded.image,
      calories = excluded.calories,
      rating = excluded.rating,
      ratings_count = excluded.ratings_count,
      tags = excluded.tags,
      is_available = true,
      position = excluded.position,
      updated_at = timezone('utc', now());


