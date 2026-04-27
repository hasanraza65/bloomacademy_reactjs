import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Play, 
  LogOut, 
  Sparkles, 
  GraduationCap,
  Bell
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { UserRole, User } from '@/src/types';
import { useLanguage } from '../context/LanguageContext';

interface DashboardProps {
  role: UserRole;
  user: User;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ role, user, onLogout }) => {
  const { t, language, setLanguage } = useLanguage();
  const roleName = role === 3 ? t('nav.signupParent') : t('nav.signupTeacher');

  return (
    <div className="min-h-screen bg-brand-slate-bg flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-100 flex-col p-8 soft-shadow">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-8 h-8 bloom-gradient rounded-lg flex items-center justify-center text-white font-bold">B</div>
          <span className="text-xl font-bold tracking-tight text-slate-800">Bloom Buddies Academy</span>
        </div>

        <nav className="space-y-2 flex-1">
          <NavItem icon={GraduationCap} label={t('dash.classes')} active />
        </nav>

        <button 
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-500 font-bold transition-all mt-auto"
        >
          <LogOut size={20} />
          <span>{t('nav.logout')}</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 px-8 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {t('dash.welcome')} <span className="text-brand-indigo">{user.firstName}</span>!
            </h1>
            <p className="text-xs text-slate-500 font-medium">{roleName} Dashboard • {t('dash.today')}</p>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Language Switcher */}
             <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 mr-2">
              <button 
                onClick={() => setLanguage('fr')}
                className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-black uppercase transition-all",
                  language === 'fr' ? "bg-white text-brand-indigo shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                FR
              </button>
              <button 
                onClick={() => setLanguage('en')}
                className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-black uppercase transition-all",
                  language === 'en' ? "bg-white text-brand-indigo shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                EN
              </button>
            </div>

             <button className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors relative">
                <Bell size={22} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
             </button>
             <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 p-0.5 overflow-hidden">
                <img 
                  src={user.avatar || `https://picsum.photos/seed/${user.email}/100/100`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover rounded-[14px]" 
                  referrerPolicy="no-referrer"
                />
             </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 max-w-6xl w-full mx-auto space-y-10">
          {/* Hero Section */}
          <section>
             <div className="bloom-gradient rounded-[2.5rem] p-10 text-white soft-shadow flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full translate-x-1/3 -translate-y-1/2" />
                
                <div className="relative z-10 flex-1">
                   <div className="flex items-center gap-2 mb-4">
                      <Sparkles size={20} className="text-amber-300" />
                      <span className="text-sm font-bold uppercase tracking-widest opacity-80 font-mono">{t('dash.currentSession')}</span>
                   </div>
                   <h2 className="text-4xl md:text-5xl font-extrabold mb-10 leading-tight">{t('dash.creativeWriting')}</h2>
                   
                   <Link 
                     to="/classroom"
                     className="inline-flex bg-white text-brand-indigo px-10 py-5 rounded-2xl font-extrabold text-lg items-center gap-3 hover:scale-105 active:scale-95 transition-all soft-shadow group/btn"
                   >
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-brand-indigo group-hover/btn:bg-brand-indigo group-hover/btn:text-white transition-colors">
                        <Play fill="currentColor" size={20} className="ml-1" />
                      </div>
                      {role === 2 ? "Manage Class" : t('dash.joinClass')}
                   </Link>
                </div>
             </div>
          </section>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
  <button className={cn(
    "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all group",
    active 
      ? "bg-indigo-50 text-brand-indigo" 
      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
  )}>
    <Icon size={20} className={cn("transition-transform group-hover:scale-110", active ? "text-brand-indigo" : "text-slate-400")} />
    <span>{label}</span>
  </button>
);
