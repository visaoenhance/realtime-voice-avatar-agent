import React from 'react'
import { FoodImagePreviewCardProps } from './types'
import BaseCard, { CardSection, CardBadge, CardMetric, CardButton } from './BaseCard'

const FoodImagePreviewCard: React.FC<FoodImagePreviewCardProps> = ({ data }) => {
  const { success, imageUrl, restaurant, menuItem, speechSummary, message } = data
  
  const formatPrice = (price?: number) => {
    if (typeof price !== 'number') return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  if (!success || !imageUrl) {
    return (
      <BaseCard
        title="Image Preview"
        subtitle={message || speechSummary}
        accent="red"
        size="md"
      >
        <CardSection>
          <div className="text-center py-6">
            <div className="text-4xl mb-3">📷</div>
            <div className="text-sm font-medium text-gray-700 mb-1">
              Image not available
            </div>
            <div className="text-xs text-gray-500">
              {message || "We couldn't load an image for this item right now"}
            </div>
          </div>
        </CardSection>
      </BaseCard>
    )
  }

  return (
    <BaseCard
      title="Food Image Preview"
      subtitle={speechSummary}
      accent="emerald"
      size="lg"
    >
      {/* Hero Image */}
      <CardSection>
        <div className="relative group">
          <div className="aspect-video md:aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-200">
            <img
              src={imageUrl}
              alt={menuItem.name || 'Food item'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y3ZjdmNyIvPgo8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OTk5OSI+SW1hZ2UgTm90IEF2YWlsYWJsZTwvdGV4dD4KPC9zdmc+'
              }}
            />
          </div>
          
          {/* Overlay gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-xl" />
          
          {/* Price badge overlay */}
          {menuItem.price && (
            <div className="absolute top-4 right-4">
              <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(menuItem.price)}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardSection>

      {/* Item Details */}
      <CardSection title="Item Details">
        <div className="space-y-4">
          
          {/* Main Item Info */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {menuItem.name || 'Menu Item'}
            </h3>
            
            {restaurant && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <span>from</span>
                <span className="font-medium text-gray-800">{restaurant.name}</span>
                {restaurant.rating && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1 text-yellow-600">
                      <span>⭐</span>
                      <span className="font-medium">{restaurant.rating}</span>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {menuItem.description && (
              <p className="text-sm text-gray-700 leading-relaxed">
                {menuItem.description}
              </p>
            )}
          </div>

          {/* Item Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {menuItem.price && (
              <CardMetric
                label="Price"
                value={formatPrice(menuItem.price) || ''}
              />
            )}
            
            {menuItem.calories && (
              <CardMetric
                label="Calories"
                value={menuItem.calories}
                suffix=" cal"
              />
            )}
            
            {menuItem.tags && menuItem.tags.length > 0 && (
              <div className="md:col-span-2">
                <span className="text-xs text-gray-500 uppercase tracking-wide">
                  Dietary Tags
                </span>
                <div className="flex flex-wrap gap-1 mt-2">
                  {menuItem.tags.slice(0, 6).map((tag, idx) => (
                    <CardBadge key={idx} variant="success" size="xs">
                      {tag}
                    </CardBadge>
                  ))}
                  {menuItem.tags.length > 6 && (
                    <CardBadge variant="secondary" size="xs">
                      +{menuItem.tags.length - 6} more
                    </CardBadge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardSection>

      {/* Restaurant Context */}
      {restaurant && (
        <CardSection title="Restaurant Info">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">
                  {restaurant.name}
                </h4>
                <div className="text-sm text-gray-600 capitalize">
                  {restaurant.cuisine}
                  {restaurant.cuisineGroup && restaurant.cuisineGroup !== restaurant.cuisine && (
                    <span className="text-gray-500"> • {restaurant.cuisineGroup}</span>
                  )}
                </div>
                
                {restaurant.standoutDish && (
                  <div className="text-xs text-emerald-600 mt-1">
                    <span className="font-medium">Also try:</span> {restaurant.standoutDish}
                  </div>
                )}
              </div>
              
              <div className="text-right space-y-1">
                {restaurant.etaMinutes && (
                  <div className="text-xs text-gray-600">
                    🚗 {restaurant.etaMinutes} min delivery
                  </div>
                )}
                {restaurant.deliveryFee !== undefined && (
                  <div className="text-xs text-gray-600">
                    💰 {restaurant.deliveryFee === 0 ? 'Free delivery' : `$${restaurant.deliveryFee} delivery`}
                  </div>
                )}
              </div>
            </div>

            {/* Restaurant Highlights */}
            {restaurant.highlights && restaurant.highlights.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex flex-wrap gap-1">
                  {restaurant.highlights.map((highlight, idx) => (
                    <CardBadge key={idx} variant="primary" size="xs">
                      {highlight}
                    </CardBadge>
                  ))}
                </div>
              </div>
            )}

            {/* Promo */}
            {restaurant.promo && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="bg-emerald-100 border border-emerald-200 rounded px-3 py-2">
                  <span className="text-emerald-800 text-xs font-medium">
                    🎉 {restaurant.promo}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardSection>
      )}

      {/* Action Buttons */}
      <CardSection>
        <div className="flex gap-3">
          <CardButton variant="primary" size="md">
            Add to Cart
          </CardButton>
          <CardButton variant="outline" size="md">
            View Full Menu
          </CardButton>
          <CardButton variant="outline" size="md">
            Similar Items
          </CardButton>
        </div>
      </CardSection>

      {/* Footer Note */}
      <div className="text-xs text-gray-400 text-center mt-4 pt-4 border-t border-gray-200">
        High-quality food images powered by Pexels
      </div>
    </BaseCard>
  )
}

export default FoodImagePreviewCard