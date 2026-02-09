import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6 mx-auto">
              <span className="material-symbols-outlined text-red-600 text-3xl">error</span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 text-center mb-3">
              Algo deu errado
            </h1>

            <p className="text-slate-600 text-center mb-6">
              Encontramos um erro inesperado. Tente recarregar a página ou volte mais tarde.
            </p>

            {this.state.error && (
              <details className="mb-6 text-sm">
                <summary className="cursor-pointer text-slate-500 hover:text-slate-700 mb-2">
                  Detalhes técnicos
                </summary>
                <pre className="bg-slate-50 p-4 rounded-lg overflow-auto text-xs text-red-600">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-primary text-white px-6 py-3 rounded-xl hover:opacity-90 transition font-medium"
              >
                Recarregar página
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-slate-200 text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-300 transition font-medium"
              >
                Ir para Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
