import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Shield, Ban, CheckCircle, DollarSign, ChevronDown } from 'lucide-react';
import AdminShell from '../components/AdminShell';

function UserModal({ user, onClose, onSave }) {
  const [balance, setBalance] = useState(user.balance || 0);
  const [role, setRole] = useState(user.role || 'user');
  const [kycStatus, setKycStatus] = useState(user.kyc_status || 'pending');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.User.update(user.id, { balance: Number(balance), role, kyc_status: kycStatus });
    setSaving(false);
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
        <h3 className="font-black text-lg text-gray-900">Edit User</h3>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="font-bold text-gray-800">{user.full_name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Balance (BDT)</label>
          <input type="number" value={balance} onChange={e => setBalance(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 font-bold outline-none focus:border-emerald-500" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Role</label>
          <select value={role} onChange={e => setRole(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 font-semibold outline-none focus:border-emerald-500">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">KYC Status</label>
          <select value={kycStatus} onChange={e => setKycStatus(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 font-semibold outline-none focus:border-emerald-500">
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-600">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.User.list('-created_date', 200);
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const kycColor = { pending: 'bg-amber-100 text-amber-700', submitted: 'bg-blue-100 text-blue-700', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700' };

  return (
    <AdminShell>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Users</h1>
            <p className="text-gray-500 text-sm">{users.length} total users</p>
          </div>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-500 font-medium text-sm" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="space-y-px">
              {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-50 animate-pulse" />)}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(u => (
                <div key={u.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelected(u)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <span className="text-emerald-700 font-black text-sm">{u.full_name?.[0]?.toUpperCase() || '?'}</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{u.full_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-800">৳{(u.balance || 0).toLocaleString()}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${kycColor[u.kyc_status] || 'bg-gray-100 text-gray-500'}`}>
                      {u.kyc_status || 'pending'}
                    </span>
                    {u.role === 'admin' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Admin</span>}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No users found</p>}
            </div>
          )}
        </div>
      </div>
      {selected && <UserModal user={selected} onClose={() => setSelected(null)} onSave={load} />}
    </AdminShell>
  );
}