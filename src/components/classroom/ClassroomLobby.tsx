import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  User as UserIcon, 
  ChevronRight, 
  Sparkles, 
  BookOpen
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export const ClassroomLobby: React.FC = () => {
  const { classroomId } = useParams<{ classroomId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const [classroomData, setClassroomData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Countdown timer state in seconds
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  // English level state for teacher view
  const [englishLevel, setEnglishLevel] = useState<string>('A1');

  // Retrieve logged in user and verify role
  const loggedInUser = useMemo(() => {
    const saved = localStorage.getItem('auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse auth_user", e);
      }
    }
    return null;
  }, []);

  const isTeacher = loggedInUser?.role === 2;

  // Determine active display language from the backend classroom/teacher config
  const activeLang = useMemo(() => {
    if (classroomData?.data?.teacher?.language) {
      const tLang = classroomData.data.teacher.language.toLowerCase();
      if (tLang === 'fr' || tLang === 'en') return tLang;
    }
    return language;
  }, [classroomData, language]);

  // Calculate dynamic child age
  const childAge = useMemo(() => {
    if (!classroomData?.data?.child?.dob) return '';
    const dobDate = new Date(classroomData.data.child.dob);
    const today = new Date();
    
    let ageYears = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
      ageYears--;
    }
    
    if (ageYears <= 0) {
      const totalMonths = (today.getFullYear() - dobDate.getFullYear()) * 12 + today.getMonth() - dobDate.getMonth();
      const monthCount = totalMonths <= 0 ? 1 : totalMonths;
      if (activeLang === 'fr') {
        return `${monthCount} mois`;
      }
      return `${monthCount} ${monthCount === 1 ? 'month old' : 'months old'}`;
    }
    
    if (activeLang === 'fr') {
      return `${ageYears} ${ageYears === 1 ? 'an' : 'ans'}`;
    }
    return `${ageYears} ${ageYears === 1 ? 'year old' : 'years old'}`;
  }, [classroomData, activeLang]);

  // Fetch classroom data on mount
  useEffect(() => {
    if (!classroomId) return;

    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiService.getClassroom(classroomId);
        if (response && response.status && response.data) {
          setClassroomData(response);
          // Set initial countdown seconds
          if (response.time_remaining) {
            const mins = response.time_remaining.total_minutes || 0;
            setSecondsRemaining(mins * 60);
          }
        } else {
          setError(language === 'fr' ? 'Classe introuvable' : 'Classroom details not found');
        }
      } catch (err) {
        console.error(err);
        setError(language === 'fr' ? 'Erreur lors du chargement des données' : 'Error loading classroom details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [classroomId, language]);

  // Live countdown timer effect
  useEffect(() => {
    if (secondsRemaining === null || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev && prev > 0) {
          return prev - 1;
        }
        clearInterval(timer);
        return 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining]);

  // Format timer display
  const countdownText = useMemo(() => {
    if (secondsRemaining === null) return '';
    if (secondsRemaining <= 0) {
      return activeLang === 'fr' ? 'Le cours a commencé !' : 'Class is live now!';
    }

    const totalHours = Math.floor(secondsRemaining / 3600);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = Math.floor((secondsRemaining % 3600) / 60);
    const seconds = secondsRemaining % 60;

    if (activeLang === 'fr') {
      const daysStr = days > 0 ? `${days} j ` : '';
      const hoursStr = (hours > 0 || days > 0) ? `${hours}h ` : '';
      return `Le cours commence dans : ${daysStr}${hoursStr}${minutes}m ${seconds}s`;
    }
    
    const daysStr = days > 0 ? `${days} d ` : '';
    const hoursStr = (hours > 0 || days > 0) ? `${hours} ${hours === 1 ? 'hour' : 'hours'} ` : '';
    return `Class commences in : ${daysStr}${hoursStr}${minutes} mins ${seconds} seconds`;
  }, [secondsRemaining, activeLang]);

  // Format date display
  const formattedDate = useMemo(() => {
    if (!classroomData || !classroomData.next_class) return '';
    const { date } = classroomData.next_class;
    if (!date) return '';
    
    const d = new Date(date);
    const locale = activeLang === 'fr' ? 'fr-FR' : 'en-US';
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  }, [classroomData, activeLang]);

  // Format time range display
  const formattedTimeRange = useMemo(() => {
    if (!classroomData || !classroomData.next_class) return '';
    const { start_time, end_time } = classroomData.next_class;
    if (!start_time || !end_time) return '';
    return `${start_time.substring(0, 5)} - ${end_time.substring(0, 5)}`;
  }, [classroomData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-slate-bg flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-brand-indigo border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 blur-xl bg-brand-indigo/20 animate-pulse rounded-full" />
        </div>
        <p className="text-slate-400 font-bold animate-pulse text-sm uppercase tracking-wider">
          {language === 'fr' ? 'Chargement du hall...' : 'Loading lobby...'}
        </p>
      </div>
    );
  }

  if (error || !classroomData) {
    return (
      <div className="min-h-screen bg-brand-slate-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full soft-shadow border border-slate-100 space-y-6">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
            <Clock size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">{language === 'fr' ? 'Oups !' : 'Oops!'}</h3>
            <p className="text-sm text-slate-500 mt-2 font-medium">{error || 'Something went wrong.'}</p>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-brand-indigo hover:bg-indigo-600 text-white rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>{language === 'fr' ? 'Retour au tableau de bord' : 'Back to Dashboard'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-slate-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-500 hover:text-brand-indigo font-bold transition-colors group text-sm cursor-pointer"
          >
            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
            <span>{activeLang === 'fr' ? 'Retour' : 'Back'}</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-extrabold uppercase tracking-wider">
            <Sparkles size={14} className="text-brand-indigo animate-pulse" />
            <span>{activeLang === 'fr' ? 'Hall de la classe' : 'Class Lobby'}</span>
          </div>
        </div>

        {/* 1. Class Info Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 sm:p-8 soft-shadow border border-slate-100 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/40 blur-[80px] rounded-full translate-x-1/3 -translate-y-1/2" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                {activeLang === 'fr' ? 'Informations sur le cours' : 'Class info'}
              </h1>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-600 font-bold text-sm">
                <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5">
                  <Clock size={16} className="text-brand-indigo" />
                  {formattedTimeRange}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5">
                  <BookOpen size={16} className="text-brand-indigo" />
                  {formattedDate}
                </span>
              </div>

              {secondsRemaining !== null && (
                <p className="text-brand-orange font-extrabold text-sm sm:text-base animate-pulse">
                  {countdownText}
                </p>
              )}
            </div>

            <button 
              onClick={() => navigate(`/classroom/${classroomData.data.channel_name}`)}
              className="py-4 px-8 bg-brand-indigo hover:bg-indigo-600 text-white rounded-2xl font-black text-base transition-all shadow-[0_6px_20px_rgba(99,102,241,0.25)] flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>{activeLang === 'fr' ? 'Entrer en Metaclass' : 'Enter Metaclass'}</span>
              <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </motion.div>

        {/* 2. Teacher or Student Section */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 sm:p-8 soft-shadow border border-slate-100 space-y-6"
        >
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
            {isTeacher 
              ? (activeLang === 'fr' ? 'Informations sur l\'élève' : 'Student info')
              : (activeLang === 'fr' ? 'Mon Enseignant' : 'My teacher')
            }
          </h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            <div className="flex flex-wrap items-center gap-6">
              <div className="w-24 h-24 rounded-full border-4 border-slate-100 p-0.5 overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center text-slate-300">
                {isTeacher ? (
                  classroomData.data.child && classroomData.data.child.avatar ? (
                    <img 
                      src={classroomData.data.child.avatar} 
                      alt="Student Avatar" 
                      className="w-full h-full object-cover rounded-full" 
                    />
                  ) : (
                    <UserIcon size={44} />
                  )
                ) : (
                  classroomData.data.teacher && classroomData.data.teacher.avatar ? (
                    <img 
                      src={classroomData.data.teacher.avatar} 
                      alt="Teacher Avatar" 
                      className="w-full h-full object-cover rounded-full" 
                    />
                  ) : (
                    <UserIcon size={44} />
                  )
                )}
              </div>

              {isTeacher ? (
                /* Teacher View (Student Info details) */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-extrabold text-xs uppercase tracking-wide">
                      {activeLang === 'fr' ? "Nom de l'élève :" : "Student's name :"}
                    </span>
                    <span className="text-slate-800 font-extrabold text-base">
                      {classroomData.data.child ? classroomData.data.child.child_name : 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-extrabold text-xs uppercase tracking-wide">
                      {activeLang === 'fr' ? "Ville :" : "City :"}
                    </span>
                    <span className="text-slate-700 font-extrabold text-sm">
                      {classroomData.data.child?.address || (activeLang === 'fr' ? 'Normandie' : 'Normandy')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-extrabold text-xs uppercase tracking-wide">
                      {activeLang === 'fr' ? "Âge de l'élève :" : "Student's age:"}
                    </span>
                    <span className="text-slate-700 font-extrabold text-sm">
                      {childAge}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-extrabold text-xs uppercase tracking-wide">
                      {activeLang === 'fr' ? "Niveau d'anglais :" : "English level:"}
                    </span>
                    <select
                      value={englishLevel}
                      onChange={(e) => setEnglishLevel(e.target.value)}
                      className="bg-slate-50 border border-slate-200 focus:border-brand-indigo rounded-xl px-3 py-1 text-xs font-extrabold text-slate-700 outline-none cursor-pointer transition-all h-8"
                    >
                      <option value="A1">A1</option>
                      <option value="A2">A2</option>
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                      <option value="C1">C1</option>
                      <option value="C2">C2</option>
                    </select>
                  </div>
                </div>
              ) : (
                /* Parent View (Teacher details) */
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-extrabold text-xs uppercase tracking-wide">
                      {activeLang === 'fr' ? "Nom de l'enseignant :" : "Teacher's name:"}
                    </span>
                    <span className="text-slate-800 font-extrabold text-base">
                      {classroomData.data.teacher ? `${classroomData.data.teacher.firstName || ''} ${classroomData.data.teacher.lastName || ''}`.trim() : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-extrabold text-xs uppercase tracking-wide">
                      {activeLang === 'fr' ? "Nom de l'enfant :" : "Child's name:"}
                    </span>
                    <span className="text-slate-800 font-extrabold text-base">
                      {classroomData.data.child ? classroomData.data.child.child_name : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-extrabold text-xs uppercase tracking-wide">
                      {activeLang === 'fr' ? "Langue :" : "Language:"}
                    </span>
                    <span className="text-slate-700 font-extrabold text-sm capitalize">
                      {classroomData.data.teacher && classroomData.data.teacher.language === 'fr' ? 'Français' : 'English'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-extrabold text-xs uppercase tracking-wide">
                      {activeLang === 'fr' ? "Ville :" : "City:"}
                    </span>
                    <span className="text-slate-700 font-extrabold text-sm">
                      {classroomData.data.teacher && classroomData.data.teacher.address ? classroomData.data.teacher.address : 'N/A'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {!isTeacher && (
              /* About Me Bio Card (Only Parent View) */
              <div className="flex-1 sm:max-w-sm bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1.5 w-full">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  {activeLang === 'fr' ? 'À propos de moi :' : 'About me:'}
                </h4>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  {activeLang === 'fr' 
                    ? `Bonjour ! Je suis votre enseignant ${classroomData.data.teacher?.firstName || ''}. Je vais vous guider tout au long de notre séance interactive d'aujourd'hui. Apprenons et amusons-nous ensemble !`
                    : `Hi! I am your teacher ${classroomData.data.teacher?.firstName || ''}. I will be guiding you through today's interactive learning session. Let's learn and have fun together!`
                  }
                </p>
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
};
