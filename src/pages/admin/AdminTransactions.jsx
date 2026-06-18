import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import AdminShell from '../../components/AdminShell';
import { AdminCard, AdminCardHeader, StatusBadge, FilterTabs, PageLoader, EmptyState } from '../../components/admin/AdminPageWrapper';
import { Search, TrendingUp, Smartphone, Building2, ArrowDownCircle, X, Check, XCircle, RefreshCw } from 'lucide-react';

const TYPE_ICONS = {
  mobile_banking: Smartphone,
  bank_transfer: Building2,
  deposit: ArrowDownCircle,
  withdraw: ArrowDownCircle,
};

const TYPE_LABELS = {
  mobile_banking: 'Mobile Banking',
  bank_transfer: 'Bank Transfer',
  deposit: 'Deposit',
  withdraw: 'Withdraw',
  send: 'Send',
  receive: 'Receive',
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
];

// Approve/Reject Modal with Last 4 Digit validation
function ApproveModal({ tx, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null); // 'approved' | 'rejected'
  const [last4Digit, setLast4Digit] = useState(tx?.approval_last_4_digit || '');

  if (!tx) return null;

  const handleAction = async (action) => {
    if (action === 'approve' && (!last4Digit || last4Digit.length !== 4 || !/^\d+$/.test(last4Digit))) {
      setError('Please enter a valid 4-digit reference number');
      return;
    }
    
    setSaving(true);
    setError('');
    try {
      const res = await base44.functions.invoke('approveTransaction', {
        txId: tx.id,
        action,
        last4Digit: action === 'approve' ? last4Digit : undefined,
      });
      if (res.data?.success) {
        setDone(action === 'approve' ? 'approved' : 'rejected');
        onSave();
        setTimeout(() => onClose(), 1200);
      } else {
        setError(res.data?.error || 'কিছু একটা সমস্যা হয়েছে।');
      }
    } catch (e) {
      setError(e?.message || 'Network error.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-black text-slate-900">Transaction Review</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Details */}
        <div className="px-5 py-4 space-y-3">
          <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">User</span>
              <span className="font-bold text-slate-700 text-right text-xs max-w-[60%] truncate">{tx.user_email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Type</span>
              <span className="font-bold text-slate-700">{TYPE_LABELS[tx.type] || tx.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Amount</span>
              <span className="font-black text-lg text-slate-900">৳{(tx.amount || 0).toLocaleString()}</span>
            </div>
            {tx.provider && (
              <div className="flex justify-between">
                <span className="text-slate-400">Provider</span>
                <span className="font-bold text-slate-700 uppercase">{tx.provider}</span>
              </div>
            )}
            {tx.recipient_mobile && (
              <div className="flex justify-between">
                <span className="text-slate-400">Recipient</span>
                <span className="font-bold text-slate-700">{tx.recipient_mobile}</span>
              </div>
            )}
            {tx.bank_name && (
              <div className="flex justify-between">
                <span className="text-slate-400">Bank</span>
                <span className="font-bold text-slate-700">{tx.bank_name}</span>
              </div>
            )}
            {tx.account_number && (
              <div className="flex justify-between">
                <span className="text-slate-400">Account</span>
                <span className="font-bold text-slate-700">{tx.account_number}</span>
              </div>
            )}
            {tx.description && (
              <div className="flex justify-between">
                <span className="text-slate-400">Note</span>
                <span className="font-medium text-slate-600 text-right text-xs max-w-[60%]">{tx.description}</span>
              </div>
            )}
            {tx.approval_last_4_digit && (
              <div className="flex justify-between">
                <span className="text-slate-400">Last 4 Digit</span>
                <span className="font-bold text-slate-700 font-mono">{tx.approval_last_4_digit}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Date</span>
              <span className="text-slate-600 text-xs">{new Date(tx.created_date).toLocaleString('en-BD')}</span>
            </div>
          </div>

          {/* Already processed */}
          {tx.status !== 'pending' && (
            <div className="text-center py-3">
              <StatusBadge status={tx.status} />
              <p className="text-xs text-slate-400 mt-2">এই ট্রানজেকশন ইতোমধ্যে প্রসেস করা হয়েছে</p>
            </div>
          )}

          {/* Success state */}
          {done && (
            <div className={`text-center py-3 rounded-xl font-bold text-sm ${done === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {done === 'approved' ? '✅ Approved!' : '❌ Rejected!'}
            </div>
          )}

          {/* Last 4 Digit Input — only for mobile banking approval */}
          {tx.status === 'pending' && !done && tx.type === 'mobile_banking' && (
            <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
              <label className="text-xs font-bold text-blue-900 block mb-2">
                Last 4 Digit Reference (Required for Approval)
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength="4"
                value={last4Digit}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setLast4Digit(v);
                }}
                placeholder="e.g. 4587"
                className="w-full px-3 py-2 rounded-lg border-2 border-blue-300 font-bold text-center text-lg tracking-widest outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-blue-700 mt-1.5">Enter the 4 digits from transaction receipt</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-xs font-bold">⚠️ {error}</p>
            </div>
          )}
          </div>

          {/* Action Buttons */}
        {tx.status === 'pending' && !done && (
          <div className="flex gap-3 px-5 pb-5">
            <button
              onClick={() => handleAction('reject')}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 text-sm active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}
            >
              <XCircle size={15} />
              {saving ? '...' : 'Reject'}
            </button>
            <button
              onClick={() => handleAction('approve')}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 text-sm active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
            >
              <Check size={15} />
              {saving ? 'Processing...' : 'Approve'}
            </button>
          </div>
        )}

        {tx.status !== 'pending' && (
          <div className="px-5 pb-5">
            <button onClick={onClose} className="w-full py-3 rounded-xl border-2 border-slate-200 font-bold text-slate-600 text-sm">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminTransactions() {
  const { user, status: authStatus } = useAuth();
  const [txs, setTxs] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    base44.entities.Transaction.list('-created_date', 200).then(setTxs).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.Transaction.subscribe((event) => {
      if (event.type === 'create') setTxs(prev => [event.data, ...prev]);
      else if (event.type === 'update') setTxs(prev => prev.map(t => t.id === event.id ? event.data : t));
      else if (event.type === 'delete') setTxs(prev => prev.filter(t => t.id !== event.id));
    });
    return unsub;
  }, []);

  // Admin role check — after all hooks
  if (authStatus === 'loading') return <div className="p-6">Loading...</div>;
  if (!user || user.role !== 'admin') return <div className="p-6 text-red-600">❌ Admin Access Required</div>;

  const filtered = txs.filter(t =>
    (status === 'all' || t.status === status) &&
    (t.user_email?.toLowerCase().includes(search.toLowerCase()) ||
     (t.type || '').includes(search.toLowerCase()) ||
     (t.tx_id || '').includes(search))
  );

  const pendingCount = txs.filter(t => t.status === 'pending').length;

  return (
    <AdminShell>
      <div className="p-6">
        <AdminCard>
          <AdminCardHeader
            title={
              <span className="flex items-center gap-2">
                Transactions ({filtered.length})
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-black text-white" style={{ background: '#f59e0b' }}>
                    {pendingCount} pending
                  </span>
                )}
              </span>
            }
            subtitle="Tap any pending transaction to approve or reject"
            action={
              <div className="flex items-center gap-3 flex-wrap">
                <FilterTabs options={STATUS_FILTERS} value={status} onChange={setStatus} />
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="pl-8 pr-3 py-2 border-2 border-slate-100 rounded-xl text-xs outline-none focus:border-emerald-400 w-36 bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
                <button onClick={load} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                  <RefreshCw size={14} className="text-slate-400" />
                </button>
              </div>
            }
          />

          {loading ? <PageLoader /> : (
            <div className="divide-y divide-slate-50">
              {filtered.map(tx => {
                const Icon = TYPE_ICONS[tx.type] || TrendingUp;
                const isPending = tx.status === 'pending';
                return (
                  <button
                    key={tx.id}
                    onClick={() => setSelected(tx)}
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isPending ? 'bg-amber-50' : 'bg-slate-100'}`}>
                      <Icon size={17} className={isPending ? 'text-amber-500' : 'text-slate-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800 truncate">{tx.user_email}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {TYPE_LABELS[tx.type] || tx.type}
                        {(tx.provider || tx.bank_name) && ` · ${tx.provider || tx.bank_name}`}
                        {' · '}{new Date(tx.created_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-sm text-slate-900">৳{(tx.amount || 0).toLocaleString()}</p>
                      <div className="mt-1"><StatusBadge status={tx.status} /></div>
                      {isPending && (
                        <div className="flex items-center gap-1 mt-1 justify-end">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <p className="text-[9px] text-amber-500 font-bold">Review</p>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && <EmptyState icon={TrendingUp} message="No transactions found" />}
            </div>
          )}
        </AdminCard>
      </div>

      {selected && (
        <ApproveModal
          tx={selected}
          onClose={() => setSelected(null)}
          onSave={load}
        />
      )}
    </AdminShell>
  );
}