import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
    if (!botToken || !chatId) return Response.json({ success: false, reason: 'telegram_not_configured' });

    // Fetch recent deposit info
    const recentTxs = await base44.asServiceRole.entities.Transaction.filter(
      { user_email: user.email, type: 'deposit' }, '-created_date', 3
    ).catch(() => []);
    const lastDeposit = recentTxs?.[0];
    const depositInfo = lastDeposit
      ? `Last: ৳${(lastDeposit.amount||0).toLocaleString()} [${lastDeposit.status}]`
      : 'No deposits';

    const now = new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' });
    const msg = `🔴 <b>SENIOR AGENT REQUEST</b>\n\n👤 <b>${user.full_name || 'Unknown'}</b>\n📧 ${user.email}\n🆔 ${user.id?.slice(-8)}\n💰 Balance: <b>৳${(user.balance || 0).toLocaleString()}</b> BDT\n📦 Deposit: ${depositInfo}\n⏰ ${now}\n\n<i>Customer needs urgent senior support assistance.</i>`;

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' }),
    });

    const data = await res.json();
    return Response.json({ success: data.ok, msg_id: data.result?.message_id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});