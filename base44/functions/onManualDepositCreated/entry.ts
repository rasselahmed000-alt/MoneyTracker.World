import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { data } = payload;

    if (!data?.user_email) {
      return Response.json({ ok: false, reason: 'No user_email in payload' });
    }

    const methodLabel = data.method === 'bank' ? 'Bank Transfer' : 'Mobile Banking';
    const bdtFormatted = data.bdt_amount ? `৳${Number(data.bdt_amount).toLocaleString()}` : '—';
    const sentAmount = data.amount_sent ? `${data.amount_sent} ${data.currency || ''}`.trim() : '—';

    const subject = `✅ Deposit Request Received — Cellfin`;

    const body = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 480px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0B3D2E 0%, #1a6b4e 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: #D4A843; font-size: 22px; margin: 0; font-weight: 800; letter-spacing: 1px; }
    .header p { color: rgba(255,255,255,0.7); font-size: 13px; margin: 6px 0 0; }
    .body { padding: 28px 24px; }
    .greeting { font-size: 15px; color: #333; margin-bottom: 16px; }
    .info-card { background: #f8faf9; border: 1px solid #e0ede8; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 13px; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #888; font-weight: 600; }
    .info-value { color: #222; font-weight: 700; text-align: right; }
    .bdt { color: #0B3D2E; font-size: 16px; font-weight: 800; }
    .badge { display: inline-block; background: #FFF8E7; color: #D4A843; border: 1px solid #F0D080; border-radius: 20px; padding: 4px 14px; font-size: 12px; font-weight: 700; margin-bottom: 20px; }
    .note { background: #fffbf0; border-left: 3px solid #D4A843; padding: 12px 16px; border-radius: 8px; font-size: 12px; color: #7a6020; line-height: 1.6; }
    .footer { background: #f4f4f4; padding: 16px 24px; text-align: center; font-size: 11px; color: #aaa; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Cellfin</h1>
      <p>International Remittance & Payment</p>
    </div>
    <div class="body">
      <p class="greeting">প্রিয় <strong>${data.user_name || 'গ্রাহক'}</strong>, আপনার ডিপোজিট রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে।</p>
      <span class="badge">⏳ Pending Review</span>
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">Country</span>
          <span class="info-value">${data.country || '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Method</span>
          <span class="info-value">${methodLabel}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Amount Sent</span>
          <span class="info-value">${sentAmount}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Approx. BDT</span>
          <span class="info-value bdt">${bdtFormatted}</span>
        </div>
      </div>
      <div class="note">
        ⏱ আপনার রিকোয়েস্ট Admin পর্যালোচনা করছেন। সাধারণত ১–২৪ ঘণ্টার মধ্যে Approval সম্পন্ন হয়। Approval-এর পর আপনার Cellfin balance স্বয়ংক্রিয়ভাবে যোগ হবে।
      </div>
    </div>
    <div class="footer">
      &copy; 2026 Cellfin · All rights reserved<br/>
      এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে, উত্তর দেওয়ার প্রয়োজন নেই।
    </div>
  </div>
</body>
</html>
    `.trim();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: data.user_email,
      subject,
      body,
    });

    return Response.json({ ok: true, sent_to: data.user_email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});