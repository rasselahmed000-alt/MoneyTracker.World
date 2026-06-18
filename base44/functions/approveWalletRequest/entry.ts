import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();
    if (admin?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { requestId, status } = await req.json();
    if (!requestId || !['approved', 'rejected'].includes(status)) {
      return Response.json({ error: 'requestId and valid status required' }, { status: 400 });
    }

    const walletReq = await base44.asServiceRole.entities.WalletRequest.get(requestId);
    if (!walletReq) return Response.json({ error: 'Request not found' }, { status: 404 });
    if (walletReq.status !== 'pending') return Response.json({ error: 'Already processed' }, { status: 400 });

    // Update wallet request status
    await base44.asServiceRole.entities.WalletRequest.update(requestId, { status });

    if (status === 'approved') {
      // Find user and update balance
      const users = await base44.asServiceRole.entities.User.filter({ email: walletReq.user_email });
      if (!users || users.length === 0) return Response.json({ error: 'User not found' }, { status: 404 });

      const targetUser = users[0];
      const currentBalance = targetUser.balance || 0;
      const amount = walletReq.amount || 0;

      const newBalance = walletReq.type === 'deposit'
        ? currentBalance + amount
        : Math.max(0, currentBalance - amount);

      await base44.asServiceRole.entities.User.update(targetUser.id, { balance: newBalance });

      // Notify user
      await base44.asServiceRole.entities.AppNotification.create({
        title: walletReq.type === 'deposit' ? '✅ Deposit Approved' : '✅ Withdrawal Approved',
        message: `আপনার ৳${amount.toLocaleString()} এর ${walletReq.type === 'deposit' ? 'ডিপোজিট' : 'উইথড্রয়াল'} অনুমোদিত হয়েছে। নতুন ব্যালেন্স: ৳${newBalance.toLocaleString()}`,
        target_email: walletReq.user_email,
        is_read_by: [],
      });

      return Response.json({ success: true, newBalance, action: 'approved' });
    }

    // Rejected — notify user
    await base44.asServiceRole.entities.AppNotification.create({
      title: '❌ Request Rejected',
      message: `দুঃখিত, আপনার ৳${(walletReq.amount || 0).toLocaleString()} এর অনুরোধ বাতিল হয়েছে।`,
      target_email: walletReq.user_email,
      is_read_by: [],
    });

    return Response.json({ success: true, action: 'rejected' });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});