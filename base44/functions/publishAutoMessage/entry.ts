import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Muslim Bangladeshi names
const MUSLIM_FIRST_NAMES = [
  'রাহিম', 'সাইফুল', 'আরিফ', 'তানভির', 'করিম', 'ফারহান', 'তাসনিম', 'মাহমুদ',
  'হাসান', 'মোহাম্মদ', 'ইমরান', 'নিজাম', 'মহিউদ্দিন', 'রেজা', 'নিশাত', 'শাহিন',
  'শামীম', 'বিলাল', 'ফাহিম', 'হানিফ', 'করিম', 'ইব্রাহিম', 'আবদুস', 'সালিম',
  'নাফিস', 'খায়রুল', 'জহির', 'সুমাইল', 'ফিরদাউস', 'নাসিম', 'সালেহ', 'আব্বাস'
];

const MUSLIM_FEMALE_FIRST_NAMES = [
  'জান্নাত', 'নুসরাত', 'সুমাইয়া', 'সারা', 'ফাতিমা', 'আয়েশা', 'রুমানা', 'সুলতানা',
  'মাইমুনা', 'নাজমা', 'আমিনা', 'ফাতেমা', 'আসমা', 'যায়নাব', 'খাদিজা', 'রুখসানা',
  'বিল্কিস', 'আফরোজা', 'সাজিয়া', 'নাফিসা', 'তানিয়া', 'সাবিনা', 'ফারজানা', 'মুনিয়া'
];

const MUSLIM_LAST_NAMES = [
  'আহমেদ', 'হোসেইন', 'জাহান', 'খান', 'সিদ্দিকী', 'করিম', 'আলী', 'হাসনাত', 'আবদুল্লাহ',
  'রহমান', 'আলম', 'ইসলাম', 'শেখ', 'চৌধুরী', 'মিয়া', 'নাসির', 'সুলতান', 'মীর',
  'হাবিব', 'সাকি', 'বাশার', 'খলিফা', 'মালিক', 'সালেহ', 'নুর', 'ফারহান'
];

// Hindu/Bangladeshi Hindu names
const HINDU_FIRST_NAMES = [
  'রাজিব', 'সুমন্ত', 'প্রিয়', 'অনিল', 'বিজয়', 'রিপন', 'মণি', 'সন্তোষ',
  'অনিলকুমার', 'সুধীর', 'বিমল', 'দেবজ্যোতি', 'সুব্রত', 'পার্থ', 'রুদ্র', 'সুব্রহ্মণ্যম'
];

const HINDU_FEMALE_FIRST_NAMES = [
  'প্রিয়া', 'রিয়া', 'সুমা', 'দীপা', 'গীতা', 'মীরা', 'রিনা', 'সীমা',
  'নীলা', 'লীনা', 'বিনা', 'সুজয়া', 'মিতা', 'নিলম', 'আরতি', 'শ্রেয়া'
];

const HINDU_LAST_NAMES = [
  'গুপ্তা', 'বর্মন', 'সরকার', 'দাস', 'শর্মা', 'মুখার্জি', 'সাহা', 'বসু', 'দত্ত',
  'প্রসাদ', 'ঠাকুর', 'রায়', 'পাল', 'বোস', 'দে', 'ভট্টাচার্য', 'সেন', 'চক্রবর্তী'
];

