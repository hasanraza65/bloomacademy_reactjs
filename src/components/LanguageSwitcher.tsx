import React from 'react';
import { cn } from '@/src/lib/utils';
import { useLanguage } from '../context/LanguageContext';

export const LanguageSwitcher = ({ isMobile = false, darkMode = false }: { isMobile?: boolean, darkMode?: boolean }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={cn(
      "flex items-center gap-2 rounded-full p-1", 
      darkMode ? "bg-white/10" : "bg-slate-100",
      isMobile && "mt-4 w-fit"
    )}>
      <button
        onClick={() => setLanguage('fr')}
        className={cn(
          "px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-all",
          language === 'fr' 
            ? (darkMode ? "bg-white text-slate-900 shadow-sm" : "bg-white text-brand-indigo shadow-sm") 
            : (darkMode ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-600")
        )}
      >
        FR
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={cn(
          "px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-all",
          language === 'en' 
            ? (darkMode ? "bg-white text-slate-900 shadow-sm" : "bg-white text-brand-indigo shadow-sm") 
            : (darkMode ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-600")
        )}
      >
        EN
      </button>
    </div>
  );
};
