-- Import Bombay Spice House to Remote (Schema-Matched)
INSERT INTO "public"."fc_restaurants" 
  (id, created_at, updated_at, slug, name, cuisine_group, cuisine, dietary_tags, price_tier, rating, eta_minutes, closes_at, delivery_fee, standout_dish, promo, hero_image, address, phone, highlights, is_active)
VALUES 
  (
    'ecc3f603-5ba1-466a-b79e-0005818d7fcf'::uuid,
    '2026-02-13T01:20:02.017012+00:00'::timestamptz,
    '2026-02-13T01:20:02.017012+00:00'::timestamptz,
    'bombay-spice-house',
    'Bombay Spice House',
    'asian',
    'indian',
    ARRAY['healthy', 'high-protein', 'spicy', 'vegetarian'],
    'medium',
    4.8,
    25,
    '2026-02-13T23:30:00+00:00',
    2.49,
    'Butter Chicken',
    '15% off orders over $30',
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1600&q=80',
    '789 Curry Lane, Orlando, FL 32801',
    '(407) 555-0789',
    NULL,
    true
  );
