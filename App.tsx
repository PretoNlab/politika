import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import CommandCenter from './components/CommandCenter';
import Dashboard from './components/Dashboard';
import History from './components/History';
import InsightsDetail from './components/InsightsDetail';
import ComparisonDetail from './components/ComparisonDetail';
import CrisisManagement from './components/CrisisManagement';
import PulseMonitor from './components/PulseMonitor';
import Workspaces from './components/Workspaces';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { initPostHog } from './lib/posthog';
import { useAnalytics } from './hooks/useAnalytics';

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
          <Outlet />
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
            <Route path="/login" element={<Login />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />

            {/* Protected routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<CommandCenter />} />
              <Route path="/analyze" element={<Dashboard />} />
              <Route path="/history" element={<History />} />
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
