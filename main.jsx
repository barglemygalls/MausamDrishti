import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MapAnalysis } from './pages/MapAnalysis';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '24px',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '640px',
            backgroundColor: '#1E293B',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #334155',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#EF4444', margin: '0 0 12px 0' }}>
              Meteorological Console Initialization Error
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '16px' }}>
              The application encountered an unexpected runtime state. You can reload the page or return to the main dashboard.
            </p>
            <pre style={{
              backgroundColor: '#0F172A',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#F8FAFC',
              overflow: 'auto',
              maxHeight: '180px',
              marginBottom: '16px'
            }}>
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                Reload Window
              </button>
              <button
                onClick={() => {
                  window.location.hash = '';
                  window.location.reload();
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#334155',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Root() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Determine if URL is targeting the standalone Map Analysis in a new tab
  const isMapRoute = hash.startsWith('#/map') || hash.startsWith('#map');

  if (isMapRoute) {
    const cleanHash = hash.replace(/^#\/?map\??/, '');
    const searchParams = new URLSearchParams(cleanHash);
    const initialGridId = searchParams.get('grid') || null;
    const initialDay = searchParams.get('day') ? parseInt(searchParams.get('day'), 10) : 5;
    const initialVariable = searchParams.get('variable') || 'temperature';
    const initialMode = searchParams.get('mode') || 'explainability';

    return (
      <ErrorBoundary>
        <MapAnalysis
          initialGridId={initialGridId}
          initialDay={initialDay}
          initialVariable={initialVariable}
          initialMode={initialMode}
          onBackToDashboard={() => {
            if (window.opener) {
              window.close();
            } else {
              window.location.hash = '';
            }
          }}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Root />
);
