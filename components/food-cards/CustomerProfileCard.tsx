import React from 'react'
import { CustomerProfileCardProps, CustomerProfile, Order } from './types'
import BaseCard, { CardSection, CardBadge, CardMetric } from './BaseCard'

const CustomerProfileCard: React.FC<CustomerProfileCardProps> = ({ data }) => {
  const { profile, recentOrders, speechSummary, lastUpdated, summary } = data
  
  const formatSpiceLevel = (level: string) => {
    const labels = { low: 'Mild', medium: 'Medium', high: 'Spicy' }
    return labels[level as keyof typeof labels] || level
  }
  
  const formatBudgetRange = (budget: string) => {
    const labels = { value: 'Value', standard: 'Standard', premium: 'Premium' }
    return labels[budget as keyof typeof labels] || budget
  }

  return (
    <BaseCard
      title="Your Food Profile"
      subtitle={summary}
      accent="blue"
      size="md"
    >
      {/* Profile Preferences */}
      <CardSection title="Food Preferences">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Favorite Cuisines */}
          {profile.favoriteCuisines.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                Favorite Cuisines
              </h5>
              <div className="flex flex-wrap gap-1">
                {profile.favoriteCuisines.map((cuisine, idx) => (
                  <CardBadge key={idx} variant="success" size="xs">
                    {cuisine}
                  </CardBadge>
                ))}
              </div>
            </div>
          )}
          
          {/* Dietary Tags */}
          {profile.dietaryTags.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                Dietary Needs
              </h5>
              <div className="flex flex-wrap gap-1">
                {profile.dietaryTags.map((tag, idx) => (
                  <CardBadge key={idx} variant="primary" size="xs">
                    {tag}
                  </CardBadge>
                ))}
              </div>
            </div>
          )}
          
        </div>
        
        {/* Dislikes */}
        {profile.dislikedCuisines.length > 0 && (
          <div className="mt-3">
            <h5 className="text-sm font-medium text-gray-700 mb-2">
              Avoid
            </h5>
            <div className="flex flex-wrap gap-1">
              {profile.dislikedCuisines.map((cuisine, idx) => (
                <CardBadge key={idx} variant="error" size="xs">
                  {cuisine}
                </CardBadge>
              ))}
            </div>
          </div>
        )}
      </CardSection>

      {/* Profile Settings */}
      <CardSection title="Settings">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <CardMetric
            label="Spice Level"
            value={formatSpiceLevel(profile.spiceLevel)}
          />
          <CardMetric
            label="Budget"
            value={formatBudgetRange(profile.budgetRange)}
          />
          {recentOrders.length > 0 && (
            <CardMetric
              label="Recent Orders"
              value={recentOrders.length}
            />
          )}
        </div>
      </CardSection>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <CardSection title="Recent Favorites">
          <div className="space-y-2">
            {recentOrders.slice(0, 3).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="font-medium text-sm">{order.restaurantName}</div>
                  <div className="text-xs text-gray-500">{order.cuisine}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">${order.total.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">
                    {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                  </div>
                </div>
                {order.rating && (
                  <div className="ml-2">
                    <CardBadge variant="warning" size="xs">
                      ⭐ {order.rating}
                    </CardBadge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardSection>
      )}

      {/* Notes */}
      {profile.notes && (
        <CardSection title="Notes">
          <div className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded">
            "{profile.notes}"
          </div>
        </CardSection>
      )}

      {/* Footer Info */}
      <div className="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-200">
        Profile last updated: {new Date(lastUpdated).toLocaleDateString()}
      </div>
    </BaseCard>
  )
}

export default CustomerProfileCard