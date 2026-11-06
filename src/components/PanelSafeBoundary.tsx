import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  title?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PanelSafeBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[PanelSafeBoundary] Caught error in panel "${this.props.title || 'Unknown'}":`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#1a0a0a] border border-red-900/30 p-5 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 font-mono min-h-[160px]">
          <AlertTriangle className="text-red-500 w-8 h-8" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-400">
              {this.props.title || 'Visualization Tab'} Failure
            </h4>
            <p className="text-[10px] text-gray-400 max-w-md">
              A rendering exception occurred in this panel: <code className="text-red-300 bg-black/40 px-1 py-0.5 rounded">{this.state.error?.message || 'Unknown error'}</code>.
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/40 rounded-xl text-[10px] transition-colors font-bold uppercase tracking-wider"
          >
            <RefreshCw size={11} />
            Reset Panel
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
