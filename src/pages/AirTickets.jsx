import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminShell from '../components/AdminShell';

export default function AirTickets() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Transaction.filter({ type: 'mobile_banking' }, '-created_date', 200)
      .then(data => setTxs(data.filter(t => t.ticket_data)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell>
      <div className="p-6 space-y-5">
        <div><h1 className="text-2xl font-black text-gray-900">Air Tickets</h1><p className="text-gray-500 text-sm">{txs.length} records</p></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? <div className="h-32 animate-pulse bg-gray-50" /> : (
            <div className="divide-y divide-gray-50">
              {txs.map(tx => {
                let ticket = {};
                try { ticket = JSON.parse(tx.ticket_data); } catch {}
                return (
                  <div key={tx.id} className="px-5 py-3.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-gray-900">{tx.user_email}</p>
                      <p className="text-xs text-gray-400">{ticket.from} → {ticket.to} · {ticket.date}</p>
                      <p className="text-xs text-gray-400">{ticket.airline} · {ticket.passenger}</p>
                    </div>
                    <p className="font-bold text-sm text-gray-900">৳{(tx.amount || 0).toLocaleString()}</p>
                  </div>
                );
              })}
              {txs.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No air ticket orders</p>}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}