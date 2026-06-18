import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import AdminShell from '../../components/AdminShell';
import { Search, Crown, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminManagement() {
  const { user, status } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(null);
  const [result, setResult] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.User.list();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Admin role check
  if (status === 'loading') return <div className="p-6">Loading...</div>;
  if (!user || user.role !== 'admin') return <div className="p-6 text-red-600">❌ Admin Access Required</div>;

  const handlePromoteToAdmin = async (targetUser) => {
    if (!window.confirm(`${targetUser.email} কে Admin বানাতে চান?`)) return;
    
    setPromoting(targetUser.id);
    setResult('');
    try {
      const res = await base44.functions.invoke('adminUpdateUser', {
        target_user_id: targetUser.id,
        data: { role: 'admin' }
      });
      if (res.data?.success) {
        setResult('✅ Successfully promoted to Admin');
        await new Promise(r => setTimeout(r, 2000));
        loadUsers();
        setResult('');
      } else {
        setResult('❌ ' + (res.data?.error || 'Failed'));
      }
    } catch (e) {
      setResult('❌ ' + (e?.message || 'Failed'));
    } finally {
      setPromoting(null);
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (u?.email || '').toLowerCase().includes(q) || (u?.full_name || '').toLowerCase().includes(q);
  });

  const admins = filtered.filter(u => u.role === 'admin');
  const regularUsers = filtered.filter(u => u.role !== 'admin');

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50">
            <h2 className="font-black text-slate-900">Admin Management</h2>
            <p className="text-xs text-slate-400 mt-0.5">Promote users to Admin role</p>
          </div>

          <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
            <Search size={15} className="text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
              className="flex-1 outline-none bg-transparent text-sm font-medium"
            />
          </div>

          {/* Current Admins */}
          {admins.length > 0 && (
            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100">
              <p className="text-xs font-bold text-emerald-700 uppercase mb-3">Current Admins ({admins.length})</p>
              <div className="space-y-2">
                {admins.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-emerald-200">
                    <Crown size={16} className="text-emerald-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800 truncate">{u.full_name || u.email}</p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    </div>
                    <span className="text-[10px] font-black px-2 py-1 rounded-full bg-emerald-200 text-emerald-700">Admin</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Users - Promote */}
          <div className="px-6 py-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : regularUsers.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle size={32} className="mx-auto mb-3 text-slate-200" />
                <p className="text-slate-400 text-sm">No regular users found</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Regular Users ({regularUsers.length})</p>
                {regularUsers.map(u => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
                      {(u?.full_name?.[0] || u?.email?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800 truncate">{u.full_name || u.email}</p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    </div>
                    <button
                      onClick={() => handlePromoteToAdmin(u)}
                      disabled={promoting === u.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all"
                    >
                      {promoting === u.id ? (
                        <>
                          <Loader size={12} className="animate-spin" />
                          Promoting...
                        </>
                      ) : (
                        <>
                          <Crown size={12} />
                          Promote
                        </>
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`px-6 py-3 flex items-center gap-2 text-sm font-bold ${
                result.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {result.startsWith('✅') ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {result}
            </motion.div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
          <AlertCircle size={16} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>Note:</strong> Promoted users will have full access to all admin features after their next login. They'll be able to manage users, transactions, and all system settings.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}