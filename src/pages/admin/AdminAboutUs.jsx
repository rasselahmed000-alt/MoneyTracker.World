import { useState, useEffect } from 'react';
import { Save, Upload, X, Loader2, CheckCircle2, Building2, Mail, Phone, MapPin, Globe, Facebook, MessageCircle, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AdminShell from '../../components/AdminShell';

const EMPTY = {
  company_name: '',
  company_description: '',
  email: '',
  phone_number: '',
  office_address: '',
  website: '',
  facebook_url: '',
  whatsapp_number: '',
  gallery_images: [],
};

function DocumentCard({ doc, onRefresh }) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.AboutUs.update(doc.id, { image_url: file_url });
      onRefresh();
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('এই document delete করতে চান?')) return;
    setDeleting(true);
    try {
      await base44.entities.AboutUs.delete(doc.id);
      onRefresh();
    } catch {
      alert('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-gray-50 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-800 text-sm">{doc.title}</h3>
          <p className="text-xs text-gray-400">{doc.image_url ? 'Image uploaded' : 'No image yet'}</p>
        </div>
        <button onClick={handleDelete} disabled={deleting}
          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-60 transition-colors">
          <Trash2 size={16} />
        </button>
      </div>

      {doc.image_url ? (
        <div className="relative rounded-lg overflow-hidden bg-gray-100 max-h-48">
          <img src={doc.image_url} alt={doc.title} className="w-full h-full object-cover max-h-48" />
          <label className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors cursor-pointer group">
            <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1">
              <Upload size={18} />
              <span className="text-xs font-bold">Change</span>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>
      ) : (
        <label className="flex items-center justify-center gap-2 py-6 rounded-lg border-2 border-dashed border-gray-300 hover:border-forest hover:bg-emerald-50 cursor-pointer transition-all group">
          {uploading ? (
            <Loader2 size={18} className="animate-spin text-forest" />
          ) : (
            <>
              <Upload size={18} className="text-gray-400 group-hover:text-forest transition-colors" />
              <span className="text-xs font-bold text-gray-400 group-hover:text-forest transition-colors">Upload Image</span>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
      )}
    </div>
  );
}

export default function AdminAboutUs() {
  const [form, setForm] = useState(EMPTY);
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [docLoading, setDocLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.CompanyInfo.list('-created_date', 1),
      base44.entities.AboutUs.filter({ is_published: true }, 'sort_order', 100),
    ]).then(([compData, docData]) => {
      const rec = compData?.[0];
      if (rec) {
        setRecordId(rec.id);
        setForm({
          company_name: rec.company_name || '',
          company_description: rec.company_description || '',
          email: rec.email || '',
          phone_number: rec.phone_number || '',
          office_address: rec.office_address || '',
          website: rec.website || '',
          facebook_url: rec.facebook_url || '',
          whatsapp_number: rec.whatsapp_number || '',
          gallery_images: rec.gallery_images || [],
        });
      }
      setDocuments(docData || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);



  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        gallery_images: (form.gallery_images || []).filter(Boolean),
        status: 'active',
      };
      if (recordId) {
        await base44.entities.CompanyInfo.update(recordId, payload);
      } else {
        const created = await base44.entities.CompanyInfo.create(payload);
        setRecordId(created.id);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const field = (key, label, icon, placeholder, multiline = false) => (
    <div>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
        {icon} {label}
      </label>
      {multiline ? (
        <textarea
          rows={4}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className="w-full border-2 border-gray-200 focus:border-forest rounded-xl px-3.5 py-3 text-sm outline-none resize-none transition-colors"
        />
      ) : (
        <input
          type="text"
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className="w-full border-2 border-gray-200 focus:border-forest rounded-xl px-3.5 py-3 text-sm outline-none transition-colors"
        />
      )}
    </div>
  );

  if (loading) {
    return (
      <AdminShell>
        <div className="p-6 flex items-center justify-center min-h-[300px]">
          <Loader2 size={32} className="animate-spin text-forest" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="p-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">About Us</h1>
            <p className="text-sm text-gray-500 mt-0.5">Customer app-এ About Us page এর content manage করুন</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-forest text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-60 transition-all shadow-sm"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>

        <div className="space-y-5">
          {/* Company Info Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wider">🏢 Company Info</h2>
            {field('company_name', 'Company Name', <Building2 size={12} />, 'e.g. Money Tracker Ltd.')}
            {field('company_description', 'Company Description', null, 'Company সম্পর্কে বিস্তারিত লিখুন...', true)}
          </div>

          {/* Contact Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wider">📞 Contact Info</h2>
            {field('email', 'Support Gmail', <Mail size={12} />, 'support@example.com')}
            {field('phone_number', 'Helpline Number', <Phone size={12} />, '+880 1XXX-XXXXXX')}
            {field('office_address', 'Office Address', <MapPin size={12} />, 'Dhaka, Bangladesh')}
          </div>

          {/* Links Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wider">🔗 Social & Web Links</h2>
            {field('website', 'Website', <Globe size={12} />, 'https://yourwebsite.com')}
            {field('facebook_url', 'Facebook Page', <Facebook size={12} />, 'https://facebook.com/yourpage')}
            {field('whatsapp_number', 'WhatsApp Number', <MessageCircle size={12} />, '+880 1XXX-XXXXXX')}
          </div>

          <hr className="border-gray-200" />

          {/* Dynamic Documents Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wider">📄 Dynamic Documents</h2>
                <p className="text-xs text-gray-400 mt-1">Trade license, permits, certifications ইত্যাদি আপলোড করুন</p>
              </div>
              <button onClick={() => {
                const newTitle = prompt('Document title (e.g., "International Trade License"):');
                if (newTitle) {
                  base44.entities.AboutUs.create({
                    title: newTitle,
                    image_url: '',
                    is_published: true,
                    sort_order: documents.length,
                  }).then(() => {
                    base44.entities.AboutUs.filter({ is_published: true }, 'sort_order', 100).then(setDocuments);
                  });
                }
              }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-forest text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity">
                <Plus size={14} /> Add Document
              </button>
            </div>

            {documents.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">কোনো document নেই। নতুন document যোগ করুন।</p>
            ) : (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} onRefresh={() => {
                    base44.entities.AboutUs.filter({ is_published: true }, 'sort_order', 100).then(setDocuments);
                  }} />
                ))}
              </div>
            )}
          </div>

          {/* Save at bottom too */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-forest text-white rounded-2xl font-bold text-sm hover:opacity-90 disabled:opacity-60 transition-all shadow-sm"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
            {saving ? 'Saving...' : saved ? '✅ Changes Saved!' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </AdminShell>
  );
}