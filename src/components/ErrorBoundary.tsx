import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'An unexpected error occurred.';
      let isFirestoreError = false;

      try {
        const parsedError = JSON.parse(this.state.error?.message || '');
        if (parsedError.error && parsedError.operationType) {
          errorMessage = `Database Error: ${parsedError.error} (Operation: ${parsedError.operationType})`;
          isFirestoreError = true;
        }
      } catch (e) {
        // Not a JSON error
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full glass p-8 rounded-3xl text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-bold text-white">Something went wrong</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {errorMessage}
              </p>
            </div>
            {isFirestoreError && (
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
                Please check your Firebase configuration or security rules.
              </p>
            )}
            <button
              onClick={this.handleReset}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
