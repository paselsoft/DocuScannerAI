import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children?: ReactNode;
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
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHardReset = () => {
    if (window.confirm("Attenzione: Questo cancellerà le impostazioni locali e la cache. I dati salvati nel Cloud non andranno persi. Continuare?")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 text-center">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-xl font-bold text-slate-900 mb-2">Qualcosa è andato storto</h1>
            <p className="text-slate-500 text-sm mb-6">
              Si è verificato un errore imprevisto nell'applicazione.
            </p>

            {this.state.error && (
                <div className="bg-slate-100 p-3 rounded-lg text-xs font-mono text-slate-600 mb-6 text-left overflow-auto max-h-32">
                    {this.state.error.toString()}
                </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Ricarica Applicazione
              </button>
              
              <button
                onClick={this.handleHardReset}
                className="w-full bg-white text-slate-600 border border-slate-300 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Trash2 className="w-4 h-4" /> Reset Completo (Risolvi Problemi)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}