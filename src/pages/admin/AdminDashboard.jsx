import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import AdminShell from '../../components/AdminShell';
import { Users, TrendingUp, ArrowDownCircle, Wallet, ArrowUpRight, Clock, CheckCircle, XCircle, MessageCircle } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, status } = useAuth();
  const [stats, setStats] = useState({ users: 0, transactions: 0, pendingDeposits: 0, volume: 0, pendingMessages: 0 });
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadStats = () => {
    setLoading(true);
    Promise.all([
      base44.entities.User.list('-created_date', 500),
      base44.entities.Transaction.list('-created_date', 50),
      base44.entities.ManualDepositRequest.filter({ status: 'pending' }),
      base44.entities.GroupMessage.filter({ status: 'pending', message_type: 'user' }),
    ]).then(([users, txs, pending, messages]) => {
      const volume = txs.reduce((s, t) => s + (t.amount || 0), 0);
      setStats({ users: users.length, transactions: txs.length, pendingDeposits: pending.length, volume, pendingMessages: messages.length });
      setRecentTx(txs.slice(0, 8));
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats();
    // Real-time: refresh recent transactions list on any change
    const unsub = base44.entities.Transaction.subscribe((event) => {
      if (event.type === 'create') setRecentTx(prev => [event.data, ...prev].slice(0, 8));
      else if (event.type === 'update') setRecentTx(prev => prev.map(t => t.id === event.id ? event.data : t));
    });
    return unsub;
  }, []);

  // Admin role check — after all hooks
  if (status === 'loading') return <div className="p-6">Loading...</div>;
  if (!user || user.role !== 'admin') return <div className="p-6 text-red-600">❌ Admin Access Required</div>;

  const cards = [
    {
      label: 'Total Users',
      value: stats.users,
      icon: Users,
      change: 'Registered accounts',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      shadow: 'rgba(102,126,234,0.35)',
    },
    {
      label: 'Transactions',
      value: stats.transactions,
      icon: TrendingUp,
      change: 'Last 50 records',
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      shadow: 'rgba(17,153,142,0.35)',
    },
    {
      label: 'Pending Deposits',
      value: stats.pendingDeposits,
      icon: ArrowDownCircle,
      change: 'Awaiting approval',
      gradient: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
      shadow: 'rgba(247,151,30,0.35)',
    },
    {
      label: 'Total Volume',
      value: `৳${(stats.volume).toLocaleString()}`,
      icon: Wallet,
      change: 'Last 50 transactions',
      gradient: 'linear-gradient(135deg, #f953c6 0%, #b91d73 100%)',
      shadow: 'rgba(249,83,198,0.35)',
    },
    {
      label: 'Pending Messages',
      value: stats.pendingMessages,
      icon: MessageCircle,
      change: 'Awaiting approval',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      shadow: 'rgba(6,182,212,0.35)',
      action: true,
    },
  ];

  const statusConfig = {
    pending: { icon: Clock, color: '#f59e0b', bg: '#fef3c7', label: 'Pending' },
    success: { icon: CheckCircle, color: '#10b981', bg: '#d1fae5', label: 'Success' },
    failed: { icon: XCircle, color: '#ef4444', bg: '#fee2e2', label: 'Failed' },
  };

  const typeLabel = {
    mobile_banking: 'Mobile Banking',
    bank_transfer: 'Bank Transfer',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    send: 'Send',
    receive: 'Receive',
  };

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
          {cards.map((c, i) => (
            <button
              key={c.label}
              onClick={() => c.action && navigate('/admin/group-chat')}
              className="relative overflow-hidden rounded-2xl p-5 text-left transition-all hover:shadow-lg"
              style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                cursor: c.action ? 'pointer' : 'default',
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: c.gradient, boxShadow: `0 6px 16px ${c.shadow}` }}
                >
                  <c.icon size={20} className="text-white" />
                </div>
                <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                  <ArrowUpRight size={13} />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 leading-tight">
                {loading ? (
                  <span className="inline-block w-16 h-7 bg-slate-100 rounded-lg animate-pulse" />
                ) : c.value}
              </p>
              <p className="text-sm font-semibold text-slate-500 mt-1">{c.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{c.change}</p>

              {/* Decorative gradient orb */}
              <div
                className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-10"
                style={{ background: c.gradient }}
              />
              {c.action && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Recent Transactions */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
        >
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
          >
            <div>
              <h2 className="font-black text-slate-900">Recent Transactions</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Latest {recentTx.length} records</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded-full w-48 animate-pulse" />
                    <div className="h-2 bg-slate-50 rounded-full w-32 animate-pulse" />
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full w-20 animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentTx.map(tx => {
                const cfg = statusConfig[tx.status] || statusConfig.pending;
                const StatusIcon = cfg.icon;
                return (
                  <div key={tx.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: cfg.bg }}
                    >
                      <StatusIcon size={18} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800 truncate">{tx.user_email}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {typeLabel[tx.type] || tx.type}
                        {(tx.provider || tx.bank_name) && ` · ${tx.provider || tx.bank_name}`}
                        {' · '}{new Date(tx.created_date).toLocaleDateString('en-BD')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-sm text-slate-900">৳{(tx.amount || 0).toLocaleString()}</p>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
              {recentTx.length === 0 && (
                <div className="py-16 text-center">
                  <TrendingUp size={32} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-slate-400 text-sm">No transactions yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}