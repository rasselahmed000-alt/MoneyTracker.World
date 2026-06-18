import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminShell from '../../components/AdminShell';
import { AdminCard, AdminCardHeader, AddButton, StatusBadge, PageLoader, EmptyState } from '../../components/admin/AdminPageWrapper';
import { Building2, Pencil, Trash2, X, Upload, GripVertical, ChevronUp, ChevronDown, Search } from 'lucide-react';

// ── Bank Form Modal ──
function BankModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || {
    name: '', short_code: '', logo_url: '',
    min_transfer_amount: 0, is_active: true, sort_order: 0
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUploadError('শুধুমাত্র ছবি ফাইল আপলোড করুন'); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError('ফাইল সাইজ ৫ MB এর কম হতে হবে'); return; }
    setUploading(true);
    setUploadError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (file_url) setForm(f => ({ ...f, logo_url: file_url }));
      else setUploadError('আপলোড সফল কিন্তু URL পাওয়া যায়নি');
    } catch (err) {
      setUploadError('আপলোড ব্যর্থ: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name?.trim()) { alert('ব্যাংকের নাম দিন'); return; }
    setSaving(true);
    try {
      if (form.id) await base44.entities.Bank.update(form.id, form);
      else await base44.entities.Bank.create(form);
      onSave();
      onClose();
    } catch (e) {
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {form.logo_url && (
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center">
                <img src={form.logo_url} alt="" className="w-full h-full object-contain p-1"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            )}
            <h3 className="font-black text-slate-900">{form.id ? 'Edit' : 'Add'} Bank</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Bank Name */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Bank Name *</label>
            <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Dutch-Bangla Bank"
              className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-4 py-2.5 font-semibold text-sm outline-none transition-colors" />
          </div>

          {/* Short Code */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Short Code</label>
            <input value={form.short_code || ''} onChange={e => setForm({ ...form, short_code: e.target.value.toUpperCase() })}
              placeholder="e.g. DBBL"
              className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-4 py-2.5 font-semibold text-sm outline-none transition-colors" />
          </div>

          {/* Logo */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Logo URL / Upload</label>
            <div className="flex gap-2 items-center mb-2">
              <input value={form.logo_url || ''} onChange={e => { setForm({ ...form, logo_url: e.target.value }); setUploadError(''); }}
                placeholder="https://... or upload image"
                className="flex-1 border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-4 py-2.5 font-semibold text-sm outline-none transition-colors" />
              <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0 hover:bg-slate-700 transition-colors">
                {uploading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Upload size={14} />}
                {uploading ? '...' : 'Upload'}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
              </label>
            </div>
            {uploadError && <p className="text-xs text-red-600 font-semibold">{uploadError}</p>}
            {form.logo_url && !uploadError && (
              <div className="h-16 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                <img src={form.logo_url} alt="" className="h-12 object-contain"
                  onError={() => setUploadError('এই URL থেকে ছবি লোড হচ্ছে না')} />
              </div>
            )}
          </div>

          {/* Min Transfer */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
              Minimum Transfer Amount (BDT)
              <span className="ml-1 text-slate-400 normal-case font-normal"> — 0 মানে কোনো minimum নেই</span>
            </label>
            <input type="number" min="0" value={form.min_transfer_amount ?? 0}
              onChange={e => setForm({ ...form, min_transfer_amount: Number(e.target.value) })}
              placeholder="0"
              className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-4 py-2.5 font-semibold text-sm outline-none transition-colors" />
          </div>

          {/* Sort Order */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
              Display Order
              <span className="ml-1 text-slate-400 normal-case font-normal"> — ছোট নম্বর আগে দেখাবে</span>
            </label>
            <input type="number" value={form.sort_order || 0}
              onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })}
              className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-4 py-2.5 font-semibold text-sm outline-none transition-colors" />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
            <div>
              <p className="font-bold text-sm text-slate-700">Active Status</p>
              <p className="text-xs text-slate-400">Customer app-এ দেখাবে কিনা</p>
            </div>
            <button onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${form.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.is_active ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-600 text-sm">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            {saving ? 'Saving...' : form.id ? 'Update Bank' : 'Add Bank'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main AdminBanks Page ──
export default function AdminBanks() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingOrder, setEditingOrder] = useState(null); // bank id being inline-edited
  const [tempOrder, setTempOrder] = useState('');

  const load = () => {
    setLoading(true);
    base44.entities.Bank.list('sort_order', 200).then(setItems).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.short_code?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleActive = async (b) => {
    await base44.entities.Bank.update(b.id, { is_active: !b.is_active });
    load();
  };

  const deleteBank = async (b) => {
    if (!confirm(`"${b.name}" মুছে ফেলবেন?`)) return;
    try {
      await base44.entities.Bank.delete(b.id);
      load();
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  // Inline sort order edit
  const startEditOrder = (b) => {
    setEditingOrder(b.id);
    setTempOrder(String(b.sort_order || 0));
  };

  const saveOrder = async (b) => {
    const newOrder = parseInt(tempOrder, 10);
    if (!isNaN(newOrder) && newOrder !== b.sort_order) {
      await base44.entities.Bank.update(b.id, { sort_order: newOrder });
      load();
    }
    setEditingOrder(null);
  };

  // Move up/down quick buttons
  const moveBank = async (b, direction) => {
    const newOrder = (b.sort_order || 0) + direction;
    await base44.entities.Bank.update(b.id, { sort_order: newOrder });
    load();
  };

  const activeCount = items.filter(b => b.is_active).length;

  return (
    <AdminShell>
      <div className="p-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <p className="text-2xl font-black text-slate-800">{items.length}</p>
            <p className="text-xs font-bold text-slate-400 mt-0.5">মোট ব্যাংক</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <p className="text-2xl font-black text-emerald-600">{activeCount}</p>
            <p className="text-xs font-bold text-slate-400 mt-0.5">Active ব্যাংক</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <p className="text-2xl font-black text-red-500">{items.length - activeCount}</p>
            <p className="text-xs font-bold text-slate-400 mt-0.5">Inactive ব্যাংক</p>
          </div>
        </div>

        <AdminCard>
          <AdminCardHeader
            title={`Banks Management (${filtered.length})`}
            subtitle="Display Order পরিবর্তন করুন • Active/Inactive করুন • লোগো আপডেট করুন"
            action={<AddButton onClick={() => setModal({})} label="+ Add Bank" />}
          />

          {/* Search */}
          <div className="px-6 pb-4">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ব্যাংক খুঁজুন (নাম বা কোড)..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-100 focus:border-emerald-400 rounded-xl text-sm font-semibold outline-none transition-colors"
              />
            </div>
          </div>

          {/* Table Header */}
          <div className="px-6 py-2 bg-slate-50 border-y border-slate-100">
            <div className="grid grid-cols-[48px_1fr_80px_100px_100px] gap-3 items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Logo</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Bank Name</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Order</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Status</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Actions</span>
            </div>
          </div>

          {loading ? <PageLoader /> : (
            <div className="divide-y divide-slate-50">
              {filtered.map(b => (
                <div key={b.id} className="px-6 py-3 hover:bg-slate-50/60 transition-colors group">
                  <div className="grid grid-cols-[48px_1fr_80px_100px_100px] gap-3 items-center">

                    {/* Logo */}
                    <div className="w-11 h-11 rounded-xl bg-white border-2 border-slate-100 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                      {b.logo_url ? (
                        <img
                          src={b.logo_url}
                          alt={b.name}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextSibling && (e.currentTarget.nextSibling.style.display = 'flex');
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full ${b.logo_url ? 'hidden' : 'flex'} items-center justify-center bg-slate-100`}>
                        <span className="text-slate-500 font-extrabold text-xs">{(b.short_code || b.name || '?')[0]}</span>
                      </div>
                    </div>

                    {/* Name + Code */}
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-800 truncate">{b.name}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        {b.short_code && (
                          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                            {b.short_code}
                          </span>
                        )}
                        {b.min_transfer_amount > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-100">
                            Min ৳{b.min_transfer_amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sort Order — inline edit */}
                    <div className="flex items-center justify-center gap-1">
                      {editingOrder === b.id ? (
                        <input
                          type="number"
                          value={tempOrder}
                          onChange={e => setTempOrder(e.target.value)}
                          onBlur={() => saveOrder(b)}
                          onKeyDown={e => { if (e.key === 'Enter') saveOrder(b); if (e.key === 'Escape') setEditingOrder(null); }}
                          autoFocus
                          className="w-14 text-center border-2 border-emerald-400 rounded-lg py-1 text-sm font-bold outline-none"
                        />
                      ) : (
                        <div className="flex items-center gap-0.5">
                          <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => moveBank(b, -1)} className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600">
                              <ChevronUp size={10} />
                            </button>
                            <button onClick={() => moveBank(b, 1)} className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600">
                              <ChevronDown size={10} />
                            </button>
                          </div>
                          <button
                            onClick={() => startEditOrder(b)}
                            className="text-sm font-black text-slate-600 w-10 text-center py-1 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                            title="Click to edit order"
                          >
                            {b.sort_order || 0}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Status toggle */}
                    <div className="flex justify-center">
                      <button onClick={() => toggleActive(b)} title="Toggle active status">
                        <StatusBadge status={b.is_active ? 'active' : 'inactive'} />
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setModal(b)}
                        className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors"
                        title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => deleteBank(b)}
                        className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && !loading && (
                <EmptyState icon={Building2} message={search ? `"${search}" নামে কোনো ব্যাংক পাওয়া যায়নি` : 'No banks added yet.'} />
              )}
            </div>
          )}

          {/* Footer hint */}
          {items.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-400 font-medium">
                💡 <strong>Display Order</strong> সংখ্যায় ক্লিক করে বা ↑↓ arrow দিয়ে order পরিবর্তন করুন।
                Active ব্যাংকগুলো customer app-এর Bank Transfer-এ দেখাবে।
              </p>
            </div>
          )}
        </AdminCard>
      </div>

      {modal !== null && (
        <BankModal
          item={modal.id ? modal : null}
          onClose={() => setModal(null)}
          onSave={load}
        />
      )}
    </AdminShell>
  );
}