function generateUniqueName(usedNames = []) {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    // 60% Muslim names, 40% Hindu names
    const isMuslim = Math.random() < 0.6;
    
    let firstName, lastName;
    
    if (isMuslim) {
      const isMale = Math.random() < 0.5;
      firstName = isMale 
        ? MUSLIM_FIRST_NAMES[Math.floor(Math.random() * MUSLIM_FIRST_NAMES.length)]
        : MUSLIM_FEMALE_FIRST_NAMES[Math.floor(Math.random() * MUSLIM_FEMALE_FIRST_NAMES.length)];
      lastName = MUSLIM_LAST_NAMES[Math.floor(Math.random() * MUSLIM_LAST_NAMES.length)];
    } else {
      const isMale = Math.random() < 0.5;
      firstName = isMale
        ? HINDU_FIRST_NAMES[Math.floor(Math.random() * HINDU_FIRST_NAMES.length)]
        : HINDU_FEMALE_FIRST_NAMES[Math.floor(Math.random() * HINDU_FEMALE_FIRST_NAMES.length)];
      lastName = HINDU_LAST_NAMES[Math.floor(Math.random() * HINDU_LAST_NAMES.length)];
    }
    
    const fullName = `${firstName} ${lastName}`;

    if (!usedNames.includes(fullName)) {
      return fullName;
    }
    attempts++;
  }

  // Fallback with timestamp
  const isMuslim = Math.random() < 0.6;
  let firstName, lastName;
  
  if (isMuslim) {
    const isMale = Math.random() < 0.5;
    firstName = isMale 
      ? MUSLIM_FIRST_NAMES[Math.floor(Math.random() * MUSLIM_FIRST_NAMES.length)]
      : MUSLIM_FEMALE_FIRST_NAMES[Math.floor(Math.random() * MUSLIM_FEMALE_FIRST_NAMES.length)];
    lastName = MUSLIM_LAST_NAMES[Math.floor(Math.random() * MUSLIM_LAST_NAMES.length)];
  } else {
    const isMale = Math.random() < 0.5;
    firstName = isMale
      ? HINDU_FIRST_NAMES[Math.floor(Math.random() * HINDU_FIRST_NAMES.length)]
      : HINDU_FEMALE_FIRST_NAMES[Math.floor(Math.random() * HINDU_FEMALE_FIRST_NAMES.length)];
    lastName = HINDU_LAST_NAMES[Math.floor(Math.random() * HINDU_LAST_NAMES.length)];
  }
  
  const timestamp = Date.now().toString().slice(-3);
  return `${firstName} ${lastName}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get schedule
    const schedules = await base44.asServiceRole.entities.AutoMessageSchedule.list();
    const schedule = schedules?.[0];

    if (!schedule || !schedule.is_enabled) {
      return Response.json({ message: 'Auto messaging is disabled or schedule not found' });
    }

    // Check if enough time has passed
    const lastTime = schedule.last_message_time ? new Date(schedule.last_message_time).getTime() : 0;
    const now = Date.now();
    const intervalMs = (schedule.interval_minutes || 5) * 60 * 1000;

    if (now - lastTime < intervalMs) {
      return Response.json({ message: 'Not enough time has passed' });
    }

    // Get active messages from library
    const messages = await base44.asServiceRole.entities.AutoMessageLibrary.list();
    const activeMessages = messages.filter(m => m.is_active);

    if (activeMessages.length === 0) {
      return Response.json({ error: 'No messages in library' });
    }

    // Select message based on mode
    let selectedMsg;
    if (schedule.mode === 'sequential') {
      const nextIndex = (schedule.last_sequential_index || 0) % activeMessages.length;
      selectedMsg = activeMessages[nextIndex];
    } else {
      selectedMsg = activeMessages[Math.floor(Math.random() * activeMessages.length)];
    }

    // Generate unique username
    const usedNames = schedule.used_names || [];
    const generatedName = generateUniqueName(usedNames);

    // Create group message
    const groupMsg = await base44.asServiceRole.entities.GroupMessage.create({
      content: selectedMsg.content,
      username: generatedName,
      user_email: null,
      message_type: 'system',
      status: 'approved',
      is_pinned: false,
      is_user_banned: false,
    });

    // Update schedule - increment published count, update last time, increment sequential index, and track used name
    const updateData = {
      last_message_time: new Date().toISOString(),
      total_published: (schedule.total_published || 0) + 1,
      used_names: [...usedNames, generatedName],
    };

    if (schedule.mode === 'sequential') {
      updateData.last_sequential_index = ((schedule.last_sequential_index || 0) + 1) % activeMessages.length;
    }

    await base44.asServiceRole.entities.AutoMessageSchedule.update(schedule.id, updateData);

    return Response.json({
      success: true,
      message: 'Auto message published',
      mode: schedule.mode,
      published: {
        username: generatedName,
        content: selectedMsg.content,
        messageId: groupMsg.id,
      },
    });
  } catch (error) {
    console.error('Publish auto message error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});