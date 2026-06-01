import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Play, 
  LogOut, 
  Sparkles, 
  GraduationCap,
  Bell,
  User as UserIcon,
  Loader2,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { UserRole, User, ClassroomData } from '@/src/types';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import Logo from '../public/images/logo.png';
import { CalendarView } from './CalendarView';

interface DashboardProps {
  role: UserRole;
  user: User;
  myClasses: ClassroomData[];
  isLoading?: boolean;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ role, user, myClasses, isLoading, onLogout }) => {
  const { t, language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = React.useState<'classes' | 'calendar'>('classes');
  const roleName = role === 3 ? t('nav.signupParent') : t('nav.signupTeacher');

const myClassesLabel =
  language === 'en'
    ? t('dash.myClasses').replace(/\b\w/g, char => char.toUpperCase())
    : t('dash.myClasses');

const calendarLabel =
  language === 'en'
    ? t('dash.calendar').replace(/\b\w/g, char => char.toUpperCase())
    : t('dash.calendar');

  return (
    <div className="min-h-screen bg-brand-slate-bg flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-100 flex-col p-8 soft-shadow">
        <div className="flex items-center gap-2 mb-8">
          {/* <div className="w-8 h-8 bloom-gradient rounded-lg flex items-center justify-center text-white font-bold">B</div> */}
          {/* <span className="text-xl font-bold tracking-tight text-slate-800">Bloom Buddies {t('nav.academy') || 'Academy'}</span> */}
          <img src={Logo} alt="Bloom Buddies Academy" className="w-84 h-auto" />
        </div>


            <nav className="space-y-2 flex-1">
              <NavItem 
                icon={GraduationCap} 
                label={myClassesLabel} 
                active={activeTab === 'classes'} 
                onClick={() => setActiveTab('classes')}
              />
              <NavItem 
                icon={Calendar} 
                label={calendarLabel} 
                active={activeTab === 'calendar'} 
                onClick={() => setActiveTab('calendar')}
              />
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
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 px-4 md:px-8 py-4 md:py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-slate-800 leading-tight">
              {t('dash.welcome')} <span className="text-brand-indigo">{user.firstName}</span>
              { language === 'fr' ? ' ' : '' }
              !
            </h1>
            {/* <p className="text-xs text-slate-500 font-medium">{roleName} Dashboard • {t('dash.today')}</p> */}
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
             <LanguageSwitcher />

             {/* <button className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors relative">
                <Bell size={22} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
             </button> */}
             <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-slate-100 border border-slate-200 p-0.5 overflow-hidden shrink-0">
                <img 
                  src={user.avatar || `https://picsum.photos/seed/${user.email}/100/100`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover rounded-[14px]" 
                  referrerPolicy="no-referrer"
                />
             </div>
             <button 
               onClick={onLogout}
               className="lg:hidden p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
               title={t('nav.logout')}
             >
               <LogOut size={22} />
             </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 md:p-8 max-w-6xl w-full mx-auto space-y-6 md:space-y-10">
          {/* Mobile Tab Selector */}
          <div className="lg:hidden flex bg-white p-1 rounded-2xl border border-slate-100 soft-shadow">
            <button
              onClick={() => setActiveTab('classes')}
              className={cn(
                "flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                activeTab === 'classes'
                  ? "bg-indigo-50 text-brand-indigo shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <GraduationCap size={18} />
              <span>{myClassesLabel}</span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={cn(
                "flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                activeTab === 'calendar'
                  ? "bg-indigo-50 text-brand-indigo shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Calendar size={18} />
              <span>{calendarLabel}</span>
            </button>
          </div>

          {activeTab === 'classes' ? (
            <section>
               {isLoading ? (
                 <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="relative">
                      <Loader2 size={48} className="text-brand-indigo animate-spin" />
                      <div className="absolute inset-0 blur-xl bg-brand-indigo/20 animate-pulse rounded-full" />
                    </div>
                    <p className="text-slate-400 font-bold animate-pulse tracking-wide uppercase text-xs">
                      {t('dash.fetching')}
                    </p>
                 </div>
               ) : myClasses.length > 0 ? (
                 <div className="grid grid-cols-1 gap-8">
                   {myClasses.map((classroom, idx) => (
                     <motion.div 
                       key={classroom.id}
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: idx * 0.1 }}
                       className="bloom-gradient rounded-xl p-6 text-white soft-shadow flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group h-full"
                     >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full translate-x-1/3 -translate-y-1/2" />
                        
                        <div className="relative z-10 flex-1">
                           <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                              {role === 3 ? (
                                classroom.teacher && (
                                  <div className="flex items-center gap-3 opacity-90">
                                     <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                        <BookOpen size={20} />
                                     </div>
                                     <div className="text-left">
                                         <p className="text-[12px] font-black uppercase tracking-widest leading-none mb-1 ">{t("class.child")}</p>
                                        <p className="text-4xl font-bold uppercase leading-none transform -translate-x-.5">{classroom.child.child_name}</p>
                                        <p className="text-[12px] font-black uppercase tracking-widest leading-none mb-1 mt-3">{t("class.teacher")}</p>
                                        <p className="text-4xl font-bold uppercase leading-none transform -translate-x-.5">{classroom.teacher.firstName}</p>
                                     </div>
                                  </div>
                                )
                              ) : (
                                classroom.child && (
                                  <div className="flex items-center gap-3 opacity-90">
                                     <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                        <UserIcon size={20} />
                                     </div>
                                     <div className="text-left">
                                        <p className="text-[12px] font-black uppercase tracking-widest leading-none mb-1">{t("class.student")}</p>
                                        <p className="text-4xl font-bold uppercase leading-none transform -translate-x-.5">{classroom.child.child_name || "Assigned Student"}</p>
                                     </div>
                                  </div>
                                )
                              )}

                              <Link 
                                to={`/classroom/${classroom.channel_name}`}
                                className="inline-flex bg-white text-brand-indigo px-6 py-3 rounded-lg font-extrabold text-lg items-center gap-3 hover:scale-105 active:scale-95 transition-all soft-shadow group/btn"
                              >
                                 <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-brand-indigo group-hover/btn:bg-brand-indigo group-hover/btn:text-white transition-colors">
                                   <Play fill="currentColor" size={20} className="ml-1" />
                                 </div>
                                 {
                                  language === 'en' ?
                                  <span className="capitalize">{t('class.enterclass')}</span> :
                                  <span>{t('class.enterclass')}</span>
                                 }
                              </Link>
                           </div>
                        </div>
                     </motion.div>
                   ))}
                 </div>
               ) : (
                <div>
                  <div className="flex items-center justify-center gap-2 my-4 text-md text-slate-600">
                    {t('dash.noclassesavailable')}
                  </div>
                </div>
               )}
            </section>
          ) : (
            <CalendarView />
          )}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all group",
      active 
        ? "bg-indigo-50 text-brand-indigo" 
        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
    )}
  >
    <Icon size={20} className={cn("transition-transform group-hover:scale-110", active ? "text-brand-indigo" : "text-slate-400")} />
    <span>{label}</span>
  </button>
);
