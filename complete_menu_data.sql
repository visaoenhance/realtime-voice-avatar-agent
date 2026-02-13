-- Complete menu data for all remaining restaurants

-- Green Garden Bowls (Plant-forward)
INSERT INTO fc_menu_items (section_id, restaurant_id, name, description, base_price, dietary_tags, is_available, slug) VALUES
-- Power Bowls
('95ebcf29-535f-4aad-b3e5-93459986fc20', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', 'Quinoa Power Bowl', 'Quinoa, roasted vegetables, avocado, tahini dressing', 16.95, '{bowl,vegetarian,healthy,high-protein,gluten-free}', true, 'quinoa-power-bowl'),
('95ebcf29-535f-4aad-b3e5-93459986fc20', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', 'Buddha Bowl', 'Brown rice, chickpeas, kale, sweet potato, hemp seeds', 15.95, '{bowl,vegan,healthy,high-protein}', true, 'buddha-bowl'),
('95ebcf29-535f-4aad-b3e5-93459986fc20', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', 'Acai Berry Bowl', 'Acai base with granola, fresh berries, coconut', 14.95, '{bowl,vegan,healthy,antioxidants}', true, 'acai-berry-bowl'),
-- Fresh Salads  
('51bef98d-3fc1-4ef7-91fe-f73e94c38d97', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', 'Kale Caesar Salad', 'Massaged kale, cashew parmesan, hemp croutons', 14.95, '{salad,vegetarian,healthy,high-protein}', true, 'kale-caesar-salad'),
('51bef98d-3fc1-4ef7-91fe-f73e94c38d97', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', 'Rainbow Veggie Salad', 'Mixed greens, rainbow vegetables, lemon vinaigrette', 13.95, '{salad,vegan,healthy,gluten-free}', true, 'rainbow-veggie-salad'),
-- Smoothies & Juices
('3caaffaa-2f4e-45b6-be50-d3cc523de3ba', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', 'Green Goddess Smoothie', 'Spinach, mango, pineapple, coconut water, protein', 9.95, '{smoothie,vegan,healthy,high-protein}', true, 'green-goddess-smoothie'),
('3caaffaa-2f4e-45b6-be50-d3cc523de3ba', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', 'Cold-Pressed Green Juice', 'Kale, cucumber, celery, apple, ginger, lemon', 8.95, '{juice,vegan,healthy,detox}', true, 'cold-pressed-green-juice');

-- Harvest & Hearth Kitchen (Farm-to-table)  
INSERT INTO fc_menu_items (section_id, restaurant_id, name, description, base_price, dietary_tags, is_available, slug) VALUES
-- Farm Fresh Mains
('2e04ba17-7655-4b7d-bccf-a58da89dbe49', '74d9b417-367d-4242-a4b5-78fc89ff49f6', 'Grass-Fed Beef Steak', 'Local grass-fed sirloin with seasonal vegetables', 28.95, '{steak,grass-fed,high-protein,local}', true, 'grass-fed-beef-steak'),
('2e04ba17-7655-4b7d-bccf-a58da89dbe49', '74d9b417-367d-4242-a4b5-78fc89ff49f6', 'Farm Chicken Breast', 'Free-range chicken with herb roasted potatoes', 24.95, '{chicken,free-range,healthy,high-protein}', true, 'farm-chicken-breast'),
('2e04ba17-7655-4b7d-bccf-a58da89dbe49', '74d9b417-367d-4242-a4b5-78fc89ff49f6', 'Pan-Seared Salmon', 'Wild-caught salmon with quinoa and green vegetables', 26.95, '{salmon,wild-caught,healthy,high-protein}', true, 'pan-seared-salmon'),
-- Garden Starters
('ccae79c1-30ca-4ca0-bf1e-f17f197a70c4', '74d9b417-367d-4242-a4b5-78fc89ff49f6', 'Farm Fresh Salad', 'Mixed greens from our garden with seasonal toppings', 12.95, '{salad,vegetarian,healthy,local}', true, 'farm-fresh-salad'),
('ccae79c1-30ca-4ca0-bf1e-f17f197a70c4', '74d9b417-367d-4242-a4b5-78fc89ff49f6', 'Roasted Beet Hummus', 'House-made hummus with garden vegetables', 10.95, '{appetizer,vegetarian,healthy}', true, 'roasted-beet-hummus'),
-- Hearth Sides
('c97144e0-b14c-4821-9081-efdd60b2c193', '74d9b417-367d-4242-a4b5-78fc89ff49f6', 'Roasted Root Vegetables', 'Seasonal root vegetables roasted in herbs', 8.95, '{side,vegetarian,healthy,local}', true, 'roasted-root-vegetables'),
('c97144e0-b14c-4821-9081-efdd60b2c193', '74d9b417-367d-4242-a4b5-78fc89ff49f6', 'Quinoa Pilaf', 'Herbed quinoa with toasted nuts and dried fruit', 7.95, '{side,vegetarian,healthy,high-protein}', true, 'quinoa-pilaf');

-- Sabor Latino Cantina (Mexican)
INSERT INTO fc_menu_items (section_id, restaurant_id, name, description, base_price, dietary_tags, is_available, slug) VALUES
-- Tacos & Quesadillas
('fa026916-8ab9-43cf-b9bb-0bbc7971608c', 'c711070d-8016-434c-b260-162fb23430ed', 'Carne Asada Tacos', '3 grilled steak tacos with onions and cilantro', 16.95, '{tacos,beef,high-protein,gluten-free}', true, 'carne-asada-tacos'),
('fa026916-8ab9-43cf-b9bb-0bbc7971608c', 'c711070d-8016-434c-b260-162fb23430ed', 'Chicken Quesadilla', 'Grilled chicken, cheese, peppers in flour tortilla', 14.95, '{quesadilla,chicken,high-protein}', true, 'chicken-quesadilla'),
('fa026916-8ab9-43cf-b9bb-0bbc7971608c', 'c711070d-8016-434c-b260-162fb23430ed', 'Fish Tacos', '3 blackened fish tacos with cabbage slaw', 17.95, '{tacos,fish,healthy,high-protein}', true, 'fish-tacos'),
-- Entrees  
('a07bfac2-31f0-4700-9cff-a7cf1afa0ca9', 'c711070d-8016-434c-b260-162fb23430ed', 'Chicken Fajitas', 'Sizzling chicken with peppers and onions', 19.95, '{entree,chicken,high-protein,gluten-free}', true, 'chicken-fajitas'),
('a07bfac2-31f0-4700-9cff-a7cf1afa0ca9', 'c711070d-8016-434c-b260-162fb23430ed', 'Carnitas Bowl', 'Slow-cooked pork with rice, beans, and toppings', 18.95, '{bowl,pork,high-protein}', true, 'carnitas-bowl'),
-- Sides & Appetizers
('e6eb903f-5e46-441f-8a4d-1f795c34e526', 'c711070d-8016-434c-b260-162fb23430ed', 'Guacamole & Chips', 'Fresh guacamole with warm tortilla chips', 9.95, '{appetizer,vegetarian,gluten-free}', true, 'guacamole-and-chips'),
('e6eb903f-5e46-441f-8a4d-1f795c34e526', 'c711070d-8016-434c-b260-162fb23430ed', 'Black Beans & Rice', 'Seasoned black beans with cilantro lime rice', 6.95, '{side,vegetarian,high-protein}', true, 'black-beans-and-rice');

-- Get Bombay Spice House section IDs
SELECT s.id, s.name FROM fc_menu_sections s 
JOIN fc_restaurants r ON s.restaurant_id = r.id 
WHERE r.slug = 'bombay-spice-house' 
ORDER BY s.display_order;