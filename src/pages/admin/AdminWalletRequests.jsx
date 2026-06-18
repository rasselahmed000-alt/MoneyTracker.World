import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminShell from '../../components/AdminShell';
import { AdminCard, AdminCardHeader, StatusBadge, FilterTabs, PageLoader, EmptyState } from '../../components/admin/AdminPageWrapper';
import { Banknote, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const FILTERS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
];

export default function AdminWalletRequests() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const q = filter === 'all' ? {} : { status: filter };
    base44.entities.WalletRequest.filter(q, '-created_date', 100).then(setItems).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filter]);

  const handleAction = async (item, status) => {
    await base44.functions.invoke('approveWalletRequest', { requestId: item.id, status });
    load();
  };

  return (
    <AdminShell>
      <div className="p-6">
        <AdminCard>
          <AdminCardHeader
            title={`Wallet Requests (${items.length})`}
            subtitle="Manage deposit and withdrawal requests"
            action={<FilterTabs options={FILTERS} value={filter} onChange={setFilter} />}
          />
          {loading ? <PageLoader /> : (
            <div className="divide-y divide-slate-50">
              {items.map(r => {
                const isDeposit = r.type === 'deposit';
                const Icon = isDeposit ? ArrowDownCircle : ArrowUpCircle;
                const iconColor = isDeposit ? '#10b981' : '#f59e0b';
                const iconBg = isDeposit ? '#d1fae5' : '#fef3c7';
                return (
                  <div key={r.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>
                      <Icon size={17} style={{ color: iconColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800">{r.user_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {r.user_email} · <span className="capitalize font-semibold">{r.type}</span>
                        {' · '}{new Date(r.created_date).toLocaleDateString()}
                      </p>
                      {r.note && <p className="text-xs text-slate-500 mt-0.5 italic">"{r.note}"</p>}
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                      <p className="font-black text-sm text-slate-900">{r.currency} {(r.amount || 0).toLocaleString()}</p>
                      {r.status === 'pending' ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleAction(r, 'rejected')}
                            className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                            style={{ background: '#ef4444' }}
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleAction(r, 'approved')}
                            className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                            style={{ background: '#10b981' }}
                          >
                            Approve
                          </button>
                        </div>
                      ) : (
                        <StatusBadge status={r.status} />
                      )}
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && <EmptyState icon={Banknote} message="No wallet requests" />}
            </div>
          )}
        </AdminCard>
      </div>
    </AdminShell>
  );
}