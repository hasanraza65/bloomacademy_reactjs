import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Camera, 
  Globe, 
  Trash2, 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  GraduationCap, 
  Users, 
  Lock, 
  Mail,
  Gamepad2,
  Sparkles,
  User as UserIcon,
  MapPin,
  Calendar as CalendarIcon,
  Phone
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { DAYS, TIME_SLOTS, AuthMode, ChildData, INITIAL_SCHEDULE, DaySchedule, UserRole, User as UserType } from '@/src/types';
import { apiService } from '@/src/services/apiService';
import { useLanguage } from '../context/LanguageContext';

const COUNTRIES = [
  { code: '+1', name: 'USA', flag: '🇺🇸' },
  { code: '+44', name: 'UK', flag: '🇬🇧' },
  { code: '+92', name: 'PK', flag: '🇵🇰' },
  { code: '+91', name: 'IN', flag: '🇮🇳' },
  { code: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: '+61', name: 'AUS', flag: '🇦🇺' },
  { code: '+1', name: 'CAN', flag: '🇨🇦' },
  { code: '+49', name: 'GER', flag: '🇩🇪' },
  { code: '+33', name: 'FRA', flag: '🇫🇷' },
];

const CountrySelector = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedCountry = COUNTRIES.find(c => c.code === value) || COUNTRIES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative h-full flex items-center" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 rounded-xl transition-all border border-transparent active:scale-95"
      >
        <span className="text-lg leading-none">{selectedCountry.flag}</span>
        <span className="text-[12px] font-bold text-slate-600 font-mono leading-none">{selectedCountry.code}</span>
        <ChevronRight size={12} className={cn("text-slate-300 transition-transform", isOpen ? "-rotate-90" : "rotate-90")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-2 left-0 z-[100] w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto p-2 space-y-1 no-scrollbar">
              {COUNTRIES.map((c) => (
                <button
                  key={`${c.name}-${c.code}`}
                  type="button"
                  onClick={() => {
                    onChange(c.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left",
                    value === c.code ? "bg-indigo-50 text-brand-indigo" : "hover:bg-slate-50 text-slate-600"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{c.flag}</span>
                    <div>
                      <p className="text-[11px] font-bold leading-tight uppercase tracking-wide">{c.name}</p>
                      <p className="text-[10px] opacity-60 leading-tight font-mono">{c.code}</p>
                    </div>
                  </div>
                  {value === c.code && <div className="w-1.5 h-1.5 rounded-full bg-brand-indigo shadow-[0_0_8px_rgba(99,102,241,0.5)]" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

type FormInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: any;
};

const FormInput = ({ label, icon: Icon, ...props }: FormInputProps) => (
  <div className="space-y-2">
    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-brand-indigo text-slate-300">
        <Icon size={18} />
      </div>
      <input 
        autoComplete="off"
        {...props}
        className={cn(
          "input-field !pl-14 h-14 text-base",
          props.className
        )}
      />
    </div>
  </div>
);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: AuthMode;
  onComplete: (role: UserRole, user: UserType) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode,
  onComplete 
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const renderContent = () => {
    switch (mode) {
      case 'login':
        return <LoginView onSwitch={(m) => setMode(m)} onComplete={onComplete} />;
      case 'signup-parent':
        return <ParentSignupView onSwitch={(m) => setMode(m)} onComplete={onComplete} />;
      case 'signup-teacher':
        return <TeacherSignupView onSwitch={(m) => setMode(m)} onComplete={onComplete} />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-slate-ink/40 backdrop-blur-sm"
          />
          
          <motion.div
            key={mode}
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className={cn(
               "relative bg-white w-full h-[90vh] md:h-[800px] overflow-hidden card-rounded soft-shadow flex flex-col z-50",
               mode === 'login' ? "max-w-[500px]" : "max-w-[1200px]"
            )}
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 transition-colors z-[60] bg-white/50 backdrop-blur-md rounded-full border border-slate-100"
            >
              <X size={20} />
            </button>

            {renderContent()}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- Login View ---
const LoginView = ({ onSwitch, onComplete }: { onSwitch: (m: AuthMode) => void, onComplete: (role: UserRole, user: UserType) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await apiService.login({ email, password });
      if (response.success && response.user) {
        if (response.token) {
          localStorage.setItem('auth_token', response.token);
        }
        setSuccess(response.message || (t('en') === 'en' ? 'Login successful! Redirecting...' : 'Connexion réussie ! Redirection...'));
        setTimeout(() => {
          onComplete(response.user.role, response.user);
        }, 1500);
      } else {
        setError(response.message || (t('en') === 'en' ? 'Login failed' : 'Échec de la connexion'));
      }
    } catch (err) {
      setError(t('en') === 'en' ? 'An unexpected error occurred. Please try again.' : 'Une erreur inattendue est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-10 md:p-14 justify-center">
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-10 h-10 bloom-gradient rounded-xl flex items-center justify-center text-white font-bold">B</div>
          <span className="text-2xl font-bold tracking-tight text-brand-slate-ink">Bloom Buddies Academy</span>
        </div>
        <h2 className="text-3xl font-extrabold text-brand-slate-ink">{t('auth.welcome')}</h2>
        <p className="text-slate-500 mt-2">{t('auth.loginDesc')}</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 animate-shake">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-sm font-bold border border-emerald-100 flex items-center gap-2">
            <Sparkles size={16} />
            {success}
          </div>
        )}
        
        <FormInput 
          label={t('auth.email')}
          icon={Mail}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
        />

        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t('auth.password')}</label>
            <button type="button" className="text-[11px] font-bold text-brand-indigo hover:underline">{t('auth.forgot')}</button>
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-indigo transition-colors" size={18} />
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field !pl-14 h-14 text-base" 
              placeholder="••••••••" 
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bloom-gradient text-white font-bold py-5 rounded-2xl shadow-xl shadow-indigo-100 text-lg hover:scale-[1.01] active:scale-95 transition-all mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t('auth.loading')}
            </>
          ) : t('auth.login')}
        </button>
      </form>

      <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
        <p className="text-sm text-slate-500">{t('auth.noAccount')}</p>
        <div className="flex gap-4">
          <button onClick={() => onSwitch('signup-parent')} className="text-xs font-bold text-brand-indigo bg-indigo-50 px-4 py-2 rounded-full hover:bg-brand-indigo hover:text-white transition-all capitalize">{t('nav.signupParent')}</button>
          <button onClick={() => onSwitch('signup-teacher')} className="text-xs font-bold text-brand-purple bg-purple-50 px-4 py-2 rounded-full hover:bg-brand-purple hover:text-white transition-all capitalize">{t('nav.signupTeacher')}</button>
        </div>
      </div>
    </div>
  );
};

// --- Parent Signup View ---
const ParentSignupView = ({ onSwitch, onComplete }: { onSwitch: (m: AuthMode) => void, onComplete: (role: UserRole, user: UserType) => void }) => {
  const { t } = useLanguage();
  const [parentFields, setParentFields] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    telephone: '',
    countryCode: '+1',
    city: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [numChildren, setNumChildren] = useState(1);
  const [children, setChildren] = useState<ChildData[]>([
    { id: '1', dob: '', schedule: INITIAL_SCHEDULE }
  ]);
  const [activeChildIndex, setActiveChildIndex] = useState(0);

  const isFormValid = 
    parentFields.firstName && 
    parentFields.lastName && 
    parentFields.email && 
    parentFields.password && 
    parentFields.password === parentFields.confirmPassword && 
    parentFields.telephone && 
    parentFields.city &&
    children.every(c => c.dob);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Map children to required format
    const formattedChildren = children.map(child => {
      const scheduleObj: Record<string, any> = {};
      child.schedule.forEach(day => {
        scheduleObj[day.day.toLowerCase()] = day.slots.map(slot => ({
          start: slot.startTime,
          end: slot.endTime
        }));
      });
      return {
        dob: child.dob,
        schedule: scheduleObj
      };
    });

    const payload = {
      firstName: parentFields.firstName,
      lastName: parentFields.lastName,
      email: parentFields.email,
      password: parentFields.password,
      password_confirmation: parentFields.confirmPassword,
      telephone: `${parentFields.countryCode}${parentFields.telephone}`,
      city: parentFields.city,
      children: formattedChildren
    };

    try {
      const response = await apiService.signupParent(payload);
      
      // Handle the case where user is in 'data' field
      const userData = response.user || (response as any).data;
      const isActuallySuccess = response.success === true || (response.message?.toLowerCase().includes('success'));

      if (isActuallySuccess) {
        let token = response.token;
        let finalUser = userData;

        // If no token, attempt auto-login to get one
        if (!token) {
          try {
            const loginRes = await apiService.login({ 
              email: parentFields.email, 
              password: parentFields.password 
            });
            if (loginRes.success && loginRes.token) {
              token = loginRes.token;
              finalUser = loginRes.user || finalUser;
            }
          } catch (loginErr) {
            console.error("Auto-login failed after signup", loginErr);
          }
        }

        if (token) {
          localStorage.setItem('auth_token', token);
        }

        setSuccess(response.message || (t('en') === 'en' ? 'Registration successful!' : 'Inscription réussie !'));
        setError(null);
        
        // Auto-login and redirect if we have a user object
        if (finalUser) {
          setTimeout(() => {
            onComplete(finalUser.role, finalUser);
          }, 1200);
        }
      } else {
        // Handle validation errors or message
        if (response.errors) {
          const firstError = Object.values(response.errors)[0][0];
          setError(firstError);
        } else {
          setError(response.message || (t('en') === 'en' ? 'Registration failed' : 'Échec de l\'inscription'));
        }
        setSuccess(null);
      }
    } catch (err) {
      setError(t('en') === 'en' ? 'An unexpected error occurred. Please try again.' : 'Une erreur inattendue est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleNumChildrenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value);
    setNumChildren(val);
    setChildren(prev => {
      if (val > prev.length) {
        const next = [...prev];
        for (let i = prev.length; i < val; i++) {
          next.push({ id: `${i + 1}`, dob: '', schedule: INITIAL_SCHEDULE });
        }
        return next;
      }
      return prev.slice(0, val);
    });
  };

  const updateChildField = (index: number, field: keyof ChildData, value: string) => {
    setChildren(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addTimeSlot = (dayName: string) => {
    setChildren(prev => {
      const next = [...prev];
      const child = next[activeChildIndex];
      const nextSchedule = child.schedule.map(d => {
        if (d.day === dayName) {
          return {
            ...d,
            slots: [...d.slots, { id: Math.random().toString(36).substr(2, 9), startTime: '', endTime: '' }]
          };
        }
        return d;
      });
      next[activeChildIndex] = { ...child, schedule: nextSchedule };
      return next;
    });
  };

  const updateTimeSlot = (dayName: string, slotId: string, field: 'startTime' | 'endTime', value: string) => {
    setChildren(prev => {
      const next = [...prev];
      const child = next[activeChildIndex];
      const nextSchedule = child.schedule.map(d => {
        if (d.day === dayName) {
          return {
            ...d,
            slots: d.slots.map(s => {
              if (s.id !== slotId) return s;
              
              let nextSlot = { ...s, [field]: value };
              
              // Auto-fill end time if start time is changed
              if (field === 'startTime' && value) {
                const [h, m] = value.split(':').map(Number);
                const nextH = (h + 1) % 24;
                nextSlot.endTime = `${nextH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
              }
              
              // Validate minimum 30 minutes
              if (nextSlot.startTime && nextSlot.endTime) {
                const [sh, sm] = nextSlot.startTime.split(':').map(Number);
                const [eh, em] = nextSlot.endTime.split(':').map(Number);
                const startMins = sh * 60 + sm;
                const endMins = eh * 60 + em;
                
                // If duration is less than 30 mins, adjust the field that was NOT changed to maintain 30 mins
                if (endMins - startMins < 30 && endMins > startMins) {
                  if (field === 'endTime') {
                    // Start time was already there, user tried setting end too early
                    // We'll actually allow the change but maybe the user wants it restricted
                    // For now, let's just enforce it by adjusting the other if it's too short
                    // Actually, let's just not allow the value if it's invalid?
                    // Better: if they set end time, and it's < 30 mins diff, force it to start + 30
                    const forceMins = startMins + 30;
                    nextSlot.endTime = `${Math.floor(forceMins/60).toString().padStart(2, '0')}:${(forceMins%60).toString().padStart(2, '0')}`;
                  } else {
                    // Start time changed, already auto-filled 1h but if user manually changes later...
                    // The auto-fill 1h handles the initial case.
                  }
                }
              }

              return nextSlot;
            })
          };
        }
        return d;
      });
      next[activeChildIndex] = { ...child, schedule: nextSchedule };
      return next;
    });
  };

  const removeTimeSlot = (dayName: string, slotId: string) => {
    setChildren(prev => {
      const next = [...prev];
      const child = next[activeChildIndex];
      const nextSchedule = child.schedule.map(d => {
        if (d.day === dayName) {
          return {
            ...d,
            slots: d.slots.filter(s => s.id !== slotId)
          };
        }
        return d;
      });
      next[activeChildIndex] = { ...child, schedule: nextSchedule };
      return next;
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Left Column: Form (60%) */}
      <div className="w-full md:w-[55%] bg-slate-50/50 border-r border-slate-100 p-8 md:p-12 overflow-y-auto no-scrollbar">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bloom-gradient rounded-xl flex items-center justify-center text-white font-bold">B</div>
            <span className="text-xl font-bold tracking-tight text-brand-slate-ink">Bloom Buddies Academy</span>
          </div>
          <h2 className="text-3xl font-extrabold text-brand-slate-ink">{t('auth.parentReg')}</h2>
          <p className="text-slate-500 mt-1">{t('auth.loginDesc')}</p>
        </div>

        <form className="space-y-6" id="parent-signup-form" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 animate-shake">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-sm font-bold border border-emerald-100 flex items-center gap-2">
              <Sparkles size={16} />
              {success}
            </div>
          )}
          <div className="grid grid-cols-2 gap-6">
            <FormInput 
              label={t('auth.firstName')}
              icon={UserIcon}
              type="text"
              required
              placeholder="Jane"
              value={parentFields.firstName}
              onChange={(e) => setParentFields(prev => ({ ...prev, firstName: e.target.value }))}
            />
            <FormInput 
              label={t('auth.lastName')}
              icon={UserIcon}
              type="text"
              required
              placeholder="Doe"
              value={parentFields.lastName}
              onChange={(e) => setParentFields(prev => ({ ...prev, lastName: e.target.value }))}
            />
          </div>

          <FormInput 
            label={t('auth.email')}
            icon={Mail}
            type="email"
            required
            placeholder="jane.doe@example.com"
            value={parentFields.email}
            onChange={(e) => setParentFields(prev => ({ ...prev, email: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-6">
            <FormInput 
              label={t('auth.password')}
              icon={Lock}
              type="password"
              required
              placeholder="••••••••"
              value={parentFields.password}
              onChange={(e) => setParentFields(prev => ({ ...prev, password: e.target.value }))}
            />
            <FormInput 
              label={t('auth.confirmPassword')}
              icon={Lock}
              type="password"
              required
              placeholder="••••••••"
              value={parentFields.confirmPassword}
              onChange={(e) => setParentFields(prev => ({ ...prev, confirmPassword: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('auth.telephone')}</label>
              <div className="relative group">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
                  <CountrySelector 
                    value={parentFields.countryCode} 
                    onChange={(val) => setParentFields(prev => ({ ...prev, countryCode: val }))} 
                  />
                </div>
                <input 
                  type="text" 
                  required 
                  className="input-field h-14 !pl-28 text-base" 
                  placeholder="(555) 000-0000" 
                  value={parentFields.telephone}
                  onChange={(e) => setParentFields(prev => ({ ...prev, telephone: e.target.value }))}
                />
              </div>
            </div>
            <FormInput 
              label={t('auth.city')}
              icon={MapPin}
              type="text"
              required
              placeholder="New York"
              value={parentFields.city}
              onChange={(e) => setParentFields(prev => ({ ...prev, city: e.target.value }))}
            />
          </div>

          <div className="pt-4 mt-8 border-t border-slate-200">
            <div className="mb-6">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('auth.numChildren')}</label>
              <select value={numChildren} onChange={handleNumChildrenChange} className="input-field h-14 mt-2">
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} {n === 1 ? (t('en') === 'en' ? 'Child' : 'Enfant') : (t('en') === 'en' ? 'Children' : 'Enfants')}</option>)}
              </select>
            </div>

            <div className="space-y-4">
              {children.map((child, idx) => (
                <div key={child.id} className="p-6 bg-white rounded-2xl soft-shadow border border-slate-100 flex flex-col gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest ml-1 font-mono">{(t('en') === 'en' ? 'Child' : 'Enfant')} {idx + 1} {t('auth.childDob')}</label>
                    <div className="relative group">
                      <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-indigo transition-colors" size={16} />
                      <input 
                        type="date" 
                        value={child.dob} 
                        onChange={(e) => updateChildField(idx, 'dob', e.target.value)} 
                        className="input-field h-12 text-sm bg-slate-50 border-transparent focus:bg-white !pl-12" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Right Column: Schedule UI (40%) */}
      <div className="flex-1 bg-white p-8 md:p-12 flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-center mb-8">
           <div className="flex bg-slate-100 p-1 rounded-full overflow-x-auto no-scrollbar max-w-full">
             {children.map((_, idx) => (
               <button
                 key={idx}
                 onClick={() => setActiveChildIndex(idx)}
                 className={cn(
                   "px-6 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                   activeChildIndex === idx ? "tab-active" : "tab-inactive"
                 )}
               >
                 {(t('en') === 'en' ? 'Child' : 'Enfant')} {idx + 1}
               </button>
             ))}
           </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-800">{t('auth.learningWindow')}</h3>
          <p className="text-xs text-slate-500 mt-1">{t('auth.scheduleDesc')}</p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 no-scrollbar pb-10">
          {children[activeChildIndex].schedule.map((day) => (
            <div key={day.day} className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100/50 transition-all hover:bg-white hover:soft-shadow hover:border-brand-indigo/20 group">
               <div className="flex justify-between items-center mb-4">
                 <span className="text-sm font-extrabold text-slate-800 uppercase tracking-widest">{t(`days.${day.day}`)}</span>
                 <button 
                   onClick={() => addTimeSlot(day.day)} 
                   className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-brand-indigo hover:border-brand-indigo hover:shadow-lg hover:shadow-indigo-50 transition-all font-bold text-[11px] uppercase tracking-wider"
                 >
                   <Plus size={14} /> {t('auth.addSlot')}
                 </button>
               </div>
               
               <div className="flex flex-wrap items-center gap-3">
                 {day.slots.length === 0 ? (
                   <div className="text-[11px] font-bold text-slate-300 uppercase tracking-widest italic py-2">{(t('en') === 'en' ? 'No slots added' : 'Aucun créneau ajouté')}</div>
                 ) : (
                   day.slots.map(slot => (
                     <div key={slot.id} className="flex items-center gap-3 bg-white border border-slate-100 p-2 pl-4 pr-2 rounded-2xl group/slot soft-shadow-sm hover:border-brand-indigo/30 transition-colors">
                       <div className="flex items-center gap-2">
                         <div className="space-y-0.5">
                           <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none">{(t('en') === 'en' ? 'Start' : 'Début')}</p>
                           <input 
                             type="time" 
                             value={slot.startTime} 
                             onChange={(e) => updateTimeSlot(day.day, slot.id, 'startTime', e.target.value)} 
                             className="bg-transparent text-xs font-bold text-brand-indigo outline-none cursor-pointer" 
                           />
                         </div>
                         <div className="w-4 h-px bg-slate-100" />
                         <div className="space-y-0.5">
                           <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none">{(t('en') === 'en' ? 'End' : 'Fin')}</p>
                           <input 
                             type="time" 
                             value={slot.endTime} 
                             onChange={(e) => updateTimeSlot(day.day, slot.id, 'endTime', e.target.value)} 
                             className="bg-transparent text-xs font-bold text-brand-indigo outline-none cursor-pointer" 
                           />
                         </div>
                       </div>
                       <button 
                         onClick={() => removeTimeSlot(day.day, slot.id)} 
                         className="p-2 bg-red-50 text-red-300 hover:text-red-500 hover:bg-red-100 rounded-xl transition-all"
                       >
                         <Trash2 size={14} />
                       </button>
                     </div>
                   ))
                 )}
               </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100 bg-white sticky bottom-0 flex flex-col items-center gap-4 shrink-0">
           <button 
             type="submit" 
             form="parent-signup-form"
             disabled={loading || !isFormValid}
             className="w-full bloom-gradient text-white font-bold py-5 rounded-2xl shadow-xl shadow-indigo-100 text-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 disabled:grayscale flex items-center justify-center gap-2"
           >
             {loading ? (
               <>
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 {t('auth.loading')}
               </>
             ) : t('auth.createParent')}
           </button>
           <p className="text-sm text-slate-400 pb-2">
             {t('auth.alreadyAccount')} <button type="button" onClick={() => onSwitch('login')} className="text-brand-indigo font-bold hover:underline">{t('auth.loginNow')}</button>
           </p>
        </div>
      </div>
    </div>
  );
};

// --- Teacher Signup View ---
const TeacherSignupView = ({ onSwitch, onComplete }: { onSwitch: (m: AuthMode) => void, onComplete: (role: UserRole, user: UserType) => void }) => {
  const { t } = useLanguage();
  const [fields, setFields] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    telephone: '',
    countryCode: '+1',
    dob: '',
    city: '',
    timezone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [aboutMe, setAboutMe] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState<'add' | 'remove'>('add');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Map schedule to flat list
    const schedule: any[] = Array.from(selectedSlots).map((slotId: string) => {
      const [day, timeRange] = slotId.split(':::');
      const [startH, endH] = timeRange.split('h - ');
      return {
        day: day.toLowerCase(),
        start: `${startH}:00`,
        end: `${endH.replace('h', '')}:00`
      };
    });

    const payload = {
      firstName: fields.firstName,
      lastName: fields.lastName,
      email: fields.email,
      password: fields.password,
      password_confirmation: fields.confirmPassword,
      telephone: `${fields.countryCode}${fields.telephone}`,
      dob: fields.dob,
      city: fields.city,
      timezone: fields.timezone,
      about_me: aboutMe,
      schedule: schedule
    };

    try {
      const response = await apiService.signupTeacher(payload);
      
      const userData = response.user || (response as any).data;
      const isActuallySuccess = response.success === true || (response.message?.toLowerCase().includes('success'));

      if (isActuallySuccess) {
        let token = response.token;
        let finalUser = userData;

        // Auto-login if token missing
        if (!token) {
          try {
            const loginRes = await apiService.login({ 
              email: fields.email, 
              password: fields.password 
            });
            if (loginRes.success && loginRes.token) {
              token = loginRes.token;
              finalUser = loginRes.user || finalUser;
            }
          } catch (loginErr) {
            console.error("Auto-login failed after signup", loginErr);
          }
        }

        if (token) {
          localStorage.setItem('auth_token', token);
        }

        setSuccess(response.message || (t('en') === 'en' ? 'Registration successful!' : 'Inscription réussie !'));
        setError(null);
        
        if (finalUser) {
          setTimeout(() => {
            onComplete(finalUser.role, finalUser);
          }, 1200);
        }
      } else {
        if (response.errors) {
          const firstError = Object.values(response.errors)[0][0];
          setError(firstError);
        } else {
          setError(response.message || (t('en') === 'en' ? 'Registration failed' : 'Échec de l\'inscription'));
        }
        setSuccess(null);
      }
    } catch (err) {
      setError(t('en') === 'en' ? 'An unexpected error occurred. Please try again.' : 'Une erreur inattendue est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSlot = (id: string, forceAction?: 'add' | 'remove') => {
    setSelectedSlots(prev => {
      const next = new Set(prev);
      const action = forceAction || (next.has(id) ? 'remove' : 'add');
      if (action === 'add') next.add(id); else next.delete(id);
      return next;
    });
  };

  const handleMouseDown = (id: string) => {
    setIsDragging(true);
    const action = selectedSlots.has(id) ? 'remove' : 'add';
    setDragAction(action);
    toggleSlot(id, action);
  };

  const handleMouseEnter = (id: string) => {
    if (isDragging) toggleSlot(id, dragAction);
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="flex flex-col md:flex-row h-full" onMouseUp={handleMouseUp}>
      {/* Left Column: Form (55%) */}
      <div className="w-full md:w-[55%] bg-slate-50/50 border-r border-slate-100 p-8 md:p-12 overflow-y-auto no-scrollbar">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bloom-gradient rounded-xl flex items-center justify-center text-white font-bold">B</div>
            <span className="text-xl font-bold tracking-tight text-brand-slate-ink">Bloom Buddies Academy</span>
          </div>
          <h2 className="text-3xl font-extrabold text-brand-slate-ink">{t('auth.teacherOnboarding')}</h2>
          <p className="text-slate-500 mt-1">{t('auth.teacherOnboardingDesc')}</p>
        </div>

        <form className="space-y-6" id="teacher-signup-form" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 animate-shake">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-sm font-bold border border-emerald-100 flex items-center gap-2">
              <Sparkles size={16} />
              {success}
            </div>
          )}
          <div className="flex flex-col items-center mb-8">
             <div className="relative group">
                <div onClick={() => fileInputRef.current?.click()} className="w-32 h-32 rounded-[2.5rem] bg-white soft-shadow flex items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden group-hover:border-brand-purple transition-all cursor-pointer">
                   {profilePic ? <img src={profilePic} className="w-full h-full object-cover shadow-inner" /> : <Camera className="text-slate-200" size={40} />}
                </div>
                <button type="button" className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-purple text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-all"><Plus size={20} /></button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setProfilePic(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }} />
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-4">{t('auth.profilePhoto')}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <FormInput 
              label={t('auth.firstName')}
              icon={UserIcon}
              type="text"
              required
              placeholder="John"
              value={fields.firstName}
              onChange={(e) => setFields(prev => ({ ...prev, firstName: e.target.value }))}
            />
            <FormInput 
              label={t('auth.lastName')}
              icon={UserIcon}
              type="text"
              required
              placeholder="Swift"
              value={fields.lastName}
              onChange={(e) => setFields(prev => ({ ...prev, lastName: e.target.value }))}
            />
          </div>

          <FormInput 
            label={t('auth.email')}
            icon={Mail}
            type="email"
            required
            placeholder="john@bloom.academy"
            value={fields.email}
            onChange={(e) => setFields(prev => ({ ...prev, email: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-6">
            <FormInput 
              label={t('auth.password')}
              icon={Lock}
              type="password"
              required
              placeholder="••••••••"
              value={fields.password}
              onChange={(e) => setFields(prev => ({ ...prev, password: e.target.value }))}
            />
            <FormInput 
              label={t('auth.confirmPassword')}
              icon={Lock}
              type="password"
              required
              placeholder="••••••••"
              value={fields.confirmPassword}
              onChange={(e) => setFields(prev => ({ ...prev, confirmPassword: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('auth.telephone')}</label>
              <div className="relative group">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
                  <CountrySelector 
                    value={fields.countryCode} 
                    onChange={(val) => setFields(prev => ({ ...prev, countryCode: val }))} 
                  />
                </div>
                <input 
                  type="text" 
                  required 
                  className="input-field h-14 !pl-28 text-base" 
                  placeholder="(555) 000-0000" 
                  value={fields.telephone}
                  onChange={(e) => setFields(prev => ({ ...prev, telephone: e.target.value }))}
                />
              </div>
            </div>
            <FormInput 
              label={t('auth.teacherDob')}
              icon={CalendarIcon}
              type="date"
              required
              value={fields.dob}
              onChange={(e) => setFields(prev => ({ ...prev, dob: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <FormInput 
              label={t('auth.city')}
              icon={MapPin}
              type="text"
              required
              placeholder="San Francisco"
              value={fields.city}
              onChange={(e) => setFields(prev => ({ ...prev, city: e.target.value }))}
            />
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('auth.timezone')}</label>
              <div className="relative group">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-indigo transition-colors pointer-events-none" size={18} />
                <select 
                  required 
                  className="input-field h-14 !pl-14 cursor-pointer appearance-none bg-white font-medium"
                  value={fields.timezone}
                  onChange={(e) => setFields(prev => ({ ...prev, timezone: e.target.value }))}
                >
                  <option value="">{t('auth.selectTimezone')}</option>
                  <option value="PKT">(UTC+5) Pakistan Standard Time</option>
                  <option value="CET">(UTC+1) Central European Time</option>
                  <option value="EST">(UTC-5) Eastern Time (US)</option>
                  <option value="BST">(UTC+1) British Summer Time</option>
                  <option value="IST">(UTC+5:30) India Standard Time</option>
                  <option value="JST">(UTC+9) Japan Standard Time</option>
                  <option value="AEST">(UTC+10) Australian Eastern Standard Time</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t('auth.aboutMe')}</label>
              <span className={cn("text-[10px] font-bold", aboutMe.length >= 250 ? "text-emerald-500" : "text-amber-500")}>{aboutMe.length}/350</span>
            </div>
            <textarea value={aboutMe} onChange={(e) => setAboutMe(e.target.value.slice(0, 350))} required className="input-field h-40 resize-none py-4 leading-relaxed" placeholder={t('auth.aboutMePlaceholder')} />
            {aboutMe.length < 250 && <p className="text-[10px] text-amber-500 font-bold ml-1 font-mono uppercase">{t('auth.aboutMeMin')}</p>}
          </div>
        </form>
      </div>

      {/* Right Column: Schedule Grid (45%) */}
      <div className="flex-1 bg-white p-8 md:px-12 md:py-10 flex flex-col h-full overflow-hidden select-none">
        <div className="mb-6 shrink-0">
          <h3 className="text-xl font-bold text-slate-800">{t('auth.weeklyAvailability')}</h3>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">{t('auth.teacherStep2')}</p>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col border border-slate-100 rounded-3xl bg-slate-50/30">
          <div className="overflow-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <table className="w-full border-separate border-spacing-1 min-w-[700px]">
              <thead className="sticky top-0 z-20 bg-white">
                <tr>
                  <th className="w-24 sticky left-0 z-30 bg-white/100 backdrop-blur-md border-r border-slate-100" />
                  {DAYS.map(day => (
                    <th key={day} className="py-4 px-1 text-center font-extrabold text-[10px] text-slate-400 uppercase tracking-widest min-w-[90px] border-b border-slate-100">
                      {t(`days.${day}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map(time => (
                  <tr key={time}>
                    <td className="w-24 sticky left-0 z-10 bg-white/95 backdrop-blur-md pr-4 text-right border-r border-slate-100/50">
                      <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{time}</span>
                    </td>
                    {DAYS.map(day => {
                      const id = `${day}:::${time}`;
                      const isSelected = selectedSlots.has(id);
                      return (
                        <td 
                          key={day}
                          onMouseDown={() => handleMouseDown(id)}
                          onMouseEnter={() => handleMouseEnter(id)}
                          className={cn(
                            "h-10 rounded-xl cursor-pointer transition-all duration-300 border relative overflow-hidden",
                            isSelected 
                              ? "bg-emerald-500 border-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.2)]" 
                              : "bg-white/50 border-transparent hover:bg-white hover:border-slate-200"
                          )}
                        >
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                              <span className="text-[10px] font-black text-white uppercase tracking-tighter leading-none">Available</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100 bg-white flex flex-col items-center gap-6 shrink-0">
           <div className="flex justify-between w-full items-center">
             <button type="button" onClick={() => setSelectedSlots(new Set())} className="text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors uppercase tracking-widest">{t('auth.clearSelection')}</button>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{selectedSlots.size} {t('auth.slotsSelected')}</span>
             </div>
           </div>
           
           <button 
             type="submit"
             form="teacher-signup-form"
             disabled={loading || aboutMe.length < 250 || selectedSlots.size === 0} 
             className="w-full bloom-gradient text-white font-bold py-5 rounded-2xl shadow-xl shadow-emerald-100/50 text-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:scale-100 flex items-center justify-center gap-2"
           >
             {loading ? (
               <>
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 {t('auth.loading')}
               </>
             ) : t('auth.createTeacher')}
           </button>
           <p className="text-sm text-slate-400 pb-2">
             {t('auth.alreadyAccount')} <button type="button" onClick={() => onSwitch('login')} className="text-brand-indigo font-bold hover:underline">{t('auth.loginNow')}</button>
           </p>
        </div>
      </div>
    </div>
  );
};
