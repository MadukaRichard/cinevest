/**
 * ===========================================
 * 404 Not Found Page
 * ===========================================
 */

import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Film } from 'lucide-react';
import Button from '../components/ui/Button';
import SEO from '../components/ui/SEO';

function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <SEO title="Page Not Found" noIndex />
      <div className="text-center max-w-lg">
        {/* 404 Visual */}
        <div className="relative mb-8">
          <h1 className="text-[10rem] md:text-[12rem] font-bold leading-none gradient-text opacity-30 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <Film className="w-20 h-20 text-primary-500 animate-pulse" />
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Scene Not Found
        </h2>
        <p className="text-muted-foreground mb-8 text-lg">
          Looks like this page didn't make the final cut. Let's get you back to
          the main feature.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            as={Link}
            to="/"
            variant="primary"
            className="inline-flex items-center justify-center"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <Button
            as={Link}
            to="/films"
            variant="outline"
            className="inline-flex items-center justify-center"
          >
            <Film className="w-4 h-4 mr-2" />
            Browse Films
          </Button>
        </div>

        {/* Go Back Link */}
        <button
          onClick={() => window.history.back()}
          className="mt-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Go back to previous page
        </button>
      </div>
    </div>
  );
}

export default NotFound;
