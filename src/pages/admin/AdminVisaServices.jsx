import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminShell from '../../components/AdminShell';
import { X, Plus, Globe, ToggleLeft, ToggleRight, Trash2, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_FIELDS = [
  { key: 'full_name', label: 'Full Name', type: 'text', required: true, show: true },
  { key: 'passport_number', label: 'Passport Number', type: 'text', required: true, show: true },
  { key: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true, show: true },
  { key: 'mobile', label: 'Mobile Number', type: 'tel', required: true, show: true },
  { key: 'travel_date', label: 'Travel Date', type: 'date', required: true, show: true },
  { key: 'email', label: 'Email', type: 'email', required: false, show: true },
  { key: 'address', label: 'Address', type: 'text', required: false, show: false },
  { key: 'passport_expiry', label: 'Passport Expiry Date', type: 'date', required: false, show: false },
  { key: 'nationality', label: 'Nationality', type: 'text', required: false, show: false },
  { key: 'occupation', label: 'Occupation', type: 'text', required: false, show: false },
  { key: 'notes', label: 'Additional Notes', type: 'textarea', required: false, show: true },
];

const DEFAULT_DOCS = [
  { name: 'Passport Copy', required: true },
  { name: 'Photo', required: true },
  { name: 'NID Copy', required: false },
  { name: 'Bank Statement', required: false },
];

const EMPTY = {
  country_name: '', flag: '', country_code: '',
  visa_fee: 0, service_charge: 0, processing_charge: 0,
  processing_time: '3-5 days', description: '',
  visa_types: [], required_docs: DEFAULT_DOCS, form_fields: DEFAULT_FIELDS,
  is_active: true, sort_order: 0
};

function VisaModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item ? {
    ...EMPTY, ...item,
    required_docs: item.required_docs?.length ? item.required_docs : DEFAULT_DOCS,
    form_fields: item.form_fields?.length ? item.form_fields : DEFAULT_FIELDS,
  } : { ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [typesStr, setTypesStr] = useState((item?.visa_types || []).join(', '));
  const [tab, setTab] = useState('basic');
  const [newDocName, setNewDocName] = useState('');

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const data = {
        ...form,
        visa_types: typesStr.split(',').map(s => s.trim()).filter(Boolean),
        required_docs: Array.isArray(form.required_docs) 
          ? form.required_docs.map(d => ({ name: String(d.name), required: Boolean(d.required) }))
          : [],
        form_fields: Array.isArray(form.form_fields)
          ? form.form_fields.map(f => ({ key: String(f.key), label: String(f.label), type: String(f.type), required: Boolean(f.required), show: Boolean(f.show) }))
          : [],
      };
      if (item?.id) {
        await base44.entities.VisaService.update(item.id, data);
      } else {
        await base44.entities.VisaService.create(data);
      }
      onSave();
      onClose();
    } catch (err) {
      alert('Save failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const toggleField = (key, prop) => {
    setForm(f => ({
      ...f,
      form_fields: f.form_fields.map(ff => ff.key === key ? { ...ff, [prop]: !ff[prop] } : ff)
    }));
  };

  const toggleDocRequired = (idx) => {
    setForm(f => ({
      ...f,
      required_docs: f.required_docs.map((d, i) => i === idx ? { ...d, required: !d.required } : d)
    }));
  };

  const removeDoc = (idx) => {
    setForm(f => ({ ...f, required_docs: f.required_docs.filter((_, i) => i !== idx) }));
  };

  const addDoc = () => {
    if (!newDocName.trim()) return;
    setForm(f => ({ ...f, required_docs: [...f.required_docs, { name: newDocName.trim(), required: false }] }));
    setNewDocName('');
  };

  const tabs = ['basic', 'fields', 'docs'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-black text-slate-900">{item ? 'Edit Visa Service' : 'Add Visa Service'}</h3>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 shrink-0 px-6">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-xs font-bold capitalize transition-colors ${tab === t ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-slate-400'}`}>
              {t === 'basic' ? 'Basic Info' : t === 'fields' ? 'Form Fields' : 'Documents'}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {tab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Country Name</label>
                  <input value={form.country_name} onChange={e => setForm({ ...form, country_name: e.target.value })}
                    placeholder="Saudi Arabia"
                    className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Flag Emoji</label>
                  <input value={form.flag} onChange={e => setForm({ ...form, flag: e.target.value })}
                    placeholder="🇸🇦" className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 text-xl" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Visa Fee (BDT)</label>
                  <input type="number" value={form.visa_fee} onChange={e => setForm({ ...form, visa_fee: Number(e.target.value) })}
                    className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Service Charge</label>
                  <input type="number" value={form.service_charge} onChange={e => setForm({ ...form, service_charge: Number(e.target.value) })}
                    className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Processing Charge</label>
                  <input type="number" value={form.processing_charge} onChange={e => setForm({ ...form, processing_charge: Number(e.target.value) })}
                    className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Processing Time</label>
                  <input value={form.processing_time} onChange={e => setForm({ ...form, processing_time: e.target.value })}
                    placeholder="3-5 days"
                    className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })}
                    className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Visa Types (comma separated)</label>
                <input value={typesStr} onChange={e => setTypesStr(e.target.value)}
                  placeholder="Work Visa, Visit Visa, Business Visa"
                  className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 resize-none" />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-500 uppercase">Active</label>
                <button onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`w-12 h-6 rounded-full transition-all relative ${form.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.is_active ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 font-medium">
                Total: ৳{((form.visa_fee || 0) + (form.service_charge || 0) + (form.processing_charge || 0)).toLocaleString()} BDT
              </div>
            </div>
          )}

          {tab === 'fields' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 mb-3">Toggle which fields appear in the customer application form.</p>
              {form.form_fields.map(ff => (
                <div key={ff.key} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-700">{ff.label}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{ff.type}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 cursor-pointer">
                      <input type="checkbox" checked={ff.show} onChange={() => toggleField(ff.key, 'show')}
                        className="w-3.5 h-3.5 accent-emerald-500" />
                      Show
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 cursor-pointer">
                      <input type="checkbox" checked={ff.required} onChange={() => toggleField(ff.key, 'required')}
                        className="w-3.5 h-3.5 accent-blue-500" disabled={!ff.show} />
                      Required
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'docs' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-3">Manage required documents for this visa service.</p>
              {form.required_docs.map((doc, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                  <p className="flex-1 font-semibold text-sm text-slate-700">📄 {doc.name}</p>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 cursor-pointer">
                    <input type="checkbox" checked={doc.required} onChange={() => toggleDocRequired(i)}
                      className="w-3.5 h-3.5 accent-blue-500" />
                    Required
                  </label>
                  <button onClick={() => removeDoc(i)} className="p-1.5 rounded-lg hover:bg-red-50">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 mt-4">
                <input value={newDocName} onChange={e => setNewDocName(e.target.value)}
                  placeholder="Add custom document..."
                  onKeyDown={e => e.key === 'Enter' && addDoc()}
                  className="flex-1 border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50" />
                <button onClick={addDoc}
                  className="px-4 py-2.5 rounded-xl text-white text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-3 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-600 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            {saving ? 'Saving...' : item ? 'Save Changes' : 'Add Service'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminVisaServices() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = () => base44.entities.VisaService.list('sort_order', 100).then(setItems).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleToggle = async (item) => {
    await base44.entities.VisaService.update(item.id, { is_active: !item.is_active });
    load();
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('এই visa service মুছে দিতে চান? এটি পরিবর্তনযোগ্য নয়।');
    if (!confirmed) return;
    try {
      await base44.entities.VisaService.delete(id);
      load();
    } catch (err) {
      alert('Delete failed: ' + (err?.message || 'Unknown error'));
    }
  };

  return (
    <AdminShell>
      <div className="p-6 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-50">
            <div>
              <h2 className="font-black text-slate-900">Visa Services</h2>
              <p className="text-xs text-slate-400 mt-0.5">{items.length} countries configured</p>
            </div>
            <button onClick={() => setModal('add')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.35)' }}>
              <Plus size={16} /> Add Country
            </button>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <Globe size={36} className="mx-auto mb-3 text-slate-200" />
              <p className="text-slate-400 text-sm">No visa services yet. Add your first country.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {items.map(item => {
                const total = (item.visa_fee || 0) + (item.service_charge || 0) + (item.processing_charge || 0);
                return (
                  <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                    <span className="text-3xl shrink-0">{item.flag || '🌍'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800">{item.country_name}</p>
                      <p className="text-xs text-slate-400">Total: ৳{total.toLocaleString()} · {item.processing_time} · {(item.visa_types || []).length} types</p>
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
                );
              })}
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {modal && <VisaModal item={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={load} />}
      </AnimatePresence>
    </AdminShell>
  );
}