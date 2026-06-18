import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle, XCircle } from 'lucide-react';
import AdminShell from '../components/AdminShell';

export default function WalletRequests() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = filter === 'all'
      ? await base44.entities.WalletRequest.list('-created_date', 200)
      : await base44.entities.WalletRequest.filter({ status: filter }, '-created_date', 200);
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const handle = async (req, status) => {
    await base44.entities.WalletRequest.update(req.id, { status });
    if (status === 'approved') {
      const users = await base44.entities.User.filter({ email: req.user_email });
      if (users[0]) {
        const currentBalance = users[0].balance || 0;
        const newBalance = req.type === 'deposit'
          ? currentBalance + req.amount
          : Math.max(0, currentBalance - req.amount);
        await base44.entities.User.update(users[0].id, { balance: newBalance });
      }
    }
    load();
  };

  const statusColor = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700' };

  return (
    <AdminShell>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Wallet Requests</h1>
          <p className="text-gray-500 text-sm">{requests.length} records</p>
        </div>

        <div className="flex gap-2">
          {['pending', 'approved', 'rejected', 'all'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${filter === s ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-gray-200 text-gray-600'}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="space-y-px">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-50 animate-pulse" />)}</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {requests.map(r => (
                <div key={r.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-gray-900">{r.user_name}</p>
                    <p className="text-xs text-gray-400">{r.type} · {r.currency} · {new Date(r.created_date).toLocaleDateString()}</p>
                    {r.note && <p className="text-xs text-gray-500 italic mt-0.5">"{r.note}"</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${r.type === 'deposit' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {r.type === 'deposit' ? '+' : '-'}৳{(r.amount || 0).toLocaleString()}
                    </span>
                    {r.status === 'pending' ? (
                      <div className="flex gap-1.5">
                        <button onClick={() => handle(r, 'rejected')}
                          className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors">
                          <XCircle size={16} className="text-red-500" />
                        </button>
                        <button onClick={() => handle(r, 'approved')}
                          className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center hover:bg-emerald-200 transition-colors">
                          <CheckCircle size={16} className="text-emerald-500" />
                        </button>
                      </div>
                    ) : (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor[r.status]}`}>{r.status}</span>
                    )}
                  </div>
                </div>
              ))}
              {requests.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No requests found</p>}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}