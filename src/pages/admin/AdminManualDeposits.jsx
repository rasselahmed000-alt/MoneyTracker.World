import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminShell from '../../components/AdminShell';
import { AdminCard, AdminCardHeader, StatusBadge, FilterTabs, PageLoader, EmptyState } from '../../components/admin/AdminPageWrapper';
import { X, Check, XCircle, ArrowDownCircle, Plus, Edit2, Trash2, Globe, Smartphone, Building2, ZoomIn, ZoomOut, Download, Maximize2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function ReceiptViewer({ url }) {
  const [zoom, setZoom] = useState(1);
  const [lightbox, setLightbox] = useState(false);
  const handleDownload = () => { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.download = 'receipt.jpg'; a.click(); };
  return (
    <>
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
        <div className="flex items-center justify-between px-3 py-2 bg-slate-100 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-500">Receipt / Payment Proof</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500"><ZoomOut size={14} /></button>
            <span className="text-xs font-bold text-slate-600 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500"><ZoomIn size={14} /></button>
            <button onClick={() => setLightbox(true)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500"><Maximize2 size={14} /></button>
            <button onClick={handleDownload} className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-500"><Download size={14} /></button>
          </div>
        </div>
        <div className="overflow-auto max-h-72 flex items-start justify-center p-2" style={{ cursor: zoom > 1 ? 'move' : 'zoom-in' }}>
          <img src={url} alt="Receipt" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s', maxWidth: '100%' }} className="rounded-lg shadow-sm" onClick={() => zoom < 2 ? setZoom(z => Math.min(3, z + 0.5)) : setZoom(1)} />
        </div>
      </div>
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-end gap-2 mb-2">
              <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-bold"><Download size={13} /> Download</button>
              <button onClick={() => setLightbox(false)} className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg"><X size={18} /></button>
            </div>
            <img src={url} alt="Receipt Full" className="w-full rounded-xl max-h-[85vh] object-contain" />
          </div>
        </div>
      )}
    </>
  );
}

