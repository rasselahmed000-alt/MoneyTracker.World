import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupDeepLinkListener } from '@/lib/deepLinkHandler';

/**
 * Deep Link Handler Component
 * Intercepts and routes deep links from native app to correct pages
 * 
 * Usage: Add to App.jsx before all routes
 */
export default function DeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    setupDeepLinkListener((deepLink) => {
      // Parse the deep link and navigate to the correct route
      try {
        const url = new URL(deepLink);
        const pathname = url.pathname;
        const search = url.search;

        // Route deep links to appropriate pages
        if (pathname.includes('/add-money')) {
          navigate('/add-money');
        } else if (pathname.includes('/deposit-options')) {
          const countryId = url.searchParams.get('country_id');
          if (countryId) {
            navigate(`/deposit-options/${countryId}`, { state: { country: { id: countryId } } });
          } else {
            navigate('/add-money');
          }
        } else if (pathname.includes('/pay-redirect')) {
          navigate(`/pay-redirect${search}`);
        } else if (pathname.includes('/mobile-banking-transfer')) {
          navigate(`/mobile-banking-transfer${search}`);
        } else if (pathname.includes('/bank-transfer')) {
          navigate('/bank-transfer');
        } else if (pathname.includes('/intl-transfer')) {
          navigate('/intl-transfer');
        } else if (pathname.includes('/history')) {
          navigate('/history');
        } else if (pathname.includes('/profile')) {
          navigate('/profile');
        } else if (pathname.includes('/wallet')) {
          navigate('/wallet');
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Deep link parsing error:', error);
        navigate('/');
      }
    });
  }, [navigate]);

  return null;
}