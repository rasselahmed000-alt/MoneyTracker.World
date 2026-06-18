import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { data, old_data, event } = payload;

    // Only act when status changes to 'approved'
    if (event?.type !== 'update') return Response.json({ skip: 'not update' });
    if (data?.status !== 'approved') return Response.json({ skip: 'not approved' });
    if (old_data?.status === 'approved') return Response.json({ skip: 'already was approved' });

    const userEmail = data.user_email;
    const bdtAmount = data.bdt_amount || 0;

    if (!userEmail || bdtAmount <= 0) return Response.json({ skip: 'invalid data' });

    // Find user by email
    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    if (!users || users.length === 0) return Response.json({ error: 'User not found' }, { status: 404 });

    const targetUser = users[0];
    const newBalance = (targetUser.balance || 0) + bdtAmount;

    // Update balance
    await base44.asServiceRole.entities.User.update(targetUser.id, { balance: newBalance });

    // Send push notification
    try {
      const subs = await base44.asServiceRole.entities.PushSubscription.filter({ user_email: userEmail });
      if (subs[0]?.subscription) {
        await base44.asServiceRole.functions.invoke('sendPushNotification', {
          subscription: JSON.parse(subs[0].subscription),
          title: '✅ ডিপোজিট অনুমোদিত!',
          body: `৳${bdtAmount.toLocaleString()} আপনার Money Tracker ওয়ালেটে যোগ হয়েছে।`,
          url: '/history',
        });
      }
    } catch (e) {
      console.warn('Push failed:', e.message);
    }

    return Response.json({ success: true, newBalance, addedAmount: bdtAmount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});