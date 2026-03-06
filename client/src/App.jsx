/**
 * ===========================================
 * CineVest - Main App Component
 * ===========================================
 * 
 * This component sets up routing and renders
 * the main layout of the application.
 * Uses React.lazy for code-splitting heavy pages.
 */

import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Components (always loaded)
import Navbar from './components/ui/Navbar';
import Footer from './components/ui/Footer';
import ProtectedRoute from './components/ui/ProtectedRoute';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { Skeleton } from './components/ui/Skeleton';

// Lightweight pages (loaded eagerly)
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';

// Heavy pages (code-split with lazy loading)
const VerifyAccount = lazy(() => import('./pages/VerifyAccount'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Films = lazy(() => import('./pages/Films'));
const FilmDetail = lazy(() => import('./pages/FilmDetail'));
const Chat = lazy(() => import('./pages/Chat'));
const Admin = lazy(() => import('./pages/Admin'));
const About = lazy(() => import('./pages/About'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));

// Page loading fallback
function PageLoader() {
  return (
    <div className="container-custom py-20 space-y-6">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow">
        <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
            <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
            <Route path="/signup" element={<ErrorBoundary><Signup /></ErrorBoundary>} />
            <Route path="/verify" element={<ErrorBoundary><VerifyAccount /></ErrorBoundary>} />
            <Route path="/forgot-password" element={<ErrorBoundary><ForgotPassword /></ErrorBoundary>} />
            <Route path="/reset-password/:token" element={<ErrorBoundary><ResetPassword /></ErrorBoundary>} />
            <Route path="/films" element={<ErrorBoundary><Films /></ErrorBoundary>} />
            <Route path="/films/:id" element={<ErrorBoundary><FilmDetail /></ErrorBoundary>} />
            <Route path="/about" element={<ErrorBoundary><About /></ErrorBoundary>} />
            <Route path="/terms" element={<ErrorBoundary><Terms /></ErrorBoundary>} />
            <Route path="/privacy" element={<ErrorBoundary><Privacy /></ErrorBoundary>} />

            {/* Protected Routes */}
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Dashboard />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/*"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Chat />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requireAdmin>
                  <ErrorBoundary>
                    <Admin />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
