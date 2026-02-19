SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: fc_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."fc_profiles" ("id", "household_name", "default_layout", "current_layout", "default_location", "updated_at") VALUES
	('00000000-0000-0000-0000-0000000000fc', 'Rivera Household', '{"hero": {"cta": "Ask Food Court Concierge", "title": "Island Breeze Caribbean", "backdrop": "https://images.unsplash.com/photo-1604908176970-ef3ee68c1801?auto=format&fit=crop&w=1600&q=80", "subtitle": "Dinner in under 40 minutes", "description": "Need something bold and still open? Ask the concierge to line up Caribbean spots, healthy bowls, or grab-and-go favorites tonight."}, "rows": [{"tiles": [{"tag": "Closes in 45 min", "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80", "title": "Island Breeze Caribbean"}, {"tag": "Free Chips Tonight", "image": "https://images.unsplash.com/photo-1606755962773-0e7d4be90a77?auto=format&fit=crop&w=1200&q=80", "title": "Sabor Latino Cantina"}], "title": "Closing Soon Caribbean"}, {"tiles": [{"tag": "ETA 24 min", "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80", "title": "Green Garden Bowls"}, {"image": "https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=1200&q=80", "title": "Harvest & Hearth"}], "title": "Healthy Staples"}, {"tiles": [{"tag": "2 for $20", "image": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80", "title": "Noodle Express"}, {"image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80", "title": "Brick Oven Slice"}], "title": "Comfort Favorites"}]}', NULL, '{"lat": 28.538336, "lng": -81.379234, "city": "Orlando", "state": "FL"}', '2026-02-13 01:23:11.041133+00');


