/**
 * ===========================================
 * Error Fallback UI Component
 * ===========================================
 *
 * Displayed when an ErrorBoundary catches an error.
 * Two visual modes:
 *   - "page"    → Full-page fallback (route-level crashes)
 *   - "section" → Inline card fallback (widget/panel crashes)
 */

import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ErrorFallback({ error, errorInfo, resetErrorBoundary, level = 'page' }) {
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();

  // ─── Section-level (inline) fallback ────────────────
  if (level === 'section') {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Something went wrong
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          This section encountered an error and couldn't render.
        </p>
        <button
          onClick={resetErrorBoundary}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                     bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Try again
        </button>
      </div>
    );
  }

  // ─── Page-level (full) fallback ─────────────────────
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Oops, something broke
        </h1>
        <p className="text-muted-foreground mb-8">
          An unexpected error occurred. You can try again or head back to the homepage.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <button
            onClick={resetErrorBoundary}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium
                       bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium
                       border border-border text-foreground hover:bg-accent transition-colors"
          >
            <Home className="w-4 h-4" />
            Go home
          </button>
        </div>

        {/* Error details (dev only) */}
        {import.meta.env.DEV && error && (
          <div className="text-left">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground
                         transition-colors mx-auto mb-3"
            >
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showDetails ? 'Hide' : 'Show'} error details
            </button>

            {showDetails && (
              <div className="rounded-lg border border-border bg-muted/50 p-4 overflow-auto max-h-64">
                <p className="text-sm font-mono text-red-400 mb-2">
                  {error.toString()}
                </p>
                {errorInfo?.componentStack && (
                  <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                    {errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ErrorFallback;
