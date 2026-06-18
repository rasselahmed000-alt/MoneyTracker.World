import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { requestId, status, admin_note, repeat_count } = body;

    if (!requestId) return Response.json({ error: 'requestId required' }, { status: 400 });
    if (!['approved', 'rejected'].includes(status)) return Response.json({ error: 'Invalid status' }, { status: 400 });

    // Get the deposit request
    const depositReq = await base44.asServiceRole.entities.ManualDepositRequest.get(requestId);
    if (!depositReq) return Response.json({ error: 'Request not found' }, { status: 404 });
    if (depositReq.status !== 'pending') return Response.json({ error: 'Already processed', currentStatus: depositReq.status }, { status: 400 });

    // If rejected — just update status
    if (status === 'rejected') {
      await base44.asServiceRole.entities.ManualDepositRequest.update(requestId, {
        status: 'rejected',
        admin_note: admin_note || '',
      });
      return Response.json({ success: true, status: 'rejected' });
    }

    // If approved — find user by email using list + manual match
    const allUsers = await base44.asServiceRole.entities.User.list();
    const targetUser = (allUsers || []).find(u => u.email === depositReq.user_email);
    if (!targetUser) return Response.json({ error: `User not found: ${depositReq.user_email}` }, { status: 404 });

    const currentBalance = Number(targetUser.balance) || 0;
    const baseAmount = Number(depositReq.bdt_amount) || 0;
    const multiplier = Math.max(1, Math.min(100, parseInt(repeat_count) || 1));
    const totalAmount = baseAmount * multiplier;
    const newBalance = currentBalance + totalAmount;

    // Update user balance
    await base44.asServiceRole.entities.User.update(targetUser.id, {
      balance: newBalance,
      balance_updated_at: new Date().toISOString(),
    });

    // Update deposit request status
    await base44.asServiceRole.entities.ManualDepositRequest.update(requestId, {
      status: 'approved',
      admin_note: admin_note || '',
      repeat_count: multiplier,
      approved_total: totalAmount,
    });

    // Create Transaction history entries (one per repeat)
    const txPromises = [];
    for (let i = 0; i < multiplier; i++) {
      txPromises.push(
        base44.asServiceRole.entities.Transaction.create({
          user_id: targetUser.id,
          user_email: depositReq.user_email,
          type: 'deposit',
          amount: baseAmount,
          currency: 'BDT',
          status: 'success',
          tx_id: `DEP-${requestId.slice(-6).toUpperCase()}-${i + 1}`,
          description: `Manual Deposit Approved${multiplier > 1 ? ` (${i + 1}/${multiplier})` : ''}`,
          provider: depositReq.method,
          deposit_request_id: requestId,
        })
      );
    }
    await Promise.all(txPromises);

    return Response.json({
      success: true,
      newBalance,
      addedAmount: totalAmount,
      baseAmount,
      multiplier,
      entriesCreated: multiplier,
      status: 'approved',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});