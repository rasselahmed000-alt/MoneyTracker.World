import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import webpush from 'npm:web-push@3.6.7';

Deno.serve(async (req) => {
  try {
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
    const VAPID_EMAIL = Deno.env.get('VAPID_EMAIL') || 'mailto:admin@cellfin.app';

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return Response.json({ error: 'VAPID keys not configured' }, { status: 500 });
    }

    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { subscription, title, body, url } = await req.json();

    if (!subscription || !title) {
      return Response.json({ error: 'Missing subscription or title' }, { status: 400 });
    }

    const payload = JSON.stringify({ title, body: body || '', url: url || '/' });
    await webpush.sendNotification(subscription, payload);

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});