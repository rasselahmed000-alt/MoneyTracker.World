import { useCallback } from 'react';
import { debounce } from '@/lib/performance-utils';

/**
 * Optimized input handler with debouncing
 * Prevents excessive re-renders on fast typing
 */
export const useOptimizedInput = (onChange, debounceDelay = 150) => {
  const debouncedOnChange = useCallback(
    debounce((value) => onChange(value), debounceDelay),
    [onChange, debounceDelay]
  );

  return {
    handleChange: (e) => {
      const value = e.target.value;
      // Immediate state for UI responsiveness
      // Debounced callback for expensive operations
      debouncedOnChange(value);
    },
  };
};

/**
 * Optimized PIN input handler
 * Instant feedback with debounced validation
 */
export const useOptimizedPinInput = (onComplete, maxLength = 6) => {
  const handlePinInput = useCallback((value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, maxLength);
    if (cleaned.length === maxLength) {
      onComplete(cleaned);
    }
  }, [maxLength, onComplete]);

  return handlePinInput;
};