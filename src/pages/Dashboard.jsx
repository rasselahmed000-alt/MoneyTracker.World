import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Users, ArrowDownCircle, ArrowUpCircle, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, Bell, Activity } from 'lucide-react';
import AdminShell from '../components/AdminShell';

export default function Dashboard() {
  const [stats, setStats] = useState({ users: 0, transactions: 0, pendingDeposits: 0, totalVolume: 0 });
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [users, txs, deposits] = await Promise.all([
          base44.entities.User.list('-created_date', 100),
          base44.entities.Transaction.list('-created_date', 20),
          base44.entities.ManualDepositRequest.filter({ status: 'pending' }),
        ]);
        const totalVolume = txs.reduce((s, t) => s + (t.amount || 0), 0);
        setStats({ users: users.length, transactions: txs.length, pendingDeposits: deposits.length, totalVolume });
        setRecentTx(txs.slice(0, 8));
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Transactions', value: stats.transactions, icon: Activity, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Pending Deposits', value: stats.pendingDeposits, icon: Clock, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', text: 'text-amber-600' },
    { label: 'Total Volume', value: `৳${stats.totalVolume.toLocaleString()}`, icon: TrendingUp, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', text: 'text-purple-600' },
  ];

  const statusColor = { success: 'text-emerald-600 bg-emerald-50', pending: 'text-amber-600 bg-amber-50', failed: 'text-red-600 bg-red-50' };

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time overview of Cellfin</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(card => (
              <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                  <card.icon size={20} className={card.text} />
                </div>
                <p className="text-2xl font-black text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 font-medium mt-1">{card.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Recent Transactions</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentTx.map(tx => (
              <div key={tx.id} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-gray-800">{tx.user_email}</p>
                  <p className="text-xs text-gray-400">{tx.type} · {tx.provider || '-'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-gray-900">৳{(tx.amount || 0).toLocaleString()}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor[tx.status] || 'bg-gray-100 text-gray-500'}`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
            {recentTx.length === 0 && !loading && (
              <p className="text-center text-gray-400 text-sm py-8">No transactions yet</p>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}