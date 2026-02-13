-- Add menu items for Island Breeze Caribbean

-- Add appetizers  
INSERT INTO fc_menu_items (section_id, restaurant_id, name, description, base_price, tags, is_available, slug) VALUES
('0d0a1bce-67ef-4bb7-8ffd-d52a4bde06e3', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'Plantain Chips', 'Crispy fried plantains with spicy mojo sauce', 8.95, '{appetizer,crispy,spicy,gluten-free}', true, 'plantain-chips'),
('0d0a1bce-67ef-4bb7-8ffd-d52a4bde06e3', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'Coconut Shrimp', 'Jumbo shrimp in coconut flakes with pineapple chutney', 12.50, '{appetizer,seafood,high-protein}', true, 'coconut-shrimp');

-- Add main dishes
INSERT INTO fc_menu_items (section_id, restaurant_id, name, description, base_price, tags, is_available, slug) VALUES
('cb69c53c-50a6-4a70-968d-904492b27ef7', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'Jerk Chicken', 'Grilled chicken with authentic jerk seasoning', 18.95, '{main,chicken,spicy,high-protein}', true, 'jerk-chicken'),
('cb69c53c-50a6-4a70-968d-904492b27ef7', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'Curry Goat', 'Tender goat slow-cooked in Caribbean curry spices', 22.95, '{main,curry,spicy,high-protein}', true, 'curry-goat'),
('cb69c53c-50a6-4a70-968d-904492b27ef7', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'Grilled Mahi Mahi', 'Fresh fish with tropical fruit salsa', 24.95, '{main,seafood,healthy,high-protein}', true, 'grilled-mahi-mahi');

-- Add sides
INSERT INTO fc_menu_items (section_id, restaurant_id, name, description, base_price, tags, is_available, slug) VALUES
('4b4139d6-e647-42b8-95cc-d03f3c141f0a', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'Rice & Peas', 'Traditional coconut rice with kidney beans', 6.95, '{side,vegetarian,gluten-free}', true, 'rice-and-peas'),
('4b4139d6-e647-42b8-95cc-d03f3c141f0a', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'Festival', 'Sweet fried dumplings (pair of 2)', 4.95, '{side,vegetarian,sweet}', true, 'festival');

SELECT 'Menu items added successfully' as status;