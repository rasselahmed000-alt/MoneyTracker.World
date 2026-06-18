import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Globe, Facebook, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import AppShell from '../components/cellfin/AppShell';
import UniversalHeader from '@/components/cellfin/UniversalHeader';

// Pre-fetch & cache hook
const CACHE_KEY = 'aboutus_page_cache';
function useCachedAboutUs() {
  const [company, setCompany] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef(null);

  useEffect(() => {
    // Try to load from cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        setCompany(data.company);
        setDocuments(data.documents);
        setLoading(false);
      }
    } catch {}

    // Real-time sync
    const fetchAndSubscribe = async () => {
      try {
        const companyData = await base44.entities.CompanyInfo.filter({ status: 'active' }, '-created_date', 1);
        const docs = await base44.entities.AboutUs.filter({ is_published: true }, 'sort_order', 100);
        setCompany(companyData?.[0] || null);
        setDocuments(docs || []);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ company: companyData?.[0], documents: docs }));
      } catch {}
      setLoading(false);

      // Subscribe for live updates
      if (unsubRef.current) unsubRef.current();
      unsubRef.current = base44.entities.AboutUs.subscribe((event) => {
        setDocuments(prev => {
          let updated = [...prev];
          if (event.type === 'create') updated.push(event.data);
          else if (event.type === 'update') updated = updated.map(d => d.id === event.id ? event.data : d);
          else if (event.type === 'delete') updated = updated.filter(d => d.id !== event.id);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ company, documents: updated }));
          return updated;
        });
      });
    };
    fetchAndSubscribe();

    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  return { company, documents, loading };
}

function ContactRow({ icon, label, value, href }) {
  const content = (
    <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-98 transition-transform">
      <div className="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center shrink-0 text-forest">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer">{content}</a>;
  }
  return content;
}

export default function AboutUs() {
  const navigate = useNavigate();
  const { company, documents, loading } = useCachedAboutUs();

  return (
    <AppShell header={
      <UniversalHeader
        title="About Us"
        subtitle="আমাদের সম্পর্কে জানুন"
      />
    }>
      <div className="p-4 pb-6 space-y-4">
        {loading ? (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl h-52 animate-pulse border border-gray-100" />
            <div className="bg-white rounded-2xl h-32 animate-pulse border border-gray-100" />
            <div className="bg-white rounded-2xl h-48 animate-pulse border border-gray-100" />
          </div>
        ) : !company ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl">🏢</span>
            </div>
            <p className="text-gray-400 font-medium">Content coming soon...</p>
            <p className="text-gray-300 text-xs mt-1">Admin panel থেকে content যোগ করুন।</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Company Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-forest to-emerald-700 p-6">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
                  <span className="text-3xl">🏢</span>
                </div>
                <h2 className="text-white font-black text-xl leading-tight">
                  {company.company_name || 'Company Name'}
                </h2>
              </div>
              {company.company_description && (
                <div className="p-5">
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                    {company.company_description}
                  </p>
                </div>
              )}
            </div>

            {/* Contact Info */}
            {(company.email || company.phone_number || company.office_address || company.website) && (
              <div>
                <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2 px-1">Contact Info</p>
                <div className="space-y-2.5">
                  {company.email && (
                    <ContactRow icon={<Mail size={18} />} label="Support Email" value={company.email} href={`mailto:${company.email}`} />
                  )}
                  {company.phone_number && (
                    <ContactRow icon={<Phone size={18} />} label="Helpline" value={company.phone_number} href={`tel:${company.phone_number}`} />
                  )}
                  {company.office_address && (
                    <ContactRow icon={<MapPin size={18} />} label="Office Address" value={company.office_address} />
                  )}
                  {company.website && (
                    <ContactRow icon={<Globe size={18} />} label="Website" value={company.website} href={company.website} />
                  )}
                </div>
              </div>
            )}

            {/* Social Links */}
            {(company.facebook_url || company.whatsapp_number) && (
              <div>
                <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2 px-1">Social Links</p>
                <div className="space-y-2.5">
                  {company.facebook_url && (
                    <ContactRow icon={<Facebook size={18} />} label="Facebook" value="Facebook Page" href={company.facebook_url} />
                  )}
                  {company.whatsapp_number && (
                    <ContactRow icon={<MessageCircle size={18} />} label="WhatsApp" value={company.whatsapp_number} href={`https://wa.me/${company.whatsapp_number.replace(/\D/g, '')}`} />
                  )}
                </div>
              </div>
            )}

            {/* Dynamic Documents Section */}
            {documents.length > 0 && (
              <div className="space-y-3">
                {documents.map((doc, i) => (
                  <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2 px-1">{doc.title}</p>
                    {doc.image_url && (
                      <div className="rounded-2xl overflow-hidden shadow-sm bg-gray-100 border border-gray-100 w-full">
                        <img src={doc.image_url} alt={doc.title} className="w-full h-auto block" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}