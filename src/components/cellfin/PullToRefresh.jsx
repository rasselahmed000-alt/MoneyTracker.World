import { useState, useRef, useCallback } from 'react';

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const onTouchStart = useCallback((e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!isPulling.current) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      setPulling(true);
      setPullY(Math.min(diff, THRESHOLD + 20));
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (pullY >= THRESHOLD && onRefresh) {
      await onRefresh();
    }
    setPulling(false);
    setPullY(0);
    isPulling.current = false;
  }, [pullY, onRefresh]);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ transform: pulling ? `translateY(${Math.min(pullY * 0.4, 28)}px)` : 'none', transition: pulling ? 'none' : 'transform 0.3s ease' }}
    >
      {pulling && pullY > 20 && (
        <div className="flex justify-center py-2">
          <div className={`w-6 h-6 border-2 border-forest border-t-transparent rounded-full ${pullY >= THRESHOLD ? 'animate-spin' : ''}`} />
        </div>
      )}
      {children}
    </div>
  );
}