--
-- Data for Name: fc_restaurants; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."fc_restaurants" ("id", "slug", "name", "cuisine_group", "cuisine", "dietary_tags", "price_tier", "rating", "eta_minutes", "closes_at", "delivery_fee", "standout_dish", "promo", "hero_image", "address", "phone", "highlights", "is_active", "created_at", "updated_at") VALUES
	('c711070d-8016-434c-b260-162fb23430ed', 'sabor-latino-cantina', 'Sabor Latino Cantina', 'latin', 'mexican', '{gluten-free}', 'low', 4.50, 28, '2026-02-13 02:53:11.046475+00', 1.99, 'Al Pastor Tacos', '15% off tonight', 'https://images.pexels.com/photos/14560045/pexels-photo-14560045.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '205 Fiesta Blvd, Orlando, FL', '407-555-0142', '{"House-made tortillas","Family bundle specials","Late-night bites"}', true, '2025-11-06 21:12:51.434723+00', '2026-02-13 01:23:11.046475+00'),
	('3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'island-breeze-caribbean', 'Island Breeze Caribbean', 'latin', 'caribbean', '{gluten-free,spicy}', 'medium', 4.70, 32, '2026-02-13 02:08:11.046475+00', 2.49, 'Jerk Chicken with Pineapple Slaw', 'Free delivery over $30', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=80', '135 Island Breeze Ave, Orlando, FL', '407-555-0134', '{"Closes in under an hour","Signature jerk marinades","Combo-friendly sides"}', true, '2025-11-06 21:12:51.434723+00', '2026-02-13 01:23:11.046475+00'),
	('b1b340a9-48c9-44a7-a4db-68a312b8d521', 'green-garden-bowls', 'Green Garden Bowls', 'healthy', 'plant-forward', '{vegetarian,gluten-free,healthy}', 'medium', 4.80, 24, '2026-02-13 02:23:11.046475+00', 0.00, 'Caribbean Quinoa Bowl', 'BOGO 50% off bowls', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1600&q=80', '47 Fresh Market Way, Winter Park, FL', '407-555-0110', '{"Build-your-own bowl","Juice cleanse add-ons","Macro-friendly portions"}', true, '2025-11-06 21:12:51.434723+00', '2026-02-13 01:23:11.046475+00'),
	('74d9b417-367d-4242-a4b5-78fc89ff49f6', 'harvest-hearth-kitchen', 'Harvest & Hearth Kitchen', 'healthy', 'farm-to-table', '{vegetarian,healthy}', 'high', 4.60, 38, '2026-02-13 02:33:11.046475+00', 4.50, 'Roasted Squash Grain Bowl', 'Free dessert with orders over $40', 'https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=1600&q=80', '892 Hearthstone Ave, Maitland, FL', '407-555-0188', '{"Seasonal produce","Chef-curated pairings","Craft mocktails"}', true, '2025-11-06 21:12:51.434723+00', '2026-02-13 01:23:11.046475+00'),
	('f0bda605-5fec-42e8-a333-9ba59dd64174', 'noodle-express', 'Noodle Express', 'asian', 'thai', '{spicy}', 'medium', 4.40, 35, '2026-02-13 03:13:11.046475+00', 3.25, 'Drunken Noodles', '2 entrees for $20', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1600&q=80', '512 Spice Lane, Altamonte Springs, FL', '407-555-0165', '{"Hand-pulled noodles","Late-night happy hour","Thai iced tea combos"}', true, '2025-11-06 21:12:51.434723+00', '2026-02-13 01:23:11.046475+00'),
	('2ce19b88-19e9-459f-bf6c-c99cee250b3e', 'brick-oven-slice', 'Brick Oven Slice', 'comfort', 'pizza', '{vegetarian}', 'low', 4.20, 29, '2026-02-13 03:23:11.046475+00', 1.50, 'Grandma Square Pie', 'Family meal $24.99', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=80', '75 Brickstone Plaza, Orlando, FL', '407-555-0177', '{"Wood-fired crust","By-the-slice classics","Overnight dough ferment"}', true, '2025-11-06 21:12:51.434723+00', '2026-02-13 01:23:11.046475+00'),
	('ecc3f603-5ba1-466a-b79e-0005818d7fcf', 'bombay-spice-house', 'Bombay Spice House', 'asian', 'indian', '{healthy,high-protein,spicy,vegetarian}', 'medium', 4.80, 25, '2026-02-13 23:30:00+00', 2.49, 'Butter Chicken', '15% off orders over $30', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1600&q=80', '789 Curry Lane, Orlando, FL 32801', '(407) 555-0789', NULL, true, '2026-02-13 01:20:02.017012+00', '2026-02-13 01:20:02.017012+00');


--
-- Data for Name: fc_carts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."fc_carts" ("id", "profile_id", "restaurant_id", "status", "subtotal", "created_at", "updated_at") VALUES
	('8e7ae9cf-6479-4169-a736-c126cd7ecf08', '00000000-0000-0000-0000-0000000000fc', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'ordered', 31.45, '2026-02-13 03:46:46.596907+00', '2026-02-13 16:13:32.298+00'),
	('9bd8cf23-8389-4341-a79e-477f56c38e35', '00000000-0000-0000-0000-0000000000fc', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'ordered', 31.45, '2026-02-13 03:46:46.602688+00', '2026-02-13 16:38:23.353+00'),
	('1a9e5537-c5db-4d4f-aebf-bc7d26e8b923', '00000000-0000-0000-0000-0000000000fc', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'ordered', 7.95, '2026-02-13 16:42:20.408678+00', '2026-02-13 16:42:41.03+00'),
	('2fc3ac6a-410b-4db4-9552-9aa98bdb11d5', '00000000-0000-0000-0000-0000000000fc', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'ordered', 12.50, '2026-02-13 18:36:07.403503+00', '2026-02-13 18:36:27.903+00');


--
-- Data for Name: fc_menu_sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."fc_menu_sections" ("id", "restaurant_id", "name", "description", "display_order", "is_active", "created_at", "updated_at") VALUES
	('0d0a1bce-67ef-4bb7-8ffd-d52a4bde06e3', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'Appetizers & Starters', 'Caribbean-style appetizers to start your meal', 1, true, '2026-02-13 01:23:52.656647+00', '2026-02-13 01:23:52.656647+00'),
	('cb69c53c-50a6-4a70-968d-904492b27ef7', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'Main Dishes', 'Authentic Caribbean entrées and specialties', 2, true, '2026-02-13 01:23:52.656647+00', '2026-02-13 01:23:52.656647+00'),
	('4b4139d6-e647-42b8-95cc-d03f3c141f0a', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'Sides & Beverages', 'Traditional sides and refreshing drinks', 3, true, '2026-02-13 01:23:52.656647+00', '2026-02-13 01:23:52.656647+00'),
	('67ce86ff-91ff-49b1-9dd6-a355d0f68ddb', 'f0bda605-5fec-42e8-a333-9ba59dd64174', 'Noodle Dishes', 'Authentic Thai noodle specialties', 1, true, '2026-02-13 01:32:12.659657+00', '2026-02-13 01:32:12.659657+00'),
	('5fdb2bfd-b22e-4141-8af2-105fb7acfbef', 'f0bda605-5fec-42e8-a333-9ba59dd64174', 'Curries & Rice', 'Traditional curries with jasmine rice', 2, true, '2026-02-13 01:32:12.659657+00', '2026-02-13 01:32:12.659657+00'),
	('1a401d61-099b-421d-9159-3fb34664f6cd', 'f0bda605-5fec-42e8-a333-9ba59dd64174', 'Appetizers & Salads', 'Fresh starters and Thai salads', 3, true, '2026-02-13 01:32:12.659657+00', '2026-02-13 01:32:12.659657+00'),
	('95ebcf29-535f-4aad-b3e5-93459986fc20', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', 'Power Bowls', 'Nutrient-packed bowls with superfoods', 1, true, '2026-02-13 01:32:12.659657+00', '2026-02-13 01:32:12.659657+00'),
	('51bef98d-3fc1-4ef7-91fe-f73e94c38d97', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', 'Fresh Salads', 'Organic greens and seasonal vegetables', 2, true, '2026-02-13 01:32:12.659657+00', '2026-02-13 01:32:12.659657+00'),
	('3caaffaa-2f4e-45b6-be50-d3cc523de3ba', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', 'Smoothies & Juices', 'Cold-pressed juices and protein smoothies', 3, true, '2026-02-13 01:32:12.659657+00', '2026-02-13 01:32:12.659657+00'),
	('2e04ba17-7655-4b7d-bccf-a58da89dbe49', '74d9b417-367d-4242-a4b5-78fc89ff49f6', 'Farm Fresh Mains', 'Seasonal dishes with local ingredients', 1, true, '2026-02-13 01:32:23.411201+00', '2026-02-13 01:32:23.411201+00'),
	('ccae79c1-30ca-4ca0-bf1e-f17f197a70c4', '74d9b417-367d-4242-a4b5-78fc89ff49f6', 'Garden Starters', 'Fresh appetizers from our garden', 2, true, '2026-02-13 01:32:23.411201+00', '2026-02-13 01:32:23.411201+00'),
	('c97144e0-b14c-4821-9081-efdd60b2c193', '74d9b417-367d-4242-a4b5-78fc89ff49f6', 'Hearth Sides', 'Artisanal sides and seasonal vegetables', 3, true, '2026-02-13 01:32:23.411201+00', '2026-02-13 01:32:23.411201+00'),
	('fa026916-8ab9-43cf-b9bb-0bbc7971608c', 'c711070d-8016-434c-b260-162fb23430ed', 'Tacos & Quesadillas', 'Authentic Mexican street food favorites', 1, true, '2026-02-13 01:32:23.411201+00', '2026-02-13 01:32:23.411201+00'),
	('a07bfac2-31f0-4700-9cff-a7cf1afa0ca9', 'c711070d-8016-434c-b260-162fb23430ed', 'Entrees', 'Traditional Mexican main dishes', 2, true, '2026-02-13 01:32:23.411201+00', '2026-02-13 01:32:23.411201+00'),
	('e6eb903f-5e46-441f-8a4d-1f795c34e526', 'c711070d-8016-434c-b260-162fb23430ed', 'Sides & Appetizers', 'Mexican sides and starter plates', 3, true, '2026-02-13 01:32:23.411201+00', '2026-02-13 01:32:23.411201+00'),
	('013dbf9d-f278-46b5-a794-828d1bb8312c', 'ecc3f603-5ba1-466a-b79e-0005818d7fcf', 'Curries & Masalas', 'Rich and aromatic curry dishes', 1, true, '2026-02-13 01:39:15.089953+00', '2026-02-13 01:39:15.089953+00'),
	('4b8fcde9-ae51-470e-b9ad-caa18cd3f43b', 'ecc3f603-5ba1-466a-b79e-0005818d7fcf', 'Tandoor Specialties', 'Clay oven grilled meats and breads', 2, true, '2026-02-13 01:39:15.089953+00', '2026-02-13 01:39:15.089953+00'),
	('c1dc2e04-30e7-4ab9-a32d-d530483d97d4', 'ecc3f603-5ba1-466a-b79e-0005818d7fcf', 'Rice & Biryani', 'Fragrant basmati rice dishes', 3, true, '2026-02-13 01:39:15.089953+00', '2026-02-13 01:39:15.089953+00'),
	('41e52427-a7d8-406b-9979-832b374791d6', '74d9b417-367d-4242-a4b5-78fc89ff49f6', 'Artisan Desserts', 'House-made desserts with seasonal ingredients', 4, true, '2026-02-13 01:43:33.272135+00', '2026-02-13 01:43:33.272135+00'),
	('88c6a934-390d-4847-9322-84c5c261d693', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'Sweet Endings', 'Traditional Caribbean and tropical desserts', 4, true, '2026-02-13 01:43:33.272135+00', '2026-02-13 01:43:33.272135+00');


--
-- Data for Name: fc_menu_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."fc_menu_items" ("id", "restaurant_id", "section_id", "slug", "name", "description", "base_price", "image_url", "dietary_tags", "allergen_info", "calories", "prep_time_minutes", "is_available", "is_popular", "display_order", "created_at", "updated_at", "image") VALUES
	('6ebf5f00-0a47-4897-a9ca-8700c3d1a926', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', '0d0a1bce-67ef-4bb7-8ffd-d52a4bde06e3', 'plantain-chips', 'Plantain Chips', 'Crispy fried plantains with spicy mojo sauce', 8.95, NULL, '{appetizer,crispy,spicy,gluten-free}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:26:36.741248+00', '2026-02-13 01:26:36.741248+00', NULL),
	('e5d12473-cbb1-4b8f-8c2c-a4a058df80aa', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'cb69c53c-50a6-4a70-968d-904492b27ef7', 'jerk-chicken', 'Jerk Chicken', 'Grilled chicken with authentic jerk seasoning', 18.95, NULL, '{main,chicken,spicy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:26:46.910963+00', '2026-02-13 01:26:46.910963+00', NULL),
	('eebe7db7-3197-4229-989f-73c88ce425ab', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'cb69c53c-50a6-4a70-968d-904492b27ef7', 'curry-goat', 'Curry Goat', 'Tender goat slow-cooked in Caribbean curry spices', 22.95, NULL, '{main,curry,spicy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:26:46.910963+00', '2026-02-13 01:26:46.910963+00', NULL),
	('d23ff2c1-18ef-4c87-b670-6237e2d5d8b5', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'cb69c53c-50a6-4a70-968d-904492b27ef7', 'grilled-mahi-mahi', 'Grilled Mahi Mahi', 'Fresh fish with tropical fruit salsa', 24.95, NULL, '{main,seafood,healthy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:26:46.910963+00', '2026-02-13 01:26:46.910963+00', NULL),
	('3f92834c-8b70-411c-999f-c0f1d471c46a', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', '4b4139d6-e647-42b8-95cc-d03f3c141f0a', 'rice-and-peas', 'Rice & Peas', 'Traditional coconut rice with kidney beans', 6.95, NULL, '{side,vegetarian,gluten-free}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:26:54.075216+00', '2026-02-13 01:26:54.075216+00', NULL),
	('d09e577a-7ea8-424c-915f-1acc7b8e1555', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', '4b4139d6-e647-42b8-95cc-d03f3c141f0a', 'festival', 'Festival', 'Sweet fried dumplings (pair of 2)', 4.95, NULL, '{side,vegetarian,sweet}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:26:54.075216+00', '2026-02-13 01:26:54.075216+00', NULL),
	('eaa1e778-ca8e-4534-9ff1-a7b2af9964da', 'f0bda605-5fec-42e8-a333-9ba59dd64174', '67ce86ff-91ff-49b1-9dd6-a355d0f68ddb', 'pad-thai', 'Pad Thai', 'Traditional stir-fried rice noodles with tamarind sauce', 16.95, NULL, '{noodles,spicy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:36:41.314227+00', '2026-02-13 01:36:41.314227+00', NULL),
	('378af4ea-3672-4030-bc5c-b3dc895fb407', 'f0bda605-5fec-42e8-a333-9ba59dd64174', '67ce86ff-91ff-49b1-9dd6-a355d0f68ddb', 'drunken-noodles', 'Drunken Noodles', 'Wide rice noodles with basil and chilies', 17.95, NULL, '{noodles,spicy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:36:41.314227+00', '2026-02-13 01:36:41.314227+00', NULL),
	('df1f1e26-edf5-41c2-9c46-3dc4a15efa5f', 'f0bda605-5fec-42e8-a333-9ba59dd64174', '5fdb2bfd-b22e-4141-8af2-105fb7acfbef', 'green-curry-chicken', 'Green Curry Chicken', 'Creamy coconut curry with Thai basil', 18.95, NULL, '{curry,spicy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:36:41.314227+00', '2026-02-13 01:36:41.314227+00', NULL),
	('883a05fe-00a6-4cb9-8440-72ddd5e490fc', 'f0bda605-5fec-42e8-a333-9ba59dd64174', '5fdb2bfd-b22e-4141-8af2-105fb7acfbef', 'massaman-beef', 'Massaman Beef', 'Rich and mild curry with potatoes', 21.95, NULL, '{curry,mild,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:37:31.612158+00', '2026-02-13 01:37:31.612158+00', NULL),
	('39915a35-dc41-4bf9-9f03-c80682ee2fd9', 'f0bda605-5fec-42e8-a333-9ba59dd64174', '1a401d61-099b-421d-9159-3fb34664f6cd', 'som-tam-salad', 'Som Tam Salad', 'Spicy green papaya salad with lime', 12.95, NULL, '{salad,spicy,healthy,gluten-free}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:37:31.612158+00', '2026-02-13 01:37:31.612158+00', NULL),
	('e720646e-272e-47b0-b1fd-31ee35a933b8', 'f0bda605-5fec-42e8-a333-9ba59dd64174', '1a401d61-099b-421d-9159-3fb34664f6cd', 'chicken-satay', 'Chicken Satay', '5pc grilled chicken skewers with peanut sauce', 14.95, NULL, '{appetizer,high-protein,grilled}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:37:31.612158+00', '2026-02-13 01:37:31.612158+00', NULL),
	('12cc54f4-7d26-4986-9690-ef8073849fb4', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', '95ebcf29-535f-4aad-b3e5-93459986fc20', 'quinoa-power-bowl', 'Quinoa Power Bowl', 'Quinoa, roasted vegetables, avocado, tahini dressing', 16.95, NULL, '{bowl,vegetarian,healthy,high-protein,gluten-free}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.023943+00', '2026-02-13 01:38:59.023943+00', NULL),
	('c9cf8f18-156c-4688-a7f4-5df857449a4c', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', '95ebcf29-535f-4aad-b3e5-93459986fc20', 'buddha-bowl', 'Buddha Bowl', 'Brown rice, chickpeas, kale, sweet potato, hemp seeds', 15.95, NULL, '{bowl,vegan,healthy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.023943+00', '2026-02-13 01:38:59.023943+00', NULL),
	('0375454e-dbf4-47c6-bcf2-7c1b01faf9e3', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', '95ebcf29-535f-4aad-b3e5-93459986fc20', 'acai-berry-bowl', 'Acai Berry Bowl', 'Acai base with granola, fresh berries, coconut', 14.95, NULL, '{bowl,vegan,healthy,antioxidants}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.023943+00', '2026-02-13 01:38:59.023943+00', NULL),
	('009c7405-3250-4f0a-b3e3-bc35079c19b3', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', '51bef98d-3fc1-4ef7-91fe-f73e94c38d97', 'kale-caesar-salad', 'Kale Caesar Salad', 'Massaged kale, cashew parmesan, hemp croutons', 14.95, NULL, '{salad,vegetarian,healthy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.023943+00', '2026-02-13 01:38:59.023943+00', NULL),
	('b4e59453-8fe9-4c09-99fe-be81e961b4cf', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', '51bef98d-3fc1-4ef7-91fe-f73e94c38d97', 'rainbow-veggie-salad', 'Rainbow Veggie Salad', 'Mixed greens, rainbow vegetables, lemon vinaigrette', 13.95, NULL, '{salad,vegan,healthy,gluten-free}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.023943+00', '2026-02-13 01:38:59.023943+00', NULL),
	('248f233b-5662-41a5-ab7c-5a7237922bce', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', '3caaffaa-2f4e-45b6-be50-d3cc523de3ba', 'green-goddess-smoothie', 'Green Goddess Smoothie', 'Spinach, mango, pineapple, coconut water, protein', 9.95, NULL, '{smoothie,vegan,healthy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.023943+00', '2026-02-13 01:38:59.023943+00', NULL),
	('ae5194b5-e5a4-4c26-bc8a-721b9bdb051c', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', '3caaffaa-2f4e-45b6-be50-d3cc523de3ba', 'cold-pressed-green-juice', 'Cold-Pressed Green Juice', 'Kale, cucumber, celery, apple, ginger, lemon', 8.95, NULL, '{juice,vegan,healthy,detox}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.023943+00', '2026-02-13 01:38:59.023943+00', NULL),
	('a4fb3ecf-9e47-4eef-8e23-b61073b01c5a', '74d9b417-367d-4242-a4b5-78fc89ff49f6', '2e04ba17-7655-4b7d-bccf-a58da89dbe49', 'grass-fed-beef-steak', 'Grass-Fed Beef Steak', 'Local grass-fed sirloin with seasonal vegetables', 28.95, NULL, '{steak,grass-fed,high-protein,local}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028006+00', '2026-02-13 01:38:59.028006+00', NULL),
	('cb07d33b-0cf4-45e9-9f51-e96748442467', '74d9b417-367d-4242-a4b5-78fc89ff49f6', '2e04ba17-7655-4b7d-bccf-a58da89dbe49', 'farm-chicken-breast', 'Farm Chicken Breast', 'Free-range chicken with herb roasted potatoes', 24.95, NULL, '{chicken,free-range,healthy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028006+00', '2026-02-13 01:38:59.028006+00', NULL),
	('7d8c0dbd-2e76-4700-9d9e-e3f7f603d721', '74d9b417-367d-4242-a4b5-78fc89ff49f6', '2e04ba17-7655-4b7d-bccf-a58da89dbe49', 'pan-seared-salmon', 'Pan-Seared Salmon', 'Wild-caught salmon with quinoa and green vegetables', 26.95, NULL, '{salmon,wild-caught,healthy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028006+00', '2026-02-13 01:38:59.028006+00', NULL),
	('7e63271d-3234-4c78-8236-a40f1d620d37', '74d9b417-367d-4242-a4b5-78fc89ff49f6', 'ccae79c1-30ca-4ca0-bf1e-f17f197a70c4', 'farm-fresh-salad', 'Farm Fresh Salad', 'Mixed greens from our garden with seasonal toppings', 12.95, NULL, '{salad,vegetarian,healthy,local}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028006+00', '2026-02-13 01:38:59.028006+00', NULL),
	('b2309351-f787-4d4f-92e9-ff15fa280c3e', '74d9b417-367d-4242-a4b5-78fc89ff49f6', 'ccae79c1-30ca-4ca0-bf1e-f17f197a70c4', 'roasted-beet-hummus', 'Roasted Beet Hummus', 'House-made hummus with garden vegetables', 10.95, NULL, '{appetizer,vegetarian,healthy}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028006+00', '2026-02-13 01:38:59.028006+00', NULL),
	('f0fcda4d-48f3-47f4-8517-6681d154c494', '74d9b417-367d-4242-a4b5-78fc89ff49f6', 'c97144e0-b14c-4821-9081-efdd60b2c193', 'roasted-root-vegetables', 'Roasted Root Vegetables', 'Seasonal root vegetables roasted in herbs', 8.95, NULL, '{side,vegetarian,healthy,local}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028006+00', '2026-02-13 01:38:59.028006+00', NULL),
	('08034323-d951-44aa-8e0c-dbe832176fb0', '74d9b417-367d-4242-a4b5-78fc89ff49f6', 'c97144e0-b14c-4821-9081-efdd60b2c193', 'quinoa-pilaf', 'Quinoa Pilaf', 'Herbed quinoa with toasted nuts and dried fruit', 7.95, NULL, '{side,vegetarian,healthy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028006+00', '2026-02-13 01:38:59.028006+00', NULL),
	('1d746764-17b1-46ca-84b8-e710b0678d9a', 'c711070d-8016-434c-b260-162fb23430ed', 'fa026916-8ab9-43cf-b9bb-0bbc7971608c', 'carne-asada-tacos', 'Carne Asada Tacos', '3 grilled steak tacos with onions and cilantro', 16.95, NULL, '{tacos,beef,high-protein,gluten-free}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028673+00', '2026-02-13 01:38:59.028673+00', NULL),
	('ee9f7df6-5a37-494e-a6ce-432515238f37', 'c711070d-8016-434c-b260-162fb23430ed', 'fa026916-8ab9-43cf-b9bb-0bbc7971608c', 'chicken-quesadilla', 'Chicken Quesadilla', 'Grilled chicken, cheese, peppers in flour tortilla', 14.95, NULL, '{quesadilla,chicken,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028673+00', '2026-02-13 01:38:59.028673+00', NULL),
	('dfb7e2a1-b5ef-443c-ad3d-150ff5c7eba8', 'c711070d-8016-434c-b260-162fb23430ed', 'fa026916-8ab9-43cf-b9bb-0bbc7971608c', 'fish-tacos', 'Fish Tacos', '3 blackened fish tacos with cabbage slaw', 17.95, NULL, '{tacos,fish,healthy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028673+00', '2026-02-13 01:38:59.028673+00', NULL),
	('8d70bb4e-552a-498e-b2be-36fdae3855ef', 'c711070d-8016-434c-b260-162fb23430ed', 'a07bfac2-31f0-4700-9cff-a7cf1afa0ca9', 'chicken-fajitas', 'Chicken Fajitas', 'Sizzling chicken with peppers and onions', 19.95, NULL, '{entree,chicken,high-protein,gluten-free}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028673+00', '2026-02-13 01:38:59.028673+00', NULL),
	('3c7331aa-d209-41f2-830e-a84a0a8797b5', 'c711070d-8016-434c-b260-162fb23430ed', 'a07bfac2-31f0-4700-9cff-a7cf1afa0ca9', 'carnitas-bowl', 'Carnitas Bowl', 'Slow-cooked pork with rice, beans, and toppings', 18.95, NULL, '{bowl,pork,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028673+00', '2026-02-13 01:38:59.028673+00', NULL),
	('29822c98-bb0e-43d7-9b15-cf9fee27a40e', 'c711070d-8016-434c-b260-162fb23430ed', 'e6eb903f-5e46-441f-8a4d-1f795c34e526', 'guacamole-and-chips', 'Guacamole & Chips', 'Fresh guacamole with warm tortilla chips', 9.95, NULL, '{appetizer,vegetarian,gluten-free}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028673+00', '2026-02-13 01:38:59.028673+00', NULL),
	('e106e7c5-1a83-41b5-a7dd-efdb297b7825', 'c711070d-8016-434c-b260-162fb23430ed', 'e6eb903f-5e46-441f-8a4d-1f795c34e526', 'black-beans-and-rice', 'Black Beans & Rice', 'Seasoned black beans with cilantro lime rice', 6.95, NULL, '{side,vegetarian,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028673+00', '2026-02-13 01:38:59.028673+00', NULL),
	('9e5600ae-3a0d-47cd-a8bd-1a30f04cc623', 'ecc3f603-5ba1-466a-b79e-0005818d7fcf', '013dbf9d-f278-46b5-a794-828d1bb8312c', 'butter-chicken', 'Butter Chicken', 'Tender chicken in creamy tomato curry sauce', 19.95, NULL, '{curry,chicken,mild,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:40:24.888639+00', '2026-02-13 01:40:24.888639+00', NULL),
	('f7cea9fe-0aa1-4b76-9156-d66a0d783cd6', 'ecc3f603-5ba1-466a-b79e-0005818d7fcf', '013dbf9d-f278-46b5-a794-828d1bb8312c', 'lamb-vindaloo', 'Lamb Vindaloo', 'Spicy lamb curry with potatoes and vinegar', 23.95, NULL, '{curry,lamb,spicy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:40:24.888639+00', '2026-02-13 01:40:24.888639+00', NULL),
	('27dba466-937c-41b7-b560-9cb81a2a86be', 'ecc3f603-5ba1-466a-b79e-0005818d7fcf', '013dbf9d-f278-46b5-a794-828d1bb8312c', 'palak-paneer', 'Palak Paneer', 'Fresh spinach curry with cottage cheese', 16.95, NULL, '{curry,vegetarian,healthy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:40:24.888639+00', '2026-02-13 01:40:24.888639+00', NULL),
	('481443fa-b114-4a68-b1d1-84d20319318b', 'ecc3f603-5ba1-466a-b79e-0005818d7fcf', '4b8fcde9-ae51-470e-b9ad-caa18cd3f43b', 'tandoori-chicken-bombay', 'Tandoori Chicken', 'Half chicken marinated in yogurt and spices', 22.95, NULL, '{tandoor,chicken,spicy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:41:23.774398+00', '2026-02-13 01:41:23.774398+00', NULL),
	('537c1b4a-860f-45d0-a144-dad10f0739cf', '74d9b417-367d-4242-a4b5-78fc89ff49f6', '41e52427-a7d8-406b-9979-832b374791d6', 'seasonal-fruit-tart', 'Seasonal Fruit Tart', 'Vanilla custard tart with seasonal farm-fresh fruit', 8.95, NULL, '{dessert,vegetarian,contains-dairy,seasonal}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:43:58.600542+00', '2026-02-13 01:43:58.600542+00', NULL),
	('705f3227-149b-4f8f-8143-c5a7862ae01b', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', '88c6a934-390d-4847-9322-84c5c261d693', 'rum-cake-caribbean', 'Rum Cake', 'Traditional Caribbean rum cake with vanilla glaze', 7.95, NULL, '{dessert,contains-alcohol,caribbean}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:44:07.701833+00', '2026-02-13 16:41:58.017+00', 'https://images.pexels.com/photos/26076163/pexels-photo-26076163.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
	('cbc83e75-b56a-4726-a132-1de6f5ef0eea', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', '0d0a1bce-67ef-4bb7-8ffd-d52a4bde06e3', 'coconut-shrimp', 'Coconut Shrimp', 'Jumbo shrimp in coconut flakes with pineapple chutney', 12.50, NULL, '{appetizer,seafood,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:26:36.741248+00', '2026-02-13 01:26:36.741248+00', 'https://images.pexels.com/photos/30750651/pexels-photo-30750651.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
	('d32de6ea-2702-47d0-8906-2e253d4bd4f4', '74d9b417-367d-4242-a4b5-78fc89ff49f6', '41e52427-a7d8-406b-9979-832b374791d6', 'classic-cheesecake-harvest', 'Classic New York Cheesecake', 'Rich cheesecake with graham cracker crust, topped with chocolate drizzle and fresh berries', 9.95, NULL, '{dessert,vegetarian,contains-dairy,chocolate-drizzle}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:43:58.600542+00', '2026-02-13 01:43:58.600542+00', 'https://images.pexels.com/photos/33987758/pexels-photo-33987758.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
	('6e07b7fc-6f20-4426-98f3-6655f765b3f9', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', '88c6a934-390d-4847-9322-84c5c261d693', 'tropical-cheesecake-caribbean', 'Tropical Coconut Cheesecake', 'Creamy coconut cheesecake with lime zest and mango puree, no chocolate', 9.95, NULL, '{dessert,vegetarian,coconut,tropical,no-chocolate}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:44:07.701833+00', '2026-02-13 01:44:07.701833+00', 'https://images.pexels.com/photos/30750651/pexels-photo-30750651.jpeg?auto=compress&cs=tinysrgb&h=650&w=940');


--
-- Data for Name: fc_cart_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."fc_cart_items" ("id", "cart_id", "menu_item_id", "quantity", "base_price", "total_price", "instructions", "created_at", "updated_at") VALUES
	('0c014c99-ad14-4c69-aa89-09dfa38860d1', '8e7ae9cf-6479-4169-a736-c126cd7ecf08', 'e5d12473-cbb1-4b8f-8c2c-a4a058df80aa', 1, 18.95, 18.95, NULL, '2026-02-13 16:13:32.285483+00', '2026-02-13 16:13:32.285483+00'),
	('bbc4e06c-c62c-43ac-94d5-57c6e057be42', '8e7ae9cf-6479-4169-a736-c126cd7ecf08', 'cbc83e75-b56a-4726-a132-1de6f5ef0eea', 1, 12.50, 12.50, NULL, '2026-02-13 16:13:32.284991+00', '2026-02-13 16:13:32.284991+00'),
	('ca836ea1-54a4-4af3-bb5f-33624fdd3c26', '9bd8cf23-8389-4341-a79e-477f56c38e35', 'e5d12473-cbb1-4b8f-8c2c-a4a058df80aa', 1, 18.95, 18.95, NULL, '2026-02-13 16:38:04.945052+00', '2026-02-13 16:38:04.945052+00'),
	('f048bad2-72ab-4a27-a087-dfa103d72cb6', '9bd8cf23-8389-4341-a79e-477f56c38e35', 'cbc83e75-b56a-4726-a132-1de6f5ef0eea', 1, 12.50, 12.50, NULL, '2026-02-13 16:38:04.945994+00', '2026-02-13 16:38:04.945994+00'),
	('ab184091-2a00-4720-ad77-31e667ea8b5e', '1a9e5537-c5db-4d4f-aebf-bc7d26e8b923', '705f3227-149b-4f8f-8143-c5a7862ae01b', 1, 7.95, 7.95, NULL, '2026-02-13 16:42:20.420284+00', '2026-02-13 16:42:20.420284+00'),
	('c4aa5683-ff3d-4913-8d07-53f44b5c7e57', '2fc3ac6a-410b-4db4-9552-9aa98bdb11d5', 'cbc83e75-b56a-4726-a132-1de6f5ef0eea', 1, 12.50, 12.50, NULL, '2026-02-13 18:36:07.413665+00', '2026-02-13 18:36:07.413665+00');


--
-- Data for Name: fc_menu_item_option_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: fc_menu_item_option_choices; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: fc_cart_item_options; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: fc_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: fc_feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: fc_layouts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: fc_order_events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: fc_order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: fc_order_item_options; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: fc_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--


--
-- PostgreSQL database dump complete
--

RESET ALL;
