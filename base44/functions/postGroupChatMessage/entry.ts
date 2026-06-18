import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Random system messages
const SYSTEM_MESSAGES = [
  'নতুন ব্যবহারকারীদের জন্য প্রথম ট্রান্সফার ৫% ছাড় পাবেন! 🎁',
  'আপনার ওয়ালেট ২৪/৭ নিরাপদ ও সুরক্ষিত রাখা হয়।',
  'প্রতিদিন নতুন এক্সচেঞ্জ রেট আপডেট পান।',
  'আন্তর্জাতিক রেমিট্যান্সে দ্রুততম সেবা পাচ্ছি আমরা।',
  'আপনার বন্ধুদের রেফার করুন এবং বোনাস পান!',
  'KYC ভেরিফিকেশন সম্পন্ন করে উচ্চতর লিমিট আনলক করুন।',
  'ভিসা আবেদন এখন আরও সহজ এবং দ্রুত!',
  'এয়ার টিকেট বুকিংয়ে সেরা দাম নিশ্চিত।',
  'নিরাপদ PIN ব্যবস্থা দিয়ে আপনার অ্যাকাউন্ট সুরক্ষিত রাখুন।',
  'লাইভ চ্যাটে আমাদের এজেন্টরা সবসময় প্রস্তুত!',
];

// Unique usernames per day
const SYSTEM_USERNAMES = [
  'Money Helper', 'Support Team', 'Finance Bot', 'Transfer Guide',
  'Safety Officer', 'Rate Update Bot', 'Reminder Assistant'
];

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Post system message every 5-15 minutes
    const now = new Date();
    const minute = now.getMinutes();
    const shouldPost = minute % 5 === 0; // Every 5 minutes

    if (!shouldPost) {
      return Response.json({ posted: false });
    }

    // Get used usernames today
    const dayKey = getTodayKey();
    const usedKey = `group_chat_usernames_${dayKey}`;
    const usedRaw = localStorage.getItem(usedKey) || '[]';
    const used = JSON.parse(usedRaw);

    // Pick unused username
    let username;
    const available = SYSTEM_USERNAMES.filter(u => !used.includes(u));
    if (available.length === 0) {
      // Reset if all used
      localStorage.removeItem(usedKey);
      username = SYSTEM_USERNAMES[0];
    } else {
      username = available[Math.floor(Math.random() * available.length)];
    }

    used.push(username);
    localStorage.setItem(usedKey, JSON.stringify(used));

    // Pick random message
    const message = SYSTEM_MESSAGES[Math.floor(Math.random() * SYSTEM_MESSAGES.length)];

    // Create system message
    await base44.entities.GroupMessage.create({
      content: message,
      username: username,
      user_email: null,
      message_type: 'system',
      status: 'approved',
    });

    return Response.json({ posted: true, message, username });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});