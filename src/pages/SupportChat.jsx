import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft, Send, ImagePlus, X, Check, CheckCheck,
  Star, Users, Phone, Clock, ZoomIn, ChevronUp, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const SESSION_TIMEOUT_MS = 10 * 60 * 1000;
const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Human-like typing delay based on reply length
function getHumanDelay(replyText) {
  const len = (replyText || '').length;
  if (len < 60)  return 3000 + Math.random() * 2000;   // 3–5s
  if (len < 180) return 6000 + Math.random() * 6000;   // 6–12s
  return 15000 + Math.random() * 15000;                 // 15–30s
}

const QUICK_REPLIES = [
  'আমার ব্যালেন্স কত?', 'টাকা পাঠাতে সমস্যা',
  'KYC কীভাবে করব?', 'ট্রানজেকশন পেন্ডিং', 'রেট জানতে চাই',
];

function getRandomAgent(pool, excludeId, seniorOnly = false) {
  const filtered = pool.filter(a => a.id !== excludeId && (!seniorOnly || a.senior));
  if (!filtered.length) {
    const any = pool.filter(a => a.id !== excludeId);
    return any[Math.floor(Math.random() * any.length)] || pool[0];
  }
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function avatarFallback(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0B3D2E&color=D4A843&size=80&bold=true`;
}

// ─── AgentAvatar ─────────────────────────────────────────
function AgentAvatar({ agent, size = 40, online = true }) {
  const [err, setErr] = useState(false);
  return (
    <div className="relative shrink-0">
      <div className="rounded-full overflow-hidden border-2"
        style={{ width: size, height: size, borderColor: online ? '#10b981' : '#e2e8f0' }}>
        <img src={err ? avatarFallback(agent.name) : agent.img} onError={() => setErr(true)}
          className="w-full h-full object-cover" alt={agent.name} />
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-emerald-400"
          style={{ width: size * 0.28, height: size * 0.28 }} />
      )}
    </div>
  );
}

// ─── Countdown Banner ────────────────────────────────────
function CountdownBanner({ seconds, position }) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="mx-4 my-2 px-4 py-3.5 rounded-2xl"
      style={{ background: 'linear-gradient(135deg,#fffbeb,#fef9c3)', border: '1px solid #fde68a' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <Users size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="font-black text-amber-800 text-xs">Queue Position: #{position}</p>
            <p className="text-[10px] text-amber-600 font-medium">Priority Support: Active</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-amber-500 font-bold uppercase tracking-wider">Est. Wait</p>
          <div className="flex items-center gap-1">
            <Clock size={11} className="text-amber-600" />
            <p className="font-black text-amber-800 text-base font-mono">{m}:{s}</p>
          </div>
        </div>
      </div>
      <div className="mt-2.5 bg-amber-200 rounded-full h-1.5 overflow-hidden">
        <motion.div className="h-full rounded-full bg-amber-500"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: seconds, ease: 'linear' }} />
      </div>
    </motion.div>
  );
}

// ─── Connected Banner ─────────────────────────────────────
function ConnectedBanner({ agent, joinedAt, onTransfer, hasDeposit }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="mx-4 my-2 px-4 py-3 rounded-2xl flex items-center gap-3"
      style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #86efac' }}>
      <AgentAvatar agent={agent} size={44} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="font-black text-gray-800 text-sm truncate">{agent.name}</p>
          {agent.senior && (
            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">SENIOR</span>
          )}
        </div>
        <p className="text-emerald-700 text-[10px] font-semibold">{agent.role}</p>
        <p className="text-gray-400 text-[9px]">
          Joined {new Date(joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      {!agent.senior && hasDeposit && (
        <button onClick={onTransfer}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 shrink-0">
          <Star size={9} /> Senior
        </button>
      )}
    </motion.div>
  );
}

// ─── Connecting Overlay ───────────────────────────────────
function ConnectingOverlay({ label }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-4 py-16">
      <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
        <div className="w-7 h-7 border-3 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"
          style={{ borderWidth: '3px' }} />
      </div>
      <p className="text-gray-500 font-semibold text-sm">{label}</p>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Typing Indicator ────────────────────────────────────
function TypingIndicator({ agentName }) {
  return (
    <div className="flex items-end gap-2 px-4">
      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-xs">
        💬
      </div>
      <div className="bg-white rounded-2xl rounded-bl-sm border border-gray-200 shadow-sm px-4 py-3">
        <p className="text-[10px] text-gray-400 font-medium mb-1.5">{agentName} is typing...</p>
        <div className="flex gap-1">
          {[0, 0.15, 0.3].map((d, i) => (
            <span key={i} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
              style={{ animationDelay: `${d}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Image Message ────────────────────────────────────────
function ImageMessage({ url }) {
  const [lb, setLb] = useState(false);
  return (
    <>
      <div className="rounded-xl overflow-hidden cursor-pointer mt-1 relative group" onClick={() => setLb(true)}>
        <img src={url} className="max-w-[200px] max-h-44 object-cover w-full rounded-xl" alt="img" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all rounded-xl">
          <ZoomIn size={18} className="text-white opacity-0 group-hover:opacity-100 transition-all" />
        </div>
      </div>
      {lb && (
        <div className="fixed inset-0 bg-black/90 z-[999] flex items-center justify-center p-4" onClick={() => setLb(false)}>
          <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-full"><X size={20} className="text-white" /></button>
          <img src={url} className="max-w-full max-h-[85vh] rounded-2xl object-contain" alt="full" />
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function SupportChat() {
  const navigate = useNavigate();

  const [agentsPool, setAgentsPool] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [chatRecord, setChatRecord] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasDeposit, setHasDeposit] = useState(false);

  const [input, setInput] = useState('');
  const [pendingImages, setPendingImages] = useState([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  const [phase, setPhase] = useState('idle'); // idle | countdown | connecting | ready
  const [countdownSecs, setCountdownSecs] = useState(0);
  const [connectLabel, setConnectLabel] = useState('Connecting Agent...');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  // CRITICAL: prevents subscription from overwriting messages during AI processing
  const isProcessingRef = useRef(false);
  const scrollRef        = useRef(null);
  const inputRef         = useRef(null);
  const fileRef          = useRef(null);
  const llmHistoryRef    = useRef([]);
  const unsubRef         = useRef(null);
  const userRef          = useRef(null);
  const chatRecordRef    = useRef(null);
  const activeSessionRef = useRef(null);
  const agentsPoolRef    = useRef([]);
  // Stable local messages ref — prevents stale closures causing flicker
  const messagesRef      = useRef([]);

  useEffect(() => { chatRecordRef.current = chatRecord; }, [chatRecord]);
  useEffect(() => { activeSessionRef.current = activeSession; }, [activeSession]);
  useEffect(() => { agentsPoolRef.current = agentsPool; }, [agentsPool]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping, streamingText, phase]);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'countdown' || countdownSecs <= 0) return;
    const t = setInterval(() => {
      setCountdownSecs(s => {
        if (s <= 1) { clearInterval(t); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  // When countdown hits 0 → transition to connecting then ready
  useEffect(() => {
    if (phase === 'countdown' && countdownSecs === 0) {
      setPhase('connecting');
      setTimeout(() => setPhase('ready'), 2200);
    }
  }, [phase, countdownSecs]);

  // Load agents from DB
  useEffect(() => {
    setAgentsLoading(true);
    base44.entities.VirtualAgent.filter({ is_active: true }, 'sort_order', 100)
      .then(dbAgents => {
        const mapped = (dbAgents || []).map(a => ({
          id: a.id, name: a.name, role: a.role || 'Support Agent',
          senior: a.is_senior || false, img: a.photo_url || '',
        }));
        setAgentsPool(mapped);
        agentsPoolRef.current = mapped;
      })
      .finally(() => setAgentsLoading(false));
  }, []);

  // Check deposit eligibility for senior agent
  useEffect(() => {
    base44.auth.me().then(async u => {
      if (!u) return;
      userRef.current = u;
      const txs = await base44.entities.Transaction.filter(
        { user_email: u.email, type: 'deposit', status: 'success' }, null, 1
      ).catch(() => []);
      setHasDeposit((txs || []).length > 0);
    }).catch(() => {});
  }, []);

  // Init — load existing session
  useEffect(() => {
    let mounted = true;
    base44.auth.me().then(async u => {
      if (!mounted) return;
      userRef.current = u;
      const recs = await base44.entities.ChatSession.filter({ user_email: u.email }, '-updated_date', 1);
      if (!mounted || !recs?.[0]) return;

      const rec = recs[0];
      setChatRecord(rec);
      subscribeToRecord(rec.id);

      const activeSess = (rec.sessions || []).find(
        s => s.session_id === rec.active_session_id && s.status === 'active'
      );

      if (activeSess) {
        const lastAct = activeSess.last_activity_at || activeSess.started_at;
        const expired = Date.now() - new Date(lastAct).getTime() > SESSION_TIMEOUT_MS;
        if (expired) {
          await archiveSession(rec, activeSess.session_id, 'expired');
          startConnect(rec, null);
        } else {
          setActiveSession(activeSess);
          const msgs = activeSess.messages || [];
          setMessages(msgs);
          messagesRef.current = msgs;
          llmHistoryRef.current = msgs
            .filter(m => m.role === 'user' || m.role === 'bot')
            .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content || '' }));
          setPhase('ready');
        }
      }
    }).catch(() => {});
    return () => { mounted = false; unsubRef.current?.(); };
  }, []); // eslint-disable-line

  const subscribeToRecord = (id) => {
    unsubRef.current?.();
    unsubRef.current = base44.entities.ChatSession.subscribe((ev) => {
      if (ev.id !== id || ev.type !== 'update' || !ev.data) return;
      // CRITICAL: Skip subscription updates while AI is processing to prevent message flicker
      if (isProcessingRef.current) return;

      setChatRecord(ev.data);
      const act = (ev.data.sessions || []).find(s => s.session_id === ev.data.active_session_id && s.status === 'active');
      if (act) {
        setActiveSession(act);
        // Only update messages from subscription if we don't have more local messages
        const dbMsgs = act.messages || [];
        if (dbMsgs.length >= messagesRef.current.length) {
          setMessages(dbMsgs);
          messagesRef.current = dbMsgs;
        }
      }
    });
  };

  const archiveSession = async (rec, sessionId, newStatus) => {
    const updated = (rec.sessions || []).map(s =>
      s.session_id === sessionId ? { ...s, status: newStatus, ended_at: new Date().toISOString() } : s
    );
    await base44.entities.ChatSession.update(rec.id, { sessions: updated, active_session_id: null });
  };

  const saveToDb = async (allSessions, activeId) => {
    const u = userRef.current;
    const rec = chatRecordRef.current;
    const activeSess = allSessions.find(s => s.session_id === activeId);
    const lastMsg = activeSess?.messages?.slice(-1)[0];
    const preview = lastMsg?.content || (lastMsg?.image_url ? '[Image]' : '');
    const payload = {
      sessions: allSessions,
      active_session_id: activeId || null,
      last_message_preview: String(preview).slice(0, 80),
      last_message_date: new Date().toISOString(),
    };
    if (rec) {
      await base44.entities.ChatSession.update(rec.id, payload);
    } else if (u) {
      const created = await base44.entities.ChatSession.create({ user_email: u.email, ...payload });
      setChatRecord(created);
      chatRecordRef.current = created;
      subscribeToRecord(created.id);
    }
  };

  // Start connection flow: countdown → connecting → ready
  const startConnect = useCallback(async (recOverride, excludeId) => {
    const rec = recOverride || chatRecordRef.current;
    const pool = agentsPoolRef.current;
    if (!pool.length) return;

    // Clear state
    const clearMsgs = [];
    setMessages(clearMsgs);
    messagesRef.current = clearMsgs;
    setActiveSession(null);
    llmHistoryRef.current = [];

    const agent = getRandomAgent(pool, excludeId, false);
    const newSess = {
      session_id: `sess_${Date.now()}`,
      agent_id: agent.id, agent_name: agent.name,
      agent_img: agent.img, agent_role: agent.role,
      agent_senior: agent.senior,
      status: 'active',
      started_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      messages: [],
    };

    const archived = (rec?.sessions || []).map(s =>
      s.status === 'active' ? { ...s, status: 'expired', ended_at: new Date().toISOString() } : s
    );
    await saveToDb([...archived, newSess], newSess.session_id);
    setActiveSession(newSess);

    // Start countdown THEN connect
    const waitSecs = 8 + Math.floor(Math.random() * 12); // 8–20 seconds
    setCountdownSecs(waitSecs);
    setPhase('countdown');
  }, []); // eslint-disable-line

  const transferToSenior = useCallback(async () => {
    const rec = chatRecordRef.current;
    const curr = activeSessionRef.current;
    if (!curr) return;

    setPhase('connecting');
    setConnectLabel('Connecting Senior Agent...');
    const clearMsgs = [];
    setMessages(clearMsgs);
    messagesRef.current = clearMsgs;
    llmHistoryRef.current = [];

    // Telegram notification
    base44.functions.invoke('seniorAgentRequest', {}).catch(() => {});

    const senior = getRandomAgent(agentsPoolRef.current, curr.agent_id, true);
    const newSess = {
      session_id: `sess_${Date.now()}`,
      agent_id: senior.id, agent_name: senior.name,
      agent_img: senior.img, agent_role: senior.role,
      agent_senior: true,
      status: 'active',
      started_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      messages: [],
      transferred_from: curr.agent_name,
    };

    const archived = (rec?.sessions || []).map(s =>
      s.session_id === curr.session_id ? { ...s, status: 'closed', ended_at: new Date().toISOString() } : s
    );
    await saveToDb([...archived, newSess], newSess.session_id);
    setActiveSession(newSess);
    setTimeout(() => setPhase('ready'), 2400);
  }, []); // eslint-disable-line

  const updateActivity = useCallback(async () => {
    const rec = chatRecordRef.current;
    const curr = activeSessionRef.current;
    if (!rec || !curr) return;
    const updated = (rec.sessions || []).map(s =>
      s.session_id === curr.session_id ? { ...s, last_activity_at: new Date().toISOString() } : s
    );
    base44.entities.ChatSession.update(rec.id, { sessions: updated });
  }, []);

  const buildUserContext = useCallback(async () => {
    const u = userRef.current;
    if (!u) return '';
    try {
      const [allTxs, manualDeposits, visaApps] = await Promise.all([
        base44.entities.Transaction.filter({ user_email: u.email }, '-created_date', 30).catch(() => []),
        base44.entities.ManualDepositRequest.filter({ user_email: u.email }, '-created_date', 5).catch(() => []),
        base44.entities.VisaApplication.filter({ user_email: u.email }, '-created_date', 3).catch(() => []),
      ]);
      const pending = allTxs.filter(t => t.status === 'pending');
      const failed  = allTxs.filter(t => t.status === 'failed');
      const fmtTx   = (t) => `[${(t.status||'?').toUpperCase()}] ${t.type?.replace(/_/g,' ')} ৳${t.amount||0}${t.provider?' '+t.provider:''}${t.description?' — '+t.description.slice(0,50):''}`;
      return [
        `Customer: ${u.full_name} | ${u.email} | Balance: ৳${(u.balance||0).toLocaleString()} BDT | MinBal: ৳${u.min_balance||0}`,
        `KYC: ${u.kyc_status||'none'} | PIN: ${u.pin?'set':'NOT SET'} | Agent: ${u.agent_name||'—'} (${u.agent_code||'—'})`,
        `Txs total: ${allTxs.length} | pending: ${pending.length} | failed: ${failed.length}`,
        `Last 10:\n${allTxs.slice(0,10).map(fmtTx).join('\n')||'none'}`,
        `Pending:\n${pending.map(fmtTx).join('\n')||'none'}`,
        `Failed:\n${failed.map(fmtTx).join('\n')||'none'}`,
        `ManualDeposits: ${manualDeposits.map(d=>`[${d.status}] ৳${d.bdt_amount||d.amount}`).join(', ')||'none'}`,
        `VisaApps: ${visaApps.map(v=>`[${v.status}] ${v.destination_country}`).join(', ')||'none'}`,
      ].join('\n');
    } catch {
      return `Customer: ${u.full_name} | Email: ${u.email} | Balance: ৳${(u.balance||0).toLocaleString()}`;
    }
  }, []);

  // Core send — stable messages, human delay, no flicker
  const sendMessage = useCallback(async (text, imageUrl = null) => {
    const curr = activeSessionRef.current;
    const rec  = chatRecordRef.current;
    if ((!text?.trim() && !imageUrl) || isTyping || phase !== 'ready' || !curr) return;

    updateActivity();

    // 1. Add user message to stable ref AND state
    const userMsg = {
      id: Date.now(), role: 'user',
      content: text?.trim() || '',
      image_url: imageUrl || undefined,
      time: nowTime(), status: 'sent',
    };
    const newMsgs = [...messagesRef.current, userMsg];
    messagesRef.current = newMsgs;
    setMessages([...newMsgs]); // spread to ensure new reference

    // 2. Block subscription updates while processing
    isProcessingRef.current = true;

    const allSessions = (rec?.sessions || []).map(s =>
      s.session_id === curr.session_id
        ? { ...s, messages: newMsgs, last_activity_at: new Date().toISOString() }
        : s
    );
    await saveToDb(allSessions, curr.session_id);

    const userContent = (text?.trim() || '') + (imageUrl ? ' [Image attached]' : '');
    const newLlm = [...llmHistoryRef.current, { role: 'user', content: userContent }];
    llmHistoryRef.current = newLlm;

    setIsTyping(true);

    const contextPromise = buildUserContext();

    try {
      const accountCtx = await contextPromise;
      const convHistory = newLlm.slice(-12)
        .map(h => `${h.role === 'user' ? 'Customer' : curr.agent_name}: ${h.content}`)
        .join('\n');

      const systemPrompt = `তুমি "${curr.agent_name}" — Money Tracker-এর ${curr.agent_role}।
তুমি একজন real, professional human support executive। কখনোই নিজেকে AI বলবে না।
Company: Money Tracker | Website: moneytracker.world

CRITICAL RULES:
- সবসময় customer-কে "স্যার" সম্বোধন করবে। কখনোই "ভাই", "আপনি" একা, বা অন্য কোনো সম্বোধন ব্যবহার করবে না।
- প্রতিটি reply professional, courteous, এবং formal হবে।
- Customer-এর EXACT প্রশ্নের সরাসরি উত্তর দাও। ৩-৪ লাইনের বেশি না।
- Account data থেকে শুধু relevant তথ্যটুকু exact value সহ বলো।

ACCOUNT DATA:
${accountCtx}

CONVERSATION:
${convHistory}

${curr.agent_name}:`;

      // AI call — runs while typing indicator shows
      const aiPromise = base44.integrations.Core.InvokeLLM({
        prompt: systemPrompt,
        file_urls: imageUrl ? [imageUrl] : undefined,
        model: 'claude_sonnet_4_6',
      });

      const result = await aiPromise;
      const reply = typeof result === 'string' ? result : (result?.text || 'দুঃখিত, একটু পরে আবার চেষ্টা করুন।');

      // Human-like delay before showing reply
      const humanDelay = getHumanDelay(reply);
      await new Promise(r => setTimeout(r, humanDelay));

      // Stream character by character
      setIsTyping(false);
      for (let i = 0; i <= reply.length; i++) {
        setStreamingText(reply.slice(0, i));
        await new Promise(r => setTimeout(r, 8));
      }
      setStreamingText('');

      // 3. Add bot message to stable ref AND state atomically
      const botMsg = {
        id: Date.now() + 1, role: 'bot',
        content: reply, time: nowTime(), status: 'read',
      };
      llmHistoryRef.current = [...newLlm, { role: 'assistant', content: reply }];
      const finalMsgs = [...messagesRef.current, botMsg];
      messagesRef.current = finalMsgs;
      setMessages([...finalMsgs]); // spread to ensure new reference

      const finalSessions = (chatRecordRef.current?.sessions || []).map(s =>
        s.session_id === activeSessionRef.current?.session_id
          ? { ...s, messages: finalMsgs, last_activity_at: new Date().toISOString() }
          : s
      );
      await saveToDb(finalSessions, activeSessionRef.current?.session_id);
    } catch {
      setIsTyping(false);
      setStreamingText('');
    } finally {
      // Re-enable subscription updates
      isProcessingRef.current = false;
    }
    inputRef.current?.focus();
  }, [isTyping, phase, updateActivity, buildUserContext]); // eslint-disable-line

  // Image select → preview (never auto-send)
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 4);
    files.forEach(async (file) => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return;
      if (file.size > 10 * 1024 * 1024) return;
      const id = Date.now() + Math.random();
      const previewUrl = URL.createObjectURL(file);
      setPendingImages(prev => [...prev, { id, previewUrl, uploadUrl: null, uploading: true }]);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setPendingImages(prev => prev.map(img =>
          img.id === id ? { ...img, uploadUrl: file_url, uploading: false } : img
        ));
      } catch {
        setPendingImages(prev => prev.filter(img => img.id !== id));
      }
    });
    e.target.value = '';
  };

  // Send: explicit user press only
  const handleSend = (e) => {
    e?.preventDefault();
    const text = input.trim();
    const readyImages = pendingImages.filter(img => img.uploadUrl);
    if (!text && readyImages.length === 0) return;
    if (isTyping || phase !== 'ready' || !agentObj) return;

    setInput('');
    setPendingImages([]);
    setShowQuickReplies(false);

    if (readyImages.length > 0) {
      sendMessage(text, readyImages[0].uploadUrl);
      readyImages.slice(1).forEach(img => setTimeout(() => sendMessage('', img.uploadUrl), 300));
    } else {
      sendMessage(text);
    }
  };

  const statusIcon = (s) => {
    if (s === 'sent')      return <Check size={10} className="text-white opacity-50" />;
    if (s === 'delivered') return <CheckCheck size={10} className="text-white opacity-70" />;
    if (s === 'read')      return <CheckCheck size={10} className="text-emerald-300" />;
    return null;
  };

  const agentObj = activeSession
    ? agentsPool.find(a => a.id === activeSession.agent_id) || {
        id: activeSession.agent_id, name: activeSession.agent_name,
        img: activeSession.agent_img, role: activeSession.agent_role,
        senior: activeSession.agent_senior,
      }
    : null;

  const hasAnyUploading = pendingImages.some(img => img.uploading);
  const canSend = !!(input.trim() || pendingImages.filter(img => img.uploadUrl).length > 0)
    && !isTyping && phase === 'ready' && !!agentObj && !hasAnyUploading;

  // ── RENDER ─────────────────────────────────────────────────
  // Custom header component (no UniversalHeader needed due to complex layout)
  const CustomHeader = () => (
    <header className="shrink-0 z-20 flex items-center gap-3 px-4 pb-3 bg-white shadow-sm"
      style={{ paddingTop: 'max(2.8rem, env(safe-area-inset-top, 2.8rem))' }}>
      <button onClick={() => navigate(-1)}
        className="p-2 rounded-xl bg-gray-100 shrink-0">
        <X size={18} className="text-gray-700" />
      </button>

        <AnimatePresence mode="wait">
          {(phase === 'countdown' || phase === 'connecting') ? (
            <motion.div key="conn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1">
              <p className="text-gray-800 font-black text-sm">Live Support</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.12}s` }} />
                ))}
                <span className="text-emerald-600 text-[10px] font-semibold">
                  {phase === 'countdown' ? 'Finding best agent...' : connectLabel}
                </span>
              </div>
            </motion.div>
          ) : agentObj && phase === 'ready' ? (
            <motion.div key={agentObj.id} initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2.5 flex-1 min-w-0">
              <AgentAvatar agent={agentObj} size={38} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-gray-900 font-black text-sm truncate">{agentObj.name}</p>
                  {agentObj.senior && (
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">SENIOR</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-600 text-[10px] font-semibold">Online · {agentObj.role}</span>
                </div>
              </div>
              {!agentObj.senior && hasDeposit && (
                <button onClick={transferToSenior}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 shrink-0">
                  <Star size={9} /> Senior
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1">
              <p className="text-gray-900 font-black text-sm">Live Support</p>
              <p className="text-gray-400 text-[10px]">24/7 Customer Support</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 shrink-0">
          <Shield size={10} className="text-emerald-600" />
          <span className="text-[9px] text-emerald-700 font-bold">Secure</span>
        </div>
      </header>
  );

  return (
    <div className="max-w-[430px] mx-auto flex flex-col font-inter"
      style={{ height: '100dvh', background: '#f8fafc' }}>

      {/* ── HEADER ── */}
      <CustomHeader />

      {/* ── MESSAGES ── */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 py-2"
        style={{ scrollbarWidth: 'none' }}>

        {/* Countdown Banner */}
        <AnimatePresence>
          {phase === 'countdown' && countdownSecs > 0 && (
            <CountdownBanner seconds={countdownSecs} position={1} />
          )}
        </AnimatePresence>

        {/* Connecting Overlay */}
        <AnimatePresence>
          {phase === 'connecting' && <ConnectingOverlay label={connectLabel} />}
        </AnimatePresence>

        {/* Transferred from badge only */}
        {agentObj && phase === 'ready' && activeSession?.transferred_from && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mx-4 mb-2 px-3 py-2 rounded-xl text-center text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200">
            🔀 Transferred from {activeSession.transferred_from}
          </motion.div>
        )}

        {/* Message list — stable rendering, no re-animation of existing messages */}
        <div className="px-4 space-y-2.5 pb-2">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div key={m.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>

                {(m.role === 'bot' || m.role === 'admin') && agentObj && (
                  <div className="shrink-0 mb-0.5">
                    <AgentAvatar agent={agentObj} size={28} online={false} />
                  </div>
                )}

                <div className={`max-w-[78%] px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                    m.role === 'user' ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'
                  }`}
                  style={m.role === 'user'
                    ? { background: 'linear-gradient(135deg,#0b3d2e,#1a6b4e)', color: '#fff' }
                    : { background: '#fff', color: '#1e293b', border: '1px solid #e2e8f0' }
                  }>
                  {m.image_url && <ImageMessage url={m.image_url} />}
                  {m.content && (
                    m.role === 'user' ? (
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    ) : (
                      <ReactMarkdown
                        className="text-[13px] leading-relaxed break-words prose prose-sm max-w-none prose-p:my-0.5 prose-strong:font-bold prose-strong:text-gray-800"
                        components={{
                          p: ({ children }) => <p className="my-0.5 leading-relaxed">{children}</p>,
                          strong: ({ children }) => <strong className="font-bold text-gray-800">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          ul: ({ children }) => <ul className="my-1 ml-3 list-disc">{children}</ul>,
                          li: ({ children }) => <li className="my-0.5 text-[13px]">{children}</li>,
                        }}
                      >{m.content}</ReactMarkdown>
                    )
                  )}
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-[9px]"
                      style={{ color: m.role === 'user' ? 'rgba(255,255,255,0.5)' : '#94a3b8' }}>
                      {m.time}
                    </span>
                    {m.role === 'user' && statusIcon(m.status)}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Streaming */}
        {streamingText && agentObj && (
          <div className="px-4 flex items-end gap-2 mt-1">
            <div className="shrink-0 mb-0.5">
              <AgentAvatar agent={agentObj} size={28} online={false} />
            </div>
            <div className="max-w-[78%] px-3.5 py-2.5 rounded-2xl rounded-bl-sm text-[13px] bg-white shadow-sm"
              style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}>
              <p className="whitespace-pre-wrap break-words">
                {streamingText}
                <span className="inline-block w-0.5 h-3.5 ml-0.5 bg-emerald-600 animate-pulse" />
              </p>
            </div>
          </div>
        )}

        {/* Typing indicator — stays until reply comes */}
        {isTyping && !streamingText && agentObj && (
          <div className="mt-2">
            <TypingIndicator agentName={agentObj.name} />
          </div>
        )}
      </main>

      {/* ── QUICK REPLIES ── */}
      <AnimatePresence>
        {showQuickReplies && phase === 'ready' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="shrink-0 overflow-hidden bg-white border-t border-gray-100">
            <div className="px-3 py-2.5 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {QUICK_REPLIES.map(q => (
                <button key={q}
                  onClick={() => { setInput(q); setShowQuickReplies(false); inputRef.current?.focus(); }}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
                  style={{ background: '#f0fdf4', color: '#0b3d2e', border: '1px solid #bbf7d0' }}>
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PENDING IMAGE PREVIEWS ── */}
      <AnimatePresence>
        {pendingImages.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="shrink-0 bg-white border-t border-gray-100 px-3 py-2.5 flex gap-2 overflow-x-auto"
            style={{ scrollbarWidth: 'none' }}>
            {pendingImages.map(img => (
              <div key={img.id} className="relative shrink-0">
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-emerald-300">
                  <img src={img.previewUrl} className="w-full h-full object-cover" alt="preview" />
                  {img.uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {!img.uploading && (
                  <button onClick={() => setPendingImages(prev => prev.filter(i => i.id !== img.id))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                    <X size={9} className="text-white" />
                  </button>
                )}
              </div>
            ))}
            <p className="text-[10px] text-gray-400 self-center ml-1 shrink-0">
              {hasAnyUploading ? 'Uploading...' : 'Press send →'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INPUT AREA — always visible ── */}
      <div className="shrink-0 z-10 bg-white border-t border-gray-100"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))' }}>
        {phase === 'idle' && (
          <div className="px-4 pt-3 pb-2 space-y-2.5">
            <div className="flex items-center gap-2">
              <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
                placeholder="Type your question here..."
                className="flex-1 text-sm outline-none py-2.5 px-4 rounded-2xl text-gray-800 placeholder:text-gray-400 border border-gray-200 bg-gray-50" />
            </div>
            {agentsLoading ? (
              <div className="flex items-center justify-center gap-2 py-3 text-gray-400 text-xs">
                <span className="w-3.5 h-3.5 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                Loading agents...
              </div>
            ) : agentsPool.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-2">No agents available. Please try later.</p>
            ) : (
              <button onClick={() => startConnect(null, null)}
                className="w-full py-3.5 rounded-2xl font-extrabold text-sm text-white flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-lg"
                style={{ background: 'linear-gradient(135deg,#0b3d2e,#1a6b4e)', boxShadow: '0 4px 20px rgba(11,61,46,0.3)' }}>
                <Phone size={16} /> Connect Support Agent
              </button>
            )}
          </div>
        )}

        {(phase === 'countdown' || phase === 'connecting') && (
          <div className="px-4 py-4 flex items-center justify-center gap-2 text-gray-400 text-xs">
            <span className="w-4 h-4 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
            <span className="font-medium">
              {phase === 'countdown' ? 'Searching for best available agent...' : connectLabel}
            </span>
          </div>
        )}

        {phase === 'ready' && (
          <div className="px-3 py-2.5">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleImageSelect} />
            <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-gray-100">
              <button type="button" onClick={() => setShowQuickReplies(!showQuickReplies)}
                className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0 transition-colors"
                style={{ background: showQuickReplies ? '#dcfce7' : 'transparent' }}>
                <ChevronUp size={14}
                  className={`transition-transform ${showQuickReplies ? 'rotate-180 text-emerald-600' : 'text-gray-400'}`} />
              </button>

              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0">
                <ImagePlus size={14} className={pendingImages.length > 0 ? 'text-emerald-600' : 'text-gray-400'} />
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={isTyping ? `${agentObj?.name} is typing...` : 'Type a message...'}
                disabled={isTyping}
                className="flex-1 bg-transparent text-sm outline-none py-2 text-gray-800 placeholder:text-gray-400 disabled:opacity-50"
              />

              <motion.button type="submit" disabled={!canSend}
                whileTap={{ scale: 0.85 }}
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
                style={{
                  background: canSend ? 'linear-gradient(135deg,#0b3d2e,#1a6b4e)' : '#e2e8f0',
                  boxShadow: canSend ? '0 4px 12px rgba(11,61,46,0.3)' : 'none',
                }}>
                <Send size={14} className={canSend ? 'text-white' : 'text-gray-400'} />
              </motion.button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}