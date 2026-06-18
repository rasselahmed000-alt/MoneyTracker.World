import { useState, useEffect, Component } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import AdminShell from '../../components/AdminShell';
import { Search, X, Users, Eye, Ban, CheckCircle, RotateCcw, AlertCircle, History, RefreshCw, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG = {
  active:    { bg: '#d1fae5', color: '#059669', label: 'Active' },
  blocked:   { bg: '#fee2e2', color: '#dc2626', label: 'Blocked' },
  suspended: { bg: '#fef3c7', color: '#d97706', label: 'Suspended' },
};

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('AdminUsers crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertCircle size={40} className="text-red-400" />
          <p className="font-bold text-slate-700">Something went wrong loading this page.</p>
          <p className="text-xs text-slate-400 max-w-sm text-center">{this.state.error?.message || 'Unknown error'}</p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            <RefreshCw size={14} /> Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Safe helpers ─────────────────────────────────────────────────────────────
const safeStr = (val, fallback = '—') => (val && typeof val === 'string' ? val : fallback);
const safeNum = (val, fallback = 0) => (typeof val === 'number' && !isNaN(val) ? val : (parseFloat(val) || fallback));
const safeInitial = (user) => {
  const src = user?.full_name || user?.email || '?';
  return (src[0] || '?').toUpperCase();
};
const safeDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString(); } catch { return '—'; }
};
const safeStatus = (u) => {
  const s = u?.account_status;
  return (s && STATUS_CONFIG[s]) ? s : 'active';
};

