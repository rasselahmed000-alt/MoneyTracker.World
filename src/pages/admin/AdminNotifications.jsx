import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminShell from '../../components/AdminShell';
import { AdminCard, AdminCardHeader, AddButton, PageLoader, EmptyState } from '../../components/admin/AdminPageWrapper';
import { Bell, Trash2, X, Send } from 'lucide-react';

export default function AdminNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', target_email: '', image_url: '' });
  const [saving, setSaving] = useState(false);

  const load = () => base44.entities.AppNotification.list('-created_date', 100).then(setItems).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSend = async () => {
    setSaving(true);
    await base44.entities.AppNotification.create({ ...form, is_read_by: [] });
    setForm({ title: '', message: '', target_email: '', image_url: '' });
    setShowForm(false); setSaving(false); load();
  };

  return (
    <AdminShell>
      <div className="p-6 space-y-5">
        {/* Send Form */}
        {showForm && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
              <h3 className="font-black text-white">Send Notification</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <X size={16} className="text-white" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { k: 'title', l: 'Title *' },
                { k: 'target_email', l: 'Target Email (leave blank for all users)' },
                { k: 'image_url', l: 'Image URL (optional)' },
              ].map(({ k, l }) => (
                <div key={k}>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">{l}</label>
                  <input value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })}
                    className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm outline-none bg-slate-50 focus:bg-white transition-colors" />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Message *</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={3}
                  className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm outline-none resize-none bg-slate-50 focus:bg-white transition-colors" />
              </div>
            </div>
            <div className="px-6 pb-6">
              <button onClick={handleSend} disabled={saving || !form.title || !form.message}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60 transition-all"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16,185,129,0.35)' }}>
                <Send size={15} /> {saving ? 'Sending...' : 'Send Notification'}
              </button>
            </div>
          </div>
        )}

        <AdminCard>
          <AdminCardHeader
            title={`Notifications (${items.length})`}
            subtitle="Push notifications sent to users"
            action={!showForm && <AddButton onClick={() => setShowForm(true)} label="New Notification" />}
          />
          {loading ? <PageLoader /> : (
            <div className="divide-y divide-slate-50">
              {items.map(n => (
                <div key={n.id} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell size={17} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-slate-300 mt-1">
                      {n.target_email ? `→ ${n.target_email}` : '→ All users'} · {new Date(n.created_date).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={async () => { await base44.entities.AppNotification.delete(n.id); load(); }}
                    className="p-2 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors mt-0.5 shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {items.length === 0 && <EmptyState icon={Bell} message="No notifications sent yet" />}
            </div>
          )}
        </AdminCard>
      </div>
    </AdminShell>
  );
}