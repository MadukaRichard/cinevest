/**
 * ===========================================
 * Error Boundary Component
 * ===========================================
 *
 * Catches JavaScript errors anywhere in its child
 * component tree and displays a fallback UI instead
 * of crashing the entire app.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <MyComponent />
 *   </ErrorBoundary>
 *
 *   <ErrorBoundary fallback={<CustomFallback />}>
 *     <MyComponent />
 *   </ErrorBoundary>
 *
 *   <ErrorBoundary level="section">
 *     <DashboardWidget />
 *   </ErrorBoundary>
 */

import { Component } from 'react';
import ErrorFallback from './ErrorFallback';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Caught error:', error);
      console.error('[ErrorBoundary] Component stack:', errorInfo?.componentStack);
    }

    // Call optional onError callback (for analytics / error reporting)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });

    // Call optional onReset callback
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback via prop
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render function fallback (receives error + reset)
      if (this.props.fallbackRender) {
        return this.props.fallbackRender({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          resetErrorBoundary: this.handleReset,
        });
      }

      // Default fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetErrorBoundary={this.handleReset}
          level={this.props.level || 'page'}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
