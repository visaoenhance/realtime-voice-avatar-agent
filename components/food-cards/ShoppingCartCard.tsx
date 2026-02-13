import React from 'react'
import { ShoppingCartCardProps } from './types'
import BaseCard, { CardSection, CardBadge, CardMetric, CardButton } from './BaseCard'

const ShoppingCartCard: React.FC<ShoppingCartCardProps> = ({ data }) => {
  const { success, cartId, createdCart, restaurant, item, subtotal, cart, speechSummary } = data
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  if (!success || !cart) {
    return (
      <BaseCard title="Cart Error" accent="red" size="md">
        <div className="text-center py-4">
          <div className="text-3xl mb-2">❌</div>
          <div className="text-sm font-medium text-gray-700 mb-1">Cart Error</div>
          <div className="text-xs text-gray-500">
            Unable to load cart information
          </div>
        </div>
      </BaseCard>
    )
  }

  const isEmpty = !cart.items || cart.items.length === 0
  const title = createdCart ? "New Cart Created" : item ? "Item Added to Cart" : "Shopping Cart"

  return (
    <BaseCard
      title={title}
      subtitle={speechSummary}
      accent="emerald"
      size="md"
    >
      {/* Restaurant Header */}
      <CardSection>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">
              {restaurant.name}
            </h4>
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

      {/* Recently Added Item Highlight */}
      {item && (
        <CardSection title="Added Just Now">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-emerald-900">
                  {item.quantity} × {item.name}
                </div>
                {item.options && item.options.length > 0 && (
                  <div className="text-xs text-emerald-600 mt-1">
                    {item.options.map(opt => opt.label || opt).join(', ')}
                  </div>
                )}
              </div>
              <div className="text-emerald-900 font-semibold">
                {formatPrice(item.linePrice)}
              </div>
            </div>
          </div>
        </CardSection>
      )}

      {/* Cart Contents */}
      {!isEmpty ? (
        <CardSection title="Cart Items">
          <div className="space-y-3">
            {cart.items.map((cartItem) => (
              <div key={cartItem.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {cartItem.name}
                      </span>
                      <CardBadge variant="secondary" size="xs">
                        {cartItem.quantity}×
                      </CardBadge>
                    </div>
                    
                    {/* Item Options */}
                    {cartItem.options && cartItem.options.length > 0 && (
                      <div className="mt-1">
                        <div className="text-xs text-gray-600">
                          {cartItem.options.map((option, idx) => (
                            <span key={idx} className="mr-2">
                              • {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Special Instructions */}
                    {cartItem.instructions && (
                      <div className="mt-1">
                        <div className="text-xs italic text-gray-500">
                          "{cartItem.instructions}"
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatPrice(cartItem.totalPrice)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatPrice(cartItem.basePrice)} each
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardSection>
      ) : (
        <CardSection>
          <div className="text-center py-4">
            <div className="text-3xl mb-2">🛒</div>
            <div className="text-sm font-medium text-gray-700 mb-1">Cart is Empty</div>
            <div className="text-xs text-gray-500">
              Add some delicious items to get started
            </div>
          </div>
        </CardSection>
      )}

      {/* Cart Summary */}
      {!isEmpty && (
        <CardSection title="Order Summary">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <CardMetric
                label="Items"
                value={cart.itemCount || cart.items.length}
              />
              
              <CardMetric
                label="Subtotal"
                value={formatPrice(subtotal)}
              />
            </div>
            
            {cart.deliveryFee !== undefined && (
              <div className="flex justify-between text-xs text-gray-600 pt-2 border-t border-gray-200">
                <span>Delivery Fee:</span>
                <span>{cart.deliveryFee === 0 ? 'Free' : formatPrice(cart.deliveryFee)}</span>
              </div>
            )}
            
            {cart.tax !== undefined && (
              <div className="flex justify-between text-xs text-gray-600">
                <span>Tax:</span>
                <span>{formatPrice(cart.tax)}</span>
              </div>
            )}
            
            {cart.total !== undefined && (
              <div className="flex justify-between font-semibold text-sm text-gray-900 pt-2 border-t border-gray-300">
                <span>Total:</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
            )}
          </div>
        </CardSection>
      )}

      {/* Cart Actions */}
      {!isEmpty && (
        <CardSection>
          <div className="flex gap-2">
            <CardButton variant="primary" size="md">
              Checkout
            </CardButton>
            <CardButton variant="outline" size="md">
              Keep Shopping
            </CardButton>
          </div>
        </CardSection>
      )}

      {/* Cart Status Info */}
      <div className="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span>Cart ID: {cartId}</span>
          {cart.updatedAt && (
            <span>Updated: {new Date(cart.updatedAt).toLocaleTimeString()}</span>
          )}
        </div>
      </div>
    </BaseCard>
  )
}

export default ShoppingCartCard