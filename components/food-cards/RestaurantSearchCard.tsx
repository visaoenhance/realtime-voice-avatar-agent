import React from 'react'
import { RestaurantSearchCardProps } from './types'
import BaseCard, { CardSection, CardBadge, CardMetric, CardButton } from './BaseCard'

const RestaurantSearchCard: React.FC<RestaurantSearchCardProps> = ({ data }) => {
  const { filters, results, speechSummary } = data
  
  const formatDeliveryFee = (fee?: number) => {
    if (fee === undefined || fee === null) return null
    if (fee === 0) return 'Free delivery'
    return `$${fee.toFixed(2)} delivery`
  }
  
  const formatEta = (minutes?: number) => {
    if (!minutes) return null
    return `${minutes} min`
  }

  return (
    <BaseCard
      title="Restaurant Search Results"
      subtitle={speechSummary}
      accent="emerald"
      size="md"
    >
      {/* Search Filters */}
      {(filters.location || filters.cuisine || filters.dietaryTags?.length) && (
        <CardSection title="Search Criteria">
          <div className="flex flex-wrap gap-2">
            {filters.location && (
              <CardBadge variant="primary" size="xs">
                📍 {filters.location}
              </CardBadge>
            )}
            {filters.cuisine && (
              <CardBadge variant="secondary" size="xs">
                🍴 {filters.cuisine}
              </CardBadge>
            )}
            {filters.subCuisine && (
              <CardBadge variant="secondary" size="xs">
                {filters.subCuisine}
              </CardBadge>
            )}
            {filters.dietaryTags?.map((tag, idx) => (
              <CardBadge key={idx} variant="success" size="xs">
                {tag}
              </CardBadge>
            ))}
            {filters.budget && (
              <CardBadge variant="warning" size="xs">
                💰 {filters.budget}
              </CardBadge>
            )}
          </div>
        </CardSection>
      )}

      {/* Results Count */}
      <CardSection>
        <CardMetric
          label="Found"
          value={results.length}
          suffix={` restaurant${results.length !== 1 ? 's' : ''}`}
        />
      </CardSection>

      {/* Restaurant Results */}
      {results.length > 0 ? (
        <CardSection title="Options">
          <div className="space-y-3">
            {results.slice(0, 5).map((restaurant) => (
              <div 
                key={restaurant.id} 
                className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {restaurant.name}
                    </h4>
                    <p className="text-xs text-gray-600 capitalize">
                      {restaurant.cuisine}
                      {restaurant.cuisineGroup && restaurant.cuisineGroup !== restaurant.cuisine && (
                        <span className="text-gray-500"> • {restaurant.cuisineGroup}</span>
                      )}
                    </p>
                  </div>
                  
                  {restaurant.rating && (
                    <div className="flex items-center gap-1 text-xs text-yellow-600">
                      <span>⭐</span>
                      <span className="font-medium">{restaurant.rating}</span>
                    </div>
                  )}
                </div>

                {/* Restaurant Details */}
                <div className="space-y-2">
                  {restaurant.standoutDish && (
                    <div className="text-xs">
                      <span className="text-gray-500">Try:</span> 
                      <span className="text-gray-700 font-medium ml-1">{restaurant.standoutDish}</span>
                    </div>
                  )}

                  {/* Service Info */}
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    {restaurant.etaMinutes && (
                      <span className="flex items-center gap-1">
                        🚗 {formatEta(restaurant.etaMinutes)}
                      </span>
                    )}
                    
                    {restaurant.deliveryFee !== undefined && (
                      <span className="flex items-center gap-1">
                        💰 {formatDeliveryFee(restaurant.deliveryFee)}
                      </span>
                    )}
                    
                    {restaurant.closesAt && (
                      <span className="flex items-center gap-1">
                        🕐 Closes {restaurant.closesAt}
                      </span>
                    )}
                  </div>

                  {/* Dietary Tags */}
                  {restaurant.dietaryTags && restaurant.dietaryTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {restaurant.dietaryTags.map((tag, idx) => (
                        <CardBadge key={idx} variant="success" size="xs">
                          {tag}
                        </CardBadge>
                      ))}
                    </div>
                  )}

                  {/* Highlights */}
                  {restaurant.highlights && restaurant.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {restaurant.highlights.map((highlight, idx) => (
                        <CardBadge key={idx} variant="primary" size="xs">
                          {highlight}
                        </CardBadge>
                      ))}
                    </div>
                  )}

                  {/* Promo */}
                  {restaurant.promo && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded p-2">
                      <span className="text-emerald-700 text-xs font-medium">
                        🎉 {restaurant.promo}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {results.length > 5 && (
              <div className="text-center">
                <CardBadge variant="secondary" size="sm">
                  +{results.length - 5} more restaurants available
                </CardBadge>
              </div>
            )}
          </div>
        </CardSection>
      ) : (
        <CardSection>
          <div className="text-center py-4">
            <div className="text-3xl mb-2">🔍</div>
            <div className="text-sm font-medium text-gray-700 mb-1">No restaurants found</div>
            <div className="text-xs text-gray-500">
              Try adjusting your search criteria or location
            </div>
          </div>
        </CardSection>
      )}
    </BaseCard>
  )
}

export default RestaurantSearchCard