import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * P1 CRITICAL: WebSocket failover system
 * - Maintains real-time sync with fallback to polling
 * - Auto-reconnects on connection loss
 * - Handles offline gracefully
 */
export function useWebSocketFailover(entityName, onUpdate, options = {}) {
  const [status, setStatus] = useState('connected');
  const unsubRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());

  useEffect(() => {
    let unsubscribe = null;

    const connect = () => {
      try {
        // Primary: WebSocket subscription
        unsubscribe = base44.entities[entityName]?.subscribe?.((event) => {
          lastUpdateRef.current = Date.now();
          setStatus('connected');
          onUpdate(event);
        });

        unsubRef.current = unsubscribe;
        setStatus('connected');
      } catch (err) {
        // Fallback: Polling every 5 seconds
        setStatus('polling');
        startPolling();
      }
    };

    const startPolling = () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      
      pollIntervalRef.current = setInterval(() => {
        if (!navigator.onLine) {
          setStatus('offline');
          return;
        }

        base44.entities[entityName]?.list?.(null, 1)
          .then(data => {
            if (data && data.length > 0) {
              const lastItem = data[0];
              if (lastItem.updated_date > lastUpdateRef.current) {
                lastUpdateRef.current = Date.now();
                onUpdate({ type: 'poll', data: lastItem });
              }
            }
          })
          .catch(() => setStatus('offline'));
      }, 5000);
    };

    connect();

    // Handle visibility changes
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        connect();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);

    // Handle online/offline
    const onOnline = () => {
      setStatus('connected');
      connect();
    };

    const onOffline = () => {
      setStatus('offline');
      if (unsubRef.current) unsubRef.current();
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      if (unsubRef.current) unsubRef.current();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [entityName, onUpdate]);

  return status;
}

export default function WebSocketFailover() {
  const [status, setStatus] = useState('connected');

  useEffect(() => {
    const onOnline = () => setStatus('connected');
    const onOffline = () => setStatus('offline');

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (status === 'offline') return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-700 text-white">
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      {status === 'polling' ? 'Sync (polling)' : 'Live sync'}
    </div>
  );
}