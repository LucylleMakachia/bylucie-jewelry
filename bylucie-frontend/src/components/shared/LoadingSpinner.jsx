import React from 'react';

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'primary',
  text = '',
  overlay = false,
  fullScreen = false 
}) {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'text-[#b8860b]',
    white: 'text-white',
    gray: 'text-gray-600',
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600'
  };

  const spinner = (
    <div className={`animate-spin rounded-full border-b-2 border-current ${sizeClasses[size]} ${colorClasses[color]}`}></div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 z-50 flex items-center justify-center">
        <div className="text-center">
          {spinner}
          {text && <p className="mt-4 text-gray-600">{text}</p>}
        </div>
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg z-10">
        <div className="text-center">
          {spinner}
          {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
        </div>
      </div>
    );
  }

  if (text) {
    return (
      <div className="flex items-center space-x-3">
        {spinner}
        <span className="text-gray-600">{text}</span>
      </div>
    );
  }

  return spinner;
}

// Variant with dots for different use cases
export function LoadingDots({ 
  size = 'md',
  color = 'primary' 
}) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const colorClasses = {
    primary: 'bg-[#b8860b]',
    white: 'bg-white',
    gray: 'bg-gray-600',
    green: 'bg-green-600'
  };

  return (
    <div className="flex space-x-1">
      <div 
        className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-bounce`}
        style={{ animationDelay: '0.1s' }}
      ></div>
      <div 
        className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-bounce`}
        style={{ animationDelay: '0.2s' }}
      ></div>
      <div 
        className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-bounce`}
        style={{ animationDelay: '0.3s' }}
      ></div>
    </div>
  );
}

// Skeleton loader for content placeholders
export function SkeletonLoader({ 
  type = 'text',
  lines = 3,
  className = '' 
}) {
  if (type === 'card') {
    return (
      <div className={`bg-white border rounded-lg p-4 animate-pulse ${className}`}>
        <div className="flex space-x-4">
          <div className="rounded-full bg-gray-200 h-12 w-12"></div>
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'image') {
    return (
      <div className={`bg-gray-200 animate-pulse rounded ${className}`}></div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`h-4 bg-gray-200 rounded ${
            index === 0 ? 'w-3/4' : index === lines - 1 ? 'w-5/6' : 'w-full'
          }`}
        ></div>
      ))}
    </div>
  );
}