import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { 
  Navbar, 
  Hero, 
  Features, 
  HowItWorks, 
  Testimonials, 
  CTABanner,
  Footer 
} from './components/landing';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { Classroom } from './components/classroom/Classroom';
import { UserRole, AuthMode, User } from './types';

function LandingPage({ 
  isLoggedIn, 
  onLogout, 
  openAuth 
}: { 
  isLoggedIn: boolean, 
  onLogout: () => void, 
  openAuth: (mode: AuthMode) => void 
}) {
  return (
    <div className="min-h-screen">
      <Navbar 
        isLoggedIn={isLoggedIn}
        onSignUpParent={() => openAuth('signup-parent')} 
        onSignUpTeacher={() => openAuth('signup-teacher')} 
        onLogin={() => openAuth('login')}
        onLogout={onLogout}
      />
      
      <main>
        <Hero onStartTrial={() => openAuth('signup-parent')} />
        <Features />
        <HowItWorks />
        <Testimonials />

        <CTABanner onAction={() => openAuth('signup-parent')} />
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  const [authModal, setAuthModal] = useState<{isOpen: boolean, mode: AuthMode}>({
    isOpen: false,
    mode: 'login'
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<UserRole>(3); // 3 = Parent
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    const token = localStorage.getItem('auth_token');
    if (savedUser && token) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setRole(parsedUser.role);
        setIsLoggedIn(true);
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
    setIsInitialized(true);
  }, []);

  const openAuth = (mode: AuthMode) => setAuthModal({ isOpen: true, mode });
  const closeAuth = () => setAuthModal(prev => ({ ...prev, isOpen: false }));

  const handleAuthComplete = (userRole: UserRole, userData: User) => {
    setRole(userRole);
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    closeAuth();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isInitialized) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            <LandingPage 
              isLoggedIn={isLoggedIn} 
              onLogout={handleLogout} 
              openAuth={openAuth} 
            />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            isLoggedIn && user ? (
              <Dashboard role={role} user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/classroom/:channelName" 
          element={
            isLoggedIn && user ? (
              <Classroom user={user} onExit={() => window.location.href = '/dashboard'} />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <AuthModal 
        isOpen={authModal.isOpen} 
        initialMode={authModal.mode} 
        onClose={closeAuth} 
        onComplete={handleAuthComplete}
      />
      
      <NavigationHandler isLoggedIn={isLoggedIn} />
    </BrowserRouter>
  );
}

// Separate component to handle navigation side effects
function NavigationHandler({ isLoggedIn }: { isLoggedIn: boolean }) {
  const navigate = useNavigate();
  const [prevLoggedIn, setPrevLoggedIn] = useState(isLoggedIn);

  useEffect(() => {
    if (isLoggedIn && !prevLoggedIn) {
      navigate('/dashboard');
    } else if (!isLoggedIn && prevLoggedIn) {
      navigate('/');
    }
    setPrevLoggedIn(isLoggedIn);
  }, [isLoggedIn, navigate, prevLoggedIn]);

  return null;
}
