import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function getCountryFromIP(ip) {
  // Skip private/local IPs
  if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return { countryCode: 'UNKNOWN', isProxy: false };
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,proxy,hosting`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json();
    if (data.status === 'success') {
      return { countryCode: data.countryCode, isProxy: data.proxy || data.hosting || false };
    }
  } catch {}
  try {
    const res2 = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(3000) });
    const data2 = await res2.json();
    if (data2.country_code) {
      return { countryCode: data2.country_code, isProxy: false };
    }
  } catch {}
  return { countryCode: 'UNKNOWN', isProxy: false };
}

function getClientIP(req) {
  const h = req.headers;
  return (
    h.get('cf-connecting-ip') ||
    (h.get('x-forwarded-for') || '').split(',')[0].trim() ||
    h.get('x-real-ip') ||
    null
  );
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Load geo_restriction setting (fail open if DB unreachable)
    let geoEnabled = false;
    let whitelist = [];
    try {
      const settings = await base44.asServiceRole.entities.AppSettings.list();
      const geoSetting = (settings || []).find(s => s.key === 'geo_restriction');
      geoEnabled = geoSetting?.value === 'enabled';

      const wlSetting = (settings || []).find(s => s.key === 'geo_whitelist');
      whitelist = (wlSetting?.value || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    } catch {
      // DB error → fail open
      return Response.json({ allowed: true, reason: 'settings_fetch_error' });
    }

    // Restriction is off → allow all
    if (!geoEnabled) {
      return Response.json({ allowed: true, reason: 'geo_restriction_disabled' });
    }

    // Get client IP
    const clientIP = getClientIP(req);
    if (!clientIP) {
      return Response.json({ allowed: true, reason: 'ip_unknown' });
    }

    // Get country
    const { countryCode, isProxy } = await getCountryFromIP(clientIP);

    // Not Bangladesh → allow
    if (countryCode !== 'BD') {
      return Response.json({ allowed: true, countryCode, reason: 'not_bd' });
    }

    // Bangladesh → check auth + whitelist
    let user = null;
    try {
      user = await base44.auth.me();
    } catch {}

    if (!user) {
      return Response.json({ allowed: false, countryCode: 'BD', isProxy, reason: 'bd_not_authenticated' });
    }

    // Admin always allowed
    if (user.role === 'admin') {
      return Response.json({ allowed: true, countryCode: 'BD', reason: 'admin', email: user.email });
    }

    // Check whitelist
    const userEmail = (user.email || '').toLowerCase();
    if (whitelist.includes(userEmail)) {
      return Response.json({ allowed: true, countryCode: 'BD', reason: 'whitelisted', email: userEmail });
    }

    return Response.json({ allowed: false, countryCode: 'BD', isProxy, reason: 'bd_not_whitelisted' });

  } catch (error) {
    // Any unexpected error → fail open
    return Response.json({ allowed: true, reason: 'unexpected_error', error: error.message });
  }
});