import { base44 } from '@/api/base44Client';

const CACHE_KEY = 'aboutus_page_cache';

/**
 * Pre-fetch About Us data on app launch
 * This runs once on app initialization to cache data locally
 * preventing any loading delays when user navigates to About Us page
 */
export async function preloadAboutUsData() {
  try {
    // Fetch company info and documents in parallel
    const [companyData, documents] = await Promise.all([
      base44.entities.CompanyInfo.filter({ status: 'active' }, '-created_date', 1),
      base44.entities.AboutUs.filter({ is_published: true }, 'sort_order', 100),
    ]);

    // Cache to localStorage for instant access
    const cacheData = {
      company: companyData?.[0] || null,
      documents: documents || [],
      timestamp: Date.now(),
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

    // Pre-load image URLs in browser cache (parallel requests)
    const allImages = [
      companyData?.[0]?.logo_url,
      ...((documents || []).map(d => d.image_url).filter(Boolean)),
    ].filter(Boolean);

    allImages.forEach(url => {
      const img = new Image();
      img.src = url;
    });

    return cacheData;
  } catch (err) {
    console.warn('About Us preload failed:', err);
    return null;
  }
}

export function getCachedAboutUsData() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}