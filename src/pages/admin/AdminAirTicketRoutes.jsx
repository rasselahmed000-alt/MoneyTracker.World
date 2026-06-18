import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminShell from '../../components/AdminShell';
import { X, Plus, Plane, ToggleLeft, ToggleRight, Trash2, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EMPTY = { from_code: '', from_name: '', to_code: '', to_name: '', from_flag: '🇧🇩', to_flag: '🌍', base_price: 0, duration: '5h 00m', stops: 'Non-stop', airlines: 'bg,bs', is_active: true, sort_order: 0 };

function RouteModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item ? { ...item } : { ...EMPTY });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (item?.id) {
        await base44.entities.AirTicketRoute.update(item.id, form);
      } else {
        await base44.entities.AirTicketRoute.create(form);
      }
      onSave();
      onClose();
    } catch (e) {
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const F = ({ label, k, type = 'text', placeholder = '' }) => (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{label}</label>
      <input type={type} value={form[k]} onChange={e => setForm({ ...form, [k]: type === 'number' ? Number(e.target.value) : e.target.value })}
        placeholder={placeholder}
        className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-black text-slate-900">{item ? 'Edit Route' : 'Add Route'}</h3>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <F label="From Code" k="from_code" placeholder="DAC" />
            <F label="From Name" k="from_name" placeholder="Dhaka" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="From Flag" k="from_flag" placeholder="🇧🇩" />
            <F label="To Flag" k="to_flag" placeholder="🇦🇪" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="To Code" k="to_code" placeholder="DXB" />
            <F label="To Name" k="to_name" placeholder="Dubai" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Base Price (BDT)" k="base_price" type="number" />
            <F label="Duration" k="duration" placeholder="5h 30m" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Stops" k="stops" placeholder="Non-stop" />
            <F label="Sort Order" k="sort_order" type="number" />
          </div>
          <F label="Airlines (comma separated IDs)" k="airlines" placeholder="bg,ek,qr" />
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-500 uppercase">Active</label>
            <button onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              className={`w-12 h-6 rounded-full transition-all relative ${form.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.is_active ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6 pt-3 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-600 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            {saving ? 'Saving...' : item ? 'Save Changes' : 'Add Route'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminAirTicketRoutes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = () => base44.entities.AirTicketRoute.list('sort_order', 200).then(setItems).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleToggle = async (item) => {
    await base44.entities.AirTicketRoute.update(item.id, { is_active: !item.is_active });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('এই route মুছে দিতে চান?')) return;
    try {
      await base44.entities.AirTicketRoute.delete(id);
      load();
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  return (
    <AdminShell>
      <div className="p-6 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-50">
            <div>
              <h2 className="font-black text-slate-900">Air Ticket Routes</h2>
              <p className="text-xs text-slate-400 mt-0.5">{items.length} routes configured</p>
            </div>
            <button onClick={() => setModal('add')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.35)' }}>
              <Plus size={16} /> Add Route
            </button>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <Plane size={36} className="mx-auto mb-3 text-slate-200" />
              <p className="text-slate-400 text-sm">No routes configured yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {items.map(item => (
                <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="text-center shrink-0">
                    <p className="text-lg">{item.from_flag || '🌍'}</p>
                    <p className="text-[10px] font-extrabold text-slate-600">{item.from_code}</p>
                  </div>
                  <Plane size={14} className="text-slate-300 shrink-0" />
                  <div className="text-center shrink-0">
                    <p className="text-lg">{item.to_flag || '🌍'}</p>
                    <p className="text-[10px] font-extrabold text-slate-600">{item.to_code}</p>
                  </div>
                  <div className="flex-1 min-w-0 ml-2">
                    <p className="font-bold text-sm text-slate-800">{item.from_name} → {item.to_name}</p>
                    <p className="text-xs text-slate-400">৳{(item.base_price || 0).toLocaleString()} · {item.duration} · {item.stops}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {item.is_active ? 'Active' : 'Hidden'}
                    </span>
                    <button onClick={() => handleToggle(item)} className="p-1.5 rounded-lg hover:bg-slate-100">
                      {item.is_active ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} className="text-slate-400" />}
                    </button>
                    <button onClick={() => setModal(item)} className="p-1.5 rounded-lg hover:bg-slate-100">
                      <Edit3 size={16} className="text-slate-400" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {modal && <RouteModal item={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={load} />}
      </AnimatePresence>
    </AdminShell>
  );
}