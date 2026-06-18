import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Send, Trash2, Bell } from 'lucide-react';
import AdminShell from '../components/AdminShell';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', target_email: '' });
  const [sending, setSending] = useState(false);

  const load = () => base44.entities.AppNotification.list('-created_date', 100)
    .then(setNotifications).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSend = async () => {
    if (!form.title || !form.message) return;
    setSending(true);
    await base44.entities.AppNotification.create({ ...form, is_read_by: [] });
    setForm({ title: '', message: '', target_email: '' });
    setShowForm(false);
    setSending(false);
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.AppNotification.delete(id);
    load();
  };

  return (
    <AdminShell>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Notifications</h1>
            <p className="text-gray-500 text-sm">{notifications.length} sent</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm">
            <Plus size={16} /> New
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl border-2 border-emerald-200 p-5 space-y-3">
            <h3 className="font-bold text-gray-900">Send Notification</h3>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Title"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 font-semibold text-sm outline-none focus:border-emerald-500" />
            <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
              placeholder="Message..." rows={3}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 resize-none" />
            <input value={form.target_email} onChange={e => setForm({ ...form, target_email: e.target.value })}
              placeholder="Target email (leave empty for all users)"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500" />
            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-bold text-gray-600 text-sm">Cancel</button>
              <button onClick={handleSend} disabled={sending}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                <Send size={14} /> {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="space-y-px">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-50 animate-pulse" />)}</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map(n => (
                <div key={n.id} className="px-5 py-3.5 flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Bell size={16} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-500">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{n.target_email ? `→ ${n.target_email}` : '→ All users'} · {new Date(n.created_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(n.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              {notifications.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No notifications sent yet</p>}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}