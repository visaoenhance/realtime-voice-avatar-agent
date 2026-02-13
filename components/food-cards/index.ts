// Shared Component Exports for Food Court Chat Cards

// Base components
export { default as BaseCard } from './BaseCard'
export { CardSection, CardBadge, CardButton, CardMetric } from './BaseCard'

// Card components
export { default as CustomerProfileCard } from './CustomerProfileCard'
export { default as RestaurantSearchCard } from './RestaurantSearchCard'
export { default as RestaurantMenuCard } from './RestaurantMenuCard'
export { default as ShoppingCartCard } from './ShoppingCartCard'
export { default as MenuItemSpotlightCard } from './MenuItemSpotlightCard'
export { default as FoodImagePreviewCard } from './FoodImagePreviewCard'
export { default as RestaurantRecommendationCard } from './RestaurantRecommendationCard'
export { default as OrderConfirmationCard } from './OrderConfirmationCard'

// TypeScript interfaces
export * from './types'

// Re-exports for easy imports in food chat implementations
export type {
  // Core data interfaces
  CustomerProfile,
  Restaurant,
  MenuItem,
  MenuSection,
  CartItem,
  Cart,
  Order,
  Location,
  
  // Tool result data interfaces
  CustomerProfileData,
  RestaurantSearchData,
  RestaurantMenuData,
  MenuItemSearchData,
  CartData,
  ImagePreviewData,
  RecommendationData,
  OrderConfirmationData,
  
  // Component prop interfaces
  BaseCardProps,
  CustomerProfileCardProps,
  RestaurantSearchCardProps,
  RestaurantMenuCardProps,
  MenuItemSpotlightCardProps,
  ShoppingCartCardProps,
  FoodImagePreviewCardProps,
  RestaurantRecommendationCardProps,
  OrderConfirmationCardProps
} from './types'