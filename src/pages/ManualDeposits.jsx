import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import AdminShell from '../components/AdminShell';

function DepositModal({ deposit, onClose, onSave }) {
  const [note, setNote] = useState(deposit.admin_note || '');
  const [saving, setSaving] = useState(false);

  const handle = async (status) => {
    setSaving(true);
    await base44.entities.ManualDepositRequest.update(deposit.id, { status, admin_note: note });
    if (status === 'approved') {
      try {
        await base44.functions.invoke('approveDeposit', { depositId: deposit.id });
      } catch {}
    }
    setSaving(false);
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="font-black text-lg text-gray-900">Deposit Request</h3>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">User</span><span className="font-bold">{deposit.user_name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-bold text-xs">{deposit.user_email}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="font-bold">{deposit.method}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Amount Sent</span><span className="font-bold">{deposit.amount_sent} {deposit.currency}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">BDT Amount</span><span className="font-bold text-emerald-600">৳{(deposit.bdt_amount || 0).toLocaleString()}</span></div>
          {deposit.last_digits && <div className="flex justify-between"><span className="text-gray-500">Last Digits</span><span className="font-bold">{deposit.last_digits}</span></div>}
          {deposit.receipt_url && (
            <div>
              <p className="text-gray-500 mb-1">Receipt</p>
              <img src={deposit.receipt_url} alt="receipt" className="w-full rounded-xl border" />
            </div>
          )}
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Admin Note</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 resize-none" />
        </div>
        {deposit.status === 'pending' && (
          <div className="flex gap-3">
            <button onClick={() => handle('rejected')} disabled={saving}
              className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2">
              <XCircle size={16} /> Reject
            </button>
            <button onClick={() => handle('approved')} disabled={saving}
              className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2">
              <CheckCircle size={16} /> {saving ? 'Processing...' : 'Approve'}
            </button>
          </div>
        )}
        <button onClick={onClose} className="w-full py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-600">Close</button>
      </div>
    </div>
  );
}

export default function ManualDeposits() {
  const [deposits, setDeposits] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = filter === 'all'
      ? await base44.entities.ManualDepositRequest.list('-created_date', 200)
      : await base44.entities.ManualDepositRequest.filter({ status: filter }, '-created_date', 200);
    setDeposits(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const statusColor = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700' };

  return (
    <AdminShell>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Manual Deposits</h1>
          <p className="text-gray-500 text-sm">{deposits.length} records</p>
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
              {deposits.map(d => (
                <div key={d.id} className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelected(d)}>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{d.user_name}</p>
                    <p className="text-xs text-gray-400">{d.method} · {d.amount_sent} {d.currency} · {new Date(d.created_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-emerald-600">৳{(d.bdt_amount || 0).toLocaleString()}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor[d.status]}`}>{d.status}</span>
                    <Eye size={14} className="text-gray-400" />
                  </div>
                </div>
              ))}
              {deposits.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No deposits found</p>}
            </div>
          )}
        </div>
      </div>
      {selected && <DepositModal deposit={selected} onClose={() => setSelected(null)} onSave={load} />}
    </AdminShell>
  );
}