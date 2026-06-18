import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import AdminShell from '../../components/AdminShell';
import {
  MessageSquare, Send, RefreshCw, ZoomIn, Download,
  X, ImagePlus, Radio, Shield, Cpu, PlayCircle, Activity
} from 'lucide-react';

// Agent pool (same as customer side)
const F_IMGS = [
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop&crop=face',
];
const M_IMGS = [
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
];

function getAgentImg(session) {
  if (!session?.last_agent_id) return null;
  const gender = session.last_agent_gender || 'female';
  const pool = gender === 'male' ? M_IMGS : F_IMGS;
  const idx = parseInt(session.last_agent_id.split('_')[1] || '0') % pool.length;
  return pool[idx];
}

function ChatModeToggle({ session, onUpdate }) {
  const mode = session?.chat_mode || 'ai';
  const modes = [
    { key: 'ai', label: 'AI Mode', icon: Cpu, color: '#10b981', desc: 'AI স্বয়ংক্রিয় উত্তর দিচ্ছে' },
    { key: 'hybrid', label: 'Hybrid', icon: Radio, color: '#f59e0b', desc: 'Admin + AI উভয়' },
    { key: 'manual', label: 'Manual', icon: Shield, color: '#ef4444', desc: 'শুধু Admin উত্তর দেবে' },
  ];

  return (
    <div className="flex gap-1.5 p-2 bg-slate-100 rounded-xl">
      {modes.map(m => {
        const active = mode === m.key;
        return (
          <button key={m.key} onClick={() => onUpdate({ chat_mode: m.key, admin_takeover: m.key === 'manual' })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: active ? m.color : 'transparent',
              color: active ? '#fff' : '#64748b',
              boxShadow: active ? `0 2px 8px ${m.color}44` : 'none',
            }}>
            <m.icon size={12} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

function ImageViewer({ url }) {
  const [lightbox, setLightbox] = useState(false);
  return (
    <>
      <div className="mt-1 rounded-xl overflow-hidden cursor-pointer border border-slate-200 group relative"
        onClick={() => setLightbox(true)}>
        <img src={url} alt="uploaded" className="max-w-[200px] max-h-40 object-cover w-full" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
          <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-all" />
        </div>
      </div>
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <div className="flex justify-end gap-2 mb-2">
              <a href={url} download target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-bold">
                <Download size={13} /> Download
              </a>
              <button onClick={() => setLightbox(false)} className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg"><X size={18} /></button>
            </div>
            <img src={url} alt="full" className="max-w-[90vw] max-h-[80vh] rounded-xl object-contain" style={{ imageRendering: 'crisp-edges' }} />
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminSupportChats() {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const unsubRef = useRef(null);

  const load = () => {
    base44.entities.ChatSession.list('-updated_date', 200).then(data => {
      setSessions(data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Subscribe to ALL ChatSession changes for real-time updates
  useEffect(() => {
    const unsub = base44.entities.ChatSession.subscribe((event) => {
      if (event.type === 'update' && event.data) {
        setSessions(prev => {
          const exists = prev.find(s => s.id === event.id);
          if (exists) return prev.map(s => s.id === event.id ? { ...s, ...event.data } : s);
          return prev;
        });
        setSelected(prev => prev?.id === event.id ? { ...prev, ...event.data } : prev);
      } else if (event.type === 'create' && event.data) {
        setSessions(prev => [event.data, ...prev]);
      }
    });
    unsubRef.current = unsub;
    return () => unsub();
  }, []);

  const updateSession = async (updates) => {
    if (!selected) return;
    // Append internal activity log entry (invisible to customer)
    const logEntry = {
      id: Date.now(),
      type: 'activity_log',
      action: updates.chat_mode === 'ai'
        ? 'admin_resumed_ai'
        : updates.chat_mode === 'manual'
          ? 'admin_takeover'
          : 'mode_changed_hybrid',
      label: updates.chat_mode === 'ai'
        ? '✅ AI Agent পুনরায় সক্রিয়'
        : updates.chat_mode === 'manual'
          ? '🔴 Admin Takeover চালু'
          : '⚡ Hybrid Mode চালু',
      at: new Date().toISOString(),
    };
    const existingLogs = selected.activity_log || [];
    const fullUpdates = { ...updates, activity_log: [...existingLogs, logEntry] };
    await base44.entities.ChatSession.update(selected.id, fullUpdates);
    setSelected(prev => ({ ...prev, ...fullUpdates }));
    setSessions(prev => prev.map(s => s.id === selected.id ? { ...s, ...fullUpdates } : s));
  };

  const handleResumeAI = async () => {
    if (!selected) return;
    await updateSession({ chat_mode: 'ai', admin_takeover: false });
  };

  // Get active session messages (nested structure)
  const getActiveMessages = (sess) => {
    if (!sess) return [];
    // New nested structure: sessions[].messages
    if (sess.sessions && sess.sessions.length > 0) {
      const activeSess = sess.sessions.find(s => s.session_id === sess.active_session_id && s.status === 'active')
        || sess.sessions[sess.sessions.length - 1];
      return activeSess?.messages || [];
    }
    // Fallback: old flat structure
    return sess.messages || [];
  };

  const handleReply = async () => {
    if (!reply.trim() || !selected || sending) return;
    setSending(true);
    const activeSessId = selected.active_session_id;
    const activeSess = (selected.sessions || []).find(s => s.session_id === activeSessId && s.status === 'active')
      || (selected.sessions || [])[selected.sessions?.length - 1];

    const adminMsg = {
      id: Date.now(),
      role: 'admin',
      content: reply.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      agent_name: activeSess?.agent_name || 'Support Agent',
      sent_at: new Date().toISOString(),
    };

    let updatedSessions;
    if (activeSess) {
      const newMsgs = [...(activeSess.messages || []), adminMsg];
      updatedSessions = (selected.sessions || []).map(s =>
        s.session_id === activeSess.session_id ? { ...s, messages: newMsgs } : s
      );
    } else {
      // Fallback: no sessions structure
      updatedSessions = selected.sessions;
    }

    const update = {
      last_message_preview: reply.trim().slice(0, 80),
      last_message_date: new Date().toISOString(),
      admin_takeover: true,
      chat_mode: selected.chat_mode === 'ai' ? 'manual' : selected.chat_mode,
    };
    if (updatedSessions) update.sessions = updatedSessions;

    await base44.entities.ChatSession.update(selected.id, update);
    setSelected(prev => ({ ...prev, ...update }));
    setReply('');
    setSending(false);
    load();
  };

  const handleImageSend = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    setUploadingImg(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const activeSessId = selected.active_session_id;
      const activeSess = (selected.sessions || []).find(s => s.session_id === activeSessId && s.status === 'active')
        || (selected.sessions || [])[selected.sessions?.length - 1];

      const imgMsg = {
        id: Date.now(),
        role: 'admin',
        image_url: file_url,
        content: '',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agent_name: activeSess?.agent_name || 'Support Agent',
        sent_at: new Date().toISOString(),
      };

      let update = { last_message_preview: '[Image]', last_message_date: new Date().toISOString(), admin_takeover: true };
      if (activeSess) {
        const newMsgs = [...(activeSess.messages || []), imgMsg];
        update.sessions = (selected.sessions || []).map(s =>
          s.session_id === activeSess.session_id ? { ...s, messages: newMsgs } : s
        );
      }
      await base44.entities.ChatSession.update(selected.id, update);
      setSelected(prev => ({ ...prev, ...update }));
      load();
    } catch { alert('Image upload failed'); }
    setUploadingImg(false);
    e.target.value = '';
  };

  const filteredSessions = sessions.filter(s => {
    const matchSearch = !search || s.user_email?.toLowerCase().includes(search.toLowerCase()) || s.last_message_preview?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === 'manual') return s.admin_takeover || s.chat_mode === 'manual';
    if (filter === 'ai') return !s.admin_takeover && s.chat_mode !== 'manual';
    return true;
  });

  // Get messages from active session (new nested structure) or fallback to flat (legacy)
  const activeSessionMsgs = (() => {
    if (!selected) return [];
    if (selected.active_session_id && selected.sessions) {
      const activeSess = selected.sessions.find(s => s.session_id === selected.active_session_id && s.status === 'active');
      if (activeSess?.messages) return activeSess.messages;
      // fallback: get latest session's messages
      const latest = [...(selected.sessions || [])].sort((a,b) => new Date(b.started_at) - new Date(a.started_at))[0];
      if (latest?.messages) return latest.messages;
    }
    return selected.messages || [];
  })();

  const activeSessionAgent = (() => {
    if (!selected) return null;
    if (selected.active_session_id && selected.sessions) {
      const s = selected.sessions.find(sess => sess.session_id === selected.active_session_id);
      if (s) return { name: s.agent_name, img: s.agent_img, id: s.agent_id };
    }
    return null;
  })();

  const agentImg = selected ? getAgentImg(selected) : null;
  const chatMode = selected?.chat_mode || 'ai';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeSessionMsgs.length]);

  return (
    <AdminShell>
      <div className="p-4 flex flex-col" style={{ height: 'calc(100vh - 73px)' }}>
        <div className="flex gap-4 flex-1 min-h-0">

          {/* ── Sessions List ── */}
          <div className="w-72 shrink-0 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="font-black text-slate-900 text-sm">Live Chats</h2>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="ইমেইল বা মেসেজ খুঁজুন..."
                className="mt-2 w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-emerald-400" />
              <div className="flex gap-1 mt-2">
                {['all','ai','manual'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className="flex-1 text-[10px] font-bold py-1 rounded-lg transition-all"
                    style={{ background: filter === f ? '#0f172a' : '#f1f5f9', color: filter === f ? '#fff' : '#64748b' }}>
                    {f === 'all' ? 'All' : f === 'ai' ? '🤖 AI' : '👤 Manual'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {loading ? (
                <div className="p-4 space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />)}</div>
              ) : filteredSessions.map(s => {
                const mode = s.chat_mode || 'ai';
                const isActive = selected?.id === s.id;
                return (
                  <button key={s.id} onClick={() => setSelected(s)}
                    className="w-full px-4 py-3 text-left transition-all"
                    style={{
                      background: isActive ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04))' : 'transparent',
                      borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent',
                    }}>
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0"
                        style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                        {(s.user_email || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs text-slate-800 truncate flex-1">{s.user_email}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                            style={{ background: mode === 'manual' ? '#fee2e2' : mode === 'hybrid' ? '#fef3c7' : '#d1fae5', color: mode === 'manual' ? '#ef4444' : mode === 'hybrid' ? '#d97706' : '#059669' }}>
                            {mode === 'manual' ? '👤' : mode === 'hybrid' ? '⚡' : '🤖'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{s.last_message_preview || 'No messages'}</p>
                        {s.last_agent_name && <p className="text-[9px] text-slate-300 mt-0.5">{s.last_agent_name}</p>}
                      </div>
                    </div>
                  </button>
                );
              })}
              {!loading && filteredSessions.length === 0 && (
                <div className="py-12 text-center">
                  <MessageSquare size={28} className="mx-auto mb-2 text-slate-200" />
                  <p className="text-xs text-slate-400">No chats found</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Chat Window ── */}
          {selected ? (
            <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-5 py-3 flex items-center gap-3 border-b border-slate-100"
                style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  {(selected.user_email || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white truncate">{selected.user_email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {selected.last_agent_name && (
                      <span className="text-[10px] text-emerald-400 font-medium">Agent: {selected.last_agent_name}</span>
                    )}
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: chatMode === 'manual' ? '#ef4444' : chatMode === 'hybrid' ? '#f59e0b' : '#10b981', color: '#fff' }}>
                      {chatMode === 'manual' ? '👤 Manual' : chatMode === 'hybrid' ? '⚡ Hybrid' : '🤖 AI'}
                    </span>
                  </div>
                </div>
                <button onClick={load} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <RefreshCw size={14} className="text-white" />
                </button>
              </div>

              {/* Mode Controls */}
              <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-bold text-slate-500 shrink-0">Chat Mode</p>
                  <ChatModeToggle session={selected} onUpdate={updateSession} />
                </div>

                {/* Status bar + Resume AI button */}
                {chatMode === 'manual' && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                      <Shield size={12} className="text-red-500 shrink-0" />
                      <p className="text-[10px] font-bold text-red-600">Admin Takeover চালু — AI নীরব। Agent পরিচয়ে রিপ্লাই করুন।</p>
                    </div>
                    <button
                      onClick={handleResumeAI}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-white shrink-0 transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 3px 10px rgba(16,185,129,0.4)' }}
                      title="AI Agent পুনরায় সক্রিয় করুন"
                    >
                      <PlayCircle size={14} />
                      Resume AI
                    </button>
                  </div>
                )}
                {chatMode === 'hybrid' && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                      <Radio size={12} className="text-amber-500 shrink-0" />
                      <p className="text-[10px] font-bold text-amber-600">Hybrid Mode — Admin এবং AI উভয়ই উত্তর দিতে পারবে।</p>
                    </div>
                    <button
                      onClick={handleResumeAI}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-white shrink-0 transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 3px 10px rgba(16,185,129,0.4)' }}
                    >
                      <PlayCircle size={14} />
                      Full AI
                    </button>
                  </div>
                )}
                {chatMode === 'ai' && (
                  <div className="mt-2 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                    <Cpu size={12} className="text-emerald-500 shrink-0" />
                    <p className="text-[10px] font-bold text-emerald-600">AI Agent সক্রিয় — স্বয়ংক্রিয়ভাবে উত্তর দিচ্ছে।</p>
                    <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  </div>
                )}

                {/* Activity Log */}
                {(selected.activity_log || []).length > 0 && (
                  <details className="mt-2">
                    <summary className="text-[10px] font-bold text-slate-400 cursor-pointer flex items-center gap-1 select-none">
                      <Activity size={10} /> Activity Log ({(selected.activity_log || []).length})
                    </summary>
                    <div className="mt-1.5 space-y-1 max-h-24 overflow-y-auto">
                      {(selected.activity_log || []).map((log, i) => (
                        <div key={i} className="flex items-center gap-2 text-[9px] text-slate-400 bg-white border border-slate-100 rounded-lg px-2.5 py-1.5">
                          <span className="font-bold">{log.label}</span>
                          <span className="ml-auto opacity-60">{new Date(log.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {activeSessionMsgs.map((m, i) => {
                  const isUser = m.role === 'user';
                  const isAdmin = m.role === 'admin';
                  const isBot = m.role === 'bot';
                  const msgAgentImg = m.agent_img || activeSessionAgent?.img || agentImg;
                  return (
                    <div key={i} className={`flex ${isUser ? 'justify-start' : 'justify-end'} items-end gap-2`}>
                      {isUser && (
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-[10px] font-bold text-slate-600">
                          {(selected.user_email || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="max-w-sm">
                        {(isAdmin || isBot) && (
                          <div className="flex items-center gap-1.5 mb-1 justify-end">
                            {msgAgentImg && <img src={msgAgentImg} alt="" className="w-5 h-5 rounded-full object-cover border border-slate-200" onError={e => e.target.style.display='none'} />}
                            <span className="text-[9px] font-bold text-slate-400">{m.agent_name || activeSessionAgent?.name || 'Agent'}</span>
                            {isAdmin && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-500">Admin sent</span>}
                          </div>
                        )}
                        <div className="px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm"
                          style={isUser
                            ? { background: '#fff', color: '#1e293b', border: '1px solid rgba(0,0,0,0.06)' }
                            : { background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#fff' }}>
                          {m.image_url && <ImageViewer url={m.image_url} />}
                          {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
                          <p className="text-[9px] mt-1 opacity-50 text-right">{m.time}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {activeSessionMsgs.length === 0 && (
                  <div className="text-center text-slate-400 text-sm py-16">No messages yet</div>
                )}
              </div>

              {/* Reply Input */}
              <div className="p-4 border-t border-slate-100 bg-white space-y-2">
                <div className="flex items-center gap-1 mb-1">
                  {(activeSessionAgent?.img || agentImg) && <img src={activeSessionAgent?.img || agentImg} alt="" className="w-5 h-5 rounded-full object-cover" onError={e => e.target.style.display='none'} />}
                  <span className="text-[10px] font-bold text-slate-500">
                    {activeSessionAgent?.name || 'Agent'}-এর পরিচয়ে পাঠাচ্ছেন
                  </span>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSend} />
                <div className="flex gap-2">
                  <button onClick={() => fileRef.current?.click()} disabled={uploadingImg}
                    className="p-2.5 rounded-xl border-2 border-slate-200 hover:border-emerald-300 transition-colors shrink-0 disabled:opacity-40">
                    {uploadingImg
                      ? <span className="w-4 h-4 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin block" />
                      : <ImagePlus size={16} className="text-slate-400" />}
                  </button>
                  <input
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()}
                    placeholder={`${selected.last_agent_name || 'Agent'} হিসেবে মেসেজ লিখুন...`}
                    className="flex-1 border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm outline-none bg-slate-50 focus:bg-white transition-colors"
                  />
                  <button onClick={handleReply} disabled={sending || !reply.trim()}
                    className="px-5 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 flex items-center gap-2 shrink-0"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.35)' }}>
                    <Send size={14} /> Send
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={28} className="text-slate-300" />
                </div>
                <p className="font-bold text-slate-400">একটি কথোপকথন নির্বাচন করুন</p>
                <p className="text-xs text-slate-300 mt-1">বাম পাশের লিস্ট থেকে বেছে নিন</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}