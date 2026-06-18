import { useState, useEffect } from 'react';
import { getOptimizedImageUrl } from '@/lib/performance-utils';

/**
 * Optimized Image Component
 * - Lazy loading
 * - WebP format with fallback
 * - Low quality placeholder
 * - Optimized sizing
 */
export default function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height,
  className = '',
  fallbackBg = 'bg-gray-200',
  priority = false 
}) {
  const [loaded, setLoaded] = useState(priority);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!priority && src) {
      const img = new Image();
      img.src = src;
      img.onload = () => setLoaded(true);
      img.onerror = () => setError(true);
    }
  }, [src, priority]);

  if (error) {
    return <div className={`${className} ${fallbackBg}`} />;
  }

  return (
    <img
      src={getOptimizedImageUrl(src, width)}
      alt={alt}
      width={width}
      height={height}
      className={`${className} ${!loaded ? 'blur-sm' : ''} transition-all duration-300`}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
    />
  );
}