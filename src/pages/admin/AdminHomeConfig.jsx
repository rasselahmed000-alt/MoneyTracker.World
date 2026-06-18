import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminShell from '../../components/AdminShell';
import { Plus, Edit2, Trash2, X, Home, Smartphone, Building2, Layers } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const TYPE_OPTIONS = [
  { value: 'mobile_provider', label: 'Mobile Provider', desc: 'bKash, Nagad, Rocket etc.' },
  { value: 'bank_transfer', label: 'Bank Transfer', desc: 'The bank transfer button' },
  { value: 'service', label: 'Service Button', desc: 'Visa, Air Ticket, Chat etc.' },
];

const CATEGORY_OPTIONS = [
  { value: 'home', label: 'Home Screen' },
  { value: 'services', label: 'Services' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'support', label: 'Support' },
  { value: 'system', label: 'System' },
];

// ─── Button Edit Modal ────────────────────────────────────────────────────────
function ButtonModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || {
    label: '', type: 'mobile_provider', image_url: '', bg_color: '#10b981',
    provider_key: '', nav_path: '', is_active: true, sort_order: 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.label) return;
    setSaving(true);
    const data = { ...form, sort_order: parseInt(form.sort_order) || 0 };
    if (item?.id) await base44.entities.HomeButton.update(item.id, data);
    else await base44.entities.HomeButton.create(data);
    setSaving(false); onSave(); onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-black text-slate-900">{item?.id ? 'Edit Button' : 'Add Home Button'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Type */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Button Type</label>
            <div className="space-y-2">
              {TYPE_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                  className={`w-full p-3 rounded-xl text-left border-2 transition-all ${form.type === opt.value ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                  <p className="text-xs text-slate-400">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Label *</label>
            <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              placeholder="e.g. bKash" className="w-full border-2 border-slate-200 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none" />
          </div>

          {/* Image URL */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Logo / Image URL</label>
            <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
              placeholder="https://..." className="w-full border-2 border-slate-200 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm outline-none" />
            {form.image_url && (
              <div className="mt-2 flex items-center gap-2">
                <img src={form.image_url} alt="preview" className="w-12 h-12 rounded-xl object-cover border border-slate-200" onError={e => e.target.style.display='none'} />
                <span className="text-xs text-slate-400">Preview</span>
              </div>
            )}
          </div>

          {/* BG Color */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Background Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.bg_color || '#10b981'} onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))}
                className="w-12 h-10 rounded-lg cursor-pointer border-2 border-slate-200" />
              <input value={form.bg_color} onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))}
                placeholder="#e2136e" className="flex-1 border-2 border-slate-200 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm outline-none font-mono" />
              <div className="w-10 h-10 rounded-xl border border-slate-200 shrink-0" style={{ background: form.bg_color || '#e5e7eb' }} />
            </div>
          </div>

          {/* Provider Key (mobile only) */}
          {form.type === 'mobile_provider' && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Provider Key</label>
              <input value={form.provider_key} onChange={e => setForm(f => ({ ...f, provider_key: e.target.value }))}
                placeholder="bkash / nagad / rocket" className="w-full border-2 border-slate-200 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm outline-none" />
              <p className="text-[10px] text-slate-400 mt-1">URL: /mobile-banking-transfer?provider=[key]</p>
            </div>
          )}

          {/* Nav Path (non-mobile) */}
          {form.type !== 'mobile_provider' && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Navigation Path</label>
              <input value={form.nav_path} onChange={e => setForm(f => ({ ...f, nav_path: e.target.value }))}
                placeholder="/visa or /bank-transfer" className="w-full border-2 border-slate-200 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm outline-none" />
            </div>
          )}

          {/* Active + Sort */}
          <div className="flex gap-3">
            <label className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3 cursor-pointer flex-1">
              <input type="checkbox" checked={!!form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-emerald-500" />
              <span className="text-sm font-bold text-slate-700">Active / Visible</span>
            </label>
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3">
              <span className="text-xs font-bold text-slate-500">Sort:</span>
              <input type="number" value={form.sort_order || 0} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
                className="w-14 border-2 border-slate-200 rounded-lg px-2 py-1 text-sm font-bold outline-none text-center" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6 pt-2 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-slate-200 font-bold text-slate-600 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.label}
            className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm disabled:opacity-50">
            {saving ? 'Saving...' : item?.id ? 'Update' : 'Add Button'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Button Group Card ────────────────────────────────────────────────────────
function ButtonGroup({ title, items, onEdit, onToggle, onDelete }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
        <p className="text-xs font-black text-slate-600 uppercase tracking-wider">{title} ({items.length})</p>
      </div>
      {items.length === 0 ? (
        <div className="px-5 py-4 text-xs text-slate-400 italic">No buttons in this group yet.</div>
      ) : (
        <div className="divide-y divide-slate-50">
          {items.map(btn => (
            <div key={btn.id} className="px-5 py-3.5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-slate-100"
                style={{ background: btn.bg_color || '#e5e7eb' }}>
                {btn.image_url
                  ? <img src={btn.image_url} alt={btn.label} className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                  : <div className="w-full h-full flex items-center justify-center text-white font-black text-sm">{(btn.label || '?')[0]}</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700">{btn.label}</p>
                <p className="text-xs text-slate-400 truncate">
                  {btn.provider_key ? `provider: ${btn.provider_key}` : (btn.nav_path || '—')}
                  {' · '}<span className="font-mono">{btn.bg_color}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">#{btn.sort_order || 0}</span>
                <button onClick={() => onToggle(btn)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${btn.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                  {btn.is_active ? 'ON' : 'OFF'}
                </button>
                <button onClick={() => onEdit(btn)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-500"><Edit2 size={14} /></button>
                <button onClick={() => onDelete(btn.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminHomeConfig() {
  const [tab, setTab] = useState('buttons');
  const [buttons, setButtons] = useState([]);
  const [flags, setFlags] = useState([]);
  const [editButton, setEditButton] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadButtons = async () => {
    const data = await base44.entities.HomeButton.list('sort_order', 100);
    setButtons(data || []);
  };
  const loadFlags = async () => {
    const data = await base44.entities.FeatureFlag.list('sort_order', 100);
    setFlags(data || []);
  };

  useEffect(() => {
    setLoading(true);
    const fn = tab === 'buttons' ? loadButtons : loadFlags;
    fn().finally(() => setLoading(false));
  }, [tab]);

  const deleteButton = async (id) => { if (!confirm('Delete this button?')) return; await base44.entities.HomeButton.delete(id); loadButtons(); };
  const toggleButton = async (btn) => { await base44.entities.HomeButton.update(btn.id, { is_active: !btn.is_active }); loadButtons(); };
  const toggleFlag = async (flag) => { await base44.entities.FeatureFlag.update(flag.id, { is_enabled: !flag.is_enabled }); loadFlags(); };

  const mobileButtons = buttons.filter(b => b.type === 'mobile_provider');
  const bankButtons = buttons.filter(b => b.type === 'bank_transfer');
  const serviceButtons = buttons.filter(b => b.type === 'service');

  const flagsByCategory = flags.reduce((acc, f) => {
    const cat = f.category || 'system';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {});

  return (
    <AdminShell>
      <div className="p-6 space-y-5">

        {/* Tabs */}
        <div className="flex gap-3">
          {[
            { id: 'buttons', label: `Home Buttons (${buttons.length})` },
            { id: 'flags', label: `Feature Flags (${flags.length})` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === t.id ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Home Buttons Tab ── */}
        {tab === 'buttons' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-black text-slate-900">Home Screen Buttons</h2>
                <p className="text-xs text-slate-500 mt-0.5">Control Quick Transfer (bKash/Nagad/Rocket/Bank) and Service buttons from here</p>
              </div>
              <button onClick={() => setEditButton({})}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 shadow-md">
                <Plus size={15} /> Add Button
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
              <Home size={18} className="text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-blue-700">How it works</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  When records exist here, the home page uses them instead of defaults. Set sort_order to control position. Disable any button to hide it instantly. If this list is empty, the app falls back to built-in defaults.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-16 animate-pulse border border-slate-100" />)}</div>
            ) : (
              <>
                <ButtonGroup title="Mobile Providers — Quick Transfer" items={mobileButtons} onEdit={setEditButton} onToggle={toggleButton} onDelete={deleteButton} />
                <ButtonGroup title="Bank Transfer Button" items={bankButtons} onEdit={setEditButton} onToggle={toggleButton} onDelete={deleteButton} />
                <ButtonGroup title="Service Buttons" items={serviceButtons} onEdit={setEditButton} onToggle={toggleButton} onDelete={deleteButton} />
              </>
            )}
          </div>
        )}

        {/* ── Feature Flags Tab ── */}
        {tab === 'flags' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-black text-slate-900">Feature Flags</h2>
              <p className="text-xs text-slate-500 mt-0.5">Enable or disable features across the entire app in real-time</p>
            </div>

            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-14 animate-pulse border border-slate-100" />)}</div>
            ) : flags.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                <Layers size={36} className="text-slate-200 mx-auto mb-3" />
                <p className="font-bold text-slate-400">No feature flags yet</p>
                <p className="text-xs text-slate-300 mt-1">Feature flags are seeded automatically by the system</p>
              </div>
            ) : (
              Object.entries(flagsByCategory).map(([cat, catFlags]) => (
                <div key={cat} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-xs font-black text-slate-600 uppercase tracking-wider">{cat} ({catFlags.length})</p>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {catFlags.map(flag => (
                      <div key={flag.id} className="px-5 py-4 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm">{flag.label || flag.key}</p>
                          {flag.description && <p className="text-xs text-slate-400 mt-0.5">{flag.description}</p>}
                          <p className="text-[10px] text-slate-300 font-mono mt-0.5">{flag.key}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            onClick={() => toggleFlag(flag)}
                            className={`relative w-12 h-6 rounded-full transition-all duration-200 ${flag.is_enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${flag.is_enabled ? 'left-7' : 'left-1'}`} />
                          </button>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg min-w-[44px] text-center ${flag.is_enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                            {flag.is_enabled ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {editButton !== null && (
          <ButtonModal
            item={editButton?.id ? editButton : null}
            onClose={() => setEditButton(null)}
            onSave={loadButtons}
          />
        )}
      </AnimatePresence>
    </AdminShell>
  );
}