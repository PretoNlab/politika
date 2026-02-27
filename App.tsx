import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import OnboardingFlow from './pages/OnboardingFlow';
import LeadCapture from './pages/LeadCapture';
import AuthCallback from './pages/AuthCallback';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { initPostHog } from './lib/posthog';
import { useAnalytics } from './hooks/useAnalytics';

// Lazy-loaded protected route components
const CommandCenter = React.lazy(() => import('./components/CommandCenter'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const RadarPreditivo = React.lazy(() => import('./components/RadarPreditivo'));
const InsightsDetail = React.lazy(() => import('./components/InsightsDetail'));
const ComparisonDetail = React.lazy(() => import('./components/ComparisonDetail'));
const CrisisManagement = React.lazy(() => import('./components/CrisisManagement'));
const PulseMonitor = React.lazy(() => import('./components/PulseMonitor'));
const Workspaces = React.lazy(() => import('./components/Workspaces'));

// Inicializa PostHog o mais cedo possível
initPostHog();

// Rastreia page views automaticamente em cada mudança de rota
const PageViewTracker: React.FC = () => {
  const location = useLocation();
  const { pageview } = useAnalytics();

  useEffect(() => {
    pageview(location.pathname);
  }, [location.pathname]);

  return null;
};

const ProtectedLayout: React.FC = () => {
  return (
    <ProtectedRoute>
      <WorkspaceProvider>
        <Layout>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
              <div className="flex flex-col items-center gap-4">
                <div className="size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-medium text-text-subtle">Carregando...</p>
              </div>
            </div>
          }>
            <Outlet />
          </Suspense>
        </Layout>
      </WorkspaceProvider>
    </ProtectedRoute>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <PageViewTracker />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/onboarding" element={<OnboardingFlow />} />
            <Route path="/solicitar-acesso" element={<LeadCapture />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/login" element={<Login />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />

            {/* Protected routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<CommandCenter />} />
              <Route path="/analyze" element={<Dashboard />} />
              <Route path="/radar" element={<RadarPreditivo />} />
              <Route path="/insight-detail/:id?" element={<InsightsDetail />} />
              <Route path="/comparison-detail/:id?" element={<ComparisonDetail />} />
              <Route path="/crisis" element={<CrisisManagement />} />
              <Route path="/pulse" element={<PulseMonitor />} />
              <Route path="/workspaces" element={<Workspaces />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0d131b',
            color: '#f6f7f8',
            borderRadius: '0.75rem',
            padding: '16px',
            fontFamily: '"Space Grotesk", sans-serif',
          },
          success: {
            iconTheme: {
              primary: '#136dec',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </ErrorBoundary>
  );
};

export default App;
