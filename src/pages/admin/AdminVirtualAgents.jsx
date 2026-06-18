import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import AdminShell from '../../components/AdminShell';
import { Plus, Trash2, Edit2, Upload, Check, X, Star, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function AgentCard({ agent, onEdit, onDelete, onToggle }) {
  const [imgErr, setImgErr] = useState(false);
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=0B3D2E&color=D4A843&size=80&bold=true`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="p-4 flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-xl overflow-hidden border-2"
            style={{ borderColor: agent.is_active ? '#10b981' : '#e2e8f0' }}>
            <img
              src={imgErr ? fallback : (agent.photo_url || fallback)}
              onError={() => setImgErr(true)}
              className="w-full h-full object-cover"
              alt={agent.name}
            />
          </div>
          {agent.is_senior && (
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
              <Star size={10} fill="#fff" color="#fff" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-black text-sm text-slate-800 truncate">{agent.name}</p>
            {agent.is_senior && (
              <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">SENIOR</span>
            )}
          </div>
          <p className="text-xs text-slate-400 truncate">{agent.role || 'Support Agent'}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-1.5 h-1.5 rounded-full ${agent.is_active ? 'bg-emerald-400' : 'bg-slate-300'}`} />
            <span className={`text-[10px] font-semibold ${agent.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
              {agent.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <button onClick={() => onEdit(agent)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-colors">
            <Edit2 size={13} className="text-slate-500" />
          </button>
          <button onClick={() => onToggle(agent)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: agent.is_active ? '#fee2e2' : '#dcfce7' }}>
            {agent.is_active
              ? <X size={13} className="text-red-500" />
              : <Check size={13} className="text-emerald-600" />}
          </button>
          <button onClick={() => onDelete(agent)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 hover:bg-red-100 transition-colors">
            <Trash2 size={13} className="text-red-500" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

const EMPTY = { name: '', role: '', photo_url: '', is_senior: false, is_active: true, sort_order: 0 };

export default function AdminVirtualAgents() {
  const [agents, setAgents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [editId, setEditId]   = useState(null);
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter]   = useState('all');
  const fileRef = useRef(null);

  const load = () => {
    setLoading(true);
    base44.entities.VirtualAgent.list('sort_order', 200)
      .then(d => setAgents(d || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = (a) => {
    setForm({ name: a.name, role: a.role || '', photo_url: a.photo_url || '', is_senior: a.is_senior || false, is_active: a.is_active !== false, sort_order: a.sort_order || 0 });
    setEditId(a.id);
    setModal(true);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { alert('JPG/PNG/WEBP only'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return; }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, photo_url: file_url }));
    } catch { alert('Upload failed'); }
    setUploading(false);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!form.name.trim()) { alert('নাম দিন'); return; }
    setSaving(true);
    if (editId) {
      await base44.entities.VirtualAgent.update(editId, form);
    } else {
      await base44.entities.VirtualAgent.create(form);
    }
    setSaving(false);
    setModal(false);
    load();
  };

  const handleDelete = async (a) => {
    if (!confirm(`"${a.name}" ডিলিট করবেন?`)) return;
    await base44.entities.VirtualAgent.delete(a.id);
    load();
  };

  const handleToggle = async (a) => {
    await base44.entities.VirtualAgent.update(a.id, { is_active: !a.is_active });
    load();
  };

  const filtered = agents.filter(a => {
    if (filter === 'active') return a.is_active !== false;
    if (filter === 'inactive') return a.is_active === false;
    if (filter === 'senior') return a.is_senior;
    return true;
  });

  const activeCount = agents.filter(a => a.is_active !== false).length;
  const seniorCount = agents.filter(a => a.is_senior && a.is_active !== false).length;

  return (
    <AdminShell>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-slate-900">Virtual AI Agents</h1>
            <p className="text-sm text-slate-400 mt-0.5">লাইভ চ্যাটের জন্য virtual agent পরিচালনা করুন</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-sm shadow-md active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg,#0b3d2e,#1a6b4e)' }}>
            <Plus size={16} /> নতুন Agent
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'মোট Agent', value: agents.length, color: '#0b3d2e' },
            { label: 'Active', value: activeCount, color: '#10b981' },
            { label: 'Senior', value: seniorCount, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {[['all','সব'],['active','Active'],['inactive','Inactive'],['senior','Senior']].map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={filter === k
                ? { background: '#0b3d2e', color: '#fff' }
                : { background: '#f1f5f9', color: '#64748b' }}>
              {l}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array(4).fill(0).map((_,i) => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <User size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold">কোনো agent নেই</p>
            <p className="text-xs mt-1">উপরের বাটন দিয়ে নতুন agent যুক্ত করুন</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence>
              {filtered.map(a => (
                <AgentCard key={a.id} agent={a} onEdit={openEdit} onDelete={handleDelete} onToggle={handleToggle} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg,#0b3d2e,#1a6b4e)' }}>
                <h3 className="font-black text-white">{editId ? 'Agent আপডেট' : 'নতুন Agent যুক্ত করুন'}</h3>
                <button onClick={() => setModal(false)} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <X size={16} color="#fff" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Photo upload */}
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-2">প্রোফাইল ছবি</p>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} />
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                      {form.photo_url ? (
                        <img src={form.photo_url} className="w-full h-full object-cover" alt="preview" />
                      ) : (
                        <User size={24} className="text-slate-300" />
                      )}
                    </div>
                    <button onClick={() => fileRef.current?.click()} disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 border-dashed border-slate-300 text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors disabled:opacity-50">
                      {uploading
                        ? <><span className="w-4 h-4 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin" /> Uploading...</>
                        : <><Upload size={14} /> ছবি আপলোড</>}
                    </button>
                  </div>
                  {/* Or URL */}
                  <input
                    type="url"
                    value={form.photo_url}
                    onChange={e => setForm(f => ({ ...f, photo_url: e.target.value }))}
                    placeholder="অথবা ছবির URL দিন"
                    className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-400 bg-slate-50"
                  />
                </div>

                {/* Name */}
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1.5">নাম <span className="text-red-500">*</span></p>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="যেমন: Nusrat Jahan"
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>

                {/* Role */}
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1.5">ভূমিকা / Role</p>
                  <input
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    placeholder="যেমন: Customer Success"
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>

                {/* Sort order */}
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1.5">Sort Order</p>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>

                {/* Toggles */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                    <input type="checkbox" checked={form.is_senior} onChange={e => setForm(f => ({ ...f, is_senior: e.target.checked }))}
                      className="w-4 h-4 accent-amber-500" />
                    <div>
                      <p className="text-xs font-black text-amber-700">Senior Agent</p>
                      <p className="text-[10px] text-amber-500">Transfer to Senior এ দেখাবে</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                      className="w-4 h-4 accent-emerald-500" />
                    <div>
                      <p className="text-xs font-black text-emerald-700">Active</p>
                      <p className="text-[10px] text-emerald-500">Pool-এ থাকবে</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="px-6 pb-6 flex gap-3">
                <button onClick={() => setModal(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-slate-200 font-bold text-sm text-slate-500">
                  বাতিল
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-3 rounded-xl text-white font-black text-sm shadow-md disabled:opacity-50 transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#0b3d2e,#1a6b4e)' }}>
                  {saving ? 'সংরক্ষণ হচ্ছে...' : (editId ? '✓ আপডেট' : '+ যুক্ত করুন')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminShell>
  );
}