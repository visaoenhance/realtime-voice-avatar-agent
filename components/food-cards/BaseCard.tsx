import React from 'react'
import { BaseCardProps } from './types'

const BaseCard: React.FC<BaseCardProps> = ({ 
  className = '',
  children,
  title,
  subtitle,
  accent = 'emerald',
  size = 'md'
}) => {
  // Size classes for consistent spacing
  const sizeClasses = {
    sm: 'p-3', 
    md: 'p-4',
    lg: 'p-6'
  }
  
  // Accent color classes for different card types
  const accentClasses = {
    emerald: 'border-emerald-200 bg-emerald-50',
    blue: 'border-blue-200 bg-blue-50', 
    amber: 'border-amber-200 bg-amber-50',
    red: 'border-red-200 bg-red-50'
  }
  
  const baseClasses = [
    'border rounded-lg shadow-sm',
    'bg-white',
    sizeClasses[size],
    accentClasses[accent],
    className
  ].filter(Boolean).join(' ')
  
  return (
    <div className={baseClasses}>
      {(title || subtitle) && (
        <header className="mb-3">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">
              {subtitle}
            </p>
          )}
        </header>
      )}
      
      <div className="space-y-3">
        {children}
      </div>
    </div>
  )
}

export default BaseCard

// Utility components for common card elements
export const CardSection: React.FC<{
  title?: string
  children: React.ReactNode
  className?: string
}> = ({ title, children, className = '' }) => (
  <section className={`${className}`}>
    {title && (
      <h4 className="font-medium text-gray-900 mb-2">
        {title}
      </h4>
    )}
    {children}
  </section>
)

export const CardBadge: React.FC<{
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'xs' | 'sm'
}> = ({ children, variant = 'secondary', size = 'sm' }) => {
  const variantClasses = {
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800', 
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  }
  
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-2.5 py-1.5 text-sm'
  }
  
  return (
    <span className={`
      inline-flex items-center rounded-full font-medium
      ${variantClasses[variant]}
      ${sizeClasses[size]}
    `}>
      {children}
    </span>
  )
}

export const CardButton: React.FC<{
  onClick?: () => void
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md'
  disabled?: boolean
}> = ({ 
  onClick, 
  children, 
  variant = 'primary', 
  size = 'sm',
  disabled = false
}) => {
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm'
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center rounded-md font-medium
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {children}
    </button>
  )
}

export const CardMetric: React.FC<{
  label: string
  value: string | number
  prefix?: string
  suffix?: string
}> = ({ label, value, prefix, suffix }) => (
  <div className="flex flex-col">
    <span className="text-xs text-gray-500 uppercase tracking-wide">
      {label}
    </span>
    <span className="text-lg font-semibold text-gray-900">
      {prefix}{value}{suffix}
    </span>
  </div>
)