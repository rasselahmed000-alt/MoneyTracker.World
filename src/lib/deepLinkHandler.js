/**
 * Deep Link Handler
 * Handles payment links in native app webview and browser
 */

export const isInNativeApp = () => {
  const userAgent = navigator.userAgent;
  return (
    /MoneyTrackerApp|moneytracker|webview/i.test(userAgent) ||
    window.moneyTrackerApp !== undefined ||
    (window.Android && window.Android.openPaymentGateway !== undefined) ||
    (window.webkit && window.webkit.messageHandlers !== undefined)
  );
};

export const openPaymentGateway = (paymentUrl) => {
  console.log('🎯 [PAYMENT GATEWAY] Called with URL:', paymentUrl);
  
  if (!paymentUrl) {
    console.error('❌ [PAYMENT GATEWAY] URL is empty or null');
    return;
  }

  console.log('📱 [PAYMENT GATEWAY] Detecting platform...');
  console.log('🔍 [PLATFORM CHECK]', {
    hasMoneyTrackerApp: !!window.moneyTrackerApp,
    hasAndroid: !!window.Android,
    hasWebKit: !!window.webkit,
    userAgent: navigator.userAgent.substring(0, 100),
  });

  try {
    // Try React Native Android bridge first
    if (window.moneyTrackerApp?.openPaymentGateway) {
      console.log('✅ [PAYMENT GATEWAY] Using React Native Android Bridge');
      window.moneyTrackerApp.openPaymentGateway(paymentUrl);
      return;
    }

    // Try WebView Android bridge
    if (window.Android?.openPaymentGateway) {
      console.log('✅ [PAYMENT GATEWAY] Using WebView Android Bridge');
      window.Android.openPaymentGateway(paymentUrl);
      return;
    }

    // Try iOS WKWebView bridge
    if (window.webkit?.messageHandlers?.openPayment) {
      console.log('✅ [PAYMENT GATEWAY] Using iOS WKWebView Bridge');
      window.webkit.messageHandlers.openPayment.postMessage({ url: paymentUrl });
      return;
    }

    // Web fallback - use window.open instead of location.href
    console.log('⚠️  [PAYMENT GATEWAY] No native bridge found, using web fallback (window.open)');
    const newWindow = window.open(paymentUrl, '_blank');
    if (!newWindow) {
      console.error('❌ [PAYMENT GATEWAY] Failed to open window (popup blocked?)');
      // Try alternative: direct href
      console.log('🔄 [PAYMENT GATEWAY] Trying alternative: location.href');
      window.location.href = paymentUrl;
    } else {
      console.log('✅ [PAYMENT GATEWAY] Successfully opened in new window');
    }
  } catch (err) {
    console.error('❌ [PAYMENT GATEWAY] Exception occurred:', err);
    throw err;
  }
};

export const openBrowser = (url) => {
  console.log('🌐 [OPEN BROWSER] Called with URL:', url);
  
  if (!url || url.trim().length === 0) {
    console.error('❌ [OPEN BROWSER] URL is empty');
    throw new Error('Invalid payment URL');
  }

  try {
    // Try React Native Android bridge
    if (window.moneyTrackerApp?.openBrowser) {
      console.log('✅ [OPEN BROWSER] Using React Native Bridge');
      window.moneyTrackerApp.openBrowser(url);
      return;
    }

    // Try WebView Android bridge
    if (window.Android?.openBrowser) {
      console.log('✅ [OPEN BROWSER] Using Android WebView Bridge');
      window.Android.openBrowser(url);
      return;
    }

    // Try iOS WKWebView bridge
    if (window.webkit?.messageHandlers?.openBrowser) {
      console.log('✅ [OPEN BROWSER] Using iOS WKWebView Bridge');
      window.webkit.messageHandlers.openBrowser.postMessage({ url });
      return;
    }

    // Web fallback - must use window.open for external browser
    console.log('⚠️  [OPEN BROWSER] No native bridge, using web fallback');
    const newWindow = window.open(url, '_blank');
    
    if (!newWindow) {
      console.error('❌ [OPEN BROWSER] Popup blocked or window.open failed');
      // Last resort: direct navigation
      console.log('🔄 [OPEN BROWSER] Trying direct location redirect');
      window.location.href = url;
    } else {
      console.log('✅ [OPEN BROWSER] Successfully opened in external browser');
    }
  } catch (err) {
    console.error('❌ [OPEN BROWSER] Exception:', err);
    throw err;
  }
};

export const goBack = () => {
  if (window.moneyTrackerApp?.goBack) {
    window.moneyTrackerApp.goBack();
  } else if (window.Android?.goBack) {
    window.Android.goBack();
  } else if (window.webkit?.messageHandlers?.goBack) {
    window.webkit.messageHandlers.goBack.postMessage({});
  }
};

export const getAppVersion = () => {
  if (window.moneyTrackerApp?.getVersion) {
    return window.moneyTrackerApp.getVersion();
  }
  return null;
};

// Handle incoming deep links from app
export const setupDeepLinkListener = (callback) => {
  window.handleDeepLink = (deepLink) => {
    callback(deepLink);
  };
};