import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import AdminShell from '../../components/AdminShell';

function RateModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || { from_currency: '', to_currency: 'BDT', rate: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, rate: Number(form.rate) };
    if (form.id) await base44.entities.ExchangeRate.update(form.id, data);
    else await base44.entities.ExchangeRate.create(data);
    setSaving(false); onSave(); onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-3">
        <h3 className="font-black text-lg">{form.id ? 'Edit' : 'Add'} Rate</h3>
        {[['from_currency','From Currency'],['to_currency','To Currency'],['rate','Rate']].map(([k,l]) => (
          <div key={k}>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{l}</label>
            <input value={form[k] || ''} onChange={e => setForm({...form,[k]:e.target.value})} type={k==='rate'?'number':'text'}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 font-semibold text-sm outline-none focus:border-emerald-500" />
          </div>
        ))}
        <div className="flex items-center gap-3 pt-1">
          <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})}
            className="w-5 h-5 rounded accent-emerald-500" />
          <label className="text-sm font-semibold text-gray-700">Active</label>
        </div>
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

export default function AdminExchangeRates() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = () => base44.entities.ExchangeRate.list('-updated_date', 200).then(setItems).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  return (
    <AdminShell>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-black text-gray-900">Exchange Rates</h1><p className="text-gray-500 text-sm">{items.length} rates</p></div>
          <button onClick={() => setModal({})} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm">
            <Plus size={16} /> Add
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? <div className="h-32 animate-pulse bg-gray-50" /> : (
            <div className="divide-y divide-gray-50">
              {items.map(r => (
                <div key={r.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-gray-900">1 {r.from_currency} = {r.rate} {r.to_currency}</p>
                    <p className="text-xs text-gray-400">Updated {new Date(r.updated_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {r.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={() => setModal(r)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors"><Pencil size={15} /></button>
                    <button onClick={async () => { await base44.entities.ExchangeRate.delete(r.id); load(); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No rates added</p>}
            </div>
          )}
        </div>
      </div>
      {modal !== null && <RateModal item={modal.id ? modal : null} onClose={() => setModal(null)} onSave={load} />}
    </AdminShell>
  );
}