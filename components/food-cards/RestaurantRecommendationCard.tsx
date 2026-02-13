import React from 'react'
import { RestaurantRecommendationCardProps } from './types'
import BaseCard, { CardSection, CardBadge, CardMetric, CardButton } from './BaseCard'

const RestaurantRecommendationCard: React.FC<RestaurantRecommendationCardProps> = ({ data }) => {
  const { shortlist, speechSummary } = data

  if (!shortlist || shortlist.length === 0) {
    return (
      <BaseCard
        title="Recommendations"
        subtitle={speechSummary}
        accent="emerald"
        size="md"
      >
        <CardSection>
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🤔</div>
            <div className="text-sm font-medium text-gray-700 mb-1">
              No recommendations available
            </div>
            <div className="text-xs text-gray-500">
              Try updating your preferences or search criteria
            </div>
          </div>
        </CardSection>
      </BaseCard>
    )
  }

  return (
    <BaseCard
      title="Personalized Recommendations"
      subtitle={speechSummary}
      accent="emerald"
      size="lg"
    >
      {/* Recommendation Overview */}
      <CardSection>
        <CardMetric
          label="Curated For You"
          value={shortlist.length}
          suffix={` recommendation${shortlist.length !== 1 ? 's' : ''}`}
        />
      </CardSection>

      {/* Recommendation List */}
      <CardSection title="Top Picks">
        <div className="space-y-4">
          {shortlist.map((recommendation, index) => {
            // Try to parse restaurant info if the recommendation follows a pattern
            const isStructured = recommendation.includes(' - ') || recommendation.includes(':')
            
            return (
              <div 
                key={index}
                className={`
                  border rounded-lg p-4 transition-all hover:shadow-md
                  ${index === 0 
                    ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-100' 
                    : 'bg-white border-gray-200 hover:border-emerald-200'
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  {/* Rank Badge */}
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm flex-shrink-0
                    ${index === 0 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    #{index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Recommendation Badge */}
                    <div className="flex items-center gap-2 mb-2">
                      {index === 0 && (
                        <CardBadge variant="success" size="xs">
                          ⭐ Top Pick
                        </CardBadge>
                      )}
                      {index === 1 && (
                        <CardBadge variant="primary" size="xs">
                          🥈 Runner Up
                        </CardBadge>
                      )}
                      {index === 2 && (
                        <CardBadge variant="warning" size="xs">
                          🥉 Great Option
                        </CardBadge>
                      )}
                      {isStructured && (
                        <CardBadge variant="secondary" size="xs">
                          Personalized
                        </CardBadge>
                      )}
                    </div>
                    
                    {/* Main Recommendation Text */}
                    <div className="space-y-2">
                      <p className={`
                        ${index === 0 ? 'text-base' : 'text-sm'} 
                        ${index === 0 ? 'font-medium' : 'font-normal'}
                        text-gray-900 leading-relaxed
                      `}>
                        {recommendation}
                      </p>
                    </div>

                    {/* Action Buttons for Top Pick */}
                    {index === 0 && (
                      <div className="flex gap-2 mt-3">
                        <CardButton variant="primary" size="sm">
                          Order Now
                        </CardButton>
                        <CardButton variant="outline" size="sm">
                          View Menu  
                        </CardButton>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardSection>

      {/* Recommendation Actions */}
      <CardSection>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-center space-y-3">
            <div className="text-sm font-medium text-gray-900">
              Need different options?
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <CardButton variant="outline" size="sm">
                Refresh Recommendations
              </CardButton>
              <CardButton variant="outline" size="sm">
                Update Preferences
              </CardButton>
              <CardButton variant="outline" size="sm">
                Search Manually
              </CardButton>
            </div>
          </div>
        </div>
      </CardSection>

      {/* Personalization Note */}
      <div className="text-xs text-gray-500 text-center mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center gap-1">
          <span>🎯</span>
          <span>Recommendations based on your preferences, dietary needs, and order history</span>
        </div>
      </div>
    </BaseCard>
  )
}

export default RestaurantRecommendationCard