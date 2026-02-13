'use client'

import React, { useEffect, useState } from 'react'
import { OrderConfirmationCardProps } from './types'
import BaseCard, { CardSection, CardBadge, CardMetric, CardButton } from './BaseCard'

const OrderConfirmationCard: React.FC<OrderConfirmationCardProps> = ({ data }) => {
  const { success, orderId, restaurant, itemCount, total, estimatedDeliveryTime, speechSummary, message } = data
  const [showAnimation, setShowAnimation] = useState(false)

  // Trigger success animation on mount if successful
  useEffect(() => {
    if (success) {
      setShowAnimation(true)
    }
  }, [success])

  if (!success) {
    return (
      <BaseCard
        title="Order Failed"
        subtitle={message || speechSummary}
        accent="red"
        size="md"
      >
        <CardSection>
          <div className="text-center py-6">
            <div className="text-4xl mb-3">❌</div>
            <div className="text-lg font-semibold text-gray-900 mb-2">
              Unable to Complete Order
            </div>
            <div className="text-sm text-gray-600 mb-4">
              {message || "There was a problem processing your order. Please try again."}
            </div>
            <div className="flex gap-2 justify-center">
              <CardButton variant="primary" size="md">
                Try Again
              </CardButton>
              <CardButton variant="outline" size="md">
                Contact Support
              </CardButton>
            </div>
          </div>
        </CardSection>
      </BaseCard>
    )
  }

  return (
    <BaseCard
      title="Order Confirmed!"
      subtitle={speechSummary}
      accent="emerald"
      size="lg"
    >
      {/* Success Animation */}
      <CardSection>
        <div className="text-center py-6">
          <div 
            className={`
              text-6xl mb-4 transition-all duration-1000 
              ${showAnimation ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
            `}
          >
            ✅
          </div>
          <div 
            className={`
              text-2xl font-bold text-emerald-800 mb-2 transition-all duration-1000 delay-300
              ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
            `}
          >
            Order Placed Successfully!
          </div>
          <div 
            className={`
              text-sm text-gray-600 transition-all duration-1000 delay-500
              ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
            `}
          >
            Your delicious food is on the way
          </div>
        </div>
      </CardSection>

      {/* Order Details */}	
      <CardSection title="Order Summary">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-emerald-900 text-lg">
                {restaurant.name}
              </h4>
              <div className="text-sm text-emerald-700 capitalize">
                {restaurant.cuisine}
                {restaurant.cuisineGroup && restaurant.cuisineGroup !== restaurant.cuisine && (
                  <span className="text-emerald-600"> • {restaurant.cuisineGroup}</span>
                )}
              </div>
            </div>
            
            {restaurant.rating && (
              <div className="flex items-center gap-1 text-emerald-700">
                <span className="text-lg">⭐</span>
                <span className="font-semibold">{restaurant.rating}</span>
              </div>
            )}
          </div>

          {/* Order Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <CardMetric
              label="Order ID"
              value={`#${orderId}`}
            />
            
            <CardMetric
              label="Items"
              value={itemCount}
              suffix={` item${itemCount !== 1 ? 's' : ''}`}
            />
            
            <CardMetric
              label="Total"
              value={`$${total.toFixed(2)}`}
            />
            
            {estimatedDeliveryTime && (
              <CardMetric
                label="Delivery"
                value={estimatedDeliveryTime}
              />
            )}
          </div>
        </div>
      </CardSection>

      {/* Timeline/Status */}
      <CardSection title="Order Status">
        <div className="space-y-4">
          {/* Status Steps */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Step 1: Confirmed */}
              <div className="flex items-center">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-sm font-bold">
                  ✓
                </div>
                <span className="ml-2 text-sm font-medium text-emerald-800">Confirmed</span>
              </div>
              
              {/* Connector Line */}
              <div className="h-0.5 w-8 bg-gray-300"></div>
              
              {/* Step 2: Preparing */}
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-100 text-yellow-800 rounded-full flex items-center justify-center text-sm">
                  👨‍🍳
                </div>
                <span className="ml-2 text-sm text-gray-600">Preparing</span>
              </div>
              
              {/* Connector Line */}
              <div className="h-0.5 w-8 bg-gray-300"></div>
              
              {/* Step 3: Delivery */}
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center text-sm">
                  🚗
                </div>
                <span className="ml-2 text-sm text-gray-500">On the way</span>
              </div>
            </div>
          </div>

          {/* Status Description */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600 text-lg">👨‍🍳</span>
              <div>
                <div className="text-sm font-medium text-yellow-800">Your order is being prepared</div>
                <div className="text-xs text-yellow-700">The kitchen has started working on your delicious meal</div>
              </div>
            </div>
          </div>
        </div>
      </CardSection>

      {/* Delivery Information */}
      {(estimatedDeliveryTime || restaurant.etaMinutes) && (
        <CardSection title="Delivery Information">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 text-2xl">🚗</span>
              <div className="flex-1">
                <h5 className="font-medium text-blue-900 mb-1">Estimated Delivery</h5>
                <div className="space-y-1">
                  {estimatedDeliveryTime && (
                    <div className="text-sm text-blue-800">
                      <span className="font-semibold">Time:</span> {estimatedDeliveryTime}
                    </div>
                  )}
                  {restaurant.etaMinutes && (
                    <div className="text-sm text-blue-800">
                      <span className="font-semibold">ETA:</span> {restaurant.etaMinutes} minutes
                    </div>
                  )}
                  {restaurant.deliveryFee !== undefined && (
                    <div className="text-sm text-blue-800">
                      <span className="font-semibold">Fee:</span> {restaurant.deliveryFee === 0 ? 'Free delivery' : `$${restaurant.deliveryFee}`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardSection>
      )}

      {/* Action Buttons */}
      <CardSection>
        <div className="flex flex-wrap gap-3">
          <CardButton variant="primary" size="md">
            Track Order
          </CardButton>
          <CardButton variant="outline" size="md">
            Contact Restaurant
          </CardButton>
          <CardButton variant="outline" size="md">
            Order Something Else
          </CardButton>
        </div>
      </CardSection>

      {/* Footer */}
      <div className="text-center pt-4 border-t border-gray-200">
        <div className="text-sm font-medium text-gray-900 mb-2">
          Thank you for your order!
        </div>
        <div className="text-xs text-gray-500">
          You'll receive updates via SMS and email • Order support: (555) 123-FOOD
        </div>
      </div>
    </BaseCard>
  )
}

export default OrderConfirmationCard