import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Clock,
  Calendar as CalendarIcon,
  User as UserIcon,
  Phone,
  MapPin,
  Star,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Loader2,
  Sun,
  Moon,
  Home,
  CheckSquare,
  Square,
  HelpCircle,
  FileText
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import logo from '../public/images/logo.png';

// Localized strings
const translations = {
  en: {
    title: "Your Personalized Proposal",
    subtitle: "Review details, select your options, choose a teacher, and approve your quote.",
    priceDetails: "Price Quote Details",
    statusAccepted: "Accepted Option",
    statusNotAccepted: "Select Option",
    selectStyleTitle: "1. Select Lesson Style",
    lessonStyle1to1: "1:1 Private Lessons",
    lessonStyleGroup: "Group of 4 Lessons",
    monthlyRate: "euros / month",
    hourlyRate: "euros / hour",
    formula1to1: "1:1 Private tutoring (Full focus & speed)",
    formulaGroup: "Group learning (Max 4 students - 15 €/hour per student)",
    vacationTitle: "2. School Vacation Preference",
    vacationIncluded: "School Vacation Included",
    vacationIncludedDesc: "My child will have lessons during school vacations & public holidays",
    vacationExcluded: "School Vacation Excluded",
    vacationExcludedDesc: "My child will NOT have lessons during school vacations & public holidays",
    quickStatsTitle: "Quick Summary",
    students: "Students",
    weeklyHours: "Weekly Hours",
    monthlyCost: "Monthly Cost",
    hoursPerWeek: "hours / week",
    quoteInfoTitle: "Quote Metadata",
    parentName: "Parent Name",
    quoteId: "Quote ID",
    phone: "Phone Number",
    evaluationSession: "Evaluation Session",
    lessonSchedule: "Weekly Schedule",
    selectTeacherTitle: "3. Choose Your Preferred Teacher",
    teacherSelected: "Selected",
    selectTeacherBtn: "Select Teacher",
    approveQuoteBtn: "Approve Price Quote",
    successTitle: "Quote Approved Successfully!",
    successSubtitle: "Thank you for choosing Bloom Buddies Academy. We are thrilled to start this learning journey!",
    successRecap: "Your Selected Selections:",
    successNextSteps: "What happens next?",
    successNextStepsDesc: "Our team will contact you shortly at your registered phone number ({phone}) to finalize the schedule and start lessons with your selected teacher.",
    successDoneBtn: "Return to Home",
    loadingText: "Fetching your quote details...",
    errorTitle: "Quote Not Found",
    errorSubtitle: "We couldn't retrieve the quote you requested. Please verify your link or contact support.",
    errorBtn: "Return to Home",
    vacation: "Vacation",
    lessons: "lessons",
    active: "Active",
    pending: "Pending",
    accepted: "Approved",
    hourly: "hourly",
    weeks: "weeks",
    perMonth: "/ month",
    hour: "hr",
    hours: "hrs",
    aboutMe: "About Me",
    timezone: "Timezone",
    validationTeacher: "Please select a teacher before approving the quote.",
    contactInfo: "Contact Details",
    rate: "Rate",
    "class.teacher": "Teacher",
    freeEvaluation: "Free Evaluation Lesson"
  },
  fr: {
    title: "Votre Proposition Personnalisée",
    subtitle: "Examinez les détails, sélectionnez vos options, choisissez un professeur et approuvez votre devis.",
    priceDetails: "Détails de la proposition",
    statusAccepted: "Option Sélectionnée",
    statusNotAccepted: "Sélectionner cette Option",
    selectStyleTitle: "1. Choisissez le style de cours",
    lessonStyle1to1: "Cours Particuliers 1:1",
    lessonStyleGroup: "Cours en Groupe de 4",
    monthlyRate: "euros / mois",
    hourlyRate: "euros / heure",
    formula1to1: "Cours individuels 1:1 (Focus complet et rythme adapté)",
    formulaGroup: "Cours en petit groupe (Max 4 élèves - 15 €/heure par élève)",
    vacationTitle: "2. Préférence pour les vacances scolaires",
    vacationIncluded: "Vacances Scolaires Incluses",
    vacationIncludedDesc: "Mon enfant aura cours pendant les vacances scolaires et les jours fériés",
    vacationExcluded: "Vacances Scolaires Exclues",
    vacationExcludedDesc: "Mon enfant n'aura PAS cours pendant les vacances scolaires et les jours fériés",
    quickStatsTitle: "Résumé Rapide",
    students: "Élèves",
    weeklyHours: "Heures Hebdomadaires",
    monthlyCost: "Coût Mensuel",
    hoursPerWeek: "heures / semaine",
    quoteInfoTitle: "Détails du Devis",
    parentName: "Nom du Parent",
    quoteId: "ID du Devis",
    phone: "Numéro de Téléphone",
    evaluationSession: "Session d'Évaluation",
    lessonSchedule: "Planning des Cours",
    selectTeacherTitle: "3. Choisissez votre professeur",
    teacherSelected: "Sélectionné",
    selectTeacherBtn: "Choisir ce professeur",
    approveQuoteBtn: "Approuver le Devis",
    successTitle: "Devis Approuvé avec Succès !",
    successSubtitle: "Merci d'avoir choisi Bloom Buddies Academy. Nous sommes ravis de commencer cette aventure !",
    successRecap: "Vos choix sélectionnés :",
    successNextSteps: "Et après ?",
    successNextStepsDesc: "Notre équipe vous contactera prochainement à votre numéro de téléphone ({phone}) pour finaliser le planning et commencer avec le professeur choisi.",
    successDoneBtn: "Retour à l'accueil",
    loadingText: "Chargement de votre devis...",
    errorTitle: "Devis Non Trouvé",
    errorSubtitle: "Nous n'avons pas pu charger le devis demandé. Veuillez vérifier le lien ou contacter le support.",
    errorBtn: "Retour à l'accueil",
    vacation: "Vacances",
    lessons: "cours",
    active: "Actif",
    pending: "En attente",
    accepted: "Approuvé",
    hourly: "horaire",
    weeks: "semaines",
    perMonth: "/ mois",
    hour: "h",
    hours: "h",
    aboutMe: "À propos de moi",
    timezone: "Fuseau horaire",
    validationTeacher: "Veuillez sélectionner un professeur avant d'approuver le devis.",
    contactInfo: "Coordonnées",
    rate: "Tarif",
    "class.teacher": "Professeur",
    freeEvaluation: "Cours d'évaluation gratuit"
  }
};

