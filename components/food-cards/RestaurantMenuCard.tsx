'use client'

import React, { useState } from 'react'
import { RestaurantMenuCardProps } from './types'
import BaseCard, { CardSection, CardBadge, CardMetric, CardButton } from './BaseCard'

const RestaurantMenuCard: React.FC<RestaurantMenuCardProps> = ({ data }) => {
  const { restaurant, sections, speechSummary } = data
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const totalItems = sections.reduce((sum, section) => sum + section.items.length, 0)

  return (
    <BaseCard
      title={`${restaurant.name} Menu`}
      subtitle={speechSummary}
      accent="emerald"
      size="lg"
    >
      {/* Restaurant Info */}
      <CardSection>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-gray-600 capitalize">
              {restaurant.cuisine}
              {restaurant.cuisineGroup && restaurant.cuisineGroup !== restaurant.cuisine && (
                <span className="text-gray-500"> • {restaurant.cuisineGroup}</span>
              )}
            </div>
            {restaurant.standoutDish && (
              <div className="text-xs text-emerald-600 mt-1">
                <span className="font-medium">Signature:</span> {restaurant.standoutDish}
              </div>
            )}
          </div>
          
          <div className="text-right space-y-1">
            {restaurant.rating && (
              <div className="flex items-center gap-1 text-sm text-yellow-600">
                <span>⭐</span>
                <span className="font-medium">{restaurant.rating}</span>
              </div>
            )}
            {restaurant.etaMinutes && (
              <div className="text-xs text-gray-500">
                🚗 {restaurant.etaMinutes} min delivery
              </div>
            )}
          </div>
        </div>
      </CardSection>

      {/* Menu Stats */}
      <CardSection>
        <div className="grid grid-cols-3 gap-4">
          <CardMetric
            label="Sections"
            value={sections.length}
          />
          <CardMetric
            label="Items"
            value={totalItems}
          />
          {restaurant.deliveryFee !== undefined && (
            <CardMetric
              label="Delivery"
              value={restaurant.deliveryFee === 0 ? "Free" : formatPrice(restaurant.deliveryFee)}
            />
          )}
        </div>
      </CardSection>

      {/* Dietary Tags */}
      {restaurant.dietaryTags && restaurant.dietaryTags.length > 0 && (
        <CardSection title="Dietary Options">
          <div className="flex flex-wrap gap-1">
            {restaurant.dietaryTags.map((tag, idx) => (
              <CardBadge key={idx} variant="success" size="xs">
                {tag}
              </CardBadge>
            ))}
          </div>
        </CardSection>
      )}

      {/* Menu Sections */}
      <CardSection title="Menu">
        <div className="space-y-3">
          {sections.map((section) => {
            const isExpanded = expandedSections.has(section.id)
            const displayItems = isExpanded ? section.items : section.items.slice(0, 3)
            const hasMoreItems = section.items.length > 3

            return (
              <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Section Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {section.title}
                      </h4>
                      {section.description && (
                        <p className="text-xs text-gray-600 mt-1">
                          {section.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <CardBadge variant="secondary" size="xs">
                        {section.items.length} items
                      </CardBadge>
                      
                      {hasMoreItems && (
                        <CardButton
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSection(section.id)}
                        >
                          {isExpanded ? 'Show Less' : 'Show All'}
                        </CardButton>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section Items */}
                <div className="p-3 space-y-3">
                  {displayItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 transition-colors">
                      {/* Item Image */}
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-gray-500 font-medium">
                            {item.name.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5 className="font-medium text-gray-900 text-sm truncate">
                              {item.name}
                            </h5>
                            {item.description && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="text-right flex-shrink-0">
                            <div className="font-semibold text-gray-900 text-sm">
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
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.tags.slice(0, 4).map((tag, idx) => (
                              <CardBadge key={idx} variant="primary" size="xs">
                                {tag}
                              </CardBadge>
                            ))}
                            {item.tags.length > 4 && (
                              <CardBadge variant="secondary" size="xs">
                                +{item.tags.length - 4} more
                              </CardBadge>
                            )}
                          </div>
                        )}

                        {/* Item Rating */}
                        {item.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-yellow-600">⭐</span>
                            <span className="text-xs text-gray-600 font-medium">
                              {item.rating}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Show more indicator */}
                  {!isExpanded && hasMoreItems && (
                    <div className="text-center py-2">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        +{section.items.length - 3} more items in {section.title}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardSection>

      {/* Promo */}
      {restaurant.promo && (
        <CardSection>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <div className="text-emerald-700 text-sm font-medium">
              🎉 {restaurant.promo}
            </div>
          </div>
        </CardSection>
      )}
    </BaseCard>
  )
}

export default RestaurantMenuCard