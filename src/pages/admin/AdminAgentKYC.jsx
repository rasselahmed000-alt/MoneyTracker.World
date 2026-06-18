import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminShell from '../../components/AdminShell';
import { AdminCard, AdminCardHeader, StatusBadge, FilterTabs, PageLoader, EmptyState, AddButton } from '../../components/admin/AdminPageWrapper';
import { Search, Users, Code, Phone, Globe, CheckCircle2, XCircle, Edit2, Trash2, Plus, X, Shield, Eye, Image as ImageIcon, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

const STATUS_COLORS = {
  active: { bg: '#d1fae5', color: '#059669', label: 'Active' },
  suspended: { bg: '#fee2e2', color: '#dc2626', label: 'Suspended' },
  inactive: { bg: '#f1f5f9', color: '#64748b', label: 'Inactive' },
};

function AgentModal({ agent, onClose, onSave }) {
  const isEdit = !!agent?.id;
  const [form, setForm] = useState({
    agent_name: agent?.agent_name || '',
    agent_code: agent?.agent_code || '',
    mobile: agent?.mobile || '',
    country: agent?.country || '',
    status: agent?.status || 'active',
    notes: agent?.notes || '',
    verification_instruction: agent?.verification_instruction || '',
    support_info: agent?.support_info || '',
    photo_url: agent?.photo_url || '',
    allow_agent_verification: agent?.allow_agent_verification ?? true,
    allow_agent_details: agent?.allow_agent_details ?? true,
    allow_agent_photo: agent?.allow_agent_photo ?? true,
    allow_agent_status: agent?.allow_agent_status ?? true,
    allow_support_notes: agent?.allow_support_notes ?? false,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, photo_url: file_url }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.agent_name || !form.agent_code) { setError('Agent name and code are required.'); return; }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const adminUser = await base44.auth.me();
      const logEntry = { action: isEdit ? 'edited' : 'created', by: adminUser?.email, timestamp: now, details: `Agent ${form.agent_code}` };

      if (isEdit) {
        await base44.entities.Agent.update(agent.id, {
          ...form,
          audit_log: [...(agent.audit_log || []), logEntry],
        });
      } else {
        const agentId = `AGT${Date.now().toString().slice(-6)}`;
        await base44.entities.Agent.create({
          ...form,
          agent_id: agentId,
          audit_log: [logEntry],
        });
      }
      onSave();
      onClose();
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleField = (key) => setForm(f => ({ ...f, [key]: !f[key] }));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="font-black text-gray-900">{isEdit ? 'Edit Agent' : 'Add New Agent'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} className="text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-gray-100 bg-gray-50 flex items-center justify-center shrink-0">
              {form.photo_url
                ? <img src={form.photo_url} className="w-full h-full object-cover" alt="Agent" />
                : <Users size={24} className="text-gray-300" />
              }
            </div>
            <div>
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 text-sm font-semibold text-gray-600">
                {uploading ? <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <ImageIcon size={14} />}
                {uploading ? 'Uploading...' : 'Upload Photo'}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
              <p className="text-[10px] text-gray-400 mt-1">Agent profile photo</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-gray-500 mb-1 block">Agent Name *</label>
              <input value={form.agent_name} onChange={e => setForm(f => ({ ...f, agent_name: e.target.value }))}
                placeholder="e.g. Rahim Enterprise"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 bg-gray-50" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Agent Code *</label>
              <input value={form.agent_code} onChange={e => setForm(f => ({ ...f, agent_code: e.target.value.toUpperCase() }))}
                placeholder="AGT-12345"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold outline-none focus:border-emerald-400 bg-gray-50" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Mobile</label>
              <input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
                placeholder="+880..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 bg-gray-50" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Country</label>
              <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                placeholder="Bangladesh"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 bg-gray-50" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 bg-gray-50">
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Internal Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Admin notes about this agent..."
              rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 bg-gray-50 resize-none" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Verification Instruction</label>
            <textarea value={form.verification_instruction} onChange={e => setForm(f => ({ ...f, verification_instruction: e.target.value }))}
              placeholder="How to verify this agent..."
              rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 bg-gray-50 resize-none" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Support Verification Info</label>
            <textarea value={form.support_info} onChange={e => setForm(f => ({ ...f, support_info: e.target.value }))}
              placeholder="Office address, working hours, special instructions..."
              rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 bg-gray-50 resize-none" />
          </div>

          {/* Access Controls */}
          <div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Support Access Controls</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'allow_agent_verification', label: 'Agent Verification' },
                { key: 'allow_agent_details', label: 'Agent Details' },
                { key: 'allow_agent_photo', label: 'Agent Photo' },
                { key: 'allow_agent_status', label: 'Agent Status' },
                { key: 'allow_support_notes', label: 'Support Notes' },
              ].map(item => (
                <button key={item.key} onClick={() => toggleField(item.key)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all"
                  style={{
                    borderColor: form[item.key] ? '#10b981' : '#e2e8f0',
                    background: form[item.key] ? '#f0fdf4' : '#f8fafc',
                    color: form[item.key] ? '#059669' : '#94a3b8',
                  }}>
                  <div className={`w-3 h-3 rounded-full ${form[item.key] ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-xs font-bold">⚠️ {error}</p>}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-600 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Agent'}
          </button>
        </div>
      </div>
    </div>
  );
}

function KYCReviewModal({ user, onClose, onSave }) {
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [imgZoom, setImgZoom] = useState(null);

  const handleAction = async (act) => {
    if (act === 'reject' && !reason.trim()) return;
    setSaving(true);
    try {
      const updateData = { kyc_status: act === 'approve' ? 'approved' : 'rejected' };
      if (act === 'approve') updateData.kyc_verified_date = new Date().toISOString();
      if (act === 'reject') {
        updateData.kyc_rejection_reason = reason.trim();
        updateData.kyc_reject_reason = reason.trim(); // both fields for compatibility
      }

      await base44.functions.invoke('adminUpdateUser', {
        target_user_id: user.id,
        data: updateData,
      });

      // Send notification to user
      try {
        await base44.entities.AppNotification.create({
          title: act === 'approve' ? '✅ KYC Approved!' : '❌ KYC Rejected',
          message: act === 'approve'
            ? 'আপনার KYC সফলভাবে যাচাই হয়েছে। আপনি এখন সমস্ত সেবা ব্যবহার করতে পারবেন।'
            : `আপনার KYC প্রত্যাখ্যান করা হয়েছে। কারণ: ${reason.trim()}। অনুগ্রহ করে সঠিক তথ্য দিয়ে পুনরায় আবেদন করুন।`,
          target_email: user.email || '',
          is_read_by: [],
        });
      } catch { /* silently fail */ }

      // Update agent counters
      if (user.agent_code) {
        try {
          const agents = await base44.entities.Agent.filter({ agent_code: user.agent_code }, null, 1);
          if (agents?.[0]) {
            const agent = agents[0];
            if (act === 'approve') {
              await base44.entities.Agent.update(agent.id, {
                approved_kyc: (agent.approved_kyc || 0) + 1,
                pending_kyc: Math.max(0, (agent.pending_kyc || 0) - 1),
              });
            } else {
              await base44.entities.Agent.update(agent.id, {
                pending_kyc: Math.max(0, (agent.pending_kyc || 0) - 1),
              });
            }
          }
        } catch { /* silently fail */ }
      }

      onSave();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
            <h3 className="font-black text-gray-900">KYC Review</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={16} className="text-gray-400" /></button>
          </div>

          <div className="p-5 space-y-4">
            {/* User info */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
              {[
                ['Full Name', user.full_name],
                ['Email', user.email],
                ['User ID', user.id?.slice(0, 12) + '...'],
                ['Mobile', user.mobile_number || '—'],
                ['Agent Name', user.agent_name || '—'],
                ['Agent Code', user.agent_code || '—'],
                ['Submitted', user.kyc_submitted_at ? new Date(user.kyc_submitted_at).toLocaleString() : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <span className="text-gray-400 font-medium shrink-0">{k}</span>
                  <span className="font-bold text-gray-700 text-right text-xs">{v}</span>
                </div>
              ))}
            </div>

            {/* Document type badge */}
            {user.kyc_doc_type && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">
                  📄 Document Type:
                </span>
                <span className="font-black text-blue-800 text-sm capitalize">{user.kyc_doc_type}</span>
              </div>
            )}

            {/* Photos */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Face Photo', url: user.kyc_face_photo },
                { label: `${user.kyc_doc_type ? user.kyc_doc_type.toUpperCase() : 'NID'} Front`, url: user.kyc_nid_front },
                { label: `${user.kyc_doc_type === 'passport' ? '—' : 'Back'}`, url: user.kyc_nid_back },
              ].filter(item => item.label !== '—').map(item => (
                <div key={item.label} className="text-center">
                  <p className="text-[9px] text-gray-400 font-bold mb-1 uppercase">{item.label}</p>
                  {item.url ? (
                    <div className="rounded-xl overflow-hidden border border-gray-200 cursor-pointer" onClick={() => setImgZoom(item.url)}>
                      <img src={item.url} className="w-full h-20 object-cover" alt={item.label} />
                    </div>
                  ) : (
                    <div className="h-20 bg-gray-100 rounded-xl flex items-center justify-center">
                      <FileText size={20} className="text-gray-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Rejection reason */}
            {action === 'reject' && (
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Rejection Reason *</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="Why is this KYC rejected?"
                  rows={3} className="w-full border border-red-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 bg-red-50 resize-none" />
              </div>
            )}
          </div>

          {user.kyc_status === 'submitted' && (
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => action === 'reject' ? (reason ? handleAction('reject') : null) : setAction('reject')}
                disabled={saving || (action === 'reject' && !reason)}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
                <XCircle size={15} /> {action === 'reject' ? 'Confirm Reject' : 'Reject'}
              </button>
              <button onClick={() => handleAction('approve')}
                disabled={saving}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                <CheckCircle2 size={15} /> {saving ? '...' : 'Approve'}
              </button>
            </div>
          )}
          {user.kyc_status !== 'submitted' && (
            <div className="px-5 pb-5">
              <div className="text-center mb-3"><StatusBadge status={user.kyc_status} /></div>
              <button onClick={onClose} className="w-full py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-600 text-sm">Close</button>
            </div>
          )}
        </div>
      </div>

      {/* Image zoom */}
      {imgZoom && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={() => setImgZoom(null)}>
          <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-full"><X size={20} className="text-white" /></button>
          <img src={imgZoom} className="max-w-full max-h-[85vh] rounded-2xl object-contain" alt="Document" />
        </div>
      )}
    </>
  );
}

export default function AdminAgentKYC() {
  const [tab, setTab] = useState('agents'); // agents | kyc
  const [agents, setAgents] = useState([]);
  const [kycUsers, setKycUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('submitted');
  const [showModal, setShowModal] = useState(false);
  const [editAgent, setEditAgent] = useState(null);
  const [reviewUser, setReviewUser] = useState(null);

  const loadAgents = async () => {
    const data = await base44.entities.Agent.list('-created_date', 100);
    setAgents(data || []);
  };

  const loadKYC = async () => {
    const data = await base44.entities.User.list('-created_date', 500);
    setKycUsers((data || []).filter(u => u.kyc_status && u.kyc_status !== 'not_submitted' && u.role !== 'admin'));
  };

  const load = async () => {
    setLoading(true);
    await Promise.all([loadAgents(), loadKYC()]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (agent) => {
    if (!window.confirm(`Delete agent "${agent.agent_name}"?`)) return;
    await base44.entities.Agent.delete(agent.id);
    loadAgents();
  };

  const handleStatusToggle = async (agent) => {
    const newStatus = agent.status === 'active' ? 'suspended' : 'active';
    const adminUser = await base44.auth.me();
    const logEntry = { action: newStatus === 'suspended' ? 'suspended' : 'activated', by: adminUser?.email, timestamp: new Date().toISOString() };
    await base44.entities.Agent.update(agent.id, {
      status: newStatus,
      audit_log: [...(agent.audit_log || []), logEntry],
    });
    loadAgents();
  };

  const filteredAgents = agents.filter(a =>
    (statusFilter === 'all' || a.status === statusFilter) &&
    (a.agent_name?.toLowerCase().includes(search.toLowerCase()) ||
     a.agent_code?.toLowerCase().includes(search.toLowerCase()) ||
     a.country?.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredKYC = kycUsers.filter(u =>
    (kycFilter === 'all' || u.kyc_status === kycFilter) &&
    (u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
     u.email?.toLowerCase().includes(search.toLowerCase()) ||
     u.agent_code?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        {/* Tab switcher */}
        <div className="flex gap-2">
          {[{ k: 'agents', label: '🏢 Agent Management' }, { k: 'kyc', label: '🪪 KYC Review' }].map(t => (
            <button key={t.k} onClick={() => { setTab(t.k); setSearch(''); }}
              className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={tab === t.k
                ? { background: 'linear-gradient(135deg,#0f172a,#1e293b)', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }
                : { background: '#f1f5f9', color: '#64748b' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── AGENTS TAB ── */}
        {tab === 'agents' && (
          <AdminCard>
            <AdminCardHeader
              title={`Agents (${filteredAgents.length})`}
              subtitle="Manage agents and their KYC codes"
              action={
                <div className="flex items-center gap-3">
                  <FilterTabs options={STATUS_TABS} value={statusFilter} onChange={setStatusFilter} />
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                      className="pl-8 pr-3 py-2 border-2 border-slate-100 rounded-xl text-xs outline-none focus:border-emerald-400 w-36 bg-slate-50" />
                  </div>
                  <AddButton onClick={() => { setEditAgent(null); setShowModal(true); }} label="Add Agent" />
                </div>
              }
            />
            {loading ? <PageLoader /> : (
              <div className="divide-y divide-gray-50">
                {filteredAgents.map(agent => {
                  const sc = STATUS_COLORS[agent.status] || STATUS_COLORS.inactive;
                  return (
                    <div key={agent.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50">
                      <div className="w-11 h-11 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0">
                        {agent.photo_url
                          ? <img src={agent.photo_url} className="w-full h-full object-cover" alt="" />
                          : <div className="w-full h-full flex items-center justify-center"><Users size={20} className="text-gray-300" /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-gray-800 truncate">{agent.agent_name}</p>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full font-black"
                            style={{ background: '#f0fdf4', color: '#059669' }}>{agent.agent_code}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{agent.mobile} · {agent.country}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                          <span>👥 {agent.total_customers || 0} customers</span>
                          <span>✅ {agent.approved_kyc || 0} approved</span>
                          <span>⏳ {agent.pending_kyc || 0} pending</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-black px-2 py-1 rounded-full" style={{ background: sc.bg, color: sc.color }}>
                          {sc.label}
                        </span>
                        <button onClick={() => handleStatusToggle(agent)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title={agent.status === 'active' ? 'Suspend' : 'Activate'}>
                          <Shield size={14} className={agent.status === 'active' ? 'text-amber-500' : 'text-emerald-500'} />
                        </button>
                        <button onClick={() => { setEditAgent(agent); setShowModal(true); }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                          <Edit2 size={14} className="text-slate-400" />
                        </button>
                        <button onClick={() => handleDelete(agent)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredAgents.length === 0 && <EmptyState icon={Users} message="No agents found" />}
              </div>
            )}
          </AdminCard>
        )}

        {/* ── KYC REVIEW TAB ── */}
        {tab === 'kyc' && (
          <AdminCard>
            <AdminCardHeader
              title={`KYC Applications (${filteredKYC.length})`}
              subtitle="Review and approve customer KYC submissions"
              action={
                <div className="flex items-center gap-3">
                  <FilterTabs
                    options={[
                      { value: 'submitted', label: 'Pending' },
                      { value: 'approved', label: 'Approved' },
                      { value: 'rejected', label: 'Rejected' },
                      { value: 'all', label: 'All' },
                    ]}
                    value={kycFilter} onChange={setKycFilter}
                  />
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                      className="pl-8 pr-3 py-2 border-2 border-slate-100 rounded-xl text-xs outline-none focus:border-emerald-400 w-36 bg-slate-50" />
                  </div>
                </div>
              }
            />
            {loading ? <PageLoader /> : (
              <div className="divide-y divide-gray-50">
                {filteredKYC.map(u => (
                  <button key={u.id} onClick={() => setReviewUser(u)}
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 text-left transition-colors">
                    <div className="w-11 h-11 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0">
                      {u.kyc_face_photo
                        ? <img src={u.kyc_face_photo} className="w-full h-full object-cover" alt="" />
                        : <div className="w-full h-full flex items-center justify-center"><Users size={20} className="text-gray-300" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-800 truncate">{u.full_name}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      {u.agent_name && (
                        <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                          Agent: {u.agent_name} · <span className="font-mono">{u.agent_code}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <StatusBadge status={u.kyc_status === 'submitted' ? 'pending' : u.kyc_status === 'approved' ? 'approved' : 'rejected'} />
                      {u.kyc_submitted_at && (
                        <p className="text-[9px] text-gray-400 mt-1">{new Date(u.kyc_submitted_at).toLocaleDateString()}</p>
                      )}
                    </div>
                  </button>
                ))}
                {filteredKYC.length === 0 && <EmptyState icon={FileText} message="No KYC applications found" />}
              </div>
            )}
          </AdminCard>
        )}
      </div>

      {/* Agent Modal */}
      {showModal && (
        <AgentModal
          agent={editAgent}
          onClose={() => { setShowModal(false); setEditAgent(null); }}
          onSave={loadAgents}
        />
      )}

      {/* KYC Review Modal */}
      {reviewUser && (
        <KYCReviewModal
          user={reviewUser}
          onClose={() => setReviewUser(null)}
          onSave={load}
        />
      )}
    </AdminShell>
  );
}