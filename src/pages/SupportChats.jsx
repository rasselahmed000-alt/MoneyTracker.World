import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Send } from 'lucide-react';
import AdminShell from '../components/AdminShell';

export default function SupportChats() {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = () => base44.entities.ChatSession.list('-updated_date', 100)
    .then(setSessions).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    const msgs = [...(selected.messages || []), {
      id: Date.now(), role: 'admin', content: reply, time: new Date().toISOString()
    }];
    await base44.entities.ChatSession.update(selected.id, { messages: msgs, last_message_preview: reply, last_message_date: new Date().toISOString() });
    setSelected({ ...selected, messages: msgs });
    setReply('');
    setSending(false);
    load();
  };

  return (
    <AdminShell>
      <div className="p-6 h-[calc(100vh-4rem)] flex flex-col space-y-4">
        <div><h1 className="text-2xl font-black text-gray-900">Support Chats</h1></div>
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Chat list */}
          <div className="w-72 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-y-auto flex-shrink-0">
            {loading ? <div className="h-full animate-pulse bg-gray-50" /> : (
              <div className="divide-y divide-gray-50">
                {sessions.map(s => (
                  <button key={s.id} onClick={() => setSelected(s)}
                    className={`w-full px-4 py-3.5 text-left hover:bg-gray-50 transition-colors ${selected?.id === s.id ? 'bg-emerald-50' : ''}`}>
                    <p className="font-bold text-sm text-gray-900 truncate">{s.user_email}</p>
                    <p className="text-xs text-gray-400 truncate">{s.last_message_preview || 'No messages'}</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">{s.last_message_date ? new Date(s.last_message_date).toLocaleDateString() : ''}</p>
                  </button>
                ))}
                {sessions.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No chats</p>}
              </div>
            )}
          </div>

          {/* Chat window */}
          {selected ? (
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="font-bold text-gray-900">{selected.user_email}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(selected.messages || []).map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${m.role === 'admin' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100 flex gap-3">
                <input value={reply} onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReply()}
                  placeholder="Type reply..."
                  className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
                <button onClick={handleReply} disabled={sending || !reply.trim()}
                  className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm disabled:opacity-60 flex items-center gap-2">
                  <Send size={14} /> Send
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Select a chat to view</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}