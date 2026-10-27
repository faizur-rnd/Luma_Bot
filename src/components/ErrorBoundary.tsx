import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button.tsx';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[LUMA ErrorBoundary] Caught render exception:', error?.message || error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div 
          role="alert" 
          className="min-h-[300px] flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] max-w-lg mx-auto my-8 shadow-sm"
        >
          <div className="w-12 h-12 rounded-full bg-[var(--warning)]/10 text-[var(--warning)] flex items-center justify-center mb-4 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[var(--text)] mb-2">
            Something interrupted this view
          </h2>
          <p className="text-sm text-[var(--muted)] mb-6 max-w-sm">
            {this.state.error?.message || 'A temporary issue occurred while rendering this section.'}
          </p>
          <div className="flex gap-3">
            <Button variant="primary" onClick={this.handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              <span>Retry</span>
            </Button>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Reload App
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
