export type MenuOption = {
  id: string;
  label: string;
  priceAdjustment?: number;
  description?: string;
};

export type MenuOptionGroup = {
  id: string;
  title: string;
  required?: boolean;
  min?: number;
  max?: number;
  options: MenuOption[];
  helpText?: string;
};

export type MenuItem = {
  slug: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  calories?: number;
  rating?: number;
  ratingsCount?: number;
  mostLikedRank?: number;
  tags?: string[];
  optionGroups?: MenuOptionGroup[];
  badges?: string[];
  preparationTime?: string;
};

export type MenuCategory = {
  slug: string;
  title: string;
  description?: string;
  items: MenuItem[];
};

export const SAMPLE_MENU_BY_RESTAURANT: Record<string, MenuCategory[]> = {
  'island-breeze-caribbean': [
    {
      slug: 'featured-items',
      title: 'Featured items',
      items: [
        {
          slug: 'chimichurri-bistro-filet',
          name: 'Chimichurri Bistro Filet',
          description:
            '8oz sliced, chef-crafted chimichurri, served with French fries and broccoli. Includes two sides and temperature preference.',
          price: 30.9,
          calories: 1400,
          rating: 4.8,
          ratingsCount: 24,
          mostLikedRank: 1,
          tags: ['#1 most liked', 'Gluten-free friendly'],
          image:
            'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1400&q=80',
          optionGroups: [
            {
              id: 'temperature',
              title: 'Temperature Options',
              required: true,
              min: 1,
              max: 1,
              options: [
                { id: 'rare', label: 'Rare: Cool Red Center' },
                { id: 'medium-rare', label: 'Medium Rare: Warm Red Center' },
                { id: 'medium', label: 'Medium: Warm Pink Center/Touch of Red' },
                { id: 'medium-well', label: 'Medium Well: Warm Brown/Pink Center' },
                { id: 'well', label: 'Well: Hot Brown Center/No Pink' },
              ],
            },
            {
              id: 'side-1',
              title: 'Side Option',
              required: true,
              min: 1,
              max: 1,
              options: [
                { id: 'fries', label: 'French Fries' },
                { id: 'jasmine-rice', label: 'Jasmine Rice' },
                { id: 'garlic-potatoes', label: 'Garlic Whipped Potatoes' },
                { id: 'steamed-asparagus', label: 'Steamed Asparagus' },
                { id: 'broccoli', label: 'Broccoli' },
                { id: 'no-side', label: 'No Side' },
                { id: 'roasted-potatoes', label: 'Roasted New Potatoes' },
                { id: 'pumpkin-ravioli', label: 'Pumpkin Ravioli', priceAdjustment: 4.5 },
              ],
            },
            {
              id: 'side-2',
              title: 'Side Option',
              required: true,
              min: 1,
              max: 1,
              options: [
                { id: 'broccoli-2', label: 'Broccoli' },
                { id: 'garlic-potatoes-2', label: 'Garlic Whipped Potatoes' },
                { id: 'fries-2', label: 'French Fries' },
                { id: 'jasmine-rice-2', label: 'Jasmine Rice' },
                { id: 'steamed-asparagus-2', label: 'Steamed Asparagus' },
                { id: 'no-side-2', label: 'No Side' },
              ],
            },
            {
              id: 'add-ons',
              title: 'Entrée Add-On',
              required: false,
              min: 0,
              max: 4,
              options: [
                { id: 'crab-cake', label: 'Add Crab Cake', priceAdjustment: 8.9 },
                { id: 'bang-bang-shrimp', label: 'Add Bang Bang Shrimp', priceAdjustment: 9.9 },
                { id: 'lobster-tail', label: 'Add Lobster Tail', priceAdjustment: 13.9 },
              ],
              helpText: 'Choose up to 4',
            },
            {
              id: 'soup-salad',
              title: 'Soup or Salad Add-on',
              required: false,
              min: 0,
              max: 1,
              options: [
                { id: 'house-salad', label: 'House Salad', priceAdjustment: 6.5 },
                { id: 'caesar-salad', label: 'Caesar Salad', priceAdjustment: 6.5 },
                { id: 'corn-chowder-cup', label: 'Corn Chowder & Lump Crab – Cup', priceAdjustment: 6.5 },
                { id: 'corn-chowder-bowl', label: 'Corn Chowder & Lump Crab – Bowl', priceAdjustment: 7.5 },
                { id: 'tomato-bisque-cup', label: 'Tomato Bisque Cup', priceAdjustment: 8.9 },
                { id: 'tomato-bisque-bowl', label: 'Tomato Bisque Bowl', priceAdjustment: 9.9 },
              ],
            },
          ],
        },
        {
          slug: 'dynamite-salmon',
          name: 'Dynamite Salmon',
          description:
            'Wood-grilled Atlantic salmon topped with dynamite aioli. Comes with two signature sides.',
          price: 27.9,
          calories: 930,
          rating: 4.7,
          ratingsCount: 16,
          mostLikedRank: 3,
          tags: ['#3 most liked'],
          image:
            'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1400&q=80',
          optionGroups: [
            {
              id: 'side-primary',
              title: 'Side Option',
              required: true,
              min: 1,
              max: 1,
              options: [
                { id: 'jasmine-rice-salmon', label: 'Jasmine Rice' },
                { id: 'garlic-potatoes-salmon', label: 'Garlic Whipped Potatoes' },
                { id: 'seasonal-veg', label: 'Seasonal Vegetables' },
              ],
            },
          ],
        },
        {
          slug: 'bourbon-glazed-salmon',
          name: 'Bourbon Glazed Salmon',
          description:
            'Pan-seared salmon finished with a smoky bourbon glaze, served with green beans and potatoes.',
          price: 28.9,
          calories: 930,
          rating: 4.6,
          ratingsCount: 21,
          mostLikedRank: 4,
          image:
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80',
        },
      ],
    },
    {
      slug: 'soups-and-greens',
      title: 'Soups & Greens',
      items: [
        {
          slug: 'corn-chowder',
          name: 'Corn Chowder & Lump Crab – Cup',
          price: 6.5,
          description: 'Roasted corn chowder finished with lump crab and a touch of sherry.',
        },
        {
          slug: 'house-salad',
          name: 'House Salad',
          price: 6.5,
          description: 'Romaine, tomatoes, kalamata olives, hearts of palm, citrus herb vinaigrette.',
        },
      ],
    },
    {
      slug: 'sides',
      title: 'Sides',
      items: [
        { slug: 'french-fries', name: 'French Fries', price: 4.5 },
        { slug: 'garlic-whipped-potatoes', name: 'Garlic Whipped Potatoes', price: 4.5 },
        { slug: 'broccoli-side', name: 'Broccoli', price: 4 },
      ],
    },
  ],
  'green-garden-bowls': [
    {
      slug: 'signature-bowls',
      title: 'Signature Bowls',
      items: [
        {
          slug: 'caribbean-quinoa-bowl',
          name: 'Caribbean Quinoa Bowl',
          description: 'Citrus-marinated shrimp, quinoa, grilled pineapple, pickled slaw, citrus vinaigrette.',
          price: 15.5,
          calories: 640,
          tags: ['Gluten-free friendly'],
          image:
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1400&q=80',
        },
        {
          slug: 'harissa-chickpea-bowl',
          name: 'Harissa Chickpea Bowl',
          description: 'Harissa-roasted chickpeas, smoky hummus, ancient grains, charred broccoli.',
          price: 13.25,
          calories: 520,
        },
      ],
    },
    {
      slug: 'fresh-press-juices',
      title: 'Fresh Press Juices',
      items: [
        {
          slug: 'pineapple-ginger-refresh',
          name: 'Pineapple Ginger Refresh',
          price: 6.5,
          description: 'Cold-pressed pineapple, ginger, mint, and sparkling water.',
        },
      ],
    },
  ],
  'noodle-express': [
    {
      slug: 'noodle-favorites',
      title: 'Noodle Favorites',
      items: [
        {
          slug: 'drunken-noodles',
          name: 'Drunken Noodles',
          description: 'Wide rice noodles, Thai basil, bell peppers, and chili garlic sauce.',
          price: 14.5,
          tags: ['Spicy'],
        },
        {
          slug: 'pad-thai',
          name: 'Pad Thai',
          description: 'Tamarind sauce, crushed peanuts, bean sprouts, choice of protein.',
          price: 13.75,
        },
      ],
    },
  ],

  'brick-oven-slice': [
    {
      slug: 'pizzas',
      title: 'Pizzas',
      items: [
        {
          slug: 'grandma-square',
          name: 'Grandma Square Pie',
          description: 'Thin crust, fresh mozzarella, San Marzano tomatoes, basil',
          price: 18.99,
          rating: 4.5,
          tags: ['Signature'],
          image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
        },
        {
          slug: 'pepperoni-pizza',
          name: 'Pepperoni Pizza',
          description: 'Classic pepperoni with mozzarella cheese',
          price: 16.99,
          tags: ['Classic'],
        },
      ],
    },
  ],

  'harvest-hearth-kitchen': [
    {
      slug: 'grain-bowls',
      title: 'Grain Bowls',
      items: [
        {
          slug: 'roasted-squash-bowl',
          name: 'Roasted Squash Grain Bowl',
          description: 'Roasted butternut squash, quinoa, kale, pomegranate seeds',
          price: 14.99,
          rating: 4.7,
          tags: ['Signature', 'Vegan'],
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
  ],

  'sabor-latino-cantina': [
    {
      slug: 'tacos',
      title: 'Tacos',
      description: 'Authentic Mexican tacos with house-made tortillas',
      items: [
        {
          slug: 'al-pastor-tacos',
          name: 'Al Pastor Tacos',
          description: 'Marinated pork with pineapple, onion, and cilantro on corn tortillas',
          price: 12.99,
          rating: 4.8,
          tags: ['Popular', 'Spicy'],
          image: 'https://images.unsplash.com/photo-1565299585323-38174c7c3013?auto=format&fit=crop&w=800&q=80',
        },
        {
          slug: 'carnitas-tacos',
          name: 'Carnitas Tacos',
          description: 'Slow-cooked pork with onions and cilantro',
          price: 11.99,
          tags: ['Traditional'],
        },
        {
          slug: 'fish-tacos',
          name: 'Fish Tacos',
          description: 'Grilled tilapia with cabbage slaw and chipotle crema',
          price: 13.99,
          tags: ['Fresh', 'Light'],
        },
      ],
    },
    {
      slug: 'entrees',
      title: 'Entrées',
      items: [
        {
          slug: 'chicken-burrito',
          name: 'Chicken Burrito',
          description: 'Seasoned chicken, rice, beans, cheese, lettuce, and salsa',
          price: 10.99,
          image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80',
        },
        {
          slug: 'beef-quesadilla',
          name: 'Beef Quesadilla',
          description: 'Grilled tortilla filled with seasoned beef and melted cheese',
          price: 9.99,
          tags: ['Comfort Food'],
        },
      ],
    },
    {
      slug: 'sides-drinks',
      title: 'Sides & Drinks',
      items: [
        {
          slug: 'chips-guacamole',
          name: 'Chips & Guacamole',
          description: 'Fresh tortilla chips with house-made guacamole',
          price: 6.99,
        },
        {
          slug: 'mexican-coke',
          name: 'Mexican Coke',
          description: 'Coca-Cola made with cane sugar',
          price: 2.99,
        },
      ],
    },
  ],
};