// ─── UserDetailModal ──────────────────────────────────────────────────────────
function UserDetailModal({ user, onClose, onSave }) {
  const [tab, setTab] = useState('info');
  const [form, setForm] = useState({
    balance: safeNum(user?.balance),
    kyc_status: user?.kyc_status || 'pending',
    account_status: safeStatus(user),
    min_balance: safeNum(user?.min_balance),
    currency: user?.currency || 'BDT',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [pinResetting, setPinResetting] = useState(false);
  const [pinDone, setPinDone] = useState(false);
  const [txs, setTxs] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [balanceAdj, setBalanceAdj] = useState('');
  const [adjType, setAdjType] = useState('add');
  const [adjSaving, setAdjSaving] = useState(false);
  const [adjDone, setAdjDone] = useState('');

  useEffect(() => {
    if (tab === 'history' && user?.email) {
      setTxLoading(true);
      base44.entities.Transaction
        .filter({ user_email: user.email }, '-created_date', 20)
        .then(data => setTxs(Array.isArray(data) ? data : []))
        .catch(() => setTxs([]))
        .finally(() => setTxLoading(false));
    }
  }, [tab, user?.email]);

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      // Use adminUpdateUser backend function (bypasses RLS safely)
      await base44.functions.invoke('adminUpdateUser', {
        target_user_id: user.id,
        data: {
          kyc_status: form.kyc_status,
          currency: form.currency,
          account_status: form.account_status,
          is_blocked: form.account_status === 'blocked', // keep is_blocked in sync
          min_balance: form.min_balance,
          balance: form.balance, // direct balance override from Balance tab
        },
      });
      onSave();
      onClose();
    } catch (e) {
      console.error('Save user failed:', e);
      setSaveError('Save failed: ' + (e?.message || 'Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleBalanceAdj = async () => {
    const adj = parseFloat(balanceAdj);
    if (!adj || isNaN(adj) || adjSaving) return;
    setAdjSaving(true);
    setAdjDone('');
    try {
      // Use adminUserOps backend function (bypasses RLS safely)
      const res = await base44.functions.invoke('adminUserOps', {
        action: adjType === 'add' ? 'add_balance' : 'deduct_balance',
        target_user_id: user.id,
        data: {
          amount: adj,
          reason: `Admin manual ${adjType === 'add' ? 'credit' : 'debit'}`,
        },
      });
      if (res.data?.success) {
        setBalanceAdj('');
        setAdjDone(adjType === 'add'
          ? `✅ ৳${adj.toLocaleString()} সফলভাবে যুক্ত হয়েছে! নতুন ব্যালেন্স: ৳${(res.data.balance_after || 0).toLocaleString()}`
          : `✅ ৳${adj.toLocaleString()} কাটা হয়েছে! নতুন ব্যালেন্স: ৳${(res.data.balance_after || 0).toLocaleString()}`);
        onSave();
      } else {
        setAdjDone('❌ ' + (res.data?.error || 'Operation failed'));
      }
    } catch (e) {
      setAdjDone('❌ ' + (e?.message || 'Please try again'));
    } finally {
      setAdjSaving(false);
    }
  };

  const handleResetPin = async () => {
    setPinResetting(true);
    try {
      // Use adminUserOps backend function (bypasses RLS safely)
      await base44.functions.invoke('adminUserOps', {
        action: 'reset_pin',
        target_user_id: user.id,
        data: {},
      });
      setPinDone(true);
    } catch (e) {
      console.error('PIN reset failed:', e);
    } finally {
      setPinResetting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm(`এই ব্যবহারকারী (${user.email}) চিরতরে মুছে দিতে চান? এই অ্যাকশন পরিবর্তনযোগ্য নয়। এই ইমেইলটি আর ব্যবহার করতে পারা যাবে না।`)) return;
    try {
      await base44.asServiceRole.entities.User.delete(user.id);
      onSave();
      onClose();
    } catch (e) {
      console.error('User deletion failed:', e);
    }
  };

  const TABS = [
    { id: 'info', label: 'Account Info' },
    { id: 'balance', label: 'Balance' },
    { id: 'history', label: 'Tx History' },
    { id: 'security', label: 'Security' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              {safeInitial(user)}
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm">{safeStr(user?.full_name, 'Unknown User')}</p>
              <p className="text-xs text-slate-400">{safeStr(user?.email, 'No Email')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Status strip */}
        <div className="flex items-center gap-2 px-6 py-2 bg-slate-50 shrink-0 flex-wrap">
          {['active', 'blocked', 'suspended'].map(s => {
            const sc = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setForm(f => ({ ...f, account_status: s }))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2"
                style={form.account_status === s
                  ? { background: sc.bg, color: sc.color, borderColor: sc.color }
                  : { background: '#fff', color: '#94a3b8', borderColor: '#e2e8f0' }}
              >
                {s === 'active' && <CheckCircle size={11} />}
                {s === 'blocked' && <Ban size={11} />}
                {s === 'suspended' && <AlertCircle size={11} />}
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            );
          })}
          <span className="ml-auto text-xs text-slate-400 font-bold">
            ৳{safeNum(form.balance).toLocaleString()}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 shrink-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-xs font-bold transition-all ${tab === t.id ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-400'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto flex-1 p-6">

          {/* INFO TAB */}
          {tab === 'info' && (
            <div className="space-y-4">
              {[

                { key: 'kyc_status', label: 'KYC Status', type: 'select', options: ['pending', 'submitted', 'approved', 'rejected'] },
                { key: 'currency', label: 'Currency', type: 'text' },
              ].map(({ key, label, type, options }) => (
                <div key={key}>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">{label}</label>
                  {type === 'select' ? (
                    <select
                      value={form[key] || ''}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-4 py-2.5 font-semibold text-sm outline-none bg-slate-50 focus:bg-white"
                    >
                      {options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={form[key] || ''}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-4 py-2.5 font-semibold text-sm outline-none bg-slate-50 focus:bg-white"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* BALANCE TAB */}
          {tab === 'balance' && (
            <div className="space-y-5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                <p className="text-xs font-bold text-emerald-600 uppercase">Current Balance</p>
                <p className="text-3xl font-black text-emerald-700 mt-1">৳{safeNum(form.balance).toLocaleString()}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Adjust Balance</label>
                <div className="flex gap-2 mb-2">
                  {['add', 'remove'].map(t => (
                    <button
                      key={t}
                      onClick={() => setAdjType(t)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${adjType === t
                        ? t === 'add' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-red-500 text-white border-red-500'
                        : 'border-slate-200 text-slate-400'}`}
                    >
                      {t === 'add' ? '+ Add' : '− Remove'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={balanceAdj}
                    onChange={e => { setBalanceAdj(e.target.value); setAdjDone(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleBalanceAdj()}
                    placeholder="Amount"
                    className="flex-1 border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-4 py-2.5 font-semibold text-sm outline-none bg-slate-50 focus:bg-white"
                  />
                  <button
                    onClick={handleBalanceAdj}
                    disabled={adjSaving || !balanceAdj}
                    className="px-4 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50 min-w-[80px]"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                  >
                    {adjSaving ? '...' : 'Apply'}
                  </button>
                </div>

                {adjDone && (
                  <div className={`rounded-xl px-4 py-3 text-xs font-bold ${adjDone.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {adjDone}
                  </div>
                )}
                </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Minimum Balance Lock
                </label>
                <input
                  type="number"
                  value={form.min_balance}
                  onChange={e => setForm({ ...form, min_balance: Number(e.target.value) || 0 })}
                  placeholder="0 = no restriction"
                  className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-4 py-2.5 font-semibold text-sm outline-none bg-slate-50 focus:bg-white"
                />
                <p className="text-xs text-slate-400 mt-1.5">ব্যালেন্স এর নিচে গেলে লেনদেন ব্লক হবে।</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Set Balance Directly
                  <span className="ml-1 text-slate-400 normal-case font-normal">— Save Changes বাটন দিয়ে সেভ করুন</span>
                </label>
                <input
                  type="number"
                  value={form.balance}
                  onChange={e => setForm({ ...form, balance: Number(e.target.value) || 0 })}
                  className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-4 py-2.5 font-semibold text-sm outline-none bg-slate-50 focus:bg-white"
                />
                <p className="text-[10px] text-amber-600 font-bold mt-1">⚠️ এই ফিল্ড পরিবর্তন করলে নিচের "Save Changes" বাটন চাপুন</p>
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {tab === 'history' && (
            <div>
              {txLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
                </div>
              ) : txs.length === 0 ? (
                <div className="text-center py-10">
                  <History size={32} className="mx-auto mb-2 text-slate-200" />
                  <p className="text-slate-400 text-sm">No transactions found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {txs.map(tx => (
                    <div key={tx.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                        tx.status === 'success' ? 'bg-emerald-500' : tx.status === 'pending' ? 'bg-amber-500' : 'bg-red-400'
                      }`}>
                        {(tx.type || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{tx.description || tx.type || '—'}</p>
                        <p className="text-[10px] text-slate-400">{safeDate(tx.created_date)}</p>
                      </div>
                      <p className={`text-xs font-black shrink-0 ${
                        tx.type === 'deposit' || tx.type === 'receive' ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {tx.type === 'deposit' || tx.type === 'receive' ? '+' : '-'}৳{safeNum(tx.amount).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECURITY TAB */}
          {tab === 'security' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="font-bold text-amber-700 text-sm mb-1">🔐 Reset User PIN</p>
                <p className="text-amber-600 text-xs mb-3">ইউজারের PIN রিসেট করলে তাকে নতুন PIN সেট করতে হবে।</p>
                <button
                  onClick={handleResetPin}
                  disabled={pinResetting || pinDone}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                  style={{ background: pinDone ? '#22c55e' : 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                >
                  <RotateCcw size={14} />
                  {pinDone ? 'PIN Reset Done!' : pinResetting ? 'Resetting...' : 'Reset PIN'}
                </button>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="font-bold text-red-700 text-sm mb-1">🗑️ Delete User Account</p>
                <p className="text-red-600 text-xs mb-3">চিরতরে এই অ্যাকাউন্ট মুছুন। এই ইমেইল পুনরায় ব্যবহার করা যাবে না।</p>
                <button
                  onClick={handleDeleteUser}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60 bg-red-600 hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={14} />
                  Delete Account Permanently
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 space-y-2">
                <p><span className="font-bold text-slate-700">Email:</span> {safeStr(user?.email, 'No Email')}</p>
                <p><span className="font-bold text-slate-700">Joined:</span> {safeDate(user?.created_date)}</p>
                <p><span className="font-bold text-slate-700">Last Updated:</span> {safeDate(user?.updated_date || user?.created_date)}</p>
                <p><span className="font-bold text-slate-700">Mobile:</span> {safeStr(user?.mobile)}</p>
                <p><span className="font-bold text-slate-700">Country:</span> {safeStr(user?.country)}</p>
                <p><span className="font-bold text-slate-700">PIN set:</span> {user?.pin ? 'Yes' : 'No'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {saveError && (
          <p className="text-center text-xs text-red-500 font-bold px-6 pb-2">{saveError}</p>
        )}
        <div className="flex gap-3 px-6 pb-6 pt-3 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-600 text-sm">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function AdminUsersInner() {
  const { user, status } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const load = async () => {
    setLoading(true);
    setFetchError('');
    try {
      // Admin can see all users via RLS rules
      const data = await base44.entities.User.list('-created_date', 500);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load users:', err);
      setFetchError('Failed to load users. Please try again.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToAdmin = async (u) => {
    const confirmed = window.confirm(`আপনি ${u.email} কে Admin বানাতে চান?`);
    if (!confirmed) return;
    try {
      const res = await base44.functions.invoke('adminUpdateUser', {
        target_user_id: u.id,
        data: { role: 'admin' }
      });
      if (res.data?.success) {
        alert('সফল! এখন ইউজার Admin হিসেবে access পাবে।');
        load();
      } else {
        alert('Admin করতে ব্যর্থ হয়েছে: ' + (res.data?.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Promote failed:', err);
      alert('Admin করতে ব্যর্থ হয়েছে: ' + err.message);
    }
  };

  useEffect(() => {
    load();
    // Real-time subscription: refresh user list on any user update
    const unsub = base44.entities.User.subscribe((event) => {
      if (event.type === 'create' || event.type === 'update' || event.type === 'delete') {
        load();
      }
    });
    return unsub;
  }, []);

  // Admin role check — after all hooks
  if (status === 'loading') return <div className="p-6">Loading...</div>;
  if (!user || user.role !== 'admin') return <div className="p-6 text-red-600">❌ Admin Access Required</div>;

  const filtered = users.filter(u => {
    const email = (u?.email || '').toLowerCase();
    const name = (u?.full_name || '').toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = email.includes(q) || name.includes(q);
    const matchStatus = statusFilter === 'all' || safeStatus(u) === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: users.length,
    active: users.filter(u => safeStatus(u) === 'active').length,
    blocked: users.filter(u => safeStatus(u) === 'blocked').length,
    suspended: users.filter(u => safeStatus(u) === 'suspended').length,
  };

  return (
    <AdminShell>
      <div className="p-4 sm:p-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: counts.all, color: '#6366f1' },
            { label: 'Active', value: counts.active, color: '#10b981' },
            { label: 'Blocked', value: counts.blocked, color: '#ef4444' },
            { label: 'Suspended', value: counts.suspended, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-slate-400 font-bold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Toolbar */}
          <div className="px-4 sm:px-6 py-4 flex flex-wrap items-center gap-3 border-b border-slate-50">
            <div className="relative flex-1 min-w-[160px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search users..."
                className="pl-9 pr-4 py-2 border-2 border-slate-100 rounded-xl text-sm outline-none focus:border-emerald-400 w-full bg-slate-50 focus:bg-white"
              />
            </div>
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl flex-wrap">
              {['all', 'active', 'blocked', 'suspended'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all"
                  style={statusFilter === s
                    ? { background: '#fff', color: '#0f172a', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }
                    : { color: '#64748b' }}
                >
                  {s} {s !== 'all' ? `(${counts[s]})` : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Error state */}
          {fetchError && (
            <div className="flex items-center justify-between px-6 py-4 bg-red-50 border-b border-red-100">
              <p className="text-sm text-red-600 font-bold">{fetchError}</p>
              <button onClick={load} className="flex items-center gap-2 text-xs text-red-600 font-bold hover:text-red-700">
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded-full w-48 animate-pulse" />
                    <div className="h-2 bg-slate-50 rounded-full w-32 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map(u => {
                const status = safeStatus(u);
                const sc = STATUS_CONFIG[status];
                return (
                  <div key={u.id} className="px-4 sm:px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                    >
                      {safeInitial(u)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800 truncate">{safeStr(u?.full_name, 'Unknown User')}</p>
                      <p className="text-xs text-slate-400 truncate">{safeStr(u?.email, 'No Email')}</p>
                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>
                          {sc.label}
                        </span>

                        {u?.kyc_status === 'approved' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">✓ KYC</span>
                        )}
                        {(u?.agent_code || u?.kyc_agent_code) && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-mono">
                            {u.agent_code || u.kyc_agent_code}
                          </span>
                        )}
                        {safeNum(u?.min_balance) > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">
                            Min ৳{safeNum(u.min_balance).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="font-black text-sm text-slate-900">৳{safeNum(u?.balance).toLocaleString()}</p>
                      <button
                        onClick={() => setEditing(u || null)}
                        className="flex items-center gap-1 text-xs text-emerald-600 font-bold hover:text-emerald-700"
                      >
                        <Eye size={11} /> Manage
                      </button>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handlePromoteToAdmin(u)}
                          className="block text-xs text-amber-600 font-bold hover:text-amber-700 text-right w-full"
                        >
                          👑 Promote
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && !loading && (
                <div className="py-16 text-center">
                  <Users size={36} className="mx-auto mb-3 text-slate-200" />
                  <p className="text-slate-400 text-sm">No users found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <UserDetailModal
            user={editing}
            onClose={() => setEditing(null)}
            onSave={load}
          />
        )}
      </AnimatePresence>
    </AdminShell>
  );
}

export default function AdminUsers() {
  return (
    <ErrorBoundary>
      <AdminUsersInner />
    </ErrorBoundary>
  );
}