import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Shield, Globe, Lock, AlertTriangle } from 'lucide-react';

export default function GeoRestriction({ children }) {
  const { user, status: authStatus } = useAuth();
  const [geoStatus, setGeoStatus] = useState('idle'); // idle | checking | allowed | blocked
  const checkedRef = useRef(false);

  useEffect(() => {
    // Wait for auth to resolve before geo check
    if (authStatus === 'loading') return;
    if (checkedRef.current) return;
    checkedRef.current = true;

    // Admin users → always allow, skip geo check entirely
    if (user?.role === 'admin') {
      setGeoStatus('allowed');
      return;
    }

    setGeoStatus('checking');

    base44.functions.invoke('geoCheck', {})
      .then(res => {
        const data = res?.data;
        if (data?.allowed === false) {
          setGeoStatus('blocked');
        } else {
          setGeoStatus('allowed');
        }
      })
      .catch(() => {
        // Fail open — never block on error
        setGeoStatus('allowed');
      });
  }, [authStatus, user]);

  // While auth is still loading, or geo not yet checked → show nothing (let AuthContext handle loading UI)
  if (authStatus === 'loading' || geoStatus === 'idle') {
    return children;
  }

  if (geoStatus === 'checking') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 z-50"
        style={{ background: 'linear-gradient(160deg,#0b3d2e 0%,#0f4d36 60%,#0a3828 100%)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.1)' }}>
          <Globe size={28} className="text-emerald-400" />
        </div>
        <p className="text-white/50 text-xs font-medium">Verifying access...</p>
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (geoStatus === 'blocked') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-6 text-center z-50"
        style={{ background: 'linear-gradient(160deg,#0b1e14 0%,#0f2a1c 60%,#091810 100%)' }}>

        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-[28px] flex items-center justify-center shadow-2xl"
            style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', boxShadow: '0 20px 50px rgba(220,38,38,0.4)' }}>
            <Lock size={40} className="text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shadow-lg">
            <AlertTriangle size={16} className="text-amber-900" />
          </div>
        </div>

        <div className="mb-8 space-y-3">
          <h1 className="text-white font-black text-2xl tracking-tight">Service Not Available</h1>
          <h2 className="font-bold text-lg" style={{ color: '#f87171' }}>In Your Region</h2>
          <div className="w-12 h-0.5 mx-auto rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
          <p className="text-white/50 text-sm leading-relaxed max-w-xs">
            This service is currently not available from Bangladesh.
            Please contact support if you believe this is an error.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Shield size={14} className="text-emerald-400" />
          <span className="text-white/40 text-xs font-medium">Protected by Geo-Restriction System</span>
        </div>
      </div>
    );
  }

  return children;
}