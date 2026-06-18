/**
 * Payment Link Opener - Opens payment links in EXTERNAL browser
 * Uses native bridges (Android/iOS) to escape WebView
 */

export const openPaymentLink = (url) => {
  if (!url || url.trim().length === 0) {
    throw new Error('Payment URL is empty');
  }

  // Try Android native bridge first
  if (window.Android?.openURL) {
    try {
      window.Android.openURL(url);
      return;
    } catch (e) {
      console.warn('Android bridge failed:', e);
    }
  }

  // Try iOS native bridge
  if (window.webkit?.messageHandlers?.openURL) {
    try {
      window.webkit.messageHandlers.openURL.postMessage({ url });
      return;
    } catch (e) {
      console.warn('iOS bridge failed:', e);
    }
  }

  // Try generic app bridge
  if (window.moneyTrackerApp?.openExternalBrowser) {
    try {
      window.moneyTrackerApp.openExternalBrowser(url);
      return;
    } catch (e) {
      console.warn('App bridge failed:', e);
    }
  }

  // Web fallback - force external by simulating link click
  try {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    window.location.href = url;
  }
};





/**
 * Simplified API for quick payment opening
 * Used in deposit flows
 */
export const quickOpenPayment = (url) => {
  return openPaymentLink(url).catch((err) => {
    console.error('Payment opening failed:', err);
    // Show user-friendly error
    throw new Error('Unable to open payment. Please try again or contact support.');
  });
};