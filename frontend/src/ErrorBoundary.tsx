import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#0a0e1a', minHeight: '100vh', color: '#fca5a5', fontFamily: 'monospace' }}>
          <h1 style={{ color: '#ef4444' }}>⚠️ Error Fatal en SADE</h1>
          <p>La aplicación sufrió un fallo inesperado. Por favor tome captura de pantalla de este texto y envíelo al soporte técnico:</p>
          <div style={{ background: '#000', padding: '20px', borderRadius: '8px', overflowX: 'auto', marginTop: '20px', border: '1px solid #ef4444' }}>
            <h3 style={{ margin: 0, color: '#f87171' }}>{this.state.error && this.state.error.toString()}</h3>
            <pre style={{ color: '#9ca3af', marginTop: '10px', fontSize: '12px' }}>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </div>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{ marginTop: '20px', background: '#ef4444', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Borrar Caché y Reiniciar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