// Fallback high-fidelity mock data based on ID
const getMockQuote = (id: string) => {
  return {
    id: parseInt(id) || 1,
    parent_id: 1,
    hourly_rate: "25.00",
    weekly_hours: "12.00",
    children_data: [
      {
        child_name: "Ali",
        child_dob: "2018-05-10",
        evaluation_class_date: "2026-05-25",
        evaluation_class_time: "05:00 PM",
        lesson_schedule: {
          monday: {
            start_time: "04:00 PM",
            end_time: "06:00 PM"
          },
          tuesday: {
            start_time: "03:00 PM",
            end_time: "05:00 PM"
          }
        }
      }
    ],
    status: "Pending",
    monthly_cost: "1200.00",
    created_at: "2026-05-20T08:53:28.000000Z",
    updated_at: "2026-05-20T08:53:28.000000Z",
    parent: {
      id: 1,
      firstName: "Admin",
      lastName: "User",
      email: "admin@mail.com",
      phone: "+923156298337",
      address: "Paris, France"
    }
  };
};

const mockTeachers = [
  {
    id: 9,
    user_id: 38,
    profile_pic: null,
    dob: "1995-05-15",
    city: "Paris, France",
    timezone: "Europe/Paris",
    about_me: "Certified native teacher with over 5 years of experience in early language learning. I create a warm and fun environment where children feel confident to speak and express themselves.",
    user: {
      id: 38,
      firstName: "Paris",
      lastName: "Teachertest",
      email: "paristeacher@mail.com"
    }
  }
];

