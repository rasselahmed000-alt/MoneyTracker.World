import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminShell from '../../components/AdminShell';
import { AdminCard, AdminCardHeader, PageLoader, EmptyState } from '../../components/admin/AdminPageWrapper';
import { Package, Pencil, Trash2, X, Plus, ChevronDown, ChevronRight, MousePointer } from 'lucide-react';

// Modal for adding/editing a package
function PackageModal({ item, defaultCountry, defaultCurrency, defaultCountryId, onClose, onSave }) {
  const [form, setForm] = useState(
    item
      ? { ...item }
      : { country_id: defaultCountryId || '', country_name: defaultCountry || '', currency: defaultCurrency || '', amount: '', redirect_url: '', is_active: true }
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.amount || !form.redirect_url) return;
    setSaving(true);
    if (form.id) {
      await base44.entities.DepositPackage.update(form.id, { ...form, amount: Number(form.amount) });
    } else {
      await base44.entities.DepositPackage.create({ ...form, amount: Number(form.amount) });
    }
    setSaving(false);
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div>
            <h3 className="font-black text-slate-900">{form.id ? 'Edit' : 'Add'} Package</h3>
            <p className="text-xs text-slate-400 mt-0.5">{form.country_name} · {form.currency}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Amount ({form.currency})</label>
            <input
              type="number"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-4 py-3 font-bold text-lg outline-none bg-slate-50 focus:bg-white transition-colors"
              placeholder="e.g. 1000"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Payment URL</label>
            <input
              value={form.redirect_url}
              onChange={e => setForm({ ...form, redirect_url: e.target.value })}
              className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-4 py-2.5 font-semibold text-sm outline-none bg-slate-50 focus:bg-white transition-colors"
              placeholder="https://buy.stripe.com/..."
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-600 text-sm">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.amount || !form.redirect_url}
            className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
          >
            {saving ? 'Saving...' : 'Save Package'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDepositPackages() {
  const [countries, setCountries] = useState([]);
  const [packages, setPackages] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    const [ctrs, pkgs] = await Promise.all([
      base44.entities.Country.filter({ is_active: true }, 'name', 200),
      base44.entities.DepositPackage.list('-created_date', 500),
    ]);
    setCountries(ctrs);
    setPackages(pkgs);
    setLoading(false);

    // Auto-backfill missing country_id on existing packages (runs silently)
    const countryMap = {};
    (ctrs || []).forEach(c => { countryMap[c.name] = c.id; });
    const toFix = (pkgs || []).filter(p => !p.country_id && p.country_name && countryMap[p.country_name]);
    for (const p of toFix) {
      base44.entities.DepositPackage.update(p.id, { country_id: countryMap[p.country_name] }).catch(() => {});
    }
  };

  useEffect(() => { loadAll(); }, []);

  // Group packages by country_name
  const pkgByCountry = packages.reduce((acc, p) => {
    const key = p.country_name || '';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  // Sort packages low → high
  Object.values(pkgByCountry).forEach(arr => arr.sort((a, b) => (a.amount || 0) - (b.amount || 0)));

  const toggleExpand = (name) => setExpanded(prev => ({ ...prev, [name]: !prev[name] }));

  const totalPackages = packages.length;

  return (
    <AdminShell>
      <div className="p-6">
        <AdminCard>
          <AdminCardHeader
            title={`Deposit Packages (${totalPackages})`}
            subtitle="Click a country to view & add packages"
          />

          {loading ? <PageLoader /> : (
            <div>
              {countries.length === 0 && (
                <EmptyState icon={Package} message="No active countries found. Add countries in the Countries section." />
              )}
              {countries.map(country => {
                const countryPkgs = pkgByCountry[country.name] || [];
                const isOpen = !!expanded[country.name];

                return (
                  <div key={country.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {/* Country Row */}
                    <button
                      onClick={() => toggleExpand(country.name)}
                      className="w-full px-5 py-4 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                    >
                      {/* Flag / Initial */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-base shrink-0"
                        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)' }}>
                        {country.flag_emoji || country.name[0]?.toUpperCase()}
                      </div>

                      <div className="flex-1 text-left">
                        <p className="font-black text-slate-800">{country.name}</p>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          {country.currency} · {countryPkgs.length} package{countryPkgs.length !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Add button */}
                      <button
                        onClick={e => { e.stopPropagation(); setModal({ country_id: country.id, country_name: country.name, currency: country.currency }); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 transition-colors mr-2"
                        style={{ background: 'rgba(16,185,129,0.1)' }}
                      >
                        <Plus size={12} /> Add
                      </button>

                      {isOpen ? <ChevronDown size={16} className="text-slate-400 shrink-0" /> : <ChevronRight size={16} className="text-slate-400 shrink-0" />}
                    </button>

                    {/* Packages — shown when expanded */}
                    {isOpen && (
                      <div className="bg-slate-50/50">
                        {countryPkgs.length === 0 ? (
                          <div className="px-6 py-4 text-center text-sm text-slate-400 font-medium">
                            No packages yet. Click <span className="text-emerald-600 font-bold">+ Add</span> to create one.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {countryPkgs.map(p => (
                              <div key={p.id} className="px-5 py-3.5 flex items-center gap-3 pl-16 hover:bg-white transition-colors">
                                <div className="flex-1 min-w-0">
                                  <p className="font-black text-slate-900 text-sm">
                                    {(p.amount || 0).toLocaleString()} <span className="text-slate-400 font-bold text-xs">{p.currency}</span>
                                  </p>
                                  <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">{p.redirect_url}</p>
                                  <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-300">
                                    <MousePointer size={9} /> {p.click_count || 0} clicks
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {/* Active toggle */}
                                  <button
                                    onClick={async () => { await base44.entities.DepositPackage.update(p.id, { is_active: !p.is_active }); loadAll(); }}
                                    className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                                    style={p.is_active
                                      ? { background: '#d1fae5', color: '#059669' }
                                      : { background: '#f1f5f9', color: '#64748b' }}
                                  >
                                    {p.is_active ? 'Active' : 'Inactive'}
                                  </button>
                                  <button
                                    onClick={() => setModal({ item: p })}
                                    className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    onClick={async () => { if (confirm('Delete this package?')) { await base44.entities.DepositPackage.delete(p.id); loadAll(); } }}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </AdminCard>
      </div>

      {modal !== null && (
        <PackageModal
          item={modal.item || null}
          defaultCountryId={modal.country_id || ''}
          defaultCountry={modal.country_name || ''}
          defaultCurrency={modal.currency || ''}
          onClose={() => setModal(null)}
          onSave={loadAll}
        />
      )}
    </AdminShell>
  );
}