import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminShell from '../components/AdminShell';

export default function VisaApps() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Transaction.filter({ type: 'mobile_banking' }, '-created_date', 200)
      .then(setItems).finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell>
      <div className="p-6 space-y-5">
        <div><h1 className="text-2xl font-black text-gray-900">Visa Applications</h1><p className="text-gray-500 text-sm">{items.length} records</p></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? <div className="h-32 animate-pulse bg-gray-50" /> : (
            <div className="divide-y divide-gray-50">
              {items.map(tx => (
                <div key={tx.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-gray-900">{tx.user_email}</p>
                    <p className="text-xs text-gray-400">{tx.description} · {new Date(tx.created_date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-gray-900">৳{(tx.amount || 0).toLocaleString()}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tx.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{tx.status}</span>
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No visa applications</p>}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}