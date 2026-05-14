import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Lock, 
  Sparkles, 
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Mail
} from 'lucide-react';
import { Navbar, Footer } from './landing';
import { useLanguage } from '../context/LanguageContext';
import { apiService } from '../services/apiService';
import { AuthMode } from '../types';
import { cn } from '@/src/lib/utils';

export const ResetPassword = ({ 
  isLoggedIn, 
  onLogout, 
  openAuth 
}: { 
  isLoggedIn: boolean, 
  onLogout: () => void, 
  openAuth: (mode: AuthMode) => void 
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      setError(t('auth.passwordMin'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordMatch'));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiService.resetPassword({
        email,
        token,
        password,
        password_confirmation: confirmPassword
      });

      if (response.success) {
        setSuccess(response.message || t('auth.passwordUpdated'));
        setTimeout(() => {
          openAuth('login');
          navigate('/');
        }, 3000);
      } else {
        if (response.errors) {
          const firstError = Object.values(response.errors)[0][0];
          setError(firstError);
        } else {
          setError(response.message || t('auth.failedReset'));
        }
      }
    } catch (err) {
      setError(t('auth.errorUnexpected'));
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar 
          isLoggedIn={isLoggedIn}
          onSignUpParent={() => openAuth('signup-parent')} 
          onSignUpTeacher={() => openAuth('signup-teacher')} 
          onLogin={() => openAuth('login')}
          onLogout={onLogout}
        />
        <main className="flex-1 flex items-center justify-center p-6 mt-20">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 md:p-14 soft-shadow border border-slate-100 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <AlertCircle size={40} />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-4">{t('auth.invalidLink')}</h1>
            <p className="text-slate-500 mb-8 font-medium">{t('auth.invalidLinkDesc')}</p>
            <button 
              onClick={() => navigate('/')}
              className="w-full bloom-gradient text-white font-bold py-5 rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
            >
              {t('nav.home')}
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar 
        isLoggedIn={isLoggedIn}
        onSignUpParent={() => openAuth('signup-parent')} 
        onSignUpTeacher={() => openAuth('signup-teacher')} 
        onLogin={() => openAuth('login')}
        onLogout={onLogout}
      />

      <main className="flex-1 flex items-center justify-center p-6 mt-20">
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[2.5rem] p-10 md:p-14 soft-shadow border border-slate-100"
        >
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-10 h-10 bloom-gradient rounded-xl flex items-center justify-center text-white font-bold">B</div>
              <span className="text-2xl font-bold tracking-tight text-brand-slate-ink uppercase">Bloom {t('nav.academy') || 'Academy'}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-brand-slate-ink">{t('auth.resetPassword')}</h1>
            <p className="text-slate-500 mt-2 font-medium">{t('auth.newSecurePassword')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3 animate-shake">
                <AlertCircle size={18} />
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-sm font-bold border border-emerald-100 flex items-center gap-3">
                <CheckCircle2 size={18} />
                {success}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('auth.email')}</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  readOnly
                  value={email}
                  className="input-field !pl-14 h-14 text-base bg-slate-50 cursor-not-allowed text-slate-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('auth.password')}</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-indigo transition-colors" size={18} />
                <input
                  type="password"
                  required
                  disabled={!!success}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field !pl-14 h-14 text-base"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('auth.confirmPassword')}</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-indigo transition-colors" size={18} />
                <input
                  type="password"
                  required
                  disabled={!!success}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field !pl-14 h-14 text-base"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full bloom-gradient text-white font-bold py-5 rounded-2xl shadow-xl shadow-indigo-100 text-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t('auth.updatePassword')}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {success && (
            <p className="text-center mt-6 text-sm text-slate-400 font-medium">
              {t('auth.redirecting')}
            </p>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};
