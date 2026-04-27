import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  Menu, 
  X, 
  Star, 
  BookOpen, 
  Users, 
  Calendar, 
  BarChart, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

import { Link } from 'react-router-dom';

import { useLanguage } from '../context/LanguageContext';

// --- Language Switcher Component ---
const LanguageSwitcher = ({ isMobile = false }) => {
  const { language, setLanguage } = useLanguage();
  
  return (
    <div className={cn("flex items-center gap-2 bg-slate-100 rounded-full p-1", isMobile && "mt-4 w-fit")}>
      <button 
        onClick={() => setLanguage('fr')}
        className={cn(
          "px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-all",
          language === 'fr' ? "bg-white text-brand-indigo shadow-sm" : "text-slate-400 hover:text-slate-600"
        )}
      >
        FR
      </button>
      <button 
        onClick={() => setLanguage('en')}
        className={cn(
          "px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-all",
          language === 'en' ? "bg-white text-brand-indigo shadow-sm" : "text-slate-400 hover:text-slate-600"
        )}
      >
        EN
      </button>
    </div>
  );
};

// --- Navbar ---
export const Navbar = ({ 
  onSignUpParent, 
  onSignUpTeacher, 
  onLogin,
  isLoggedIn,
  onLogout
}: { 
  onSignUpParent: () => void, 
  onSignUpTeacher: () => void, 
  onLogin: () => void,
  isLoggedIn?: boolean,
  onLogout?: () => void
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
      isScrolled ? "glass-morphism py-3 soft-shadow" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="w-10 h-10 bloom-gradient rounded-xl flex items-center justify-center text-white soft-shadow group-hover:scale-110 transition-transform">
            <GraduationCap size={24} />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-slate-800">
            Bloom Buddies <span className="text-brand-purple">Academy</span>
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 font-semibold text-slate-600">
          <a href="#features" className="hover:text-brand-purple transition-colors">{t('nav.features')}</a>
          <a href="#how-it-works" className="hover:text-brand-purple transition-colors">{t('nav.howItWorks')}</a>
          <a href="#testimonials" className="hover:text-brand-purple transition-colors">{t('nav.testimonials')}</a>
          <div className="h-6 w-px bg-slate-200" />
          
          <LanguageSwitcher />

          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className="hover:text-brand-purple transition-colors">{t('nav.dashboard')}</Link>
              <button 
                onClick={onLogout}
                className="bg-slate-100 text-slate-600 px-6 py-2.5 rounded-full font-bold hover:bg-red-50 hover:text-red-500 transition-all"
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <button onClick={onLogin} className="hover:text-brand-purple transition-colors">{t('nav.login')}</button>
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                  className="bloom-gradient text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                >
                  {t('nav.signup')} <ChevronDown size={18} className={cn("transition-transform", isDropdownOpen && "rotate-180")} />
                </button>
                
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-64 bg-white rounded-2xl p-2 soft-shadow border border-slate-100 z-50"
                    >
                      <button 
                        onClick={onSignUpParent}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-3 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-brand-purple flex items-center justify-center group-hover:bg-brand-purple group-hover:text-white transition-colors">
                          <Users size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{t('nav.signupParent')}</p>
                          <p className="text-xs text-slate-500">{t('nav.parentDesc')}</p>
                        </div>
                      </button>
                      <button 
                        onClick={onSignUpTeacher}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-3 group mt-1"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-brand-indigo flex items-center justify-center group-hover:bg-brand-indigo group-hover:text-white transition-colors">
                          <BookOpen size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{t('nav.signupTeacher')}</p>
                          <p className="text-xs text-slate-500">{t('nav.teacherDesc')}</p>
                        </div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-slate-800" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 backdrop-blur-xl absolute top-full left-0 right-0 border-b border-slate-100 px-6 py-8 overflow-hidden"
          >
            <div className="flex flex-col gap-6 text-lg font-bold text-slate-700">
              <a href="#features" onClick={() => setIsMenuOpen(false)}>{t('nav.features')}</a>
              <a href="#how-it-works" onClick={() => setIsMenuOpen(false)}>{t('nav.howItWorks')}</a>
              <a href="#testimonials" onClick={() => setIsMenuOpen(false)}>{t('nav.testimonials')}</a>
              
              <LanguageSwitcher isMobile />
              
              <div className="h-px bg-slate-100" />
              {isLoggedIn ? (
                <>
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>{t('nav.dashboard')}</Link>
                  <button className="text-left text-red-500 py-2" onClick={() => { onLogout?.(); setIsMenuOpen(false); }}>{t('nav.logout')}</button>
                </>
              ) : (
                <>
                  <button className="text-left py-2" onClick={() => { onSignUpParent(); setIsMenuOpen(false); }}>{t('nav.signupParent')}</button>
                  <button className="text-left py-2" onClick={() => { onSignUpTeacher(); setIsMenuOpen(false); }}>{t('nav.signupTeacher')}</button>
                  <button className="bg-brand-indigo text-white py-4 rounded-2xl w-full text-center shadow-lg shadow-indigo-100" onClick={() => { onLogin(); setIsMenuOpen(false); }}>{t('nav.login')}</button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// --- Hero Section ---
export const Hero = ({ onStartTrial }: { onStartTrial: () => void }) => {
  const { t } = useLanguage();
  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden min-h-[90vh] flex items-center">
      {/* Background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-purple/10 blur-[120px] rounded-full animate-pulse-slow" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-indigo/10 blur-[120px] rounded-full animate-pulse-slow" />
      
      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center relative">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 bg-purple-50 text-brand-purple px-4 py-2 rounded-full font-bold text-sm mb-6 border border-purple-100">
            <Sparkles size={16} />
            <span>{t('hero.tag')}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-8">
            {t('hero.title').split('Learning')[0]} <br /> 
            <span className="gradient-text">{t('hero.title').includes('Learning') ? 'Learning ' + t('hero.title').split('Learning')[1] : t('hero.title')}</span>
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed mb-10 max-w-xl">
            {t('hero.desc')}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button 
              onClick={onStartTrial}
              className="w-full sm:w-auto bloom-gradient text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-indigo-100 hover:-translate-y-1 active:scale-95"
            >
              {t('hero.startTrial')}
            </button>
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 text-slate-600 font-bold px-8 py-5 rounded-2xl hover:bg-white transition-all">
              {t('hero.watchDemo')} <ArrowRight size={18} />
            </button>
          </div>
          
          <div className="mt-12 flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-sm">
                  <img 
                    src={`https://picsum.photos/seed/kid${i}/100/100`} 
                    alt="Student" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
            <div className="text-sm font-semibold">
              <div className="flex items-center gap-1 text-brand-yellow">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="text-slate-500">{t('hero.trusted')}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative"
        >
          {/* Main Visual */}
          <div className="relative z-10 rounded-[2.5rem] overflow-hidden soft-shadow border-[12px] border-white max-w-lg mx-auto transform hover:rotate-2 transition-transform duration-500">
            <img 
              src="https://picsum.photos/seed/learning-kids/800/1000" 
              alt="Kid learning" 
              className="w-full aspect-[4/5] object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-8">
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 text-white w-full border border-white/30">
                <p className="font-bold">{t('hero.nextClass')}</p>
                <p className="text-sm opacity-90">{t('hero.startingIn')}</p>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-10 -right-4 z-20 bg-white p-6 rounded-3xl soft-shadow flex flex-col items-center gap-2 border border-slate-100"
          >
            <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-brand-pink">
              <Sparkles size={24} />
            </div>
            <p className="text-sm font-bold text-slate-800">100% Fun</p>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-6 -left-10 z-20 bg-white p-6 rounded-3xl soft-shadow flex items-center gap-4 border border-slate-100"
          >
            <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center text-brand-teal">
              <BookOpen size={28} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800">200+</p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Courses</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

// --- Features Section ---
export const Features = () => {
  const { t } = useLanguage();
  const features = [
    {
      title: t('feat.interactive.title'),
      desc: t('feat.interactive.desc'),
      icon: Sparkles,
      color: "brand-purple",
      bg: "bg-purple-50"
    },
    {
      title: t('feat.teachers.title'),
      desc: t('feat.teachers.desc'),
      icon: GraduationCap,
      color: "brand-indigo",
      bg: "bg-indigo-50"
    },
    {
      title: t('feat.flexible.title'),
      desc: t('feat.flexible.desc'),
      icon: Calendar,
      color: "brand-pink",
      bg: "bg-pink-50"
    },
    {
      title: t('feat.tracking.title'),
      desc: t('feat.tracking.desc'),
      icon: BarChart,
      color: "brand-teal",
      bg: "bg-teal-50"
    }
  ];

  return (
    <section id="features" className="py-24 px-6 bg-white relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
            {t('features.title').split(' families')[0]} <span className="text-brand-purple">{t('features.title').split('families ')[1] || 'love us'}</span>
          </h2>
          <p className="text-xl text-slate-600">
            {t('features.desc')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2rem] bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
            >
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform", f.bg)}>
                 <f.icon className={cn(`text-${f.color}`)} size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">{f.title}</h3>
              <p className="text-slate-600 leading-relaxed font-medium">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- How It Works ---
export const HowItWorks = () => {
  const { t } = useLanguage();
  const steps = [
    {
      title: t('step.1.title'),
      desc: t('step.1.desc'),
      icon: "1"
    },
    {
      title: t('step.2.title'),
      desc: t('step.2.desc'),
      icon: "2"
    },
    {
      title: t('step.3.title'),
      desc: t('step.3.desc'),
      icon: "3"
    }
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">{t('how.title')}</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">{t('how.desc')}</p>
        </div>

        <div className="relative">
          {/* Connector Line */}
          <div className="hidden lg:block absolute top-[100px] left-[15%] right-[15%] h-1 border-t-4 border-dashed border-slate-200 z-0" />
          
          <div className="grid lg:grid-cols-3 gap-12 relative z-10">
            {steps.map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center text-3xl font-extrabold mb-8 transition-all hover:scale-110 soft-shadow",
                  i === 0 ? "bg-brand-purple text-white" : i === 1 ? "bg-brand-indigo text-white" : "bg-brand-pink text-white"
                )}>
                  {s.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{s.title}</h3>
                <p className="text-slate-600 font-medium leading-relaxed max-w-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Testimonials ---
export const Testimonials = () => {
  const { t, language } = useLanguage();
  const reviews = [
    {
      name: "Sarah Jenkins",
      role: language === 'en' ? "Mother of two" : "Mère de deux enfants",
      content: language === 'en' ? "My son used to struggle with math, but now he actually asks when his next Bloom class is! The interactive tools make a world of difference." : "Mon fils avait des difficultés en maths, mais maintenant il demande quand est son prochain cours Bloom ! Les outils interactifs font toute la différence.",
      image: "https://picsum.photos/seed/parent1/100/100"
    },
    {
      name: "Michael Chen",
      role: language === 'en' ? "Father of one" : "Père d'un enfant",
      content: language === 'en' ? "The quality of teachers here is unmatched. They don't just teach; they inspire. It's the best investment we've made for our daughter's education." : "La qualité des enseignants ici est inégalée. Ils n'enseignent pas seulement ; ils inspirent. C'est le meilleur investissement que nous ayons fait pour l'éducation de notre fille.",
      image: "https://picsum.photos/seed/parent2/100/100"
    },
    {
      name: "Emily Rodriguez",
      role: language === 'en' ? "Homeschooling Parent" : "Parent faisant l'école à la maison",
      content: language === 'en' ? "The flexibility is a lifesaver. We can easily fit classes into our custom curriculum, and the progress tracking helps me stay on top of her growth." : "La flexibilité est un sauveur. Nous pouvons facilement intégrer les cours dans notre programme personnalisé, et le suivi des progrès m'aide à rester au top de sa croissance.",
      image: "https://picsum.photos/seed/parent3/100/100"
    }
  ];

  return (
    <section id="testimonials" className="py-24 px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 font-display leading-[1.2]">{t('test.title').split(' parents')[0]} <span className="text-brand-indigo">{t('test.title').includes('parents') ? 'parents' + t('test.title').split('parents')[1] : (t('test.title').includes('par ') ? t('test.title').split('par ')[1] : 'parents like you')}</span></h2>
            <p className="text-xl text-slate-600">{t('test.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
             <div className="bg-brand-yellow/10 p-2 rounded-xl text-brand-yellow">
                <Star fill="currentColor" size={24} />
             </div>
             <div className="pr-4">
                <p className="text-lg font-extrabold text-slate-900">{t('test.rating')}</p>
                <p className="text-sm font-bold text-slate-500 uppercase">{t('test.independent')}</p>
             </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((r, i) => (
            <motion.div 
              key={i}
              className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 relative group transition-all hover:-translate-y-2"
            >
              <div className="flex gap-1 text-brand-yellow mb-6">
                {[1, 2, 3, 4, 5].map(j => <Star key={j} size={16} fill="currentColor" />)}
              </div>
              <p className="text-lg text-slate-700 italic leading-relaxed mb-8">"{r.content}"</p>
              <div className="flex items-center gap-4 mt-auto">
                <img src={r.image} alt={r.name} className="w-14 h-14 rounded-2xl object-cover grayscale group-hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                <div>
                  <p className="font-bold text-slate-900">{r.name}</p>
                  <p className="text-sm text-slate-500 font-medium">{r.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- CTA Banner ---
export const CTABanner = ({ onAction }: { onAction: () => void }) => {
  const { t } = useLanguage();
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto bloom-gradient rounded-[3rem] p-8 md:p-16 text-center text-white soft-shadow relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
        <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">{t('cta.title')}</h2>
          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
            {t('cta.desc')}
          </p>
          <button 
            onClick={onAction}
            className="bg-white text-brand-indigo px-12 py-5 rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-all soft-shadow"
          >
            {t('cta.button')}
          </button>
        </div>
      </div>
    </section>
  );
};

// --- Footer ---
export const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="bg-slate-900 text-white pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-brand-purple rounded-lg flex items-center justify-center text-white">
                <GraduationCap size={18} />
              </div>
              <span className="text-xl font-extrabold tracking-tight">Bloom Buddies Academy</span>
            </div>
            <p className="text-slate-400 leading-relaxed font-medium">
              {t('footer.desc')}
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-slate-100">Quick Links</h4>
            <ul className="space-y-4 text-slate-400 font-medium">
              <li><a href="#" className="hover:text-white transition-colors">{t('nav.features')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('nav.howItWorks')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-slate-100">Legal</h4>
            <ul className="space-y-4 text-slate-400 font-medium">
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Parent Guide</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-slate-100">{t('footer.newsletter')}</h4>
            <p className="text-slate-400 mb-6 text-sm">{t('footer.newsletterDesc')}</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Email address" 
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 w-full focus:outline-none focus:border-brand-purple"
              />
              <button className="bg-brand-purple p-2.5 rounded-xl hover:bg-brand-purple/90">
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-sm font-medium">
          <p>{t('footer.rights')}</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
