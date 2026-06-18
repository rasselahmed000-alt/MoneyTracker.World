import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminShell from '../../components/AdminShell';
import { AdminCard, AdminCardHeader, FilterTabs, PageLoader, EmptyState } from '../../components/admin/AdminPageWrapper';
import {
  Search, Plus, Edit2, Trash2, UserCheck, UserX, Globe, Phone,
  Shield, X, Check, Camera, Info, ChevronRight, Eye, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' },
];

const STATUS_COLORS = {
  active: { bg: '#d1fae5', color: '#059669', label: 'Active' },
  suspended: { bg: '#fef3c7', color: '#d97706', label: 'Suspended' },
  inactive: { bg: '#f1f5f9', color: '#64748b', label: 'Inactive' },
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.inactive;
  return (
    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
}

// ─── Agent Form Modal ──────────────────────────────────────────────────────
function AgentModal({ agent, onClose, onSave, adminEmail }) {
  const isEdit = !!agent;
  const [form, setForm] = useState({
    agent_name: agent?.agent_name || '',
    agent_code: agent?.agent_code || '',
    mobile: agent?.mobile || '',
    country: agent?.country || '',
    status: agent?.status || 'active',
    notes: agent?.notes || '',
    verification_instruction: agent?.verification_instruction || '',
    support_info: agent?.support_info || '',
    allow_verification: agent?.allow_verification !== false,
    allow_details: agent?.allow_details !== false,
    allow_photo: agent?.allow_photo !== false,
    allow_status: agent?.allow_status !== false,
    allow_support_notes: agent?.allow_support_notes || false,
    photo_url: agent?.photo_url || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const toggle = k => () => setForm(f => ({ ...f, [k]: !f[k] }));

  const handlePhotoUpload = async (file) => {
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, photo_url: file_url }));
    setUploadingPhoto(false);
  };

  const generateCode = () => {
    const code = 'AGT-' + String(Math.floor(Math.random() * 9000) + 1000);
    setForm(f => ({ ...f, agent_code: code }));
  };

  const handleSave = async () => {
    if (!form.agent_name.trim() || !form.agent_code.trim()) {
      setError('Agent Name and Code are required'); return;
    }
    setSaving(true);
    setError('');
    try {
      const now = new Date().toISOString();
      const logEntry = {
        action: isEdit ? 'edited' : 'created',
        by: adminEmail || 'admin',
        timestamp: now,
        details: isEdit ? 'Agent info updated' : 'Agent created',
      };

      const data = {
        ...form,
        agent_code: form.agent_code.trim().toUpperCase(),
        agent_id: agent?.agent_id || ('AGT' + Date.now()),
        audit_log: [...(agent?.audit_log || []), logEntry],
      };

      if (isEdit) {
        await base44.entities.Agent.update(agent.id, data);
      } else {
        await base44.entities.Agent.create(data);
      }
      onSave();
      onClose();
    } catch (e) {
      setError(e.message || 'Save failed');
    }
    setSaving(false);
  };

  const inputCls = "w-full border-2 border-slate-100 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm outline-none bg-slate-50 focus:bg-white transition-colors font-medium";
  const toggleCls = (active) => `w-11 h-6 rounded-full transition-all ${active ? 'bg-emerald-500' : 'bg-slate-200'}`;
  const toggleDotCls = (active) => `w-5 h-5 bg-white rounded-full shadow transition-all ${active ? 'translate-x-5' : 'translate-x-0.5'}`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h3 className="font-black text-slate-900">{isEdit ? 'Edit Agent' : 'Add New Agent'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center border-2 border-slate-200 shrink-0">
              {form.photo_url ? (
                <img src={form.photo_url} className="w-full h-full object-cover" alt="Agent" />
              ) : (
                <Shield size={28} className="text-slate-300" />
              )}
            </div>
            <div>
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors">
                {uploadingPhoto ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Camera size={15} />}
                {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files[0] && handlePhotoUpload(e.target.files[0])} />
              </label>
              <p className="text-[10px] text-slate-400 mt-1">Agent profile picture</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Agent Name *</label>
              <input value={form.agent_name} onChange={set('agent_name')} className={inputCls} placeholder="e.g. Rahim Enterprise" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Agent Code *</label>
              <div className="flex gap-2">
                <input value={form.agent_code} onChange={e => setForm(f => ({ ...f, agent_code: e.target.value.toUpperCase() }))}
                  className={inputCls + ' tracking-widest font-black'} placeholder="AGT-0001" />
                <button onClick={generateCode} title="Auto-generate"
                  className="px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 shrink-0">
                  Gen
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Status</label>
              <select value={form.status} onChange={set('status')} className={inputCls}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Mobile</label>
              <input value={form.mobile} onChange={set('mobile')} className={inputCls} placeholder="+880..." />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Country</label>
              <input value={form.country} onChange={set('country')} className={inputCls} placeholder="Bangladesh" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Verification Instruction</label>
            <textarea value={form.verification_instruction} onChange={set('verification_instruction')}
              className={inputCls + ' resize-none h-20'} placeholder="How to verify this agent..." />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Support Verification Info</label>
            <textarea value={form.support_info} onChange={set('support_info')}
              className={inputCls + ' resize-none h-24'}
              placeholder="Office address, working hours, special instructions for support..." />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Internal Notes</label>
            <textarea value={form.notes} onChange={set('notes')}
              className={inputCls + ' resize-none h-16'} placeholder="Internal admin notes..." />
          </div>

          {/* Smart Reply Toggles */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-black text-slate-600 uppercase tracking-wider">Live Chat Smart Reply Controls</p>
            {[
              { key: 'allow_verification', label: 'Allow Agent Verification' },
              { key: 'allow_details', label: 'Allow Agent Details' },
              { key: 'allow_photo', label: 'Allow Agent Photo' },
              { key: 'allow_status', label: 'Allow Agent Status' },
              { key: 'allow_support_notes', label: 'Allow Support Notes' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-slate-700 font-medium">{label}</span>
                <button onClick={toggle(key)} className={toggleCls(form[key])}>
                  <div className={`flex items-center transition-all ${toggleDotCls(form[key])}`}>
                    <div className="w-5 h-5 bg-white rounded-full shadow" />
                  </div>
                </button>
              </div>
            ))}
          </div>

          {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-xl">{error}</p>}

          <button onClick={handleSave} disabled={saving}
            className="w-full py-3.5 rounded-xl font-black text-white disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
            <Check size={16} /> {saving ? 'Saving...' : isEdit ? 'Update Agent' : 'Create Agent'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Agent Detail / View Modal ────────────────────────────────────────────
function AgentDetailModal({ agent, onClose, onEdit, onDelete, onStatusChange, adminEmail }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleStatusChange = async (newStatus) => {
    const logEntry = {
      action: newStatus === 'suspended' ? 'suspended' : 'activated',
      by: adminEmail || 'admin',
      timestamp: new Date().toISOString(),
      details: `Status changed to ${newStatus}`,
    };
    await base44.entities.Agent.update(agent.id, {
      status: newStatus,
      audit_log: [...(agent.audit_log || []), logEntry],
    });
    onStatusChange();
    onClose();
  };

  const handleDelete = async () => {
    await base44.entities.Agent.delete(agent.id);
    onStatusChange();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-black text-slate-900">Agent Details</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Photo + basic info */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden border-2 border-slate-200 shrink-0">
              {agent.photo_url ? (
                <img src={agent.photo_url} className="w-full h-full object-cover" alt={agent.agent_name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Shield size={28} className="text-slate-300" />
                </div>
              )}
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-lg">{agent.agent_name}</h4>
              <p className="text-slate-500 text-sm font-mono font-bold">{agent.agent_code}</p>
              <StatusBadge status={agent.status} />
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5 text-sm">
            {[
              ['Agent ID', agent.agent_id || agent.id],
              ['Mobile', agent.mobile || '—'],
              ['Country', agent.country || '—'],
              ['Registered', new Date(agent.created_date).toLocaleDateString()],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-slate-400 font-medium">{k}</span>
                <span className="font-bold text-slate-700">{v}</span>
              </div>
            ))}
          </div>

          {agent.verification_instruction && (
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Verification Instruction</p>
              <p className="text-sm text-slate-700 bg-blue-50 border border-blue-100 rounded-xl p-3">{agent.verification_instruction}</p>
            </div>
          )}

          {agent.support_info && (
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Support Info</p>
              <p className="text-sm text-slate-700 bg-amber-50 border border-amber-100 rounded-xl p-3">{agent.support_info}</p>
            </div>
          )}

          {/* Audit log */}
          {agent.audit_log?.length > 0 && (
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Audit Log</p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {[...agent.audit_log].reverse().map((log, i) => (
                  <div key={i} className="text-xs bg-slate-50 rounded-xl px-3 py-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                    <span className="text-slate-600 font-medium capitalize">{log.action}</span>
                    <span className="text-slate-400">by {log.by?.split('@')[0]}</span>
                    <span className="ml-auto text-slate-300">{new Date(log.timestamp).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onEdit}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm border-2 border-slate-200 text-slate-700 hover:bg-slate-50">
              <Edit2 size={14} /> Edit
            </button>
            {agent.status === 'active' ? (
              <button onClick={() => handleStatusChange('suspended')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-amber-50 border-2 border-amber-200 text-amber-700">
                <UserX size={14} /> Suspend
              </button>
            ) : (
              <button onClick={() => handleStatusChange('active')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-emerald-50 border-2 border-emerald-200 text-emerald-700">
                <UserCheck size={14} /> Activate
              </button>
            )}
          </div>

          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-red-50 border-2 border-red-200 text-red-600">
              <Trash2 size={14} /> Delete Agent
            </button>
          ) : (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 space-y-2">
              <p className="text-red-700 font-bold text-sm text-center">Are you sure?</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-lg border border-slate-200 font-bold text-sm text-slate-600">Cancel</button>
                <button onClick={handleDelete} className="flex-1 py-2 rounded-lg bg-red-500 font-bold text-sm text-white">Delete</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── KYC Review Section ────────────────────────────────────────────────────
function KYCReviewSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [processing, setProcessing] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const load = () => {
    setLoading(true);
    base44.entities.User.filter({ kyc_status: 'submitted' }, '-kyc_submitted_at', 100)
      .then(setUsers).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleApprove = async (u) => {
    setProcessing('approve_' + u.id);
    await base44.functions.invoke('adminUpdateUser', {
      target_user_id: u.id,
      data: { kyc_status: 'approved', kyc_verified_date: new Date().toISOString() }
    });
    // notify user
    await base44.asServiceRole.entities.AppNotification?.create?.({
      title: '✅ KYC Approved!',
      message: 'আপনার KYC যাচাই সম্পন্ন হয়েছে। এখন সকল সেবা উপলব্ধ।',
      target_email: u.email,
    }).catch(() => {});
    setProcessing('');
    setSelected(null);
    load();
  };

  const handleReject = async (u) => {
    if (!rejectReason.trim()) return;
    setProcessing('reject_' + u.id);
    await base44.functions.invoke('adminUpdateUser', {
      target_user_id: u.id,
      data: { kyc_status: 'rejected', kyc_reject_reason: rejectReason.trim() }
    });
    await base44.asServiceRole.entities.AppNotification?.create?.({
      title: '❌ KYC Rejected',
      message: `আপনার KYC আবেদন বাতিল হয়েছে। কারণ: ${rejectReason.trim()}`,
      target_email: u.email,
    }).catch(() => {});
    setProcessing('');
    setRejectReason('');
    setSelected(null);
    load();
  };

  if (loading) return <div className="p-6 text-center text-slate-400">Loading...</div>;

  return (
    <div>
      {users.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <Check size={36} className="mx-auto mb-3 text-slate-200" />
          <p>No pending KYC submissions</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {users.map(u => (
            <button key={u.id} onClick={() => setSelected(u)}
              className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors text-left">
              {u.kyc_face_photo ? (
                <img src={u.kyc_face_photo} className="w-10 h-10 rounded-xl object-cover border-2 border-slate-200 shrink-0" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <AlertCircle size={16} className="text-amber-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-800 truncate">{u.full_name || u.email}</p>
                <p className="text-xs text-slate-400 mt-0.5">Agent: {u.kyc_agent_name || '—'} · {u.kyc_agent_code || '—'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[9px] text-amber-500 font-bold">Pending Review</p>
                <p className="text-[10px] text-slate-400">{u.kyc_submitted_at ? new Date(u.kyc_submitted_at).toLocaleDateString() : ''}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* KYC Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
                <h3 className="font-black text-slate-900">KYC Review</h3>
                <button onClick={() => { setSelected(null); setRejectReason(''); }} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm">
                  {[
                    ['Full Name', selected.full_name || selected.display_name || '—'],
                    ['Email', selected.email],
                    ['Mobile', selected.mobile || '—'],
                    ['User ID', selected.id],
                    ['Agent Name', selected.kyc_agent_name || '—'],
                    ['Agent Code', selected.kyc_agent_code || '—'],
                    ['Submitted', selected.kyc_submitted_at ? new Date(selected.kyc_submitted_at).toLocaleString('en-BD') : '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <span className="text-slate-400 font-medium shrink-0">{k}</span>
                      <span className="font-bold text-slate-700 text-right text-xs">{v}</span>
                    </div>
                  ))}
                </div>

                {/* Face Photo */}
                {selected.kyc_face_photo && (
                  <div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Face Photo</p>
                    <img src={selected.kyc_face_photo} className="w-full rounded-2xl object-cover max-h-52" alt="Face" />
                  </div>
                )}

                {/* NID Images */}
                <div className="grid grid-cols-2 gap-3">
                  {selected.kyc_nid_front && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">NID / ID Front</p>
                      <img src={selected.kyc_nid_front} className="w-full rounded-xl object-cover h-28 border border-slate-200" alt="NID Front" />
                    </div>
                  )}
                  {selected.kyc_nid_back && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">NID / ID Back</p>
                      <img src={selected.kyc_nid_back} className="w-full rounded-xl object-cover h-28 border border-slate-200" alt="NID Back" />
                    </div>
                  )}
                </div>

                {/* Reject reason */}
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1.5">Rejection Reason (if rejecting)</label>
                  <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    placeholder="e.g. Documents unclear, face not visible..."
                    className="w-full border-2 border-slate-100 focus:border-red-400 rounded-xl px-4 py-2.5 text-sm outline-none bg-slate-50 transition-colors" />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => handleReject(selected)}
                    disabled={!rejectReason.trim() || !!processing}
                    className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
                    {processing.startsWith('reject') ? '...' : <><X size={14} /> Reject</>}
                  </button>
                  <button onClick={() => handleApprove(selected)}
                    disabled={!!processing}
                    className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                    {processing.startsWith('approve') ? '...' : <><Check size={14} /> Approve</>}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function AdminAgentVerification() {
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('agents'); // agents | kyc
  const [modal, setModal] = useState(null); // null | 'add' | {agent}
  const [viewAgent, setViewAgent] = useState(null);
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    base44.auth.me().then(u => setAdminEmail(u?.email || ''));
  }, []);

  const load = () => {
    setLoading(true);
    base44.entities.Agent.list('-created_date', 200).then(setAgents).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = agents.filter(a =>
    (statusFilter === 'all' || a.status === statusFilter) &&
    (a.agent_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.agent_code?.toLowerCase().includes(search.toLowerCase()) ||
      a.country?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminShell>
      <div className="p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
          {[{ v: 'agents', label: '🤝 Agent Management' }, { v: 'kyc', label: '📋 KYC Review' }].map(t => (
            <button key={t.v} onClick={() => setTab(t.v)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === t.v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Agent Management */}
        {tab === 'agents' && (
          <AdminCard>
            <AdminCardHeader
              title={`Agents (${filtered.length})`}
              subtitle="Manage all agent accounts and verification codes"
              action={
                <div className="flex items-center gap-3 flex-wrap">
                  <FilterTabs options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                      className="pl-8 pr-3 py-2 border-2 border-slate-100 rounded-xl text-xs outline-none focus:border-emerald-400 w-36 bg-slate-50 focus:bg-white transition-colors" />
                  </div>
                  <button onClick={() => setModal('add')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                    <Plus size={16} /> Add Agent
                  </button>
                </div>
              }
            />
            {loading ? <PageLoader /> : (
              <div className="divide-y divide-slate-50">
                {filtered.map(agent => (
                  <button key={agent.id} onClick={() => setViewAgent(agent)}
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors text-left">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                      {agent.photo_url ? (
                        <img src={agent.photo_url} className="w-full h-full object-cover" alt={agent.agent_name} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Shield size={18} className="text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-slate-800 truncate">{agent.agent_name}</p>
                        <StatusBadge status={agent.status} />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono font-bold">{agent.agent_code}</p>
                      <p className="text-[10px] text-slate-300 mt-0.5">{agent.country || '—'} · {new Date(agent.created_date).toLocaleDateString()}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 shrink-0" />
                  </button>
                ))}
                {filtered.length === 0 && <EmptyState icon={Shield} message="No agents found" />}
              </div>
            )}
          </AdminCard>
        )}

        {/* KYC Review */}
        {tab === 'kyc' && (
          <AdminCard>
            <AdminCardHeader title="KYC Submissions" subtitle="Review and approve/reject pending KYC requests" />
            <KYCReviewSection />
          </AdminCard>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modal === 'add' && (
          <AgentModal onClose={() => setModal(null)} onSave={load} adminEmail={adminEmail} />
        )}
        {modal && modal !== 'add' && (
          <AgentModal agent={modal} onClose={() => setModal(null)} onSave={load} adminEmail={adminEmail} />
        )}
        {viewAgent && (
          <AgentDetailModal
            agent={viewAgent}
            onClose={() => setViewAgent(null)}
            onEdit={() => { setModal(viewAgent); setViewAgent(null); }}
            onStatusChange={load}
            adminEmail={adminEmail}
          />
        )}
      </AnimatePresence>
    </AdminShell>
  );
}