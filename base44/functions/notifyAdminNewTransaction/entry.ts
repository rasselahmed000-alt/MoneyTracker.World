import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ADMIN_EMAIL = 'saifjariya@gmail.com';

async function sendTelegram(message) {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { data, event } = payload;

    if (!data) return Response.json({ ok: false, reason: 'No data' });

    const isManualDeposit = event?.entity_name === 'ManualDepositRequest';
    const isTransaction = event?.entity_name === 'Transaction';

    let subject = '';
    let bodyHtml = '';

    if (isManualDeposit) {
      const methodLabel = data.method === 'bank' ? 'Bank Transfer' : 'Mobile Banking';
      const bdtFormatted = data.bdt_amount ? `৳${Number(data.bdt_amount).toLocaleString()}` : '—';

      await sendTelegram(
`🔔 <b>নতুন Deposit Request!</b>

👤 User: <b>${data.user_name || data.user_email}</b>
📧 Email: ${data.user_email || '—'}
🌍 Country: ${data.country || '—'}
💳 Method: ${methodLabel}
💵 Amount: ${data.amount_sent || 0} ${data.currency || ''}
💰 BDT: ${bdtFormatted}
⏳ Status: Pending

👉 https://cellfin.base44.app/admin/manual-deposits`
      );

      subject = `🔔 নতুন Deposit Request — ${data.user_name || data.user_email}`;
      bodyHtml = buildEmail({
        badge: '⏳ Pending Deposit Request',
        badgeColor: '#D4A843',
        title: 'নতুন Deposit Request',
        subtitle: 'একজন ব্যবহারকারী ডিপোজিট রিকোয়েস্ট পাঠিয়েছেন',
        rows: [
          ['User', data.user_name || '—'],
          ['Email', data.user_email || '—'],
          ['Country', data.country || '—'],
          ['Method', methodLabel],
          ['Amount Sent', `${data.amount_sent || 0} ${data.currency || ''}`],
          ['BDT Amount', bdtFormatted],
          ['Status', 'Pending'],
        ],
        ctaLabel: 'Admin Panel খুলুন',
        ctaUrl: 'https://cellfin.base44.app/admin/manual-deposits',
      });

    } else if (isTransaction) {
      const typeLabel = {
        mobile_banking: 'Mobile Banking',
        bank_transfer: 'Bank Transfer',
        deposit: 'Deposit',
        withdraw: 'Withdraw',
        intl_transfer: 'International Transfer',
        send: 'Send Money',
      }[data.type] || data.type;

      const isIntl = data.type === 'intl_transfer' || data.type === 'send';

      if (isIntl && data.country) {
        await sendTelegram(
`🌍 <b>নতুন International Transfer Request!</b>

👤 User: <b>${data.user_email || '—'}</b>
🌐 Country: ${data.country || '—'}
💳 Method: ${data.provider || '—'}
📋 Receiver Info: ${data.receiver_info || data.recipient_mobile || '—'}
💰 Amount: ৳${Number(data.amount || 0).toLocaleString()} ${data.currency || 'BDT'}
💱 Receiver Gets: ${data.converted_amount || '—'} ${data.currency_code || ''}
🆔 TX ID: ${data.tx_id || '—'}
⏳ Status: Pending Approval

👉 https://cellfin.base44.app/admin/transactions`
        );

        subject = `🌍 Intl Transfer — ${data.country} · ${data.provider} · ৳${Number(data.amount || 0).toLocaleString()}`;
        bodyHtml = buildEmail({
          badge: '⏳ Pending International Transfer',
          badgeColor: '#10b981',
          title: 'নতুন International Transfer',
          subtitle: 'একটি নতুন আন্তর্জাতিক ট্রান্সফার রিকোয়েস্ট এসেছে',
          rows: [
            ['User', data.user_email || '—'],
            ['Country', data.country || '—'],
            ['Method', data.provider || '—'],
            ['Receiver Info', data.receiver_info || data.recipient_mobile || '—'],
            ['Amount (BDT)', `৳${Number(data.amount || 0).toLocaleString()}`],
            ['Receiver Gets', `${data.converted_amount || '—'} ${data.currency_code || ''}`],
            ['TX ID', data.tx_id || '—'],
            ['Status', 'Pending Approval'],
          ],
          ctaLabel: 'Transactions দেখুন',
          ctaUrl: 'https://cellfin.base44.app/admin/transactions',
        });
      } else {
        // Fetch user for agent info
        let agentName = '—', agentCode = '—', userName = data.user_email || '—', userId = data.user_id || '—';
        try {
          const users = await base44.asServiceRole.entities.User.filter({ email: data.user_email }, null, 1);
          if (users?.[0]) {
            agentName = users[0].agent_name || users[0].kyc_agent_name || '—';
            agentCode = users[0].agent_code || users[0].kyc_agent_code || '—';
            userName = users[0].display_name || users[0].full_name || data.user_email;
            userId = users[0].id;
          }
        } catch {}

        await sendTelegram(
        `💸 <b>নতুন Transaction Request!</b>

        👤 User: <b>${userName}</b>
        🆔 User ID: <code>${userId}</code>
        🤝 Agent: ${agentName} · <code>${agentCode}</code>
        🏷️ Type: ${typeLabel}
        🏦 Provider/Bank: ${data.provider || data.bank_name || '—'}
        📱 Recipient: ${data.recipient_mobile || data.account_number || '—'}
        💰 Amount: ৳${Number(data.amount || 0).toLocaleString()} ${data.currency || 'BDT'}
        🆔 TX ID: ${data.tx_id || '—'}
        📅 Time: ${new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' })}
        ⏳ Status: Pending Approval

        👉 https://cellfin.base44.app/admin/transactions`
        );

        subject = `💸 নতুন Transaction — ${typeLabel} · ৳${Number(data.amount || 0).toLocaleString()}`;
        bodyHtml = buildEmail({
          badge: '⏳ Pending Transaction',
          badgeColor: '#6366f1',
          title: 'নতুন Transaction Request',
          subtitle: 'একটি নতুন পেমেন্ট রিকোয়েস্ট এসেছে',
          rows: [
            ['User', data.user_email || '—'],
            ['Type', typeLabel],
            ['Provider / Bank', data.provider || data.bank_name || '—'],
            ['Recipient', data.recipient_mobile || data.account_number || '—'],
            ['Amount', `৳${Number(data.amount || 0).toLocaleString()} ${data.currency || 'BDT'}`],
            ['TX ID', data.tx_id || '—'],
            ['Description', data.description || '—'],
            ['Status', 'Pending Approval'],
          ],
          ctaLabel: 'Transactions দেখুন',
          ctaUrl: 'https://cellfin.base44.app/admin/transactions',
        });
      }
    }

    if (!subject) return Response.json({ ok: false, reason: 'Unknown entity' });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: ADMIN_EMAIL,
      subject,
      body: bodyHtml,
    });

    return Response.json({ ok: true, sent_to: ADMIN_EMAIL });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildEmail({ badge, badgeColor, title, subtitle, rows, ctaLabel, ctaUrl }) {
  const rowsHtml = rows.map(([k, v]) => `
    <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #eee;font-size:13px;">
      <span style="color:#888;font-weight:600;">${k}</span>
      <span style="color:#222;font-weight:700;text-align:right;max-width:60%;">${v}</span>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <div style="max-width:480px;margin:30px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:28px 24px;text-align:center;">
      <div style="width:48px;height:48px;background:linear-gradient(135deg,#10b981,#059669);border-radius:14px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:22px;">🔔</span>
      </div>
      <h1 style="color:#10b981;font-size:20px;margin:0;font-weight:800;letter-spacing:0.5px;">Cellfin Admin Alert</h1>
      <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:5px 0 0;">${subtitle}</p>
    </div>

    <!-- Body -->
    <div style="padding:24px;">
      <div style="display:inline-block;background:${badgeColor}20;color:${badgeColor};border:1px solid ${badgeColor}50;border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700;margin-bottom:16px;">${badge}</div>
      <h2 style="font-size:16px;font-weight:800;color:#0f172a;margin:0 0 16px;">${title}</h2>
      
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:4px 16px;margin-bottom:20px;">
        ${rowsHtml}
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin-top:8px;">
        <a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-weight:800;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;box-shadow:0 4px 12px rgba(16,185,129,0.35);">${ctaLabel} →</a>
      </div>

      <p style="color:#94a3b8;font-size:11px;text-align:center;margin-top:20px;">এই নোটিফিকেশন স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে — Cellfin Admin System</p>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:14px 24px;text-align:center;font-size:11px;color:#aaa;border-top:1px solid #e2e8f0;">
      © 2026 Cellfin Remittance · All rights reserved
    </div>
  </div>
</body>
</html>`;
}