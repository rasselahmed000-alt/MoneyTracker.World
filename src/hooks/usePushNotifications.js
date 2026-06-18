import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export function usePushNotifications(user) {
  useEffect(() => {
    if (!user?.email) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (!VAPID_PUBLIC_KEY) return;
    // Skip push notification setup in development to avoid SW caching stale JS
    if (import.meta.env.DEV) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const existing = await reg.pushManager.getSubscription();
        const sub = existing || await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        const subStr = JSON.stringify(sub);

        // Save/update subscription in DB
        const existing_records = await base44.entities.PushSubscription.filter({ user_email: user.email });
        if (existing_records.length > 0) {
          await base44.entities.PushSubscription.update(existing_records[0].id, { subscription: subStr });
        } else {
          await base44.entities.PushSubscription.create({
            user_email: user.email,
            user_id: user.id,
            subscription: subStr,
          });
        }
      } catch (err) {
        console.warn('Push notification setup failed:', err);
      }
    };

    register();
  }, [user?.email]);
}