import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorInfo: string | null;
}

export class SystemShield extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    let errorInfo = error.message;
    try {
      // Try to parse if it's our custom JSON error
      const parsed = JSON.parse(error.message);
      errorInfo = JSON.stringify(parsed, null, 2);
    } catch (e) {
      // Not JSON, use as is
    }
    return { hasError: true, errorInfo };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 font-mono">
          <div className="max-w-2xl w-full bg-[#1a0a0a] border border-red-900/50 p-8 rounded-lg">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertTriangle size={24} />
              <h2 className="text-xl font-bold uppercase tracking-tighter">System Fault Detected</h2>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              An unrecoverable error occurred during a secure operation. This may be due to insufficient permissions or a network failure.
            </p>
            <div className="bg-black/50 p-4 rounded border border-red-900/30 mb-6 overflow-auto max-h-64">
              <pre className="text-xs text-red-400 leading-relaxed">
                {this.state.errorInfo}
              </pre>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 px-4 py-2 rounded text-sm transition-colors"
            >
              <RefreshCcw size={16} />
              REBOOT SYSTEM
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
