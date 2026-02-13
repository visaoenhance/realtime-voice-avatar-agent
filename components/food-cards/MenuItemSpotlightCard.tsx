import React from 'react'
import { MenuItemSpotlightCardProps } from './types'
import BaseCard, { CardSection, CardBadge, CardMetric, CardButton } from './BaseCard'

const MenuItemSpotlightCard: React.FC<MenuItemSpotlightCardProps> = ({ data }) => {
  const { restaurant, results, filters, speechSummary } = data
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  if (!results || results.length === 0) {
    return (
      <BaseCard
        title="Menu Item Search"
        subtitle={speechSummary}
        accent="amber"
        size="md"
      >
        <CardSection>
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🔍</div>
            <div className="text-sm font-medium text-gray-700 mb-1">
              No items found
            </div>
            <div className="text-xs text-gray-500">
              Try different search terms or browse the full menu
            </div>
          </div>
        </CardSection>
      </BaseCard>
    )
  }

  return (
    <BaseCard
      title="Menu Item Spotlight"
      subtitle={speechSummary}
      accent="amber"
      size="lg"
    >
      {/* Search Filters */}
      {(filters.query || filters.maxPrice || filters.tags?.length) && (
        <CardSection title="Search Criteria">
          <div className="flex flex-wrap gap-2">
            {filters.query && (
              <CardBadge variant="primary" size="sm">
                🔍 "{filters.query}"
              </CardBadge>
            )}
            {filters.maxPrice && (
              <CardBadge variant="warning" size="sm">
                💰 Under {formatPrice(filters.maxPrice)}
              </CardBadge>
            )}
            {filters.tags?.map((tag, idx) => (
              <CardBadge key={idx} variant="success" size="sm">
                {tag}
              </CardBadge>
            ))}
          </div>
        </CardSection>
      )}

      {/* Restaurant Context */}
      {restaurant && (
        <CardSection>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{restaurant.name}</h4>
              <div className="text-xs text-gray-600 capitalize">
                {restaurant.cuisine}
                {restaurant.cuisineGroup && restaurant.cuisineGroup !== restaurant.cuisine && (
                  <span className="text-gray-500"> • {restaurant.cuisineGroup}</span>
                )}
              </div>
            </div>
            {restaurant.rating && (
              <div className="flex items-center gap-1 text-sm text-yellow-600">
                <span>⭐</span>
                <span className="font-medium">{restaurant.rating}</span>
              </div>
            )}
          </div>
        </CardSection>
      )}

      {/* Results Overview */}
      <CardSection>
        <CardMetric
          label="Found"
          value={results.length}
          suffix={` item${results.length !== 1 ? 's' : ''}`}
        />
      </CardSection>

      {/* Featured Items */}
      <CardSection title="Menu Items">
        <div className="space-y-4">
          {results.map((item, index) => (
            <div 
              key={item.id} 
              className={`
                border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow
                ${index === 0 ? 'ring-2 ring-amber-200 bg-amber-50' : 'border-gray-200'}
              `}
            >
              <div className="flex flex-col md:flex-row">
                {/* Item Image */}
                <div className="md:w-32 md:flex-shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-32 md:h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 md:h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 font-medium text-lg">
                        {item.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Item Details */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-semibold text-gray-900 text-sm">
                          {item.name}
                        </h5>
                        {index === 0 && (
                          <CardBadge variant="warning" size="xs">
                            ⭐ Top Result
                          </CardBadge>
                        )}
                      </div>
                      
                      {/* Restaurant Name - prominently displayed */}
                      {item.restaurantName && (
                        <div className="text-xs font-medium text-blue-600 mt-1">
                          📍 {item.restaurantName}
                        </div>
                      )}
                      
                      {item.sectionTitle && (
                        <div className="text-xs text-gray-500 mt-1">
                          From: {item.sectionTitle}
                        </div>
                      )}
                      
                      {item.description && (
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right ml-4 flex-shrink-0">
                      <div className="font-bold text-gray-900">
                        {formatPrice(item.price)}
                      </div>
                      {item.calories && (
                        <div className="text-xs text-gray-500">
                          {item.calories} cal
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Item Tags */}
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.tags.slice(0, 5).map((tag, tagIdx) => (
                        <CardBadge key={tagIdx} variant="secondary" size="xs">
                          {tag}
                        </CardBadge>
                      ))}
                      {item.tags.length > 5 && (
                        <CardBadge variant="secondary" size="xs">
                          +{item.tags.length - 5} more
                        </CardBadge>
                      )}
                    </div>
                  )}

                  {/* Item Rating & Restaurant Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {item.rating && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">⭐</span>
                          <span className="font-medium">{item.rating}</span>
                        </div>
                      )}
                      
                      {item.restaurantName && (
                        <div>
                          from {item.restaurantName}
                        </div>
                      )}
                    </div>
                    
                    <CardButton variant="primary" size="sm">
                      Add to Cart
                    </CardButton>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardSection>

      {/* Summary Actions */}
      {results.length > 1 && (
        <CardSection>
          <div className="flex gap-2 justify-center">
            <CardButton variant="outline" size="md">
              View All {results.length} Items
            </CardButton>
            <CardButton variant="primary" size="md">
              Add Multiple to Cart
            </CardButton>
          </div>
        </CardSection>
      )}
    </BaseCard>
  )
}

export default MenuItemSpotlightCard