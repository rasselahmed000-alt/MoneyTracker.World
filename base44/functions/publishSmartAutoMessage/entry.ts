import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── Name Generator ───────────────────────────────────────────────────────────
const muslimPrefix = ['Md', 'Mohammad', 'Muhammad', 'Sheikh', 'Syed'];
const muslimFirst  = ['Rakib','Saiful','Tamim','Nayeem','Fahim','Rahat','Shakib','Mahmud','Kabir','Jahir','Rubel','Fatima','Amina','Ayesha','Nisa','Sadia','Rumi','Arif','Sumaiya'];
const muslimMid    = ['Hasan','Islam','Hossain','Rahman','Uddin','Karim','Jahan','Ahmed','Ali','Alam','Morshed','Sadik'];
const muslimSur    = ['Khan','Ahmed','Chowdhury','Sarker','Talukder','Sheikh','Mollah','Miah','Haque','Bhuiyan'];
const hinduFirst   = ['Sayan','Debjit','Anirban','Subrata','Soham','Arindam','Biplab','Tapas','Priyanka','Riya','Neha','Isha','Puja','Dipa','Sujan'];
const hinduSur     = ['Roy','Saha','Chakraborty','Banik','Dhar','Biswas','Paul','Nath','Das','Ghosh'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generateName() {
  if (Math.random() < 0.55) {
    const p = Math.random();
    if (p < 0.3)  return `${pick(muslimPrefix)} ${pick(muslimFirst)} ${pick(muslimMid)} ${pick(muslimSur)}`;
    if (p < 0.6)  return `${pick(muslimFirst)} ${pick(muslimMid)} ${pick(muslimSur)}`;
    return `${pick(muslimFirst)} ${pick(muslimMid)}`;
  }
  return `${pick(hinduFirst)} ${pick(hinduSur)}`;
}

function isInCooldown(name, recentUsers, mins = 20) {
  const cutoff = Date.now() - mins * 60_000;
  return recentUsers.some(u => u.name === name && new Date(u.timestamp).getTime() > cutoff);
}

function freshName(recentUsers) {
  for (let i = 0; i < 20; i++) {
    const n = generateName();
    if (!isInCooldown(n, recentUsers)) return n;
  }
  return generateName();
}

/**
 * DYNAMIC TIMING ENGINE
 * 
 * Calculates next publish delay in SECONDS based on:
 * - Remaining messages to send
 * - Remaining time in window
 * - Activity intensity (burst/gap patterns)
 * - Human-like randomness
 * 
 * Returns seconds until next message should be sent.
 */
function calcNextDelaySeconds(remainingMsgs, remainingMs, intensity) {
  // Average interval if distributing evenly
  const avgSeconds = (remainingMs / 1000) / remainingMsgs;

  const r = Math.random();

  // BURST: rapid succession (1-5s) — probability increases with intensity
  if (r < intensity * 0.30) {
    return Math.max(1, avgSeconds * (0.02 + Math.random() * 0.12));
  }

  // LONG GAP: natural pause — lower probability
  if (r < intensity * 0.30 + 0.08) {
    return avgSeconds * (3 + Math.random() * 5);
  }

  // MEDIUM GAP: slightly slower
  if (r < intensity * 0.30 + 0.08 + 0.15) {
    return avgSeconds * (1.5 + Math.random() * 2);
  }

  // NORMAL: jitter ±50% around average
  return Math.max(1, avgSeconds * (0.5 + Math.random() * 1.0));
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const schedules = await base44.asServiceRole.entities.AutoMessageSchedule.list();
    const schedule = schedules?.[0];
    if (!schedule?.is_enabled) {
      return Response.json({ message: 'Auto messaging disabled' });
    }

    const now = Date.now();
    const timeRangeMs = (schedule.time_range_minutes || 60) * 60_000;
    const target      = schedule.target_message_count || 30;
    const intensity   = schedule.activity_intensity ?? 0.5;

    // ── Batch tracking ──────────────────────────────────────────────────────
    let batchStart = schedule.current_batch_start
      ? new Date(schedule.current_batch_start).getTime()
      : now;
    let batchCount = schedule.current_batch_count || 0;

    // Reset batch if window expired — set a random first-message delay so
    // the new batch doesn't fire immediately on the first trigger after reset
    if (now - batchStart > timeRangeMs) {
      batchStart = now;
      batchCount = 0;
      // Random delay 1-8 minutes before first message in new batch
      const firstDelayMs = (60 + Math.random() * 420) * 1000;
      const firstPublishAt = new Date(now + firstDelayMs).toISOString();
      await base44.asServiceRole.entities.AutoMessageSchedule.update(schedule.id, {
        current_batch_start: new Date(batchStart).toISOString(),
        current_batch_count: 0,
        next_publish_time: firstPublishAt,
      });
      return Response.json({
        message: `Batch reset — first message in ${(firstDelayMs / 60000).toFixed(1)} min`,
        nextAt: firstPublishAt,
      });
    }

    if (batchCount >= target) {
      return Response.json({
        message: 'Batch complete — waiting for next window',
        batchCount, target,
      });
    }

    // ── next_publish_time check ─────────────────────────────────────────────
    const nextPublishTime = schedule.next_publish_time
      ? new Date(schedule.next_publish_time).getTime()
      : 0;

    // If next_publish_time not set yet, set a random initial delay (don't publish immediately)
    if (!schedule.next_publish_time) {
      const initDelayMs = (30 + Math.random() * 180) * 1000; // 30s - 3.5min
      await base44.asServiceRole.entities.AutoMessageSchedule.update(schedule.id, {
        next_publish_time: new Date(now + initDelayMs).toISOString(),
      });
      return Response.json({ message: `Initial delay set: ${(initDelayMs / 1000).toFixed(0)}s` });
    }

    if (nextPublishTime > now) {
      const waitSecs = ((nextPublishTime - now) / 1000).toFixed(0);
      return Response.json({
        message: `Next message in ${waitSecs}s`,
        nextAt: schedule.next_publish_time,
        batchCount, target,
        progress: ((batchCount / target) * 100).toFixed(1) + '%',
      });
    }

    // ── Time to publish! ────────────────────────────────────────────────────
    const allMsgs = await base44.asServiceRole.entities.AutoMessageLibrary.list();
    const active  = allMsgs.filter(m => m.is_active !== false);
    if (active.length === 0) {
      return Response.json({ error: 'No messages in library' });
    }

    let recentUsers = (schedule.recent_users || []).filter(
      u => now - new Date(u.timestamp).getTime() < 3_600_000
    );
    let seqIdx = schedule.last_sequential_index || 0;

    // Pick message
    let selectedMsg;
    if (schedule.publish_mode === 'sequential') {
      selectedMsg = active[seqIdx % active.length];
      seqIdx = (seqIdx + 1) % active.length;
    } else {
      selectedMsg = active[Math.floor(Math.random() * active.length)];
    }

    // Pick name
    const name = freshName(recentUsers);

    // Publish
    await base44.asServiceRole.entities.GroupMessage.create({
      content: selectedMsg.content,
      username: name,
      user_email: null,
      message_type: 'system',
      status: 'approved',
      is_pinned: false,
      is_user_banned: false,
    });

    const newBatchCount   = batchCount + 1;
    const newTotalPublished = (schedule.total_published || 0) + 1;
    const newRecentUsers  = [...recentUsers, { name, timestamp: new Date().toISOString() }].slice(-60);
    const usedNames       = [...(schedule.used_names || []), name].slice(-300);

    // ── Calculate NEXT publish time (dynamic human-like) ────────────────────
    const remainingMsgs = target - newBatchCount;
    const remainingMs   = Math.max(60_000, (batchStart + timeRangeMs) - now); // at least 1 min

    let nextDelayMs = 0;
    if (remainingMsgs > 0) {
      const delaySeconds = calcNextDelaySeconds(remainingMsgs, remainingMs, intensity);
      // Cap delay: never wait more than 5 min (trigger interval) otherwise we'd skip a whole cycle
      const cappedSeconds = Math.min(delaySeconds, 4.5 * 60);
      nextDelayMs = Math.max(1000, cappedSeconds * 1000);
    }

    const nextPublishAt = remainingMsgs > 0
      ? new Date(now + nextDelayMs).toISOString()
      : null;

    // Auto delete
    if (schedule.auto_delete_after_send && selectedMsg?.id) {
      try { await base44.asServiceRole.entities.AutoMessageLibrary.delete(selectedMsg.id); } catch (_) {}
    }

    // Save state
    await base44.asServiceRole.entities.AutoMessageSchedule.update(schedule.id, {
      last_message_time:     new Date().toISOString(),
      current_batch_start:   new Date(batchStart).toISOString(),
      current_batch_count:   newBatchCount,
      total_published:       newTotalPublished,
      used_names:            usedNames,
      recent_users:          newRecentUsers,
      last_sequential_index: seqIdx,
      next_publish_time:     nextPublishAt,
    });

    return Response.json({
      success: true,
      published: { username: name, content: selectedMsg.content.substring(0, 50) },
      nextPublishIn: nextDelayMs ? `${(nextDelayMs / 1000).toFixed(0)}s` : 'batch complete',
      batch: {
        current: newBatchCount,
        target,
        progress: ((newBatchCount / target) * 100).toFixed(1) + '%',
        timeRangeMinutes: schedule.time_range_minutes,
      },
    });

  } catch (err) {
    console.error('publishSmartAutoMessage error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});