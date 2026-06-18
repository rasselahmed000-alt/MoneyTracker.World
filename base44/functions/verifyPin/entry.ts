import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// In-memory attempt tracker (resets on redeploy — acceptable for rate limiting)
// Structure: Map<userId, { count, blockedUntil, lockCount }>
// lockCount tracks how many times the user has been blocked (to escalate duration)
const attemptTracker = new Map();

const MAX_ATTEMPTS = 3;                        // lock after 3 wrong attempts
const BLOCK_DURATION_1ST_MS = 15 * 60 * 1000; // first lock: 15 minutes
const BLOCK_DURATION_2ND_MS = 30 * 60 * 1000; // subsequent locks: 30 minutes

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { pin } = body;

    if (!pin || pin.length < 4) {
      return Response.json({ success: false, error: 'PIN কমপক্ষে ৪ ডিজিট হতে হবে' });
    }

    const userId = user.id;
    const now = Date.now();
    const tracker = attemptTracker.get(userId) || { count: 0, blockedUntil: 0, lockCount: 0 };

    // ── Check if currently blocked ──
    if (tracker.blockedUntil > now) {
      const remainingSeconds = Math.ceil((tracker.blockedUntil - now) / 1000);
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      return Response.json({
        success: false,
        blocked: true,
        error: `৩ বার ভুল PIN দেওয়া হয়েছে। ${remainingMinutes} মিনিট পরে চেষ্টা করুন।`,
        remaining_seconds: remainingSeconds,
      });
    }

    // ── No PIN set ──
    const storedPin = user.pin;
    if (!storedPin) {
      return Response.json({
        success: false,
        error: 'PIN সেট করা নেই। Profile থেকে PIN সেট করুন।',
        no_pin: true,
      });
    }

    // ── Wrong PIN ──
    if (String(pin).trim() !== String(storedPin).trim()) {
      tracker.count = (tracker.count || 0) + 1;

      if (tracker.count >= MAX_ATTEMPTS) {
        // Escalate block duration based on how many times they've been locked
        tracker.lockCount = (tracker.lockCount || 0) + 1;
        const blockDuration = tracker.lockCount >= 2 ? BLOCK_DURATION_2ND_MS : BLOCK_DURATION_1ST_MS;
        const blockMinutes = blockDuration / 60000;

        tracker.blockedUntil = now + blockDuration;
        tracker.count = 0; // reset attempt count after locking
        attemptTracker.set(userId, tracker);

        return Response.json({
          success: false,
          blocked: true,
          error: `৩ বার ভুল PIN দেওয়া হয়েছে। ${blockMinutes} মিনিটের জন্য লক করা হয়েছে।`,
          remaining_seconds: blockDuration / 1000,
          attempts_remaining: 0,
        });
      }

      attemptTracker.set(userId, tracker);
      const remaining = MAX_ATTEMPTS - tracker.count;
      return Response.json({
        success: false,
        error: `ভুল PIN! আরো ${remaining} বার সুযোগ আছে।`,
        attempts_remaining: remaining,
      });
    }

    // ── Correct PIN — reset attempt count (keep lockCount for escalation history) ──
    tracker.count = 0;
    tracker.blockedUntil = 0;
    attemptTracker.set(userId, tracker);

    return Response.json({ success: true });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});