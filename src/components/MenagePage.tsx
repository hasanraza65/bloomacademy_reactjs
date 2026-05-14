import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Minus, 
  Star, 
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Wind,
  SprayCan,
  Trash2
} from 'lucide-react';
import { Navbar, Footer } from './landing';
import { useLanguage } from '../context/LanguageContext';
import { AuthMode } from '../types';
import { cn } from '@/src/lib/utils';

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="text-xl font-bold text-slate-800 group-hover:text-brand-purple transition-colors">{question}</span>
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-all",
          isOpen ? "bg-brand-purple text-white rotate-180" : "bg-slate-100 text-slate-500"
        )}>
          {isOpen ? <Minus size={18} /> : <Plus size={18} />}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-slate-600 leading-relaxed font-medium">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const MenagePage = ({ 
  isLoggedIn, 
  onLogout, 
  openAuth 
}: { 
  isLoggedIn: boolean, 
  onLogout: () => void, 
  openAuth: (mode: AuthMode) => void 
}) => {
  const { t } = useLanguage();

  const services = [
    {
      title: t('menage.service1.title'),
      desc: t('menage.service1.desc'),
      icon: SprayCan,
      color: "brand-purple",
      bg: "bg-purple-50"
    },
    {
      title: t('menage.service2.title'),
      desc: t('menage.service2.desc'),
      icon: CheckCircle2,
      color: "brand-indigo",
      bg: "bg-indigo-50"
    },
    {
      title: t('menage.service3.title'),
      desc: t('menage.service3.desc'),
      icon: Wind,
      color: "brand-teal",
      bg: "bg-teal-50"
    }
  ];

  const testimonials = [
    {
      name: t('menage.testimonials.name1'),
      quote: t('menage.testimonials.quote1'),
      avatar: "https://images.unsplash.com/photo-1656690278205-1febeb97d664?auto=format&fit=crop&w=80&h=80",
      rating: 5
    },
    {
      name: t('menage.testimonials.name2'),
      quote: t('menage.testimonials.quote2'),
      avatar: "https://images.unsplash.com/photo-1586195831465-e769c717f1e1?auto=format&fit=crop&w=80&h=80",
      rating: 5
    }
  ];

  const faqs = [
    { q: t('menage.faq.q1'), a: t('menage.faq.a1') },
    { q: t('menage.faq.q2'), a: t('menage.faq.a2') },
    { q: t('menage.faq.q3'), a: t('menage.faq.a3') },
    { q: t('menage.faq.q4'), a: t('menage.faq.a4') },
    { q: t('menage.faq.q5'), a: t('menage.faq.a5') },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar 
        isLoggedIn={isLoggedIn}
        onSignUpParent={() => openAuth('signup-parent')} 
        onSignUpTeacher={() => openAuth('signup-teacher')} 
        onLogin={() => openAuth('login')}
        onLogout={onLogout}
      />

      <main>
        {/* --- SECTION 1: HERO --- */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden flex items-center bg-slate-50">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-purple/5 blur-[120px] rounded-full animate-pulse-slow" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-indigo/5 blur-[120px] rounded-full animate-pulse-slow" />
          
          <div className="max-w-7xl mx-auto w-full relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 bg-purple-50 text-brand-purple px-4 py-2 rounded-full font-bold text-sm mb-8 border border-purple-100">
                <ShieldCheck size={16} />
                <span>{t('menage.hero.badge')}</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-8 max-w-4xl mx-auto">
                {t('menage.hero.title')}
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl mx-auto">
                {t('menage.hero.subtext')}
              </p>
              <div className="flex justify-center">
                <button 
                  onClick={() => openAuth('signup-parent')}
                  className="bloom-gradient text-white px-12 py-5 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 hover:-translate-y-1 active:scale-95 transition-all"
                >
                  {t('menage.hero.cta')}
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* --- SECTION 2: SERVICES --- */}
        <section className="py-24 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">{t('menage.services.title')}</h2>
              <p className="text-xl text-slate-600">{t('menage.services.subtitle')}</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {services.map((s, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 rounded-[2rem] bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
                >
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform", s.bg)}>
                    <s.icon className={cn(`text-${s.color}`)} size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">{s.title}</h3>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {s.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --- SECTION 3: TESTIMONIALS --- */}
        <section className="py-24 px-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map((t, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="bg-white p-8 rounded-[2.5rem] soft-shadow border border-slate-100 flex flex-col items-center text-center group"
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden mb-6 border-4 border-slate-50 group-hover:scale-105 transition-transform">
                    <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex gap-1 text-brand-yellow mb-4">
                    {[...Array(t.rating)].map((_, j) => <Star key={j} size={18} fill="currentColor" />)}
                  </div>
                  <p className="text-xl text-slate-700 italic leading-relaxed mb-6 font-medium">"{t.quote}"</p>
                  <p className="font-bold text-slate-900 text-lg">{t.name}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --- SECTION 4: CTA BANNER --- */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto bloom-gradient rounded-[3rem] p-8 md:p-16 text-center text-white soft-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6">{t('menage.cta.title')}</h2>
              <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
                {t('menage.cta.subtext')}
              </p>
              <button 
                onClick={() => openAuth('signup-parent')}
                className="bg-white text-brand-indigo px-12 py-5 rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-all soft-shadow mb-4"
              >
                {t('menage.cta.button')}
              </button>
              <p className="text-sm font-bold opacity-80 mt-4 underline underline-offset-4">
                 {t('menage.cta.note')}
              </p>
            </div>
          </div>
        </section>

        {/* --- SECTION 5: FAQ --- */}
        <section className="py-24 px-6 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-12 text-center">{t('menage.faq.title')}</h2>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <FAQItem key={i} question={faq.q} answer={faq.a} />
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* --- SECTION 6: FOOTER (Overridden with specific content) --- */}
      <footer className="bg-slate-900 text-white pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex flex-col items-center gap-6 mb-12">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-brand-purple rounded-xl flex items-center justify-center text-white">
                <Sparkles size={24} />
              </div>
              <span className="text-2xl font-extrabold tracking-tight">Bloom Buddies <span className="text-brand-purple">Academy</span></span>
            </div>
            <p className="text-slate-400 max-w-lg font-medium">
              {t('menage.footer.address')}
            </p>
          </div>
          
          <div className="py-8 border-y border-slate-800 mb-12">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-6">Nos Villes</p>
            <p className="text-slate-300 font-medium leading-relaxed max-w-4xl mx-auto">
              {t('menage.footer.cities')}
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-slate-500 text-sm font-medium">
            <p>{t('menage.footer.copyright')}</p>
            <div className="flex gap-8">
              <a href="https://www.facebook.com/BloomBuddiesAcademy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Facebook</a>
              <a href="https://www.instagram.com/bloombuddiesacademy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
