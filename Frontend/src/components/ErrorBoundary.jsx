import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('FreshBasket ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200 shadow-xl">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Something unexpected happened</h1>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              We encountered an issue rendering this view. Your session and cart data are safe.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-emerald-800 py-3 text-xs font-bold text-white hover:bg-emerald-700 transition"
              >
                <RefreshCw size={14} />
                Refresh Page
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center gap-2 rounded-full border border-gray-200 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                <Home size={14} />
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