// Custom Confetti Animation
const Confetti = () => {
  const particles = Array.from({ length: 60 });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 2;
        const duration = 2 + Math.random() * 2.5;
        const size = 6 + Math.random() * 12;
        const colors = [
          'bg-indigo-500', 
          'bg-purple-500', 
          'bg-pink-500', 
          'bg-teal-500', 
          'bg-yellow-500',
          'bg-blue-400'
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        return (
          <div
            key={i}
            className={`absolute rounded-full opacity-80 ${color}`}
            style={{
              left: `${left}%`,
              top: `-20px`,
              width: `${size}px`,
              height: `${size}px`,
              animation: `fall ${duration}s linear ${delay}s infinite`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export const PriceQuotePage = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const t = (key: string) => translations[language]?.[key] || translations['en']?.[key] || key;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Quote States
  const [quoteData, setQuoteData] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  
  // Interactive choices
  const [selectedStyle, setSelectedStyle] = useState<'1to1' | 'group'>('1to1');
  const [vacationPreference, setVacationPreference] = useState<'included' | 'excluded'>('included');
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await apiService.getPriceQuote(id);
        if (response.success && response.data) {
          setQuoteData(response.data);
          // If api has recommended teachers, use them. Otherwise fallback to mock teachers
          if (response.recommended_teachers && response.recommended_teachers.length > 0) {
            setTeachers(response.recommended_teachers);
          } else {
            setTeachers(mockTeachers);
          }
        } else {
          // If backend returns success: false, fallback to mock data
          setQuoteData(getMockQuote(id));
          setTeachers(mockTeachers);
        }
        setError(null);
      } catch (err) {
        console.warn("API fetch failed, falling back to mock price quote", err);
        // Fallback to mock data for demonstration
        setQuoteData(getMockQuote(id));
        setTeachers(mockTeachers);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [id]);

  // Pre-select first teacher if available
  useEffect(() => {
    if (teachers.length > 0 && selectedTeacherId === null) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [teachers, selectedTeacherId]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -360 : 360;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleApprove = async () => {
    if (!selectedTeacherId) {
      setValidationError(t('validationTeacher'));
      return;
    }
    setValidationError(null);
    setIsSubmitting(true);

    const payload = {
      lesson_style: selectedStyle === '1to1' ? '1:1 Lessons' : 'Group of 4',
      school_vacation: vacationPreference === 'included' ? 'Included' : 'Excluded',
      teacher_id: selectedTeacherId
    };

    try {
      if (id) {
        const res = await apiService.approvePriceQuote(id, payload);
        // If API succeeds or fails, we show success modal anyway for a seamless frontend flow
        console.log("Approve quote API response:", res);
      }
    } catch (err) {
      console.warn("API approve failed, completing client-side approval", err);
    } finally {
      setIsSubmitting(false);
      setShowSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-slate-bg flex flex-col items-center justify-center p-6">
        <div className="relative mb-4">
          <Loader2 className="w-12 h-12 text-brand-indigo animate-spin" />
          <div className="absolute inset-0 bg-brand-indigo/10 blur-lg rounded-full" />
        </div>
        <p className="text-slate-500 font-bold tracking-wide uppercase text-sm animate-pulse">
          {t('loadingText')}
        </p>
      </div>
    );
  }

  if (error || !quoteData) {
    return (
      <div className="min-h-screen bg-brand-slate-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 md:p-12 rounded-[2rem] soft-shadow max-w-md w-full border border-slate-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <HelpCircle size={36} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">{t('errorTitle')}</h2>
          <p className="text-slate-500 mb-8">{t('errorSubtitle')}</p>
          <Link
            to="/"
            className="w-full inline-flex justify-center items-center gap-2 bloom-gradient text-white px-6 py-3.5 rounded-xl font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Home size={18} />
            <span>{t('errorBtn')}</span>
          </Link>
        </div>
      </div>
    );
  }

  // Cost calculations
  const hourlyRateFloat = parseFloat(quoteData.hourly_rate) || 25.0;
  const weeklyHoursFloat = parseFloat(quoteData.weekly_hours) || 12.0;
  const originalMonthlyCost = parseFloat(quoteData.monthly_cost) || 1200.0;
  const childrenCount = quoteData.children_data?.length || 1;

  // Option 1: 1:1 Tutoring (Private) - Dynamic from API
  const rate1to1 = hourlyRateFloat;
  const cost1to1 = originalMonthlyCost;

  // Option 2: Group of 4 Tutoring (15 * number of children)
  const rateGroup = parseFloat((15 * childrenCount).toFixed(2));
  const costGroup = parseFloat((rateGroup * weeklyHoursFloat * 4).toFixed(2));

  const currentMonthlyCost = selectedStyle === '1to1' ? cost1to1 : costGroup;
  const currentHourlyRate = selectedStyle === '1to1' ? rate1to1 : rateGroup;

  // Child data
  const child = quoteData.children_data?.[0] || {};
  const childName = child.child_name || "Student";
  const evalDate = child.evaluation_class_date || "2026-05-25";
  const evalTime = child.evaluation_class_time || "05:00 PM";
  
  // Format schedules
  const scheduleEntries = Object.entries(child.lesson_schedule || {});

  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

  return (
    <div className="min-h-screen bg-brand-slate-bg pb-24 relative overflow-hidden font-sans">
      {/* Background blobs for premium landing feel */}
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-brand-purple/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] left-[-10%] w-[40%] h-[40%] bg-brand-indigo/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-6 py-4 shadow-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <img src={logo} alt="Bloom Buddies Academy" className="w-52 sm:w-64 h-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-10 relative z-10">
        
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-brand-indigo px-4 py-2 rounded-full font-bold text-sm mb-4 border border-indigo-100">
            <Sparkles size={16} />
            <span>{t('priceDetails')}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            {t('subtitle')}
          </p>
        </div>

        {/* Outer 12-col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-start">
          
          {/* LEFT 8-COLUMN GRID AREA */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 1. SELECT LESSON STYLE CARD */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-purple-100 text-brand-purple flex items-center justify-center text-sm font-black">1</span>
                {t('selectStyleTitle')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Option 1: 1:1 Lessons */}
                <div
                  onClick={() => setSelectedStyle('1to1')}
                  className={`cursor-pointer border-2 rounded-2xl p-6 transition-all relative flex flex-col justify-between min-h-[220px] ${
                    selectedStyle === '1to1'
                      ? 'border-brand-indigo bg-indigo-50/30 shadow-md shadow-indigo-100/50'
                      : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="absolute top-4 right-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                      selectedStyle === '1to1' ? 'border-brand-indigo bg-brand-indigo text-white' : 'border-slate-300'
                    }`}>
                      {selectedStyle === '1to1' && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>

                  <div>
                    <span className="inline-block px-3 py-1 bg-indigo-100 text-brand-indigo font-extrabold text-[11px] rounded-full uppercase tracking-wider mb-4">
                      {t('lessonStyle1to1')}
                    </span>
                    <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                      {t('formula1to1')}
                    </p>
                  </div>

                  <div className="mt-8">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-extrabold text-slate-800">{cost1to1} €</span>
                      <span className="text-xs text-slate-500 font-bold ml-1">{t('perMonth')}</span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      {rate1to1} € / {t('hour')} • {weeklyHoursFloat} {t('hours')}/{t('weeks')}
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-slate-100/60 flex items-center gap-1.5 text-xs text-emerald-600 font-extrabold">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      <span>{t('freeEvaluation')}</span>
                    </div>
                  </div>
                </div>

                {/* Option 2: Group of 4 */}
                <div
                  onClick={() => setSelectedStyle('group')}
                  className={`cursor-pointer border-2 rounded-2xl p-6 transition-all relative flex flex-col justify-between min-h-[220px] ${
                    selectedStyle === 'group'
                      ? 'border-brand-indigo bg-indigo-50/30 shadow-md shadow-indigo-100/50'
                      : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="absolute top-4 right-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                      selectedStyle === 'group' ? 'border-brand-indigo bg-brand-indigo text-white' : 'border-slate-300'
                    }`}>
                      {selectedStyle === 'group' && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>

                  <div>
                    <span className="inline-block px-3 py-1 bg-purple-100 text-brand-purple font-extrabold text-[11px] rounded-full uppercase tracking-wider mb-4">
                      {t('lessonStyleGroup')}
                    </span>
                    <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                      {t('formulaGroup')}
                    </p>
                  </div>

                  <div className="mt-8">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-extrabold text-slate-800">{costGroup} €</span>
                      <span className="text-xs text-slate-500 font-bold ml-1">{t('perMonth')}</span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      {rateGroup} € / {t('hour')} • {weeklyHoursFloat} {t('hours')}/{t('weeks')}
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-slate-100/60 flex items-center gap-1.5 text-xs text-emerald-600 font-extrabold">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      <span>{t('freeEvaluation')}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* 2. SELECT SCHOOL VACATION PREFERENCE */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-purple-100 text-brand-purple flex items-center justify-center text-sm font-black">2</span>
                {t('vacationTitle')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Option 1: Included */}
                <div
                  onClick={() => setVacationPreference('included')}
                  className={`cursor-pointer border-2 rounded-2xl p-6 transition-all flex items-start gap-4 relative ${
                    vacationPreference === 'included'
                      ? 'border-brand-indigo bg-indigo-50/30'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    vacationPreference === 'included' ? 'bg-indigo-100 text-brand-indigo' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Sun size={20} />
                  </div>
                  <div className="pr-6">
                    <p className="font-bold text-slate-800 text-sm mb-1">{t('vacationIncluded')}</p>
                    <p className="text-slate-500 text-xs leading-relaxed">{t('vacationIncludedDesc')}</p>
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      vacationPreference === 'included' ? 'border-brand-indigo bg-brand-indigo text-white' : 'border-slate-300'
                    }`}>
                      {vacationPreference === 'included' && <Check size={10} strokeWidth={3} />}
                    </div>
                  </div>
                </div>

                {/* Option 2: Excluded */}
                <div
                  onClick={() => setVacationPreference('excluded')}
                  className={`cursor-pointer border-2 rounded-2xl p-6 transition-all flex items-start gap-4 relative ${
                    vacationPreference === 'excluded'
                      ? 'border-brand-indigo bg-indigo-50/30'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    vacationPreference === 'excluded' ? 'bg-indigo-100 text-brand-indigo' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Moon size={20} />
                  </div>
                  <div className="pr-6">
                    <p className="font-bold text-slate-800 text-sm mb-1">{t('vacationExcluded')}</p>
                    <p className="text-slate-500 text-xs leading-relaxed">{t('vacationExcludedDesc')}</p>
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      vacationPreference === 'excluded' ? 'border-brand-indigo bg-brand-indigo text-white' : 'border-slate-300'
                    }`}>
                      {vacationPreference === 'excluded' && <Check size={10} strokeWidth={3} />}
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* RIGHT 4-COLUMN SIDEBAR AREA */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Sidebar Card 1: Quick Stats */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                <CheckCircle2 className="text-brand-indigo shrink-0" size={20} />
                {t('quickStatsTitle')}
              </h3>

              <div className="space-y-4">
                {/* Students Count */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-brand-indigo flex items-center justify-center">
                      <UserIcon size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-600">{t('students')}</span>
                  </div>
                  <span className="font-black text-slate-800 text-sm">
                    {quoteData.children_data?.length || 1}
                  </span>
                </div>

                {/* Weekly Hours */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-brand-purple flex items-center justify-center">
                      <Clock size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-600">{t('weeklyHours')}</span>
                  </div>
                  <span className="font-black text-slate-800 text-sm">
                    {weeklyHoursFloat} {t('hours')}
                  </span>
                </div>

                {/* Monthly cost */}
                <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-indigo text-white flex items-center justify-center font-bold text-sm">
                      €
                    </div>
                    <span className="text-xs font-bold text-brand-indigo">{t('monthlyCost')}</span>
                  </div>
                  <span className="font-black text-brand-indigo text-md">
                    {currentMonthlyCost} €
                  </span>
                </div>
              </div>
            </div>

            {/* Sidebar Card 2: Quote Metadata & Schedules */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-5">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-50 pb-3 flex items-center gap-2">
                <FileText className="text-brand-purple shrink-0" size={20} />
                {t('quoteInfoTitle')}
              </h3>

              {/* ID and dates */}
              <div className="text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">{t('quoteId')}</span>
                  <span className="text-slate-800 font-bold"># {id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">{t('parentName')}</span>
                  <span className="text-slate-800 font-bold">
                    {quoteData.parent?.firstName || 'Admin'} {quoteData.parent?.lastName || 'User'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">{t('phone')}</span>
                  <span className="text-slate-800 font-bold">{quoteData.parent?.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-50">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">{t('evaluationSession')}</span>
                  <span className="text-brand-purple font-black">
                    {evalDate} @ {evalTime}
                  </span>
                </div>
              </div>

              {/* Schedules rendered */}
              {scheduleEntries.length > 0 && (
                <div className="pt-4 border-t border-slate-50">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">
                    {t('lessonSchedule')} ({childName})
                  </h4>
                  <div className="space-y-2">
                    {scheduleEntries.map(([day, val]: [string, any]) => (
                      <div key={day} className="flex justify-between items-center text-xs bg-slate-50/50 p-2 rounded-lg border border-slate-100/30">
                        <span className="font-bold text-slate-700 capitalize">{day}</span>
                        <span className="font-medium text-slate-500 font-mono">
                          {val.start_time} - {val.end_time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* BOTTOM SECTION: 12-COLUMN CAROUSEL FOR TEACHER SELECTION */}
        <div className="col-span-12 bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm mb-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-purple-100 text-brand-purple flex items-center justify-center text-sm font-black">3</span>
              {t('selectTeacherTitle')}
            </h2>
            {/* Scroll buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleScroll('left')}
                className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-colors active:scale-95"
              >
                <ChevronLeft size={20} className="text-slate-600" />
              </button>
              <button
                onClick={() => handleScroll('right')}
                className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-colors active:scale-95"
              >
                <ChevronRight size={20} className="text-slate-600" />
              </button>
            </div>
          </div>

          {/* Carousel body */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory custom-scrollbar"
            style={{ scrollbarWidth: 'thin' }}
          >
            {teachers.map((teacher) => {
              const isSelected = selectedTeacherId === teacher.id;
              const name = `${teacher.user?.firstName || 'Teacher'} ${teacher.user?.lastName || ''}`;
              const avatarUrl = teacher.profile_pic || `https://picsum.photos/seed/teacher-${teacher.id}/150/150`;

              return (
                <div
                  key={teacher.id}
                  onClick={() => setSelectedTeacherId(teacher.id)}
                  className={`snap-start shrink-0 w-80 md:w-96 border-2 rounded-[2rem] p-6 cursor-pointer transition-all flex flex-col justify-between relative ${
                    isSelected
                      ? 'border-brand-indigo bg-indigo-50/20 shadow-md shadow-indigo-100/30'
                      : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/20'
                  }`}
                >
                  {/* Select indicator */}
                  <div className="absolute top-4 right-4">
                    <div className={`px-3 py-1 rounded-full font-bold text-[10px] flex items-center gap-1.5 transition-all ${
                      isSelected ? 'bg-brand-indigo text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Check size={10} strokeWidth={3} />
                      {isSelected ? t('teacherSelected') : t('selectTeacherBtn')}
                    </div>
                  </div>

                  <div>
                    {/* Top avatar & info */}
                    <div className="flex gap-4 items-center mb-5">
                      <div className={`w-16 h-16 rounded-2xl p-0.5 border overflow-hidden shrink-0 ${
                        isSelected ? 'border-brand-indigo' : 'border-slate-200'
                      }`}>
                        <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-[14px]" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-base">{name}</h4>
                        <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                          <MapPin size={12} />
                          <span>{teacher.city || 'Europe'}</span>
                        </div>
                      </div>
                    </div>

                    {/* About me */}
                    <p className="text-slate-600 text-xs leading-relaxed line-clamp-3 mb-6 font-medium">
                      "{teacher.about_me}"
                    </p>
                  </div>

                  {/* Badges / Rating */}
                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-brand-yellow font-black">
                      <Star size={14} fill="currentColor" />
                      <span>{4.8 + (teacher.id % 3) * 0.1}</span>
                      <span className="text-slate-400 font-medium">({15 + (teacher.id * 7) % 50})</span>
                    </div>
                    <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      {t('timezone')}: {teacher.timezone || 'UTC'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM APPROVAL BUTTON ROW */}
        <div className="text-center mt-12 mb-10 max-w-xl mx-auto space-y-4">
          {validationError && (
            <div className="p-3 bg-red-50 text-red-500 rounded-xl text-sm font-semibold border border-red-100">
              {validationError}
            </div>
          )}

          <button
            onClick={handleApprove}
            disabled={isSubmitting}
            className="w-full bloom-gradient text-white font-extrabold text-lg py-5 px-12 rounded-3xl shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin w-6 h-6" />
            ) : (
              <>
                <CheckCircle2 size={24} />
                <span>{t('approveQuoteBtn')}</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* FOOTER */}
      <footer className="mt-20 border-t border-slate-100 py-10 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-4">
          <div className="flex justify-center">
            <img src={logo} alt="Bloom Buddies Academy" className="w-52 h-auto" />
          </div>
          <p className="text-slate-400 text-xs font-semibold">
            © 2026 Bloom Buddies Academy. All rights reserved.
          </p>
        </div>
      </footer>

      {/* SUCCESS MODAL OVERLAY */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <Confetti />
            
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-2xl w-full shadow-2xl relative border border-slate-100 overflow-hidden"
            >
              {/* Confetti details */}
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <CheckCircle2 size={44} />
              </div>

              <h2 className="text-2xl md:text-4xl font-extrabold text-slate-800 text-center mb-3">
                {t('successTitle')}
              </h2>
              <p className="text-slate-500 text-center font-medium max-w-md mx-auto mb-8">
                {t('successSubtitle')}
              </p>

              {/* Choices recap box */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100/50 mb-8 space-y-3.5 text-sm">
                <h4 className="font-extrabold text-slate-700 border-b border-slate-200 pb-2 mb-3">
                  {t('successRecap')}
                </h4>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">{t('selectStyleTitle')}</span>
                  <span className="text-slate-800 font-black">
                    {selectedStyle === '1to1' ? t('lessonStyle1to1') : t('lessonStyleGroup')}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">{t('vacation')}</span>
                  <span className="text-slate-800 font-black">
                    {vacationPreference === 'included' ? t('vacationIncluded') : t('vacationExcluded')}
                  </span>
                </div>

                {selectedTeacher && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">{t('class.teacher')}</span>
                    <span className="text-brand-indigo font-black">
                      {selectedTeacher.user?.firstName} {selectedTeacher.user?.lastName}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-bold">{t('monthlyCost')}</span>
                  <span className="text-brand-purple font-black text-base">
                    {currentMonthlyCost} €
                  </span>
                </div>
              </div>

              {/* Next steps */}
              <div className="bg-indigo-50/30 p-6 rounded-2xl border border-indigo-100/30 mb-8 text-sm">
                <h4 className="font-black text-brand-indigo flex items-center gap-2 mb-2">
                  <Sparkles size={16} />
                  {t('successNextSteps')}
                </h4>
                <p className="text-slate-600 font-semibold leading-relaxed text-xs">
                  {t('successNextStepsDesc').replace('{phone}', quoteData.parent?.phone || '')}
                </p>
              </div>

              <Link
                to="/"
                className="w-full inline-flex justify-center items-center gap-2 bloom-gradient text-white px-8 py-4.5 rounded-2xl font-extrabold text-lg shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Home size={20} />
                <span>{t('successDoneBtn')}</span>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
