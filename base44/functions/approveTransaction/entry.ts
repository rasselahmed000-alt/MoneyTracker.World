import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();
    if (admin?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { txId, action, last4Digit } = await req.json();
    if (!txId || !action) {
      return Response.json({ error: 'txId and action required' }, { status: 400 });
    }

    // Fetch the transaction
    const tx = await base44.asServiceRole.entities.Transaction.get(txId);
    if (!tx) return Response.json({ error: 'Transaction not found' }, { status: 404 });
    if (tx.status !== 'pending') {
      return Response.json({ error: 'Transaction already processed', status: tx.status }, { status: 400 });
    }

    // Fetch user
    const users = await base44.asServiceRole.entities.User.filter({ email: tx.user_email });
    const user = users?.[0];

    if (action === 'approve') {
      if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

      // For mobile banking, last4Digit is required
      if (tx.type === 'mobile_banking' && (!last4Digit || last4Digit.length !== 4 || !/^\d+$/.test(last4Digit))) {
        return Response.json({ error: 'Valid 4-digit reference number required for mobile banking approval' }, { status: 400 });
      }

      // Balance logic: deposit/receive = ADD, all others (withdraw, send, mobile_banking, bank_transfer) = DEDUCT
      const isCredit = tx.type === 'deposit' || tx.type === 'receive';
      const currentBal = user.balance || 0;
      const txAmount = tx.amount || 0;
      const newBal = isCredit
        ? currentBal + txAmount
        : Math.max(0, currentBal - txAmount);

      await base44.asServiceRole.entities.User.update(user.id, { balance: newBal });

      // Update transaction to success
      await base44.asServiceRole.entities.Transaction.update(txId, {
        status: 'success',
        approval_last_4_digit: last4Digit || '',
        approved_by: admin.email,
        approved_at: new Date().toISOString(),
      });

      // Notify user
      await base44.asServiceRole.entities.AppNotification.create({
        title: '✅ Transaction Approved',
        message: `আপনার ৳${txAmount.toLocaleString()} টাকার লেনদেন সফলভাবে অনুমোদিত হয়েছে। নতুন ব্যালেন্স: ৳${newBal.toLocaleString()}`,
        target_email: tx.user_email,
        is_read_by: [],
      });

      return Response.json({ success: true, action: 'approved', newBalance: newBal, txType: tx.type, isCredit });

    } else if (action === 'reject') {
      // ── NO REFUND: balance was never deducted, transaction is just cancelled ──
      // Simply mark as failed — customer balance remains unchanged

      // Update original transaction to failed
      await base44.asServiceRole.entities.Transaction.update(txId, {
        status: 'failed',
        rejected_by: admin.email,
        rejected_at: new Date().toISOString(),
      });

      // Notify user (no refund since balance was never deducted)
      await base44.asServiceRole.entities.AppNotification.create({
        title: '❌ Transaction Rejected',
        message: `দুঃখিত, আপনার ৳${(tx.amount || 0).toLocaleString()} টাকার লেনদেন বাতিল হয়েছে। (${tx.description || tx.type})`,
        target_email: tx.user_email,
        is_read_by: [],
      });

      return Response.json({ success: true, action: 'rejected' });

    } else {
      return Response.json({ error: 'Invalid action. Use approve or reject.' }, { status: 400 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});