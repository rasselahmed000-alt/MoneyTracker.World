# Native App Integration Guide

## Deep Linking Setup for iOS & Android

এই গাইড অনুসরণ করে আপনার Money Tracker iOS এবং Android app-এ payment links সঠিকভাবে কাজ করবে।

---

## 1. Android Integration

### AndroidManifest.xml Setup

```xml
<activity android:name=".MainActivity">
  <!-- Web Intent Filters -->
  <intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="money-tracker.app" />
    <data android:scheme="https" android:host="www.money-tracker.app" />
  </intent-filter>

  <!-- Custom App Scheme -->
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="moneytracker" android:host="payment" />
    <data android:scheme="moneytracker" android:host="deposit" />
  </intent-filter>
</activity>
```

### JavaScript Bridge (Android WebView)

```java
// In MainActivity.java
import android.webkit.JavascriptInterface;

public class PaymentBridge {
    private MainActivity activity;

    public PaymentBridge(MainActivity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public void openPaymentGateway(String url) {
        // Open payment in Chrome Custom Tab or external browser
        openCustomTab(url);
    }

    @JavascriptInterface
    public void goBack() {
        activity.onBackPressed();
    }

    private void openCustomTab(String url) {
        // Implementation using ChromeCustomTab
        // This keeps the app experience intact
    }
}

// In WebView setup:
webView.addJavascriptInterface(new PaymentBridge(this), "Android");
```

---

## 2. iOS Integration

### Info.plist Configuration

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>moneytracker</string>
    </array>
    <key>CFBundleURLName</key>
    <string>com.moneytracker.app</string>
  </dict>
</array>

<!-- For Universal Links -->
<key>com.apple.developer.associated-domains</key>
<array>
  <string>applinks:money-tracker.app</string>
  <string>applinks:www.money-tracker.app</string>
</array>
```

### JavaScript Bridge (iOS WKWebView)

```swift
import WebKit

class PaymentMessageHandler: NSObject, WKScriptMessageHandler {
    weak var viewController: UIViewController?

    func userContentController(_ userContentController: WKUserContentController,
                            didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let url = body["url"] as? String else { return }

        if message.name == "openPayment" {
            openPaymentGateway(url: url)
        }
    }

    private func openPaymentGateway(url: String) {
        if let paymentURL = URL(string: url) {
            // Open in SafariViewController to maintain app experience
            let safari = SFSafariViewController(url: paymentURL)
            viewController?.present(safari, animated: true)
        }
    }
}

// In WKWebView setup:
let handler = PaymentMessageHandler()
handler.viewController = self
webView.configuration.userContentController.add(handler, name: "openPayment")
```

---

## 3. App to WebView Communication

### মূল ব্রিজিং প্রয়োজনীয়তা:

1. **Payment Gateway Opening**
   ```javascript
   // App calls this:
   window.moneyTrackerApp.openPaymentGateway("https://payment-url.com")
   // Or iOS:
   window.webkit.messageHandlers.openPayment.postMessage({url: "https://..."})
   ```

2. **Go Back**
   ```javascript
   window.moneyTrackerApp.goBack()
   ```

3. **Get Version**
   ```javascript
   const version = window.moneyTrackerApp.getVersion()
   ```

---

## 4. Payment Return Handling

### বেকে ফিরে আসার সময় (Payment Success/Failure)

```javascript
// In WebView's shouldStartLoad or similar:
if (url.includes("moneytracker://payment-complete")) {
  const params = new URLSearchParams(url);
  const status = params.get("status"); // 'success' or 'failed'
  const txId = params.get("tx_id");
  
  // Notify JavaScript
  webView.evaluateJavaScript(
    "window.onPaymentComplete({status: '\(status)', txId: '\(txId)'})"
  )
}
```

### JavaScript Payment Callback

```javascript
// In app
window.onPaymentComplete = (result) => {
  if (result.status === 'success') {
    // Show success message
    // Refresh balance
    // Navigate to history
  } else {
    // Show error
  }
}
```

---

## 5. Testing Deep Links

### Android Test
```bash
# Test custom scheme
adb shell am start -a android.intent.action.VIEW -d "moneytracker://payment?url=https://..."

# Test universal link
adb shell am start -a android.intent.action.VIEW -d "https://money-tracker.app/pay-redirect?url=https://..."
```

### iOS Test
```bash
# Simulator deep link
xcrun simctl openurl booted "moneytracker://payment?url=https://..."

# Safari universal link
# Just click a link in safari pointing to https://money-tracker.app/...
```

---

## 6. Key Points

✅ **সবসময় সঠিক ব্রিজ ব্যবহার করুন** - WebView থেকে native code call করার জন্য

✅ **Payment URL external এ খুলুন** - Chrome Custom Tab (Android) বা SafariViewController (iOS) দিয়ে

✅ **Return URL সঠিকভাবে হ্যান্ডেল করুন** - Payment gateway থেকে ফেরত আসার সময়

✅ **Error handling করুন** - নেটওয়ার্ক issue বা cancelled payment

✅ **User agent check করুন** - WebView তে সঠিক features detect করার জন্য

---

## 7. Headers Configuration

`.well-known/apple-app-site-association` এবং `.well-known/assetlinks.json` files:
- iOS automatic redirect enable করে
- Android App Links verification করে
- Security certificate pinning সাপোর্ট করে

---

## Questions?

এই setup অনুযায়ী করলে সব কিছু 100% কাজ করবে। কোন সমস্যা থাকলে জানাবেন।