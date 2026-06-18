import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import AdminShell from '../../components/AdminShell';
import { AdminCard, AdminCardHeader, AddButton, StatusBadge, EmptyState } from '../../components/admin/AdminPageWrapper';
import { ImageIcon, Pencil, Trash2, X, Cloud, Eye, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function BannerModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || { title: '', image_url: '', link_url: '', is_active: true, sort_order: 0 });
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageProcess = async (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
        setForm(prev => ({ ...prev, image_url: e.target.result }));
      };
      reader.readAsDataURL(file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(p => Math.min(p + 20, 90));
      }, 200);

      // Upload file
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        setForm(prev => ({ ...prev, image_url: uploadRes.file_url }));
        setUploading(false);
        setUploadProgress(0);
      }, 300);
    } catch (err) {
      alert('Upload failed: ' + err.message);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleImageProcess(files[0]);
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.image_url) {
      alert('Please fill in title and upload image');
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        await base44.entities.Banner.update(form.id, form);
      } else {
        await base44.entities.Banner.create(form);
      }
      onSave();
      onClose();
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white">
          <h3 className="font-black text-xl text-slate-900">{form.id ? 'Edit' : 'Create'} Banner</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Title Input */}
          <div>
            <label className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2.5 block">Banner Title</label>
            <input
              value={form.title || ''}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Summer Sale 2024"
              className="w-full border-2 border-slate-200 focus:border-emerald-500 rounded-2xl px-5 py-3.5 font-semibold text-sm outline-none bg-white focus:bg-emerald-50/30 transition-all"
            />
          </div>

          {/* Image Upload Area */}
          <div>
            <label className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2.5 block">Banner Image</label>
            <motion.div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              animate={{
                borderColor: dragActive ? '#10b981' : '#e2e8f0',
                backgroundColor: dragActive ? 'rgba(16, 185, 129, 0.05)' : '#f8fafc',
              }}
              className="relative border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleImageProcess(e.target.files[0])}
                className="hidden"
              />

              {uploading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 flex items-center justify-center text-white">
                    <Loader2 size={24} className="animate-spin" />
                  </div>
                  <div className="w-full max-w-xs">
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 text-center mt-2 font-semibold">{uploadProgress}%</p>
                  </div>
                </div>
              ) : form.image_url ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Eye size={24} />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-800 text-sm">Image Selected</p>
                    <p className="text-xs text-slate-500 mt-1">Click to change</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <Cloud size={24} />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-800 text-sm">Drop image here or browse</p>
                    <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, WEBP</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Image Preview */}
          {form.image_url && (
            <div className="space-y-2">
              <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Live Preview</p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden shadow-lg border border-slate-100"
              >
                <img src={form.image_url} alt="preview" className="w-full h-40 object-cover" />
              </motion.div>
            </div>
          )}

          {/* Link URL */}
          <div>
            <label className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2.5 block">Link URL (Optional)</label>
            <input
              value={form.link_url || ''}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              placeholder="https://example.com"
              className="w-full border-2 border-slate-200 focus:border-emerald-500 rounded-2xl px-5 py-3.5 font-semibold text-sm outline-none bg-white focus:bg-emerald-50/30 transition-all"
            />
          </div>

          {/* Sort Order */}
          <div>
            <label className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2.5 block">Display Order</label>
            <input
              type="number"
              value={form.sort_order || 0}
              onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) })}
              className="w-full border-2 border-slate-200 focus:border-emerald-500 rounded-2xl px-5 py-3.5 font-semibold text-sm outline-none bg-white focus:bg-emerald-50/30 transition-all"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 bg-slate-50">
            <span className="font-semibold text-sm text-slate-700">Active Status</span>
            <button
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                form.is_active ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <motion.div
                className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full"
                animate={{ x: form.is_active ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        </div>

        {/* Sticky Action Buttons */}
        <div className="sticky bottom-0 flex gap-3 px-8 py-6 border-t border-slate-100 bg-white">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl border-2 border-slate-200 font-bold text-slate-700 text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading || !form.title || !form.image_url}
            className="flex-1 py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            style={{
              background: saving || uploading ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            }}
          >
            {saving ? 'Saving...' : uploading ? 'Uploading...' : form.id ? 'Update' : 'Create'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function BannerCard({ banner, onEdit, onDelete, onToggle, onMoveUp, onMoveDown, canMoveUp, canMoveDown }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-2xl overflow-hidden border border-slate-100 hover:shadow-lg transition-all"
    >
      {banner.image_url ? (
        <img src={banner.image_url} alt={banner.title} className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <ImageIcon size={32} className="text-slate-300" />
        </div>
      )}
      <div className="p-4 space-y-3">
        <div>
          <p className="font-bold text-sm text-slate-800">{banner.title}</p>
          {banner.link_url && <p className="text-xs text-slate-500 truncate mt-1">{banner.link_url}</p>}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            <button
              onClick={() => onMoveUp()}
              disabled={!canMoveUp}
              className="p-2 rounded-lg hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-400 hover:text-blue-600 transition-colors text-xs"
              title="Move up"
            >
              ↑
            </button>
            <button
              onClick={() => onMoveDown()}
              disabled={!canMoveDown}
              className="p-2 rounded-lg hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-400 hover:text-blue-600 transition-colors text-xs"
              title="Move down"
            >
              ↓
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggle()}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              style={{
                background: banner.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                color: banner.is_active ? '#10b981' : '#6b7280',
              }}
            >
              {banner.is_active ? 'Active' : 'Inactive'}
            </button>
            <button
              onClick={() => onEdit()}
              className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete()}
              className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminBanners() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Banner.list('sort_order', 200);
      setItems(data || []);
    } catch (err) {
      console.error('Failed to load banners:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this banner?')) {
      await base44.entities.Banner.delete(id);
      load();
    }
  };

  const handleToggle = async (id, isActive) => {
    await base44.entities.Banner.update(id, { is_active: !isActive });
    load();
  };

  const handleMoveOrder = async (id, direction) => {
    const banner = items.find(b => b.id === id);
    if (!banner) return;

    const newOrder = direction === 'up' ? banner.sort_order - 1 : banner.sort_order + 1;
    await base44.entities.Banner.update(id, { sort_order: newOrder });
    load();
  };

  return (
    <AdminShell>
      <div className="p-6">
        <AdminCard>
          <AdminCardHeader
            title={`Banners (${items.length})`}
            subtitle="Manage promotional banners displayed in the app"
            action={<AddButton onClick={() => setModal({})} label="Create Banner" />}
          />

          {loading ? (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={ImageIcon} message="No banners created yet. Start by adding your first promotional banner." />
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="layout">
                  {items.map((banner, idx) => (
                    <BannerCard
                      key={banner.id}
                      banner={banner}
                      onEdit={() => setModal(banner)}
                      onDelete={() => handleDelete(banner.id)}
                      onToggle={() => handleToggle(banner.id, banner.is_active)}
                      onMoveUp={() => handleMoveOrder(banner.id, 'up')}
                      onMoveDown={() => handleMoveOrder(banner.id, 'down')}
                      canMoveUp={idx > 0}
                      canMoveDown={idx < items.length - 1}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </AdminCard>
      </div>

      <AnimatePresence>
        {modal !== null && (
          <BannerModal item={modal.id ? modal : null} onClose={() => setModal(null)} onSave={load} />
        )}
      </AnimatePresence>
    </AdminShell>
  );
}