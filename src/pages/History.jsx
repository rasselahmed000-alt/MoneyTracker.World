import { useState, useEffect, useCallback, memo } from 'react';
import { ArrowUpRight, ArrowDownLeft, Search, Plane, Download, Filter, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import AppShell from '../components/cellfin/AppShell';
import UniversalHeader from '@/components/cellfin/UniversalHeader';
import AirTicketReceipt from '../components/cellfin/AirTicketReceipt';
import PullToRefresh from '../components/cellfin/PullToRefresh';
import PDFReceiptModal from '../components/cellfin/PDFReceiptModal';

// ── Status config ──
const STATUS_CONFIG = {
  success:  { label: 'Approved', bg: '#dcfce7', color: '#16a34a', dot: '#16a34a' },
  approved: { label: 'Approved', bg: '#dcfce7', color: '#16a34a', dot: '#16a34a' },
  pending:  { label: 'Pending',  bg: '#fff7ed', color: '#ea580c', dot: '#f97316' },
  failed:   { label: 'Failed',   bg: '#fee2e2', color: '#dc2626', dot: '#ef4444' },
};

const TYPE_ICONS = {
  deposit: '💰', mobile_banking: '📱', bank_transfer: '🏦', send: '🌐', receive: '📥',
};

// Category filter definitions
// matchFn receives a transaction and returns true if it belongs to this category
const FILTERS = [
  {
    key: 'all',
    label: 'সব',
    color: '#0b3d2e',
    matchFn: () => true,
  },
  {
    key: 'deposit',
    label: '💰 Deposit',
    color: '#059669',
    matchFn: (tx) => tx.type === 'deposit' || tx.type === 'receive',
  },
  {
    key: 'mobile_banking',
    label: '📱 Mobile Banking',
    color: '#db2777',
    matchFn: (tx) => tx.type === 'mobile_banking',
  },
  {
    key: 'bank_transfer',
    label: '🏦 Bank Transfer',
    color: '#2563eb',
    matchFn: (tx) => tx.type === 'bank_transfer',
  },
  {
    key: 'intl_transfer',
    label: '🌐 International',
    color: '#0d9488',
    matchFn: (tx) => tx.type === 'send' || (tx.country && tx.type !== 'bank_transfer'),
  },
  {
    key: 'others',
    label: '🗂 Others',
    color: '#7c3aed',
    matchFn: (tx) => {
      const handled = ['deposit','receive','mobile_banking','bank_transfer','send'].includes(tx.type);
      const isIntl = tx.country && tx.type !== 'bank_transfer';
      return !handled && !isIntl;
    },
  },
];

const STATUS_FILTERS = ['all', 'success', 'approved', 'pending', 'failed'];

export default function History() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch]             = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState(null);
  const [showFilters, setShowFilters]   = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const txs = await base44.entities.Transaction.filter({ user_email: user.email }, '-created_date', 100);
      setTransactions(txs || []);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time sync — filtered to current user only, with reconnect on visibility
  useEffect(() => {
    if (!user?.email) return;
    let unsubFn = null;

    const subscribe = () => {
      if (unsubFn) unsubFn();
      unsubFn = base44.entities.Transaction.subscribe((event) => {
        if (event.data?.user_email && event.data.user_email !== user.email) return;
        if (event.type === 'create') setTransactions(prev => [event.data, ...prev]);
        else if (event.type === 'update') setTransactions(prev => prev.map(t => t.id === event.id ? event.data : t));
        else if (event.type === 'delete') setTransactions(prev => prev.filter(t => t.id !== event.id));
      });
    };

    subscribe();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        subscribe();
        loadData(); // also re-fetch in case missed events during background
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (unsubFn) unsubFn();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user?.email, loadData]);

  const activeFilter = FILTERS.find(f => f.key === filter) || FILTERS[0];

  const filtered = transactions.filter(tx => {
    const matchType   = activeFilter.matchFn(tx);
    const matchStatus = statusFilter === 'all' || tx.status === statusFilter || tx.status === statusFilter;
    const matchSearch = !search || tx.description?.toLowerCase().includes(search.toLowerCase()) ||
                        tx.tx_id?.toLowerCase().includes(search.toLowerCase()) ||
                        tx.provider?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchStatus && matchSearch;
  });

  // Calculate Total Deposit (only successful deposits) and Total Transfer (all transfer types)
  const totalDeposit = transactions.filter(t => t.type === 'deposit' && ['success','approved'].includes(t.status)).reduce((s, t) => s + (t.amount || 0), 0);
  const totalTransfer = transactions.filter(t => ['mobile_banking','bank_transfer','send'].includes(t.type) && ['success','approved'].includes(t.status)).reduce((s, t) => s + (t.amount || 0), 0);

  const isApproved = (tx) => tx.status === 'success' || tx.status === 'approved';

  return (
    <>
    <AnimatePresence>
      {selectedTicket && <AirTicketReceipt ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}
      {selectedReceiptTx && <PDFReceiptModal tx={selectedReceiptTx} user={user} onClose={() => setSelectedReceiptTx(null)} />}
    </AnimatePresence>
    <AppShell header={
      <UniversalHeader
        title="Transaction History"
        rightAction={
          <button onClick={loadData} className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <RefreshCw size={16} className={`text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />
    }>
      <div className="px-5 pt-2 space-y-2.5 pb-6">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by description, TX ID..." 
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm outline-none focus:border-green-700 transition-colors" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-colors ${showFilters ? 'bg-green-900 border-green-900' : 'bg-white border-gray-200'}`}>
              <Filter size={15} className={showFilters ? 'text-white' : 'text-gray-500'} />
            </button>
          </div>

          {/* Filter panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden">
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Status</p>
                    <div className="flex gap-2 flex-wrap">
                      {STATUS_FILTERS.map(s => {
                        const cfg = s === 'all' ? { label: 'All', dot: '#6b7280' } : STATUS_CONFIG[s] || STATUS_CONFIG.pending;
                        return (
                          <button key={s} onClick={() => setStatusFilter(s)}
                            className="px-3 py-1 rounded-xl text-xs font-bold border transition-all"
                            style={statusFilter === s
                              ? { background: cfg.dot, color: '#fff', borderColor: cfg.dot }
                              : { background: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }}>
                            {s === 'success' || s === 'approved' ? '✅ Approved' : s === 'pending' ? '🟠 Pending' : s === 'failed' ? '🔴 Failed' : 'All'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Category</p>
                    <div className="flex gap-2 flex-wrap">
                      {FILTERS.map(f => (
                        <button key={f.key} onClick={() => setFilter(f.key)}
                          className="px-3 py-1 rounded-xl text-xs font-bold border transition-all"
                          style={filter === f.key
                            ? { background: f.color, color: '#fff', borderColor: f.color }
                            : { background: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Type filter pills (always visible) */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={filter === f.key
                  ? { background: f.color, color: '#fff', boxShadow: `0 4px 12px ${f.color}55` }
                  : { background: '#fff', border: '1.5px solid #e5e7eb', color: '#6b7280' }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Count */}
          <p className="text-[11px] text-gray-400 font-medium">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</p>

          {/* List */}
          {loading ? (
            Array(5).fill(0).map((_, i) => <div key={i} className="bg-white rounded-2xl h-16 animate-pulse border border-gray-100" />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <p className="text-5xl mb-3">📭</p>
              <p className="font-bold text-gray-500">No transactions found</p>
              <p className="text-xs mt-1">Try changing your filters</p>
            </div>
          ) : (
            filtered.map((tx, i) => {
               const isAirTicket = tx.description?.startsWith('Air Ticket:') && tx.ticket_data;
               const ticketData = isAirTicket ? (() => { try { return JSON.parse(tx.ticket_data); } catch { return null; } })() : null;
               const isIn = ['deposit', 'receive'].includes(tx.type);
               const approved = isApproved(tx);
               const stCfg = STATUS_CONFIG[tx.status] || STATUS_CONFIG.pending;

               return (
                 <motion.div key={tx.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                   className="bg-white rounded-xl shadow-xs border border-gray-100 relative overflow-hidden hover:shadow-sm transition-shadow">
                   <div className="p-3 flex items-center gap-2.5">
                     {/* Icon */}
                     <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                       style={{ background: isIn ? 'linear-gradient(135deg,#d1fae5,#a7f3d0)' : tx.type === 'mobile_banking' ? 'linear-gradient(135deg,#fce7f3,#fbcfe8)' : tx.type === 'bank_transfer' ? 'linear-gradient(135deg,#dbeafe,#bfdbfe)' : tx.type === 'send' || tx.country ? 'linear-gradient(135deg,#ccfbf1,#99f6e4)' : 'linear-gradient(135deg,#f3f4f6,#e5e7eb)' }}>
                        {isAirTicket ? '✈️' : tx.description?.toLowerCase().includes('visa') ? '🛂' : (TYPE_ICONS[tx.type] || '💳')}
                     </div>

                     {/* Info */}
                     <div className="flex-1 min-w-0">
                       <p className="font-semibold text-xs text-gray-800 truncate">{tx.description || tx.type?.replace(/_/g,' ')}</p>
                       <p className="text-[9px] text-gray-400 truncate">
                         {tx.tx_id?.slice(0, 12)}{tx.last_digits ? `-${tx.last_digits}` : ''}
                         {tx.approval_last_4_digit ? ` [Ref: ${tx.approval_last_4_digit}]` : ''}... · {new Date(tx.created_date).toLocaleDateString('en-BD', { day:'2-digit', month:'short' })}
                       </p>
                     </div>

                     {/* Amount */}
                     <div className="text-right shrink-0">
                       <p className={`font-bold text-xs ${isIn ? 'text-emerald-600' : 'text-red-500'}`}>
                         {isIn ? '+' : '-'}৳{(tx.amount || 0).toLocaleString()}
                       </p>
                       <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full inline-block" style={{ background: stCfg.bg, color: stCfg.color }}>
                         {stCfg.label}
                       </span>
                     </div>

                     {/* Corner Actions */}
                     {(approved || (isAirTicket && ticketData)) && (
                       <div className="absolute top-1.5 right-1.5 flex gap-1.5">
                         {approved && (
                           <button onClick={() => setSelectedReceiptTx(tx)}
                             className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-sm"
                             title="Download receipt">
                             <Download size={12} />
                             <span className="text-[10px] font-bold">Receipt</span>
                           </button>
                         )}
                         {isAirTicket && ticketData && (
                           <button onClick={() => setSelectedTicket(ticketData)}
                             className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-sm"
                             title="View ticket">
                             <Plane size={12} />
                             <span className="text-[10px] font-bold">View</span>
                           </button>
                         )}
                       </div>
                     )}
                   </div>
                 </motion.div>
               );
             })
          )}
        </div>
        </AppShell>
    </>
  );
}