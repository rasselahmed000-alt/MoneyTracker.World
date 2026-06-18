import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminShell from '../../components/AdminShell';
import { AdminCard, AdminCardHeader, AddButton, StatusBadge, PageLoader, EmptyState } from '../../components/admin/AdminPageWrapper';
import { Globe, Pencil, Trash2, X } from 'lucide-react';

function Modal({ item, onClose, onSave }) {
   const [form, setForm] = useState(item || { name: '', currency: '', flag_emoji: '', phone_code: '', is_active: true, sort_order: 0 });
   const [saving, setSaving] = useState(false);
   const [error, setError] = useState('');
   const handleSave = async () => {
     setSaving(true);
     setError('');
     try {
       if (form.id) await base44.entities.Country.update(form.id, form);
       else await base44.entities.Country.create(form);
       onSave(); 
       onClose();
     } catch (e) {
       setError('Save failed: ' + e.message);
     } finally {
       setSaving(false);
     }
   };
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <h3 className="font-black text-slate-900">{form.id ? 'Edit' : 'Add'} Country</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-3">
          {[['name', 'Country Name'], ['currency', 'Currency Code'], ['flag_emoji', 'Flag Emoji'], ['phone_code', 'Phone Code']].map(([k, l]) => (
            <div key={k}>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">{l}</label>
              <input value={form[k] || ''} onChange={e => setForm({ ...form, [k]: e.target.value })}
                className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-4 py-2.5 font-semibold text-sm outline-none bg-slate-50 focus:bg-white transition-colors" />
            </div>
          ))}
        </div>
        {error && <p className="px-6 py-2 text-xs text-red-600 font-bold">{error}</p>}
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-600 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCountries() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = () => base44.entities.Country.list('sort_order', 200).then(setItems).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  return (
    <AdminShell>
      <div className="p-6">
        <AdminCard>
          <AdminCardHeader
            title={`Countries (${items.length})`}
            subtitle="Manage supported countries"
            action={<AddButton onClick={() => setModal({})} label="Add Country" />}
          />
          {loading ? <PageLoader /> : (
            <div className="divide-y divide-slate-50">
              {items.map(c => (
                <div key={c.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-2xl shrink-0">{c.flag_emoji || '🌍'}</div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.currency} · {c.phone_code}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={async () => { await base44.entities.Country.update(c.id, { is_active: !c.is_active }); load(); }}>
                      <StatusBadge status={c.is_active ? 'active' : 'inactive'} />
                    </button>
                    <button onClick={() => setModal(c)} className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors"><Pencil size={14} /></button>
                    <button onClick={async () => { 
                      if (!window.confirm(`${c.name} মুছে দিতে চান?`)) return;
                      try { 
                        await base44.entities.Country.delete(c.id); 
                        load(); 
                      } catch (e) { 
                        alert('Delete failed: ' + e.message); 
                      }
                    }} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
              {items.length === 0 && <EmptyState icon={Globe} message="No countries added" />}
            </div>
          )}
        </AdminCard>
      </div>
      {modal !== null && <Modal item={modal.id ? modal : null} onClose={() => setModal(null)} onSave={load} />}
    </AdminShell>
  );
}