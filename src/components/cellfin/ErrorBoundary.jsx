import { Component } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Error Boundary to prevent app crashes
 * Catches errors and shows graceful error UI
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error?.message, error?.stack, errorInfo?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-lg font-black text-foreground mb-2">Something went wrong</h1>
          <p className="text-sm text-muted-foreground text-center mb-2">
            আমরা সমস্যা সমাধান করছি। দয়া করে অ্যাপ রিলোড করুন।
          </p>
          {this.state.error?.message && (
            <p className="text-xs text-red-400 text-center mb-4 font-mono bg-red-50 px-3 py-2 rounded-xl max-w-sm break-all">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm"
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}