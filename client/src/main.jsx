import React, { Component } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { AlarmProvider } from './context/AlarmContext.jsx';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AuraAlarm Render Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px 20px', 
          backgroundColor: '#0a0d14', 
          color: '#f8fafc', 
          minHeight: '100vh', 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          textAlign: 'center' 
        }}>
          <div style={{
            maxWidth: '480px',
            padding: '32px',
            backgroundColor: '#111827',
            borderRadius: '24px',
            border: '1px solid #374151'
          }}>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '12px' }}>
              AuraAlarm Loading Guard
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
              {this.state.error?.message || 'Recovering state. Please tap reload.'}
            </p>
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }} 
              style={{ 
                padding: '12px 24px', 
                backgroundColor: '#6366f1', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '12px', 
                fontWeight: 'bold',
                cursor: 'pointer' 
              }}
            >
              Reload & Clear Cache
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <AlarmProvider>
            <App />
          </AlarmProvider>
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
