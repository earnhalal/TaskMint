import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-[100dvh] bg-slate-50 flex flex-col items-center justify-center text-slate-800 p-6 fixed inset-0 z-[9999]">
          <h1 className="text-2xl font-black mb-4 text-rose-500 uppercase">App Error Recovered</h1>
          <p className="mb-6 opacity-70 text-center max-w-sm">We ran into a visual glitch. Please refresh the app. If you just updated, the new layout is syncing.</p>
          <pre className="bg-white border border-slate-200 shadow-inner p-4 rounded-xl text-[10px] max-w-full overflow-auto text-rose-400 font-mono mb-8 max-h-40">
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-colors shadow-xl"
          >
            Restart Session
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