function DepositModal({ item, onClose, onSave }) {
  const [note, setNote] = useState(item.admin_note || '');
  const [repeatCount, setRepeatCount] = useState(1);
  const [saving, setSaving] = useState(false);
  const baseAmount = item.bdt_amount || 0;
  const totalCredit = baseAmount * repeatCount;

  const handle = async (status) => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await base44.functions.invoke('approveDeposit', { requestId: item.id, status, admin_note: note, repeat_count: status === 'approved' ? repeatCount : 1 });
      if (res.data?.error) { alert('Error: ' + res.data.error); setSaving(false); return; }
      onSave(); onClose();
    } catch (err) { alert('Failed: ' + (err?.message || 'Unknown')); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div><h3 className="font-black text-slate-900">Deposit Request</h3><p className="text-xs text-slate-400 mt-0.5">{item.user_email}</p></div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 space-y-2.5 text-sm">
            {[['User', `${item.user_name} - ${item.user_email}`], ['Amount', `${item.amount_sent} ${item.currency} = BDT ${(item.bdt_amount || 0).toLocaleString()}`], ['Method', item.method], item.last_digits && ['Ref', item.last_digits]].filter(Boolean).map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="text-slate-400 font-medium">{k}</span><span className="font-bold text-slate-700 capitalize">{v}</span></div>
            ))}
          </div>
          {item.method === 'mobile_banking' && item.last_digits && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs font-black text-blue-600 uppercase tracking-wider mb-2">Last 4 Digits</p>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-white border-2 border-blue-300 flex items-center justify-center font-black text-lg text-blue-600">{item.last_digits}</div>
                <p className="text-xs text-blue-500">Transaction reference শেষের অংশ</p>
              </div>
            </div>
          )}
          {item.receipt_url && <ReceiptViewer url={item.receipt_url} />}
          {item.status === 'pending' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <label className="text-xs font-black text-amber-700 uppercase tracking-wider mb-2 block">Repeat Count (Multiplier)</label>
              <div className="flex items-center gap-3">
                <input type="number" min="1" max="100" value={repeatCount} onChange={e => setRepeatCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))} className="w-24 border-2 border-amber-300 focus:border-amber-500 rounded-xl px-3 py-2.5 text-lg font-black text-center outline-none" />
                <div className="flex-1">
                  <p className="text-xs text-amber-600 font-bold">BDT {baseAmount.toLocaleString()} x {repeatCount} = <span className="text-amber-800 font-black text-sm ml-1">BDT {totalCredit.toLocaleString()}</span></p>
                  {repeatCount > 1 && <p className="text-[10px] text-amber-500 mt-0.5">{repeatCount} Transaction entries</p>}
                </div>
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Admin Note</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm outline-none resize-none" />
          </div>
          {item.status === 'pending' && (
            <div className="flex gap-3">
              <button onClick={() => handle('rejected')} disabled={saving} className="flex-1 py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 text-sm bg-red-500 disabled:opacity-60"><XCircle size={15} /> Reject</button>
              <button onClick={() => handle('approved')} disabled={saving} className="flex-1 py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 text-sm bg-emerald-500 disabled:opacity-60"><Check size={15} /> Approve {repeatCount > 1 ? `(x${repeatCount})` : ''}</button>
            </div>
          )}
          {item.status !== 'pending' && (
            <div className="text-center py-2">
              <StatusBadge status={item.status} />
              {item.repeat_count > 1 && <p className="text-xs text-slate-400 mt-1">Repeat: {item.repeat_count}x Total: BDT {(item.approved_total || 0).toLocaleString()}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// method is LOCKED on create/edit — no switching allowed
function AccountModal({ item, fixedMethod, defaultCountry, onClose, onSave }) {
  const lockedMethod = item?.method || fixedMethod || 'mobile_banking';
  const isMobile = lockedMethod === 'mobile_banking';
  const [form, setForm] = useState(item || {
    country: defaultCountry?.country || '',
    currency: defaultCountry?.currency || '',
    currency_code: defaultCountry?.currency_code || '',
    flag_emoji: defaultCountry?.flag_emoji || '',
    exchange_rate: defaultCountry?.exchange_rate || '',
    send_limit: defaultCountry?.send_limit || 0,
    receive_limit: defaultCountry?.receive_limit || 0,
    method: lockedMethod,
    is_active: true, sort_order: 0,
    mobile_provider: '', mobile_number: '', account_holder: '',
    account_number: '', iban: '', branch: '', swift_code: '', bank_name: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.country || !form.currency_code || !form.exchange_rate) return;
    setSaving(true);
    const data = { ...form, method: lockedMethod, exchange_rate: parseFloat(form.exchange_rate) || 0, send_limit: parseFloat(form.send_limit) || 0, receive_limit: parseFloat(form.receive_limit) || 0, sort_order: parseInt(form.sort_order) || 0 };
    if (item?.id) { await base44.entities.ManualDepositAccount.update(item.id, data); }
    else { await base44.entities.ManualDepositAccount.create(data); }
    setSaving(false); onSave(); onClose();
  };

  const f = (key, label, placeholder, type = 'text') => (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">{label}</label>
      <input type={type} value={form[key] || ''} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))} placeholder={placeholder}
        className="w-full border-2 border-slate-200 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none transition-colors" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isMobile ? 'bg-pink-100' : 'bg-blue-100'}`}>
              {isMobile ? <Smartphone size={16} className="text-pink-600" /> : <Building2 size={16} className="text-blue-600" />}
            </div>
            <div>
              <h3 className="font-black text-slate-900">{item?.id ? 'Edit Account' : (isMobile ? 'Add Mobile Banking' : 'Add Bank Account')}</h3>
              <p className="text-xs font-bold text-slate-400">{isMobile ? 'Mobile Banking account' : 'Bank Transfer account'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="bg-blue-50 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-black text-blue-600 uppercase tracking-wider">Country Info</p>
            <div className="grid grid-cols-2 gap-3">
              {f('country', 'Country Name *', 'e.g. Malaysia')}
              {f('flag_emoji', 'Flag Emoji', 'e.g. MYR')}
              {f('currency', 'Currency Name *', 'e.g. Ringgit')}
              {f('currency_code', 'Currency Code *', 'e.g. MYR')}
            </div>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-black text-emerald-600 uppercase tracking-wider">Exchange Rate</p>
            <div className="flex items-center gap-2 border-2 border-slate-200 focus-within:border-emerald-400 rounded-xl px-4 py-2.5 bg-white">
              <span className="text-sm font-bold text-slate-500">1 {form.currency_code || 'FCY'} =</span>
              <input type="number" value={form.exchange_rate || ''} onChange={e => setForm(prev => ({ ...prev, exchange_rate: e.target.value }))} placeholder="34.60" className="flex-1 text-sm font-bold outline-none" />
              <span className="text-sm font-bold text-emerald-600">BDT</span>
            </div>
            {form.exchange_rate && <p className="text-xs text-emerald-600 font-semibold">1000 {form.currency_code || 'FCY'} = BDT {(1000 * parseFloat(form.exchange_rate)).toLocaleString()}</p>}
            <div className="grid grid-cols-2 gap-3">
              {f('send_limit', 'Send Limit (0=unlimited)', '5000', 'number')}
              {f('receive_limit', 'Receive Limit BDT', '200000', 'number')}
            </div>
          </div>
          {isMobile ? (
            <div className="bg-pink-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone size={15} className="text-pink-600" />
                <p className="text-xs font-black text-pink-600 uppercase tracking-wider">Mobile Banking Details</p>
              </div>
              {f('mobile_provider', 'Provider Name *', 'e.g. bKash, Nagad, Wave')}
              {f('mobile_number', 'Mobile Number *', 'e.g. 01700000000')}
              {f('account_holder', 'Account Holder Name', 'Name on account')}
            </div>
          ) : (
            <div className="bg-blue-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Building2 size={15} className="text-blue-600" />
                <p className="text-xs font-black text-blue-600 uppercase tracking-wider">Bank Account Details</p>
              </div>
              {f('bank_name', 'Bank Name *', 'e.g. Maybank')}
              {f('account_holder', 'Account Holder', 'Name on account')}
              {f('account_number', 'Account Number *', 'Account number')}
              {f('iban', 'IBAN', 'IBAN (optional)')}
              {f('swift_code', 'SWIFT Code', 'SWIFT (optional)')}
              {f('branch', 'Branch', 'Branch name (optional)')}
            </div>
          )}
          <div className="flex gap-3">
            <label className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3 cursor-pointer flex-1">
              <input type="checkbox" checked={!!form.is_active} onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))} className="w-4 h-4 accent-emerald-500" />
              <span className="text-sm font-bold text-slate-700">Active</span>
            </label>
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3">
              <span className="text-xs font-bold text-slate-500">Sort:</span>
              <input type="number" value={form.sort_order || 0} onChange={e => setForm(prev => ({ ...prev, sort_order: e.target.value }))} className="w-14 border-2 border-slate-200 rounded-lg px-2 py-1 text-sm font-bold outline-none text-center" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-slate-200 font-bold text-slate-600 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.country || !form.currency_code || !form.exchange_rate}
            className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm disabled:opacity-50">
            {saving ? 'Saving...' : item?.id ? 'Update' : 'Add Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountRow({ acc, onEdit, onToggle, onDelete }) {
  const isMobile = acc.method === 'mobile_banking';
  return (
    <div className="px-5 py-3.5 flex items-center gap-3">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isMobile ? 'bg-pink-50' : 'bg-blue-50'}`}>
        {isMobile ? <Smartphone size={14} className="text-pink-500" /> : <Building2 size={14} className="text-blue-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-700">{acc.mobile_provider || acc.bank_name || 'Account'}</p>
        <p className="text-xs text-slate-400 truncate">{acc.mobile_number || acc.account_number || acc.account_holder || '-'}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button onClick={() => onToggle(acc)} className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${acc.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
          {acc.is_active ? 'ON' : 'OFF'}
        </button>
        <button onClick={() => onEdit(acc)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-500"><Edit2 size={14} /></button>
        <button onClick={() => onDelete(acc.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

function CountrySection({ country, items, onEdit, onToggle, onDelete, onAdd }) {
  const [expanded, setExpanded] = useState(true);
  const mobileAccounts = items.filter(a => a.method === 'mobile_banking');
  const bankAccounts = items.filter(a => a.method === 'bank');
  const first = items[0];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-slate-700 to-slate-800 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <span className="text-2xl">{first.flag_emoji || '🌍'}</span>
        <div className="flex-1">
          <p className="font-black text-white">{country}</p>
          <p className="text-xs text-slate-300">{first.currency} ({first.currency_code}) - Rate: 1 {first.currency_code} = BDT {first.exchange_rate}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs px-2 py-1 bg-pink-500/30 text-pink-200 rounded-lg font-bold">Mobile {mobileAccounts.length}</span>
          <span className="text-xs px-2 py-1 bg-blue-500/30 text-blue-200 rounded-lg font-bold">Bank {bankAccounts.length}</span>
          {expanded ? <ChevronUp size={16} className="text-slate-300" /> : <ChevronDown size={16} className="text-slate-300" />}
        </div>
      </div>

      {expanded && (
        <>
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 mr-auto">Accounts in {country}</span>
            <button onClick={() => onAdd('mobile_banking', first)} className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500 text-white rounded-lg text-xs font-bold hover:bg-pink-600">
              <Smartphone size={12} /> Add Mobile Banking
            </button>
            <button onClick={() => onAdd('bank', first)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600">
              <Building2 size={12} /> Add Bank Account
            </button>
          </div>

          <div className="border-b border-slate-50">
            <div className="px-5 py-2.5 bg-pink-50/50 flex items-center gap-2">
              <Smartphone size={13} className="text-pink-500" />
              <p className="text-xs font-black text-pink-600 uppercase tracking-wider">Mobile Banking ({mobileAccounts.length})</p>
            </div>
            {mobileAccounts.length === 0
              ? <div className="px-5 py-3 text-xs text-slate-400 italic">No mobile banking accounts yet.</div>
              : <div className="divide-y divide-slate-50">{mobileAccounts.map(acc => <AccountRow key={acc.id} acc={acc} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />)}</div>
            }
          </div>

          <div>
            <div className="px-5 py-2.5 bg-blue-50/50 flex items-center gap-2">
              <Building2 size={13} className="text-blue-500" />
              <p className="text-xs font-black text-blue-600 uppercase tracking-wider">Bank Transfer ({bankAccounts.length})</p>
            </div>
            {bankAccounts.length === 0
              ? <div className="px-5 py-3 text-xs text-slate-400 italic">No bank accounts yet.</div>
              : <div className="divide-y divide-slate-50">{bankAccounts.map(acc => <AccountRow key={acc.id} acc={acc} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />)}</div>
            }
          </div>
        </>
      )}
    </div>
  );
}

const DEPOSIT_FILTERS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
];

export default function AdminManualDeposits() {
  const [tab, setTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editAccount, setEditAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    const q = filter === 'all' ? {} : { status: filter };
    const data = await base44.entities.ManualDepositRequest.filter(q, '-created_date', 100);
    setRequests(data || []);
  };
  const loadAccounts = async () => {
    const data = await base44.entities.ManualDepositAccount.list('sort_order', 300);
    setAccounts(data || []);
  };

  useEffect(() => {
    setLoading(true);
    if (tab === 'requests') loadRequests().finally(() => setLoading(false));
    else loadAccounts().finally(() => setLoading(false));
  }, [tab, filter]);

  const toggleActive = async (acc) => { await base44.entities.ManualDepositAccount.update(acc.id, { is_active: !acc.is_active }); loadAccounts(); };
  const deleteAccount = async (id) => { if (!confirm('Delete this account?')) return; await base44.entities.ManualDepositAccount.delete(id); loadAccounts(); };

  const grouped = accounts.reduce((acc, item) => {
    const key = item.country || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <AdminShell>
      <div className="p-6 space-y-5">
        <div className="flex gap-3">
          {[
            { id: 'requests', label: `Deposit Requests (${requests.length})` },
            { id: 'countries', label: `Countries (${accounts.length} accounts)` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === t.id ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'requests' && (
          <AdminCard>
            <AdminCardHeader title="Manual Deposit Requests" subtitle="Review and approve customer deposits"
              action={<FilterTabs options={DEPOSIT_FILTERS} value={filter} onChange={setFilter} />} />
            {loading ? <PageLoader /> : (
              <div className="divide-y divide-slate-50">
                {requests.map(d => (
                  <button key={d.id} onClick={() => setSelectedRequest(d)}
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors text-left">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <ArrowDownCircle size={17} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800">{d.user_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{d.method} - {d.currency} - {new Date(d.created_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-sm text-slate-900">BDT {(d.bdt_amount || 0).toLocaleString()}</p>
                      <div className="mt-1"><StatusBadge status={d.status} /></div>
                    </div>
                  </button>
                ))}
                {requests.length === 0 && <EmptyState icon={ArrowDownCircle} message="No deposit requests" />}
              </div>
            )}
          </AdminCard>
        )}

        {tab === 'countries' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-black text-slate-900">Countries + Deposit Accounts</h2>
                <p className="text-xs text-slate-500 mt-0.5">Each country supports unlimited mobile banking AND bank accounts simultaneously</p>
              </div>
              <button onClick={() => setEditAccount({ item: null, fixedMethod: 'mobile_banking', defaultCountry: null })}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 shadow-md">
                <Plus size={15} /> Add New Account
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-sm font-bold text-emerald-700">Multi-Account System</p>
                <p className="text-xs text-emerald-600 mt-0.5">Each country can have multiple mobile banking (bKash, Nagad etc.) AND multiple bank accounts at the same time. Adding new accounts never removes existing ones.</p>
              </div>
            </div>

            {loading ? <PageLoader /> : accounts.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <Globe size={40} className="text-slate-200 mx-auto mb-3" />
                <p className="font-bold text-slate-400">No countries configured</p>
              </div>
            ) : (
              Object.entries(grouped).map(([country, items]) => (
                <CountrySection
                  key={country}
                  country={country}
                  items={items}
                  onEdit={(acc) => setEditAccount({ item: acc, fixedMethod: acc.method, defaultCountry: null })}
                  onToggle={toggleActive}
                  onDelete={deleteAccount}
                  onAdd={(method, firstItem) => setEditAccount({ item: null, fixedMethod: method, defaultCountry: firstItem })}
                />
              ))
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedRequest && <DepositModal item={selectedRequest} onClose={() => setSelectedRequest(null)} onSave={loadRequests} />}
        {editAccount !== null && (
          <AccountModal
            item={editAccount.item}
            fixedMethod={editAccount.fixedMethod}
            defaultCountry={editAccount.defaultCountry}
            onClose={() => setEditAccount(null)}
            onSave={loadAccounts}
          />
        )}
      </AnimatePresence>
    </AdminShell>
  );
}