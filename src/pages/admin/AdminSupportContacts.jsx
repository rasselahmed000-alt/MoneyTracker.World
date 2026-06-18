import { useState, useEffect } from 'react';
import AdminShell from '../../components/AdminShell';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

const PLATFORM_OPTIONS = [
  { value: 'whatsapp', label: '💬 WhatsApp', color: '#25d366' },
  { value: 'imo',      label: '📱 IMO',       color: '#0084ff' },
  { value: 'telegram', label: '✈️ Telegram',  color: '#2aabee' },
];

function ContactModal({ contact, onClose, onSave }) {
  const [form, setForm] = useState(contact || {
    platform: 'whatsapp',
    label: '',
    value: '',
    link: '',
    is_active: true,
    sort_order: 0,
  });
  const [saving, setSaving] = useState(false);

  const platform = form.platform;
  const placeholder = platform === 'whatsapp'
    ? 'e.g. 8801XXXXXXXXX (digits only)'
    : platform === 'telegram'
    ? 'e.g. @username or link'
    : 'Phone or username';

  const autoLink = () => {
    const v = (form.value || '').replace(/\D/g, '');
    if (platform === 'whatsapp') return `https://wa.me/${v}`;
    if (platform === 'telegram') return `https://t.me/${form.value?.replace('@', '')}`;
    return form.link || '';
  };

  const handleSave = async () => {
    if (!form.platform || !form.value) return;
    setSaving(true);
    const link = form.link?.trim() || autoLink();
    const data = { ...form, link, sort_order: Number(form.sort_order || 0) };
    if (contact?.id) {
      await base44.entities.SupportContact.update(contact.id, data);
    } else {
      await base44.entities.SupportContact.create(data);
    }
    onSave();
    onClose();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-black text-gray-800">{contact?.id ? 'Edit Contact' : 'Add Support Contact'}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Platform */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Platform</label>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORM_OPTIONS.map(p => (
                <button key={p.value} onClick={() => setForm(f => ({ ...f, platform: p.value }))}
                  className="py-2.5 rounded-xl text-sm font-bold border-2 transition-all"
                  style={{
                    borderColor: form.platform === p.value ? p.color : '#e5e7eb',
                    background: form.platform === p.value ? p.color + '15' : '#fff',
                    color: form.platform === p.value ? p.color : '#6b7280',
                  }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          {/* Label */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Display Label</label>
            <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              placeholder="e.g. WhatsApp Support"
              className="w-full border-2 border-gray-200 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none" />
          </div>
          {/* Value */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Number / Username</label>
            <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              placeholder={placeholder}
              className="w-full border-2 border-gray-200 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none" />
          </div>
          {/* Link (optional) */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Custom Link (optional)</label>
            <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
              placeholder="Leave blank for auto-generate"
              className="w-full border-2 border-gray-200 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none" />
            <p className="text-xs text-gray-400 mt-1">Auto: {autoLink()}</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="w-4 h-4 accent-emerald-500" />
              <span className="text-sm font-bold text-gray-600">Active</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-bold">Sort:</span>
              <input type="number" value={form.sort_order || 0}
                onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
                className="w-16 border-2 border-gray-200 rounded-xl px-2 py-1.5 text-xs font-semibold outline-none text-center" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-bold text-gray-600 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.value}
            className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSupportContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const load = () => {
    setLoading(true);
    base44.entities.SupportContact.list('sort_order', 50)
      .then(d => setContacts(d || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (c) => {
    await base44.entities.SupportContact.update(c.id, { is_active: !c.is_active });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this contact?')) return;
    await base44.entities.SupportContact.delete(id);
    load();
  };

  const COLORS = { whatsapp: '#25d366', imo: '#0084ff', telegram: '#2aabee' };
  const EMOJIS = { whatsapp: '💬', imo: '📱', telegram: '✈️' };

  return (
    <AdminShell>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900">24/7 Support Contacts</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage WhatsApp, IMO, Telegram support links</p>
          </div>
          <button onClick={() => { setEditing(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Plus size={15} /> Add Contact
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : contacts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-400">
            <p className="text-4xl mb-3">🎧</p>
            <p className="font-bold">No support contacts yet</p>
            <p className="text-sm mt-1">Add WhatsApp, IMO, or Telegram contacts</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {contacts.map(c => {
              const color = COLORS[c.platform] || '#6b7280';
              const emoji = EMOJIS[c.platform] || '📞';
              return (
                <div key={c.id} className={`bg-white rounded-2xl p-4 border-2 flex items-center gap-4 transition-all ${!c.is_active ? 'opacity-50 border-gray-100' : 'border-transparent shadow-sm'}`}
                  style={c.is_active ? { borderColor: color + '20' } : {}}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: color + '15', border: `2px solid ${color}25` }}>
                    {emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm" style={{ color }}>{c.label || c.platform}</p>
                    <p className="text-xs text-gray-500 truncate">{c.value}</p>
                    {c.link && <p className="text-[10px] text-gray-400 truncate">{c.link}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleActive(c)}
                      className="relative w-11 h-6 rounded-full transition-all"
                      style={{ background: c.is_active ? color : '#e5e7eb' }}>
                      <span className="absolute top-0.5 transition-all duration-200 w-5 h-5 rounded-full bg-white shadow-sm"
                        style={{ left: c.is_active ? '22px' : '2px' }} />
                    </button>
                    <button onClick={() => { setEditing(c); setShowModal(true); }}
                      className="p-1.5 rounded-lg hover:bg-gray-100">
                      <Pencil size={14} className="text-gray-400" />
                    </button>
                    <button onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <ContactModal
          contact={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={load}
        />
      )}
    </AdminShell>
  );
}