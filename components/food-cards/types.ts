// TypeScript interfaces for Food Court Chat Cards

export interface CustomerProfile {
  favoriteCuisines: string[];
  dislikedCuisines: string[];
  dietaryTags: string[];
  spiceLevel: 'low' | 'medium' | 'high';
  budgetRange: 'value' | 'standard' | 'premium';
  notes?: string;
}

export interface Location {
  city: string;
  state: string;
  lat?: number;
  lng?: number;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  cuisineGroup: string;
  rating?: number;
  etaMinutes?: number;
  closesAt?: string;
  standoutDish?: string;
  deliveryFee?: number;
  promo?: string;
  heroImage?: string;
  address?: string;
  phone?: string;
  highlights?: string[];
  dietaryTags?: string[];
  priceTier?: 'low' | 'medium' | 'high';
}

export interface MenuItem {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  tags: string[];
  calories?: number;
  rating?: number;
  sectionTitle?: string;
  restaurantId?: string;
  restaurantSlug?: string;
  restaurantName?: string;
  image?: string;
}

export interface MenuSection {
  id: string;
  slug: string;
  title: string;
  description?: string;
  position: number;
  items: MenuItem[];
}

export interface CartItem {
  id: string;
  menuItemId: string;
  menuItemSlug?: string;
  name: string;
  quantity: number;
  basePrice: number;
  totalPrice: number;
  options: string[];
  instructions?: string;
  lineTotal: number;
}

export interface Cart {
  id: string;
  restaurantId: string;
  restaurantSlug?: string;
  restaurantName?: string;
  status: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee?: number;
  tax?: number;
  total?: number;
  itemCount: number;
  updatedAt?: string;
}

export interface Order {
  id: string;
  restaurantId: string;
  restaurantName: string;
  cuisine: string;
  total: number;
  itemCount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out-for-delivery' | 'delivered';
  estimatedDeliveryTime?: string;
  createdAt: string;
  rating?: number;
  satisfactionNotes?: string;
}

// Tool result payload interfaces
export interface CustomerProfileData {
  profile: CustomerProfile;
  recentOrders: Order[];
  speechSummary: string;
  lastUpdated: string;
  summary: string;
  defaultLocation?: Location;
}

export interface RestaurantSearchData {
  filters: {
    location?: string;
    cuisine?: string;
    subCuisine?: string;
    dietaryTags?: string[];
    budget?: string;
    closesWithinMinutes?: number;
    currentLocation?: Location;
    useDefaultLocation?: boolean;
  };
  results: Restaurant[];
  speechSummary: string;
}

export interface RestaurantMenuData {
  restaurant: Restaurant;
  sections: MenuSection[];
  speechSummary: string;
}

export interface MenuItemSearchData {
  restaurant?: Restaurant;
  results: MenuItem[];
  filters: {
    query?: string;
    maxPrice?: number;
    tags?: string[];
  };
  speechSummary: string;
}

export interface CartData {
  success: boolean;
  cartId: string;
  createdCart?: boolean;
  itemId?: string;
  restaurant: Restaurant;
  item?: {
    id: string;
    slug: string;
    name: string;
    quantity: number;
    linePrice: number;
    options: any[];
  };
  subtotal: number;
  cart: Cart;
  speechSummary: string;
}

export interface ImagePreviewData {
  success: boolean;
  imageUrl?: string;
  restaurant?: Restaurant;
  menuItem: {
    id?: string;
    slug?: string;
    name?: string;
    price?: number;
    tags?: string[];
    description?: string;
    calories?: number;
  };
  speechSummary: string;
  message?: string;
}

export interface RecommendationData {
  shortlist: string[];
  tone?: 'concise' | 'detailed';
  speechSummary: string;
}

export interface OrderConfirmationData {
  success: boolean;
  orderId: string;
  restaurant: Restaurant;
  itemCount: number;
  total: number;
  estimatedDeliveryTime?: string;
  speechSummary: string;
  message?: string;
}

// Base card props
export interface BaseCardProps {
  className?: string;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  accent?: 'emerald' | 'blue' | 'amber' | 'red';
  size?: 'sm' | 'md' | 'lg';
}

// Individual card component props
export interface CustomerProfileCardProps {
  data: CustomerProfileData;
}

export interface RestaurantSearchCardProps {
  data: RestaurantSearchData;
}

export interface RestaurantMenuCardProps {
  data: RestaurantMenuData;
}

export interface MenuItemSpotlightCardProps {
  data: MenuItemSearchData;
}

export interface ShoppingCartCardProps {
  data: CartData;
}

export interface FoodImagePreviewCardProps {
  data: ImagePreviewData;
}

export interface RestaurantRecommendationCardProps {
  data: RecommendationData;
}

export interface OrderConfirmationCardProps {
  data: OrderConfirmationData;
}