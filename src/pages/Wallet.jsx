import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import AppShell from '../components/cellfin/AppShell';
import UniversalHeader from '@/components/cellfin/UniversalHeader';

export default function Wallet() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleRequest = async () => {
    if (!amount || Number(amount) < 50) { alert('Minimum amount is 50'); return; }
    setLoading(true);
    try {
      const me = await base44.auth.me();
      await base44.entities.WalletRequest.create({
        user_id: me.id, user_email: me.email, user_name: me.full_name,
        type: tab, amount: Number(amount), currency: me.currency || 'BDT', status: 'pending',
      });
      setSuccess(true);
      setAmount('');
    } catch { alert('Request failed!'); }
    setLoading(false);
  };

  return (
    <AppShell header={
      <UniversalHeader title="Wallet" />
    }>

      <div className="px-5 pt-4 pb-8">
        {/* Tabs */}
        <div className="flex bg-secondary rounded-2xl p-1 mb-6">
          {['deposit', 'withdraw'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === t ? 'bg-forest text-gold shadow-sm' : 'text-muted-foreground'}`}>
              {t === 'deposit' ? '+ Deposit' : '- Withdraw'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div key="suc" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
              <CheckCircle2 size={60} className="text-emerald-500 mx-auto mb-3" />
              <h3 className="font-extrabold text-lg text-foreground">Request Submitted!</h3>
              <p className="text-muted-foreground text-sm mt-1">Admin will process within 24 hours</p>
              <button onClick={() => setSuccess(false)} className="mt-6 bg-forest text-gold px-6 py-3 rounded-2xl font-bold text-sm">New Request</button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-white rounded-2xl p-5 border border-border mb-4">
                <p className="text-xs font-bold text-muted-foreground mb-2">Amount ({user?.currency || 'BDT'})</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-forest">৳</span>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="0.00" className="flex-1 text-3xl font-extrabold text-forest outline-none bg-transparent" />
                </div>
                <div className="flex gap-2 mt-3">
                  {[500, 1000, 5000, 10000].map(a => (
                    <button key={a} onClick={() => setAmount(String(a))}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold ${amount === String(a) ? 'bg-forest text-gold' : 'bg-secondary text-secondary-foreground'}`}>
                      ৳{a >= 1000 ? (a/1000)+'k' : a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 mb-4 text-xs text-blue-700">
                {tab === 'deposit' ? '📌 Send payment proof to admin after requesting.' : '📌 Withdrawals processed within 24-48 hours.'}
              </div>

              <button onClick={handleRequest} disabled={loading || !amount}
                className="w-full bg-forest text-gold py-4 rounded-2xl font-extrabold text-base disabled:opacity-40 flex items-center justify-center gap-2">
                {tab === 'deposit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                {loading ? 'Submitting...' : `Request ${tab === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}