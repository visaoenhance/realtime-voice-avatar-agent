-- Import Bombay Spice House to Remote
INSERT INTO "public"."fc_restaurants" 
  (id, created_at, updated_at, name, slug, description, cuisine_type, rating, delivery_time, delivery_fee, min_order, is_open, address, phone, hero_image, promo, closes_at, highlights, standout_dish)
VALUES 
  (
    'ecc3f603-5ba1-466a-b79e-0005818d7fcf'::uuid,
    '2026-02-13T01:20:02.017012+00:00'::timestamptz,
    '2026-02-13T01:20:02.017012+00:00'::timestamptz,
    'Bombay Spice House',
    'bombay-spice-house',
    'Authentic Indian cuisine with rich spices and traditional recipes',
    'Indian',
    4.8,
    '25-35 mins',
    2.49,
    15.00,
    true,
    '789 Curry Lane, Orlando, FL 32801',
    '(407) 555-0789',
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1600&q=80',
    '15% off orders over $30',
    '23:30:00'::time,
    ARRAY['Vegetarian Options', 'Spicy', 'Traditional'],
    'Butter Chicken'
  );
