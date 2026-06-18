import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminShell from '../../components/AdminShell';
import { Shield, Plus, Trash2, Globe, Lock, Unlock, Save, RefreshCw } from 'lucide-react';

export default function AdminGeoRestriction() {
  const [geoEnabled, setGeoEnabled] = useState(false);
  const [whitelist, setWhitelist] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geoSettingId, setGeoSettingId] = useState(null);
  const [whitelistSettingId, setWhitelistSettingId] = useState(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settings = await base44.entities.AppSettings.list();
      const geoSetting = settings.find(s => s.key === 'geo_restriction');
      const wlSetting = settings.find(s => s.key === 'geo_whitelist');

      if (geoSetting) {
        setGeoSettingId(geoSetting.id);
        setGeoEnabled(geoSetting.value === 'enabled');
      }
      if (wlSetting) {
        setWhitelistSettingId(wlSetting.id);
        const emails = wlSetting.value.split(',').map(e => e.trim()).filter(Boolean);
        setWhitelist(emails);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSettings(); }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const geoValue = geoEnabled ? 'enabled' : 'disabled';
      const wlValue = whitelist.join(',');

      if (geoSettingId) {
        await base44.entities.AppSettings.update(geoSettingId, { value: geoValue });
      } else {
        const created = await base44.entities.AppSettings.create({
          key: 'geo_restriction',
          value: geoValue,
          description: 'Bangladesh geo restriction: enabled/disabled',
        });
        setGeoSettingId(created.id);
      }

      if (whitelistSettingId) {
        await base44.entities.AppSettings.update(whitelistSettingId, { value: wlValue });
      } else {
        const created = await base44.entities.AppSettings.create({
          key: 'geo_whitelist',
          value: wlValue,
          description: 'Whitelisted emails allowed from Bangladesh (comma separated)',
        });
        setWhitelistSettingId(created.id);
      }

      alert('Settings saved successfully!');
    } catch (err) {
      alert('Error saving: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    if (whitelist.includes(email)) return;
    setWhitelist(prev => [...prev, email]);
    setNewEmail('');
  };

  const removeEmail = (email) => {
    setWhitelist(prev => prev.filter(e => e !== email));
  };

  return (
    <AdminShell>
      <div className="p-6 space-y-6 max-w-2xl">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}>
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-black text-slate-900 text-lg">Geo Restriction</h1>
            <p className="text-xs text-slate-400">Block Bangladesh IP — allow only whitelisted accounts</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Toggle Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${geoEnabled ? 'bg-red-50' : 'bg-emerald-50'}`}>
                    {geoEnabled ? <Lock size={18} className="text-red-500" /> : <Unlock size={18} className="text-emerald-500" />}
                  </div>
                  <div>
                    <p className="font-black text-slate-800">Bangladesh Restriction</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {geoEnabled ? '🔴 BD access is BLOCKED (whitelist only)' : '🟢 BD access is OPEN for all users'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setGeoEnabled(!geoEnabled)}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 ${geoEnabled ? 'bg-red-500' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${geoEnabled ? 'left-7' : 'left-0.5'}`} />
                </button>
              </div>

              {geoEnabled && (
                <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
                  <Globe size={14} className="text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 font-medium">
                    Bangladesh users will see "Service Not Available In Your Region" unless their email is whitelisted below. Admin accounts are automatically allowed.
                  </p>
                </div>
              )}
            </div>

            {/* Whitelist Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-black text-slate-900">Whitelist</p>
                  <p className="text-xs text-slate-400 mt-0.5">Emails allowed from Bangladesh even when restriction is ON</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  {whitelist.length} entries
                </span>
              </div>

              {/* Add new email */}
              <div className="px-5 py-4 border-b border-slate-50 flex gap-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addEmail()}
                  placeholder="Add email (e.g. user@gmail.com)"
                  className="flex-1 border-2 border-slate-200 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
                />
                <button onClick={addEmail}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-colors">
                  <Plus size={15} /> Add
                </button>
              </div>

              {/* List */}
              <div className="divide-y divide-slate-50">
                {whitelist.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-sm">No emails whitelisted yet</div>
                ) : whitelist.map((email, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
                        style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                        {email[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{email}</span>
                    </div>
                    <button onClick={() => removeEmail(email)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Note about admins */}
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <Shield size={15} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700 font-medium">
                <strong>Note:</strong> All Admin accounts are automatically whitelisted — no need to add them manually. This list is for regular users who need special BD access.
              </p>
            </div>

            {/* Save Button */}
            <button onClick={saveSettings} disabled={saving}
              className="w-full py-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.35)' }}>
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </>
        )}
      </div>
    </AdminShell>
  );
}