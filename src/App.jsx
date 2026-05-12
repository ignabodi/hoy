import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import CameraPage from './pages/CameraPage';
import InboxPage from './pages/InboxPage';
import FriendsPage from './pages/FriendsPage';
import ProfilePage from './pages/ProfilePage';
import BottomNav from './components/ui/BottomNav';
import UsernameForm from './components/auth/UsernameForm';

// Redirects unauthenticated users to /auth
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/auth" replace />;
}

function AppShell() {
  const { currentUser, needsUsername } = useAuth();

  // If signed in but hasn't chosen a username yet, show that screen
  if (currentUser && needsUsername) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <UsernameForm />
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* If already logged in, redirect away from /auth */}
        <Route
          path="/auth"
          element={currentUser ? <Navigate to="/inbox" replace /> : <AuthPage />}
        />
        <Route path="/camera"  element={<ProtectedRoute><CameraPage /></ProtectedRoute>} />
        <Route path="/inbox"   element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        {/* Any other URL redirects to camera or auth depending on login state */}
        <Route path="*" element={<Navigate to={currentUser ? '/inbox' : '/auth'} replace />} />
      </Routes>

      {/* Only show nav when logged in */}
      {currentUser && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}