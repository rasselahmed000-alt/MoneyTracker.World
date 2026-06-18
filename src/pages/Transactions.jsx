import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Filter } from 'lucide-react';
import AdminShell from '../components/AdminShell';

export default function Transactions() {
  const [txs, setTxs] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Transaction.list('-created_date', 500)
      .then(setTxs).finally(() => setLoading(false));
  }, []);

  const filtered = txs.filter(t => {
    const matchSearch = t.user_email?.toLowerCase().includes(search.toLowerCase()) || t.tx_id?.includes(search);
    const matchFilter = filter === 'all' || t.status === filter;
    return matchSearch && matchFilter;
  });

  const statusColor = { success: 'bg-emerald-100 text-emerald-700', pending: 'bg-amber-100 text-amber-700', failed: 'bg-red-100 text-red-700' };
  const typeIcon = { deposit: '⬇️', withdraw: '⬆️', mobile_banking: '📱', bank_transfer: '🏦', send: '➡️', receive: '⬅️' };

  return (
    <AdminShell>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Transactions</h1>
          <p className="text-gray-500 text-sm">{txs.length} total records</p>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search email or TX ID..."
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-500 font-medium text-sm" />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="border-2 border-gray-200 rounded-xl px-4 py-3 font-semibold text-sm outline-none focus:border-emerald-500">
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="space-y-px">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-50 animate-pulse" />)}</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(tx => (
                <div key={tx.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{typeIcon[tx.type] || '💳'}</span>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{tx.user_email}</p>
                      <p className="text-xs text-gray-400">{tx.type} · {tx.provider || tx.bank_name || '-'} · {new Date(tx.created_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-gray-900">৳{(tx.amount || 0).toLocaleString()}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor[tx.status] || 'bg-gray-100 text-gray-500'}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No transactions found</p>}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}