import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught exception]:', error, errorInfo);
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
        <div 
          style={{
            minHeight: '100vh',
            backgroundColor: '#fafafa',
            color: '#09090b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          <div 
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: '#ffffff',
              border: '2px solid #09090b',
              boxShadow: '6px 6px 0px #09090b',
              padding: '2.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #ef4444', color: '#991b1b' }}>
                <AlertTriangle size={24} />
              </div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                ALGO NO HA SALIDO COMO ESPERÁBAMOS
              </h1>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#52525b', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Ha ocurrido una incidencia puntual en la interfaz. Tus datos y reservas previas están a salvo. Puedes reiniciar la página para volver al estado normal.
            </p>

            {this.state.error?.message && (
              <div 
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  backgroundColor: '#f4f4f5',
                  padding: '0.75rem',
                  borderLeft: '3px solid #09090b',
                  marginBottom: '1.75rem',
                  color: '#71717a',
                  wordBreak: 'break-word'
                }}
              >
                Error: {this.state.error.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.25rem',
                  backgroundColor: '#09090b',
                  color: '#ffffff',
                  border: '1px solid #09090b',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={15} />
                REINTENTAR / RECARGAR
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.25rem',
                  backgroundColor: '#ffffff',
                  color: '#09090b',
                  border: '1px solid #09090b',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                <Home size={15} />
                IR AL INICIO
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
