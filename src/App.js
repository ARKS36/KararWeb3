import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AnonymityPopup from './components/AnonymityPopup';
import VoteTypeNotification from './components/VoteTypeNotification';
import LanguageSwitcher from './components/LanguageSwitcher';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Route change handler component
function ScrollToTop() {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  return null;
}

// Lazy load components with error boundaries
const withErrorBoundary = (Component, fallback = <LoadingSpinner />) => (props) => (
  <ErrorBoundary>
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  </ErrorBoundary>
);

// Lazy load pages
const HomePage = withErrorBoundary(React.lazy(() => import('./pages/HomePage')));
const LoginPage = withErrorBoundary(React.lazy(() => import('./pages/LoginPage')));
const RegisterPage = withErrorBoundary(React.lazy(() => import('./pages/RegisterPage')));
const ProtestDetailPage = withErrorBoundary(React.lazy(() => import('./pages/ProtestDetailPage')));
const ProtestsPage = withErrorBoundary(React.lazy(() => import('./pages/ProtestsPage')));
const BoycottsPage = withErrorBoundary(React.lazy(() => import('./pages/BoycottsPage')));
const BoycottDetailPage = withErrorBoundary(React.lazy(() => import('./pages/BoycottDetailPage')));
const HakkimdaPage = withErrorBoundary(React.lazy(() => import('./pages/HakkimdaPage')));
const CreateProtestPage = withErrorBoundary(React.lazy(() => import('./pages/CreateProtestPage')));
const CreateBoycottPage = withErrorBoundary(React.lazy(() => import('./pages/CreateBoycottPage')));
const ProfilePage = withErrorBoundary(React.lazy(() => import('./pages/ProfilePage')));
const AdminPanel = withErrorBoundary(React.lazy(() => import('./pages/AdminPanel')));

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <ScrollToTop />
            <div className="app-container">
              <Navbar />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/protest/:protestId" element={<ProtestDetailPage />} />
                <Route path="/protestolar" element={<ProtestsPage />} />
                <Route path="/boykotlar" element={<BoycottsPage />} />
                <Route path="/boycott/:boycottId" element={<BoycottDetailPage />} />
                <Route path="/hakkimizda" element={<HakkimdaPage />} />
                <Route path="/create-protest" element={<CreateProtestPage />} />
                <Route path="/create-boycott" element={<CreateBoycottPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              {/* Additional components */}
              <LanguageSwitcher mode="floating" />
              <AnonymityPopup />
              <VoteTypeNotification />
              <ToastContainer
                position="bottom-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </div>
          </Router>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
