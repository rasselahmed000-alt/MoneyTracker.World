import { useState, useEffect, memo } from 'react';
import { base44 } from '@/api/base44Client';
import AdminShell from '../../components/AdminShell';
import { X, CheckCircle2, FileText, Send, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG = {
  pending:     { bg: '#fef3c7', color: '#d97706', label: 'Pending', icon: '⏳' },
  under_review: { bg: '#dbeafe', color: '#2563eb', label: 'Under Review', icon: '🔍' },
  approved:    { bg: '#d1fae5', color: '#059669', label: 'Approved', icon: '✅' },
  rejected:    { bg: '#fee2e2', color: '#dc2626', label: 'Rejected', icon: '❌' },
};

const STATUSES = ['pending', 'under_review', 'approved', 'rejected'];
const DOC_STATUS = ['pending', 'verified', 'invalid', 'missing', 'not_required'];

function AppDetailModal({ app, onClose, onUpdate }) {
  const [status, setStatus] = useState(app.status || 'pending');
  const [docVerif, setDocVerif] = useState(app.doc_verification || {});
  const [rejectionReason, setRejectionReason] = useState(app.rejection_reason || '');
  const [applicantMsg, setApplicantMsg] = useState(app.applicant_message || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const history = [...(app.action_history || [])];
    if (status !== app.status) {
      history.push({
        action: `Changed to ${status}`,
        by: '(admin)',
        timestamp: new Date().toISOString(),
        details: rejectionReason || applicantMsg || '',
      });
    }

    await base44.entities.VisaApplication.update(app.id, {
      status,
      doc_verification: docVerif,
      rejection_reason: rejectionReason,
      applicant_message: applicantMsg,
      action_history: history,
    });

    // Notify applicant if status changed
    if (status !== app.status) {
      await base44.entities.AppNotification.create({
        title: `Visa Application ${STATUS_CONFIG[status].label}`,
        message: applicantMsg || `Your visa application has been ${status.replace('_', ' ')}.`,
        target_email: app.user_email,
      }).catch(() => {});
    }

    setSaving(false);
    onUpdate();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[88vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-black text-slate-900">{app.destination_country} — {app.visa_type}</h3>
            <p className="text-xs text-slate-400">{app.app_ref} · {app.user_name}</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Applicant Info */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">👤 Applicant</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-bold text-slate-700">{app.user_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Passport</span><span className="font-bold text-slate-700">{app.passport_number}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">DOB</span><span className="font-bold text-slate-700">{app.date_of_birth}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Contact</span><span className="font-bold text-slate-700">{app.mobile_number}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Purpose</span><span className="font-bold text-slate-700 text-right text-xs">{app.purpose_of_visit}</span></div>
            </div>
          </div>

          {/* Document Verification */}
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">📄 Document Verification</p>
            <div className="space-y-2.5">
              {[
                { key: 'passport_scan', label: 'Passport Scan', url: app.passport_scan_url },
                { key: 'national_id', label: 'National ID / Birth Cert', url: app.national_id_url },
                { key: 'bank_statement', label: 'Bank Statement', url: app.bank_statement_url },
                { key: 'passport_photo', label: 'Passport Photo', url: app.passport_photo_url },
              ].map(doc => (
                <div key={doc.key} className="border-2 border-slate-100 rounded-xl p-3">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-bold text-slate-700">{doc.label}</span>
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                        <Download size={14} />
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {DOC_STATUS.map(s => (
                      <button key={s} onClick={() => setDocVerif(p => ({ ...p, [doc.key]: s }))}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold border transition-all"
                        style={docVerif[doc.key] === s
                          ? { background: '#2563eb', color: '#fff', borderColor: '#2563eb' }
                          : { background: '#f1f5f9', color: '#64748b', borderColor: 'transparent' }}>
                        {s === 'not_required' ? 'N/A' : s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Control */}
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">🔄 Status</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {STATUSES.map(s => {
                const cfg = STATUS_CONFIG[s];
                return (
                  <button key={s} onClick={() => setStatus(s)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all"
                    style={status === s
                      ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color }
                      : { background: '#f8fafc', color: '#94a3b8', borderColor: 'transparent' }}>
                    {cfg.icon} {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Messages */}
          {status === 'rejected' && (
            <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={2}
              placeholder="Reason for rejection (admin internal)..."
              className="w-full border-2 border-red-200 focus:border-red-500 rounded-xl px-3 py-2.5 text-sm outline-none bg-red-50 resize-none" />
          )}

          <textarea value={applicantMsg} onChange={e => setApplicantMsg(e.target.value)} rows={2}
            placeholder="Message to applicant (will be notified)..."
            className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 resize-none" />

          {/* Action History */}
          {app.action_history?.length > 0 && (
            <div>
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">📋 History</p>
              <div className="space-y-2">
                {app.action_history.map((h, i) => (
                  <div key={i} className="border-l-2 border-slate-200 pl-3 py-1">
                    <p className="text-xs font-bold text-slate-600">{h.action}</p>
                    {h.details && <p className="text-xs text-slate-400">{h.details}</p>}
                    <p className="text-[10px] text-slate-300">{new Date(h.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6 pt-3 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-600 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 bg-blue-700">
            <Send size={14} /> {saving ? 'Saving...' : 'Update'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default memo(function AdminVisaApps() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const load = () => {
    base44.entities.VisaApplication.list('-created_date', 200)
      .then(setApps).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter);
  const stats = STATUSES.reduce((acc, s) => {
    acc[s] = apps.filter(a => a.status === s).length;
    return acc;
  }, {});

  return (
    <AdminShell>
      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: apps.length, color: '#6366f1' },
            { label: 'Pending', value: stats.pending || 0, color: '#d97706' },
            { label: 'Reviewing', value: stats.under_review || 0, color: '#2563eb' },
            { label: 'Approved', value: stats.approved || 0, color: '#059669' },
            { label: 'Rejected', value: stats.rejected || 0, color: '#dc2626' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-slate-400 font-semibold mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Applications */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex flex-wrap gap-2">
            {['all', ...STATUSES].map(s => {
              const cfg = STATUS_CONFIG[s];
              const count = s === 'all' ? apps.length : (stats[s] || 0);
              return (
                <button key={s} onClick={() => setFilter(s)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all capitalize"
                  style={filter === s
                    ? { background: cfg?.bg || '#e2e8f0', color: cfg?.color || '#1e293b' }
                    : { background: '#f8fafc', color: '#94a3b8' }}>
                  {s === 'all' ? `All (${count})` : `${cfg?.label} (${count})`}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="p-6 space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <FileText size={36} className="mx-auto mb-3 text-slate-200" />
              <p className="text-slate-400 text-sm">No applications found.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map(app => {
                const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                return (
                  <button key={app.id} onClick={() => setSelected(app)}
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left">
                    <span className="text-2xl shrink-0">{app.destination_country.split(' ')[0] || '🌍'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800">{app.destination_country} — {app.visa_type}</p>
                      <p className="text-xs text-slate-400">{app.user_name} · {app.app_ref}</p>
                      <p className="text-[10px] text-slate-300">{new Date(app.created_date).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selected && <AppDetailModal app={selected} onClose={() => setSelected(null)} onUpdate={load} />}
      </AnimatePresence>
    </AdminShell>
  );
});