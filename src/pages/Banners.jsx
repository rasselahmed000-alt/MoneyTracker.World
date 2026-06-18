import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import AdminShell from '../components/AdminShell';

function BannerModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || { title: '', image_url: '', link_url: '', is_active: true, sort_order: 0 });
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    if (form.id) await base44.entities.Banner.update(form.id, form);
    else await base44.entities.Banner.create(form);
    setSaving(false); onSave(); onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-3">
        <h3 className="font-black text-lg">{form.id ? 'Edit' : 'Add'} Banner</h3>
        {[['title','Title'],['image_url','Image URL'],['link_url','Link URL']].map(([k,l]) => (
          <div key={k}>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{l}</label>
            <input value={form[k] || ''} onChange={e => setForm({...form,[k]:e.target.value})}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 font-semibold text-sm outline-none focus:border-emerald-500" />
          </div>
        ))}
        {form.image_url && <img src={form.image_url} alt="preview" className="w-full h-32 object-cover rounded-xl border" />}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-600">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold disabled:opacity-60">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Banners() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = () => base44.entities.Banner.list('sort_order', 200).then(setItems).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const toggleActive = async (item) => { await base44.entities.Banner.update(item.id, { is_active: !item.is_active }); load(); };

  return (
    <AdminShell>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-black text-gray-900">Banners</h1><p className="text-gray-500 text-sm">{items.length} banners</p></div>
          <button onClick={() => setModal({})} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm">
            <Plus size={16} /> Add
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? [1,2].map(i => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />) :
            items.map(b => (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {b.image_url && <img src={b.image_url} alt={b.title} className="w-full h-36 object-cover" />}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-gray-900">{b.title}</p>
                    <p className="text-xs text-gray-400 truncate max-w-xs">{b.link_url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleActive(b)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                      {b.is_active ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} />}
                    </button>
                    <button onClick={() => setModal(b)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors"><Pencil size={15} /></button>
                    <button onClick={async () => { await base44.entities.Banner.delete(b.id); load(); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>
            ))
          }
          {!loading && items.length === 0 && <p className="text-gray-400 text-sm py-8 text-center col-span-2">No banners added</p>}
        </div>
      </div>
      {modal !== null && <BannerModal item={modal.id ? modal : null} onClose={() => setModal(null)} onSave={load} />}
    </AdminShell>
  );
}