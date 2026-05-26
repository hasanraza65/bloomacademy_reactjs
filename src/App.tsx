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
import { MenagePage } from './components/MenagePage';

import { UserRole, AuthMode, User, ClassroomData } from './types';
import { apiService } from './services/apiService';
import { APIProvider } from '@vis.gl/react-google-maps';
import { ResetPassword } from './components/ResetPassword';
import { PriceQuotePage } from './components/PriceQuotePage';
import ScrollToTop from "./scrollToTop";
import { useLanguage } from './context/LanguageContext';


const GOOGLE_MAPS_API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;

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
  const [myClasses, setMyClasses] = useState<ClassroomData[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { setLanguage } = useLanguage();

  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    const token = localStorage.getItem('auth_token');
    if (savedUser && token) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setRole(parsedUser.role);
        setIsLoggedIn(true);
        // Sync language from saved logged-in user profile
        const userLang = parsedUser.language;
        if (userLang === 'fr' || userLang === 'en') {
          setLanguage(userLang);
        }
        // Fetch classes on reload
        setIsLoadingClasses(true);
        apiService.getMyClasses().then(classes => {
          if (Array.isArray(classes)) setMyClasses(classes);
        })
        .catch(console.error)
        .finally(() => setIsLoadingClasses(false));
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
    // Sync language from logged-in user profile on login
    const userLang = (userData as any).language;
    if (userLang === 'fr' || userLang === 'en') {
      setLanguage(userLang);
    }
    // Fetch classes after login
    setIsLoadingClasses(true);
    apiService.getMyClasses().then(classes => {
      if (Array.isArray(classes)) setMyClasses(classes);
    })
    .catch(console.error)
    .finally(() => setIsLoadingClasses(false));
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
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly" solutionChannel="gmp_mcp_codeassist_v1_aistudio">
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
        <Route 
          path="/" 
          element={
            isLoggedIn && user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LandingPage 
                isLoggedIn={isLoggedIn} 
                onLogout={handleLogout} 
                openAuth={openAuth} 
              />
            )
          } 
        />
        <Route 
          path="/menage" 
          element={
            <MenagePage 
              isLoggedIn={isLoggedIn} 
              onLogout={handleLogout} 
              openAuth={openAuth} 
            />
          } 
        />
        <Route 
          path="/reset-password" 
          element={
            <ResetPassword 
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
              <Dashboard 
                role={role} 
                user={user} 
                myClasses={myClasses} 
                isLoading={isLoadingClasses}
                onLogout={handleLogout} 
              />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/classroom/:channelName" 
          element={
            isLoggedIn && user ? (
              <Classroom user={user} onExit={
                () => {
                  let oldLang = window.localStorage.getItem('language');
                  if(oldLang === 'fr') {
                    setLanguage('fr');
                  }
                  window.location.href = '/dashboard'
                }
              } />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/price-quote/:id" 
          element={<PriceQuotePage />} 
        />
        <Route 
          path="/price-qoute/:id" 
          element={<Navigate to="/price-quote/:id" replace />} 
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
  </APIProvider>
);
}

// Separate component to handle navigation side effects
function NavigationHandler({ isLoggedIn }: { isLoggedIn: boolean }) {
  const navigate = useNavigate();
  const [prevLoggedIn, setPrevLoggedIn] = useState(isLoggedIn);

  useEffect(() => {
    console.log('NavigationHandler - isLoggedIn:', isLoggedIn, 'prevLoggedIn:', prevLoggedIn);
    if (isLoggedIn && !prevLoggedIn) {
      navigate('/dashboard');
    } else if (!isLoggedIn && prevLoggedIn) {
      navigate('/');
    }
    setPrevLoggedIn(isLoggedIn);
  }, [isLoggedIn, navigate, prevLoggedIn]);

  return null;
}
