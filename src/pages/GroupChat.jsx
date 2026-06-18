import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ChevronUp } from 'lucide-react';
import UniversalHeader from '@/components/cellfin/UniversalHeader';
import { base44 } from '@/api/base44Client';
import ChatMessage from '../components/chat/ChatMessage';

const PAGE_SIZE = 50;

function DateLabel({ label }) {
  return (
    <div className="flex items-center gap-2 my-3 px-2">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-[10px] font-semibold text-gray-400 bg-white px-2 shrink-0">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function getDateLabel(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function injectDateLabels(messages) {
  const result = [];
  let lastDate = '';
  messages.forEach(msg => {
    const label = getDateLabel(msg.created_date);
    if (label !== lastDate) {
      result.push({ _isDateLabel: true, label, id: `date-${msg.id}` });
      lastDate = label;
    }
    result.push(msg);
  });
  return result;
}

export default function GroupChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [user, setUser] = useState(null);
  const [sending, setSending] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const userRef = useRef(null);
  const skipRef = useRef(0);
  const isAtBottomRef = useRef(true);
  const prevScrollHeightRef = useRef(0);

  const formatDateTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const isVisible = (msg) => {
    const u = userRef.current;
    return (
      msg.message_type === 'system' ||
      msg.status === 'approved' ||
      (msg.user_email === u?.email && msg.status === 'pending')
    );
  };

  const fetchMessages = useCallback(async (skip = 0) => {
    const batch = await base44.entities.GroupMessage.list('-created_date', PAGE_SIZE + skip);
    const all = (batch || []).reverse();
    const visible = all.filter(isVisible);

    if (skip === 0) {
      const page = visible.slice(-PAGE_SIZE);
      setMessages(page);
      setHasMore(visible.length > PAGE_SIZE);
      setTotalCount(visible.length);
      skipRef.current = PAGE_SIZE;
    } else {
      const older = visible.slice(0, Math.max(0, visible.length - skipRef.current));
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newOlder = older.filter(m => !existingIds.has(m.id));
        return [...newOlder, ...prev];
      });
      setHasMore(older.length > 0);
      skipRef.current += PAGE_SIZE;
    }
  }, []);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    prevScrollHeightRef.current = scrollRef.current?.scrollHeight || 0;
    try {
      const allBatch = await base44.entities.GroupMessage.list('-created_date', skipRef.current + PAGE_SIZE);
      const all = (allBatch || []).reverse();
      const visible = all.filter(isVisible);
      const older = visible.slice(0, Math.max(0, visible.length - skipRef.current));
      if (older.length === 0) { setHasMore(false); return; }
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newOlder = older.filter(m => !existingIds.has(m.id));
        if (newOlder.length === 0) { setHasMore(false); return prev; }
        skipRef.current += newOlder.length;
        return [...newOlder, ...prev];
      });
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!loadingMore && prevScrollHeightRef.current > 0 && scrollRef.current) {
      const diff = scrollRef.current.scrollHeight - prevScrollHeightRef.current;
      scrollRef.current.scrollTop = diff;
      prevScrollHeightRef.current = 0;
    }
  }, [messages, loadingMore]);

  useEffect(() => {
    if (!loading && isAtBottomRef.current && scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 80);
    }
  }, [messages, loading]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 80;
    if (scrollTop < 100 && hasMore && !loadingMore) {
      loadMore();
    }
  };

  useEffect(() => {
    const init = async () => {
      const u = await base44.auth.me();
      setUser(u);
      userRef.current = u;
      await fetchMessages(0);
      setLoading(false);
    };
    init().catch(err => { console.error(err); setLoading(false); });

    const unsub = base44.entities.GroupMessage.subscribe((event) => {
      if (event.type === 'create' && event.data) {
        const msg = event.data;
        if (!isVisible(msg)) return;
        setMessages(prev => {
          const filtered = prev.filter(m => !(m._isTemp && m.content === msg.content && m.user_email === msg.user_email));
          if (filtered.some(m => m.id === msg.id)) return filtered;
          return [...filtered, msg];
        });
      } else if (event.type === 'update' && event.data) {
        setMessages(prev => prev.map(m => m.id === event.id ? event.data : m));
      } else if (event.type === 'delete') {
        setMessages(prev => prev.filter(m => m.id !== event.id));
      }
    });
    return unsub;
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending || !user) return;
    const msgContent = input.trim();
    setSending(true);
    setInput('');
    isAtBottomRef.current = true;

    const displayName = user.display_name || user.full_name || 'User';
    const tempMsg = {
      id: `temp-${Date.now()}`,
      content: msgContent,
      username: displayName,
      user_email: user.email,
      message_type: 'user',
      status: 'pending',
      created_date: new Date().toISOString(),
      _isTemp: true,
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await base44.entities.GroupMessage.create({
        content: msgContent,
        username: displayName,
        user_email: user.email,
        message_type: 'user',
        status: 'pending',
      });
    } catch (err) {
      console.error('Send error:', err);
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const withDateLabels = injectDateLabels(messages);

  return (
    <div className="flex flex-col w-full bg-white font-inter" style={{ height: '100dvh' }}>
      {/* Universal Header */}
      <UniversalHeader
        title="Community Chat"
        subtitle="● Live"
        rightAction={
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
            <span className="text-white text-xs font-black">৳</span>
          </div>
        }
      />

      {/* Messages */}
      <main
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-2"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingTop: 'calc(4rem + env(safe-area-inset-top))' }}
      >
        {hasMore && !loading && (
          <div className="flex justify-center py-2">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100"
            >
              {loadingMore ? (
                <span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ChevronUp size={13} />
              )}
              {loadingMore ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">No messages yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-0.5 pb-2">
            {withDateLabels.map((item) =>
              item._isDateLabel ? (
                <DateLabel key={item.id} label={item.label} />
              ) : (
                <ChatMessage
                  key={item.id}
                  msg={item}
                  isOwn={item.user_email === user?.email && item.message_type === 'user'}
                  formatDateTime={formatDateTime}
                />
              )
            )}
          </div>
        )}
      </main>

      {/* Input */}
      <div className="shrink-0 bg-white border-t border-gray-100 px-3 py-2 z-50"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        <form onSubmit={handleSend} className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2.5">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90 disabled:opacity-30"
            style={{ background: input.trim() && !sending ? 'linear-gradient(135deg,#10b981,#059669)' : '#d1d5db' }}
          >
            <Send size={14} color={input.trim() && !sending ? '#fff' : '#9ca3af'} strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </div>
  );
}