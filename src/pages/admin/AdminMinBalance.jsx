import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminShell from '../../components/AdminShell';
import { Search, Save, AlertTriangle, Users, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminMinBalance() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState({});
  const [localVals, setLocalVals] = useState({});

  const load = async () => {
    const data = await base44.entities.User.list('-created_date', 500);
    setUsers(data);
    const init = {};
    data.forEach(u => { init[u.id] = u.min_balance || 0; });
    setLocalVals(init);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSaveUser = async (user) => {
    setSaving(s => ({ ...s, [user.id]: true }));
    await base44.entities.User.update(user.id, { min_balance: Number(localVals[user.id] || 0) });
    setSaving(s => ({ ...s, [user.id]: false }));
    // update local state
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, min_balance: Number(localVals[user.id] || 0) } : u));
  };

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const withMinBal = users.filter(u => (u.min_balance || 0) > 0).length;

  return (
    <AdminShell>
      <div className="p-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-2xl font-black text-slate-800">{users.length}</p>
            <p className="text-xs text-slate-400 font-bold mt-0.5">Total Users</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-2xl font-black text-orange-500">{withMinBal}</p>
            <p className="text-xs text-slate-400 font-bold mt-0.5">With Min Balance</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-2xl font-black text-slate-400">{users.length - withMinBal}</p>
            <p className="text-xs text-slate-400 font-bold mt-0.5">No Restriction</p>
          </div>
        </div>

        {/* Info card */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex gap-3">
          <AlertTriangle size={20} className="text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-orange-700 text-sm">Low Topup Balance System</p>
            <p className="text-orange-600 text-xs mt-1">ইউজারের ব্যালেন্স নির্ধারিত মিনিমামের নিচে গেলে সকল লেনদেন স্বয়ংক্রিয়ভাবে ব্লক হবে। 0 মানে কোনো বিধিনিষেধ নেই।</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
                className="pl-9 pr-4 py-2 border-2 border-slate-100 rounded-xl text-sm outline-none focus:border-emerald-400 w-full bg-slate-50" />
            </div>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map(u => (
                <div key={u.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                    {(u.full_name || u.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800">{u.full_name || u.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400">Balance: ৳{(u.balance || 0).toLocaleString()}</span>
                      {(u.min_balance || 0) > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">
                          Min: ৳{(u.min_balance).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">৳</span>
                      <input
                        type="number"
                        value={localVals[u.id] ?? 0}
                        onChange={e => setLocalVals(v => ({ ...v, [u.id]: e.target.value }))}
                        className="pl-7 pr-3 py-2 border-2 border-slate-100 focus:border-emerald-400 rounded-xl text-sm font-bold outline-none w-28 bg-slate-50"
                        min="0"
                      />
                    </div>
                    <button onClick={() => handleSaveUser(u)} disabled={saving[u.id]}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                      {saving[u.id] ? '...' : <><Save size={12} /> Set</>}
                    </button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="py-12 text-center">
                  <Users size={32} className="mx-auto mb-2 text-slate-200" />
                  <p className="text-slate-400 text-sm">No users found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}