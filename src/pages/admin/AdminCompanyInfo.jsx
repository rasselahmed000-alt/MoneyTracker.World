import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import AdminPageWrapper from '../../components/admin/AdminPageWrapper';

export default function AdminCompanyInfo() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({});
  const [newService, setNewService] = useState({ name: '', description: '', processing_time: '', fee_percent: 0, min_limit: 0, max_limit: 0 });
  const [showServiceForm, setShowServiceForm] = useState(false);

  useEffect(() => {
    base44.entities.CompanyInfo.list('', 1)
      .then(data => {
        const item = data?.[0];
        setInfo(item);
        if (item) setEditData(item);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (info?.id) {
        await base44.entities.CompanyInfo.update(info.id, editData);
      } else {
        await base44.entities.CompanyInfo.create(editData);
      }
      setInfo(editData);
      setEditing(false);
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
  };

  const handleAddService = () => {
    setEditData(prev => ({
      ...prev,
      services: [...(prev.services || []), newService]
    }));
    setNewService({ name: '', description: '', processing_time: '', fee_percent: 0, min_limit: 0, max_limit: 0 });
    setShowServiceForm(false);
  };

  const handleRemoveService = (idx) => {
    setEditData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== idx)
    }));
  };

  if (loading) {
    return (
      <AdminPageWrapper title="Company Info">
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper title="Company Information">
      <div className="space-y-6">
        {!editing ? (
          // View Mode
          <>
            <button
              onClick={() => setEditing(true)}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700"
            >
              <Edit2 size={16} /> Edit Company Info
            </button>

            {info && (
              <div className="space-y-4">
                {/* Company Overview */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <h3 className="font-bold text-lg mb-3">🏢 Company Overview</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 font-bold">Company Name</p>
                      <p className="text-sm font-bold text-gray-900">{info.company_name || '-'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 font-bold">Status</p>
                      <p className="text-sm font-bold text-gray-900">{info.status === 'active' ? '✅ Active' : '🔧 Maintenance'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 font-bold">Total Countries</p>
                      <p className="text-sm font-bold text-gray-900">{info.total_countries || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 font-bold">Total Users</p>
                      <p className="text-sm font-bold text-gray-900">{(info.total_users || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Services */}
                {info.services && info.services.length > 0 && (
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h3 className="font-bold text-lg mb-3">💼 Services</h3>
                    <div className="space-y-2">
                      {info.services.map((s, i) => (
                        <div key={i} className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-bold text-sm">{s.name}</p>
                          <p className="text-xs text-gray-600">{s.processing_time} · {s.fee_percent}% Fee</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                {(info.phone_number || info.email || info.website) && (
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h3 className="font-bold text-lg mb-3">☎️ Contact</h3>
                    <div className="space-y-2 text-sm">
                      {info.phone_number && <p>📱 {info.phone_number}</p>}
                      {info.email && <p>📧 {info.email}</p>}
                      {info.website && <p>🌐 {info.website}</p>}
                    </div>
                  </div>
                )}

                {/* Security */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <h3 className="font-bold text-lg mb-3">🛡️ Security</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-lg">{info.is_ssl_secured ? '✅' : '❌'}</p>
                      <p className="text-xs font-bold text-gray-600">SSL</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-lg">{info.is_encrypted ? '✅' : '❌'}</p>
                      <p className="text-xs font-bold text-gray-600">Encrypted</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-lg">{info.is_verified ? '✅' : '❌'}</p>
                      <p className="text-xs font-bold text-gray-600">Verified</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          // Edit Mode
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50"
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <X size={16} /> Cancel
              </button>
            </div>

            {/* Company Name */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <label className="block text-sm font-bold text-gray-600 mb-2">Company Name</label>
              <input
                type="text"
                value={editData.company_name || ''}
                onChange={e => setEditData({ ...editData, company_name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <label className="block text-sm font-bold text-gray-600 mb-2">Description</label>
              <textarea
                value={editData.company_description || ''}
                onChange={e => setEditData({ ...editData, company_description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-24"
              />
            </div>

            {/* Status & Numbers */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">Status</label>
                <select
                  value={editData.status || 'active'}
                  onChange={e => setEditData({ ...editData, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">Total Countries</label>
                  <input
                    type="number"
                    value={editData.total_countries || 0}
                    onChange={e => setEditData({ ...editData, total_countries: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">Total Users</label>
                  <input
                    type="number"
                    value={editData.total_users || 0}
                    onChange={e => setEditData({ ...editData, total_users: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-sm">Services</h3>
                <button
                  onClick={() => setShowServiceForm(!showServiceForm)}
                  className="text-xs bg-blue-600 text-white px-2 py-1 rounded-lg flex items-center gap-1"
                >
                  <Plus size={12} /> Add
                </button>
              </div>

              {showServiceForm && (
                <div className="bg-blue-50 p-3 rounded-lg mb-3 space-y-2 border-2 border-blue-200">
                  <input
                    type="text"
                    placeholder="Service name"
                    value={newService.name}
                    onChange={e => setNewService({ ...newService, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Processing time (e.g., 1-2 hours)"
                    value={newService.processing_time}
                    onChange={e => setNewService({ ...newService, processing_time: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="Fee %"
                      value={newService.fee_percent}
                      onChange={e => setNewService({ ...newService, fee_percent: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Min"
                      value={newService.min_limit}
                      onChange={e => setNewService({ ...newService, min_limit: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={newService.max_limit}
                      onChange={e => setNewService({ ...newService, max_limit: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    onClick={handleAddService}
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold"
                  >
                    Add Service
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {(editData.services || []).map((s, i) => (
                  <div key={i} className="bg-gray-50 p-3 rounded-lg flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-bold text-sm">{s.name}</p>
                      <p className="text-xs text-gray-600">{s.processing_time} · {s.fee_percent}%</p>
                    </div>
                    <button
                      onClick={() => handleRemoveService(i)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
              <input
                type="text"
                placeholder="Phone Number"
                value={editData.phone_number || ''}
                onChange={e => setEditData({ ...editData, phone_number: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="email"
                placeholder="Email"
                value={editData.email || ''}
                onChange={e => setEditData({ ...editData, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="url"
                placeholder="Website"
                value={editData.website || ''}
                onChange={e => setEditData({ ...editData, website: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {/* Legal Info */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
              <input
                type="text"
                placeholder="Trade License"
                value={editData.trade_license || ''}
                onChange={e => setEditData({ ...editData, trade_license: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Registration Number"
                value={editData.registration_number || ''}
                onChange={e => setEditData({ ...editData, registration_number: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Office Address"
                value={editData.office_address || ''}
                onChange={e => setEditData({ ...editData, office_address: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-20"
              />
            </div>

            {/* Security Flags */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editData.is_ssl_secured || false}
                  onChange={e => setEditData({ ...editData, is_ssl_secured: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-bold">SSL Secured</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editData.is_encrypted || false}
                  onChange={e => setEditData({ ...editData, is_encrypted: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-bold">Encrypted</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editData.is_verified || false}
                  onChange={e => setEditData({ ...editData, is_verified: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-bold">Verified</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </AdminPageWrapper>
  );
}