import { useState, useEffect, useRef } from 'react';
import AdminShell from '../../components/AdminShell';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Globe, CreditCard, ToggleLeft, ToggleRight, X, Upload, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Country Modal ────────────────────────────────────────────────────────────
function CountryModal({ country, onClose, onSave }) {
  const [form, setForm] = useState(country || {
    name: '', flag_emoji: '', currency_code: '', exchange_rate: '', min_transfer: 100,
    max_transfer: 50000, fee_percent: 0, is_active: true, is_maintenance: false, sort_order: 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.currency_code || !form.exchange_rate) return;
    setSaving(true);
    try {
      const data = { ...form, exchange_rate: Number(form.exchange_rate), min_transfer: Number(form.min_transfer), max_transfer: Number(form.max_transfer), fee_percent: Number(form.fee_percent), sort_order: Number(form.sort_order) };
      if (country?.id) {
        await base44.entities.IntlCountry.update(country.id, data);
      } else {
        await base44.entities.IntlCountry.create(data);
      }
      onSave();
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-black text-slate-800">{country?.id ? 'Edit Country' : 'Add Country'}</h3>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {[
            { key: 'name', label: 'Country Name', placeholder: 'India' },
            { key: 'flag_emoji', label: 'Flag Emoji', placeholder: '🇮🇳' },
            { key: 'currency_code', label: 'Currency Code', placeholder: 'INR' },
            { key: 'exchange_rate', label: '1 Foreign = X BDT (Rate)', placeholder: '34.60', type: 'number' },
            { key: 'fee_percent', label: 'Fee %', placeholder: '1.5', type: 'number' },
            { key: 'min_transfer', label: 'Min Transfer (BDT)', placeholder: '100', type: 'number' },
            { key: 'max_transfer', label: 'Max Transfer (BDT)', placeholder: '50000', type: 'number' },
            { key: 'sort_order', label: 'Sort Order', placeholder: '0', type: 'number' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">{f.label}</label>
              <input type={f.type || 'text'} value={form[f.key] || ''} placeholder={f.placeholder}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none" />
            </div>
          ))}
          <div className="flex gap-4">
            {[['is_active', 'Active'], ['is_maintenance', 'Maintenance']].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!form[key]} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.checked }))} className="w-4 h-4 accent-emerald-500" />
                <span className="text-sm font-bold text-slate-600">{label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6 pt-3 border-t">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-600 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Method Modal ─────────────────────────────────────────────────────────────
function MethodModal({ method, countries, onClose, onSave }) {
  const parseFields = (raw) => { try { return JSON.parse(raw || '[]'); } catch { return []; } };
  const [form, setForm] = useState(method || { country_id: '', country_name: '', name: '', color: '#10b981', is_active: true, sort_order: 0, required_fields: '[]' });
  const [fields, setFields] = useState(() => parseFields(method?.required_fields));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, logo_url: file_url }));
    } finally { setUploading(false); }
  };

  const addField = () => setFields(prev => [...prev, { key: '', label: '', placeholder: '', type: 'text' }]);
  const removeField = (i) => setFields(prev => prev.filter((_, idx) => idx !== i));
  const updateField = (i, k, v) => setFields(prev => prev.map((f, idx) => idx === i ? { ...f, [k]: v } : f));

  const handleSave = async () => {
    if (!form.country_id || !form.name) return;
    setSaving(true);
    try {
      const data = { ...form, sort_order: Number(form.sort_order), required_fields: JSON.stringify(fields) };
      if (method?.id) {
        await base44.entities.IntlPaymentMethod.update(method.id, data);
      } else {
        await base44.entities.IntlPaymentMethod.create(data);
      }
      onSave();
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h3 className="font-black text-slate-800">{method?.id ? 'Edit Method' : 'Add Payment Method'}</h3>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Country</label>
            <select value={form.country_id} onChange={e => {
              const c = countries.find(c => c.id === e.target.value);
              setForm(prev => ({ ...prev, country_id: e.target.value, country_name: c?.name || '' }));
            }} className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none">
              <option value="">Select country</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.flag_emoji} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Method Name</label>
            <input type="text" value={form.name || ''} placeholder="Paytm"
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none" />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Logo Image</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            <div className="flex items-center gap-3">
              {/* Preview */}
              <div className="w-16 h-16 rounded-2xl border-2 border-slate-100 flex items-center justify-center overflow-hidden shrink-0"
                style={{ background: form.logo_url ? '#f8fafc' : (form.color || '#10b981') }}>
                {form.logo_url ? (
                  <img src={form.logo_url} alt="logo" className="w-full h-full object-contain p-1.5" />
                ) : (
                  <ImageIcon size={22} className="text-white/80" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors disabled:opacity-60">
                  <Upload size={15} />
                  {uploading ? 'Uploading...' : 'Upload Logo'}
                </button>
                {form.logo_url && (
                  <button type="button" onClick={() => setForm(prev => ({ ...prev, logo_url: '' }))}
                    className="w-full py-1.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-50 transition-colors">
                    Remove Logo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Sort Order</label>
            <input type="number" value={form.sort_order || 0} placeholder="0"
              onChange={e => setForm(prev => ({ ...prev, sort_order: e.target.value }))}
              className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Brand Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.color || '#10b981'} onChange={e => setForm(prev => ({ ...prev, color: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200" />
              <input type="text" value={form.color || ''} onChange={e => setForm(prev => ({ ...prev, color: e.target.value }))} placeholder="#10b981" className="flex-1 border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!form.is_active} onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))} className="w-4 h-4 accent-emerald-500" />
            <span className="text-sm font-bold text-slate-600">Active</span>
          </label>

          {/* Required Fields Builder */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Required Fields</p>
              <button onClick={addField}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <Plus size={11} /> Add Field
              </button>
            </div>
            {fields.length === 0 && (
              <p className="text-xs text-slate-400 italic">No fields added yet. Click "Add Field" to add receiver input fields.</p>
            )}
            <div className="space-y-3">
              {fields.map((f, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Field #{i + 1}</p>
                    <button onClick={() => removeField(i)} className="p-1 rounded hover:bg-red-50">
                      <X size={12} className="text-red-400" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Key (unique)</label>
                      <input value={f.key} onChange={e => updateField(i, 'key', e.target.value)} placeholder="e.g. upi_id"
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-emerald-400" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Label</label>
                      <input value={f.label} onChange={e => updateField(i, 'label', e.target.value)} placeholder="e.g. UPI ID"
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-emerald-400" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Placeholder</label>
                      <input value={f.placeholder} onChange={e => updateField(i, 'placeholder', e.target.value)} placeholder="e.g. user@upi"
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-emerald-400" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Type</label>
                      <select value={f.type || 'text'} onChange={e => updateField(i, 'type', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-emerald-400 bg-white">
                        <option value="text">Text</option>
                        <option value="tel">Phone</option>
                        <option value="email">Email</option>
                        <option value="number">Number</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6 pt-3 border-t shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-600 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminIntlTransfer() {
  const [countries, setCountries] = useState([]);
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('countries');
  const [editingCountry, setEditingCountry] = useState(null);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [showMethodModal, setShowMethodModal] = useState(false);

  const load = async () => {
    setLoading(true);
    const [ctrs, mths] = await Promise.all([
      base44.entities.IntlCountry.list('sort_order', 100),
      base44.entities.IntlPaymentMethod.list('sort_order', 200),
    ]).catch(() => [[], []]);
    setCountries(Array.isArray(ctrs) ? ctrs : []);
    setMethods(Array.isArray(mths) ? mths : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleCountry = async (c) => {
    await base44.entities.IntlCountry.update(c.id, { is_active: !c.is_active });
    load();
  };

  const deleteCountry = async (id) => {
    if (!confirm('Delete this country?')) return;
    await base44.entities.IntlCountry.delete(id);
    load();
  };

  const toggleMethod = async (m) => {
    await base44.entities.IntlPaymentMethod.update(m.id, { is_active: !m.is_active });
    load();
  };

  const deleteMethod = async (id) => {
    if (!confirm('Delete this method?')) return;
    await base44.entities.IntlPaymentMethod.delete(id);
    load();
  };

  return (
    <AdminShell>
      <div className="p-4 sm:p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {[['countries', Globe, 'Countries'], ['methods', CreditCard, 'Payment Methods']].map(([id, Icon, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all"
              style={tab === id ? { background: '#fff', color: '#0f172a', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' } : { color: '#64748b' }}>
              <Icon size={15} />{label}
            </button>
          ))}
        </div>

        {/* Countries Tab */}
        {tab === 'countries' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
              <p className="font-black text-slate-800">Countries ({countries.length})</p>
              <button onClick={() => { setEditingCountry(null); setShowCountryModal(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <Plus size={15} /> Add Country
              </button>
            </div>
            {loading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}</div>
            ) : countries.length === 0 ? (
              <div className="py-16 text-center text-slate-400">No countries configured</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {countries.map(c => (
                  <div key={c.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50">
                    <span className="text-2xl shrink-0">{c.flag_emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm">{c.name}</p>
                      <p className="text-xs text-slate-400">
                        1 {c.currency_code} = {c.exchange_rate} BDT · {c.fee_percent}% fee
                        {c.is_maintenance && <span className="ml-2 text-amber-500 font-bold">⚠ Maintenance</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => toggleCountry(c)}>
                        {c.is_active
                          ? <ToggleRight size={24} className="text-emerald-500" />
                          : <ToggleLeft size={24} className="text-slate-300" />}
                      </button>
                      <button onClick={() => { setEditingCountry(c); setShowCountryModal(true); }}
                        className="p-1.5 rounded-lg hover:bg-slate-100">
                        <Pencil size={14} className="text-slate-400" />
                      </button>
                      <button onClick={() => deleteCountry(c.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Methods Tab */}
        {tab === 'methods' && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-slate-800 text-lg">Payment Methods</p>
                <p className="text-xs text-slate-400 mt-0.5">{methods.filter(m=>m.is_active).length} active · {methods.length} total</p>
              </div>
              <button onClick={() => { setEditingMethod(null); setShowMethodModal(true); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <Plus size={15} /> Add Method
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1,2,3,4].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
              </div>
            ) : methods.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl text-slate-400">No payment methods configured</div>
            ) : (
              /* Group by country */
              (() => {
                const grouped = {};
                methods.forEach(m => {
                  const key = m.country_name || 'Other';
                  if (!grouped[key]) grouped[key] = [];
                  grouped[key].push(m);
                });
                const countryForName = (name) => countries.find(c => c.name === name);

                return Object.entries(grouped).map(([countryName, cms]) => {
                  const country = countryForName(countryName);
                  const allActive = cms.every(m => m.is_active);
                  const someActive = cms.some(m => m.is_active);

                  return (
                    <div key={countryName} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                      {/* Country header */}
                      <div className="flex items-center justify-between px-5 py-3.5"
                        style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderBottom: '1px solid #e2e8f0' }}>
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{country?.flag_emoji || '🌐'}</span>
                          <div>
                            <p className="font-black text-slate-800 text-sm">{countryName}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              {cms.filter(m=>m.is_active).length}/{cms.length} active
                              {country && ` · 1 ${country.currency_code} = ${country.exchange_rate} BDT`}
                            </p>
                          </div>
                        </div>
                        {/* Bulk toggle */}
                        <button
                          onClick={async () => {
                            const targetState = !allActive;
                            await Promise.all(cms.map(m => base44.entities.IntlPaymentMethod.update(m.id, { is_active: targetState })));
                            load();
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          style={{
                            background: someActive ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)',
                            color: someActive ? '#059669' : '#64748b',
                            border: `1px solid ${someActive ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.2)'}`,
                          }}>
                          {allActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                          {allActive ? 'All On' : someActive ? 'Partial' : 'All Off'}
                        </button>
                      </div>

                      {/* Methods list */}
                      <div className="divide-y divide-slate-50">
                        {cms.map(m => (
                          <div key={m.id} className={`flex items-center gap-3 px-5 py-3.5 transition-all ${!m.is_active ? 'opacity-50' : 'hover:bg-slate-50/60'}`}>
                            {/* Logo */}
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-sm font-black shrink-0 overflow-hidden shadow-sm"
                              style={{ background: m.logo_url ? '#f1f5f9' : (m.color || '#6b7280'), border: m.logo_url ? '1.5px solid #e2e8f0' : 'none' }}>
                              {m.logo_url
                                ? <img src={m.logo_url} alt={m.name} className="w-full h-full object-contain p-1.5" onError={e => { e.target.style.display='none'; e.target.parentElement.style.background = m.color || '#6b7280'; }} />
                                : <span style={{ fontSize: 17 }}>{(m.name||'?')[0]}</span>
                              }
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                                {!m.is_active && (
                                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-slate-100 text-slate-400 uppercase tracking-wide">OFF</span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400">
                                {(() => { try { const f = JSON.parse(m.required_fields||'[]'); return `${f.length} field${f.length!==1?'s':''}` } catch { return '0 fields'; } })()}
                                {m.color && <span className="ml-2 inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{background: m.color}} />{m.color}</span>}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Big toggle switch */}
                              <button onClick={() => toggleMethod(m)}
                                className="relative w-11 h-6 rounded-full transition-all shrink-0"
                                style={{ background: m.is_active ? '#10b981' : '#e2e8f0' }}>
                                <span className="absolute top-0.5 transition-all duration-200 w-5 h-5 rounded-full bg-white shadow-sm"
                                  style={{ left: m.is_active ? '22px' : '2px' }} />
                              </button>
                              <button onClick={() => { setEditingMethod(m); setShowMethodModal(true); }}
                                className="p-1.5 rounded-lg hover:bg-slate-100">
                                <Pencil size={13} className="text-slate-400" />
                              </button>
                              <button onClick={() => deleteMethod(m.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                                <Trash2 size={13} className="text-red-400" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCountryModal && (
          <CountryModal
            country={editingCountry}
            onClose={() => { setShowCountryModal(false); setEditingCountry(null); }}
            onSave={load}
          />
        )}
        {showMethodModal && (
          <MethodModal
            method={editingMethod}
            countries={countries}
            onClose={() => { setShowMethodModal(false); setEditingMethod(null); }}
            onSave={load}
          />
        )}
      </AnimatePresence>
    </AdminShell>
  );
}