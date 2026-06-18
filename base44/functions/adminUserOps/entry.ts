import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action, target_user_id, data } = body;

    if (!action || !target_user_id) {
      return Response.json({ error: 'Missing action or target_user_id' }, { status: 400 });
    }

    switch (action) {

      // ── Change role ──────────────────────────────
      case 'set_role': {
        const { role } = data || {};
        if (!['admin', 'user'].includes(role)) {
          return Response.json({ error: 'Invalid role. Must be admin or user' }, { status: 400 });
        }
        await base44.asServiceRole.entities.User.update(target_user_id, { role });
        return Response.json({ success: true, message: `User role updated to ${role}` });
      }

      // ── Block user ───────────────────────────────
      case 'block_user': {
        const blockedUser = await base44.asServiceRole.entities.User.get(target_user_id);
        await base44.asServiceRole.entities.User.update(target_user_id, { is_blocked: true, account_status: 'blocked' });
        await base44.asServiceRole.entities.AppNotification.create({
          title: 'Account Blocked',
          message: 'আপনার অ্যাকাউন্ট সাময়িকভাবে ব্লক করা হয়েছে। বিস্তারিত জানতে Support-এ যোগাযোগ করুন।',
          target_email: blockedUser?.email || '',
          is_read_by: [],
        });
        return Response.json({ success: true, message: 'User blocked' });
      }

      // ── Unblock user ─────────────────────────────
      case 'unblock_user': {
        const unblockedUser = await base44.asServiceRole.entities.User.get(target_user_id);
        await base44.asServiceRole.entities.User.update(target_user_id, { is_blocked: false, account_status: 'active' });
        await base44.asServiceRole.entities.AppNotification.create({
          title: 'Account Unblocked',
          message: 'আপনার অ্যাকাউন্ট পুনরায় সচল করা হয়েছে।',
          target_email: unblockedUser?.email || '',
          is_read_by: [],
        });
        return Response.json({ success: true, message: 'User unblocked' });
      }

      // ── Add balance ──────────────────────────────
      case 'add_balance': {
        const { amount, reason } = data || {};
        if (!amount || amount <= 0) {
          return Response.json({ error: 'Invalid amount' }, { status: 400 });
        }
        const targetUser = await base44.asServiceRole.entities.User.get(target_user_id);
        if (!targetUser) {
          return Response.json({ error: 'User not found' }, { status: 404 });
        }
        const balanceBefore = targetUser.balance || 0;
        const balanceAfter = balanceBefore + amount;

        await base44.asServiceRole.entities.User.update(target_user_id, { balance: balanceAfter });

        // Ledger entry
        await base44.asServiceRole.entities.TransactionLedger.create({
          user_id: target_user_id,
          amount_before: balanceBefore,
          amount_after: balanceAfter,
          amount_change: amount,
          type: 'credit',
          description: reason || 'Admin balance credit',
          approved_by: user.email,
          created_at: new Date().toISOString(),
        });

        // Notification
        await base44.asServiceRole.entities.AppNotification.create({
          title: '💰 Balance Added',
          message: `আপনার অ্যাকাউন্টে ৳${amount.toLocaleString()} যোগ করা হয়েছে। নতুন ব্যালেন্স: ৳${balanceAfter.toLocaleString()}`,
          target_email: targetUser.email || '',
          is_read_by: [],
        });

        return Response.json({ success: true, balance_before: balanceBefore, balance_after: balanceAfter });
      }

      // ── Deduct balance ───────────────────────────
      case 'deduct_balance': {
        const { amount, reason } = data || {};
        if (!amount || amount <= 0) {
          return Response.json({ error: 'Invalid amount' }, { status: 400 });
        }
        const targetUser = await base44.asServiceRole.entities.User.get(target_user_id);
        if (!targetUser) {
          return Response.json({ error: 'User not found' }, { status: 404 });
        }
        const balanceBefore = targetUser.balance || 0;
        const minBalance = targetUser.min_balance || 0;

        if (balanceBefore - amount < minBalance) {
          return Response.json({
            error: `Insufficient balance. Available: ৳${balanceBefore}, Minimum required: ৳${minBalance}`
          }, { status: 400 });
        }

        const balanceAfter = balanceBefore - amount;
        await base44.asServiceRole.entities.User.update(target_user_id, { balance: balanceAfter });

        await base44.asServiceRole.entities.TransactionLedger.create({
          user_id: target_user_id,
          amount_before: balanceBefore,
          amount_after: balanceAfter,
          amount_change: -amount,
          type: 'debit',
          description: reason || 'Admin balance deduction',
          approved_by: user.email,
          created_at: new Date().toISOString(),
        });

        await base44.asServiceRole.entities.AppNotification.create({
          title: '⚠️ Balance Deducted',
          message: `আপনার অ্যাকাউন্ট থেকে ৳${amount.toLocaleString()} কাটা হয়েছে। নতুন ব্যালেন্স: ৳${balanceAfter.toLocaleString()}`,
          target_email: targetUser.email || '',
          is_read_by: [],
        });

        return Response.json({ success: true, balance_before: balanceBefore, balance_after: balanceAfter });
      }

      // ── Reset PIN ────────────────────────────────
      case 'reset_pin': {
        await base44.asServiceRole.entities.User.update(target_user_id, {
          pin: null,
          pin_failed_attempts: 0,
          pin_locked_until: null,
        });
        return Response.json({ success: true, message: 'PIN reset successfully' });
      }

      // ── Set min balance ──────────────────────────
      case 'set_min_balance': {
        const { min_balance } = data || {};
        if (min_balance === undefined || min_balance < 0) {
          return Response.json({ error: 'Invalid min_balance value' }, { status: 400 });
        }
        await base44.asServiceRole.entities.User.update(target_user_id, { min_balance });
        return Response.json({ success: true, message: `Min balance set to ৳${min_balance}` });
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});