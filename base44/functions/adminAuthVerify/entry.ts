import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// All credentials stored ONLY in backend — never exposed to frontend
const VALID_EMAIL = 'saifjariya@gmail.com';
const VALID_PIN   = '60616168';
const VALID_OTP   = '9812';

// Constant-time comparison using SHA-256 to prevent timing attacks
async function secureEqual(a, b) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(String(a))),
    crypto.subtle.digest('SHA-256', enc.encode(String(b))),
  ]);
  const ua = new Uint8Array(ha);
  const ub = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < ua.length; i++) diff |= ua[i] ^ ub[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { step, email, pin, otp } = body;

    // Step 1: Validate email only
    if (step === 'email') {
      const ok = await secureEqual(email, VALID_EMAIL);
      if (!ok) return Response.json({ success: false, error: 'This email is not authorized.' });
      return Response.json({ success: true });
    }

    // Step 2: Validate email + PIN
    if (step === 'pin') {
      const [emailOk, pinOk] = await Promise.all([
        secureEqual(email, VALID_EMAIL),
        secureEqual(pin, VALID_PIN),
      ]);
      if (!emailOk || !pinOk) return Response.json({ success: false, error: 'PIN is incorrect.' });
      return Response.json({ success: true });
    }

    // Step 3: Full validation email + PIN + OTP
    if (step === 'otp') {
      const [emailOk, pinOk, otpOk] = await Promise.all([
        secureEqual(email, VALID_EMAIL),
        secureEqual(pin, VALID_PIN),
        secureEqual(otp, VALID_OTP),
      ]);
      if (!emailOk || !pinOk || !otpOk) return Response.json({ success: false, error: 'OTP is incorrect.' });
      return Response.json({ success: true });
    }

    return Response.json({ success: false, error: 'Invalid step.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});