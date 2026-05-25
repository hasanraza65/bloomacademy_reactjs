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
  ChevronDown,
  Sparkles,
  Check,
  Loader2,
  Sun,
  Moon,
  Home,
  CheckSquare,
  Square,
  HelpCircle,
  FileText,
  Edit3,
  X
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
    selectStyleTitle: "Select Lesson Style",
    lessonStyle1to1: "1:1 Private Lessons",
    lessonStyleGroup: "Group of 4 Lessons",
    monthlyRate: "euros / month",
    hourlyRate: "euros / hour",
    formula1to1: "1:1 Private tutoring (Full focus & speed)",
    formulaGroup: "Group learning (Collaborative study - 15 €/hour per student)",
    vacationTitle: "School Vacation Preference",
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
    selectTeacherTitle: "Choose Your Preferred Teacher",
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
    freeEvaluation: "Free Evaluation Lesson",
    acceptQuoteBtn: "Accept",
    rejectQuoteBtn: "Reject",
    rejectQuoteBtnShort: "Reject",
    requestNewQuoteBtn: "Request New Quote",
    requestNewQuoteBtnShort: "Request New",
    rejectTitle: "Proposal Rejected",
    rejectSubtitle: "We are sorry this proposal didn't fit. We would love to make it right for you.",
    rejectNextSteps: "Our team will reach out to you shortly to understand your needs and send you a revised proposal.",
    requestNewTitle: "Request a New Proposal",
    requestNewDesc: "Tell us what changes you would like (e.g. schedules, hours, lesson style) and we will generate a new quote for you.",
    submitRequestBtn: "Submit Request",
    requestSuccessTitle: "Request Submitted!",
    requestSuccessSubtitle: "We have received your requirements and are working on a new proposal for you.",
    confirmApproveTitle: "Accept Proposal?",
    confirmApproveDesc: "Are you sure you want to accept this proposal? This will confirm your selection and proceed to the next steps.",
    confirmRejectTitle: "Reject Proposal?",
    confirmRejectDesc: "Are you sure you want to reject this proposal? If it doesn't fit, our team can send you a new proposal.",
    confirmBtnYesApprove: "Yes, Accept",
    confirmBtnYesReject: "Yes, Reject",
    cancelBtn: "Cancel",
    selectTeacherBtnShort: "Select"
  },
  fr: {
    title: "Votre Proposition Personnalisée",
    subtitle: "Examinez les détails, sélectionnez vos options, choisissez un professeur et approuvez votre devis.",
    priceDetails: "Détails de la proposition",
    statusAccepted: "Option Sélectionnée",
    statusNotAccepted: "Sélectionner cette Option",
    selectStyleTitle: "Choisissez le style de cours",
    lessonStyle1to1: "Cours Particuliers 1:1",
    lessonStyleGroup: "Cours en Groupe de 4",
    monthlyRate: "euros / mois",
    hourlyRate: "euros / heure",
    formula1to1: "Cours individuels 1:1 (Focus complet et rythme adapté)",
    formulaGroup: "Cours en groupe (Apprentissage collaboratif - 15 €/heure par élève)",
    vacationTitle: "Préférence pour les vacances scolaires",
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
    selectTeacherTitle: "Choisissez votre professeur",
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
    freeEvaluation: "Cours d'évaluation gratuit",
    acceptQuoteBtn: "Accepter",
    rejectQuoteBtn: "Refuser le Devis",
    rejectQuoteBtnShort: "Refuser",
    requestNewQuoteBtn: "Demander un Nouveau Devis",
    requestNewQuoteBtnShort: "Nouveau Devis",
    rejectTitle: "Proposition Refusée",
    rejectSubtitle: "Nous sommes désolés que cette proposition ne vous convienne pas. Nous aimerions trouver la solution idéale.",
    rejectNextSteps: "Notre équipe vous contactera rapidement pour comprendre vos besoins et vous envoyer une proposition révisée.",
    requestNewTitle: "Demander une Nouvelle Proposition",
    requestNewDesc: "Dites-nous quelles modifications vous souhaitez (ex. plannings, heures, style de cours) et nous générerons un nouveau devis.",
    submitRequestBtn: "Envoyer la Demande",
    requestSuccessTitle: "Demande Envoyée !",
    requestSuccessSubtitle: "Nous avons bien reçu vos critères et préparons une nouvelle proposition pour vous.",
    confirmApproveTitle: "Accepter la Proposition ?",
    confirmApproveDesc: "Êtes-vous sûr de vouloir accepter cette proposition ? Cela confirmera votre sélection et passera aux étapes suivantes.",
    confirmRejectTitle: "Rejeter la Proposition ?",
    confirmRejectDesc: "Êtes-vous sûr de vouloir rejeter cette proposition ? Si elle ne vous convient pas, notre équipe pourra vous envoyer une nouvelle proposition.",
    confirmBtnYesApprove: "Oui, Accepter",
    confirmBtnYesReject: "Oui, Rejeter",
    cancelBtn: "Annuler",
    selectTeacherBtnShort: "Choisir"
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
          monday: { start_time: "04:00 PM", end_time: "06:00 PM" },
          tuesday: { start_time: "03:00 PM", end_time: "05:00 PM" }
        }
      },
      {
        child_name: "Ahmad",
        child_dob: "2019-03-15",
        evaluation_class_date: "2026-05-26",
        evaluation_class_time: "10:00 AM",
        lesson_schedule: {
          wednesday: { start_time: "10:00 AM", end_time: "12:00 PM" },
          friday: { start_time: "11:00 AM", end_time: "01:00 PM" }
        }
      },
      {
        child_name: "Mubeen",
        child_dob: "2017-08-22",
        evaluation_class_date: "2026-05-27",
        evaluation_class_time: "02:00 PM",
        lesson_schedule: {
          monday: { start_time: "02:00 PM", end_time: "04:00 PM" },
          thursday: { start_time: "03:00 PM", end_time: "05:00 PM" }
        }
      },
      {
        child_name: "Hassan",
        child_dob: "2020-01-10",
        evaluation_class_date: "2026-05-28",
        evaluation_class_time: "09:00 AM",
        lesson_schedule: {
          tuesday: { start_time: "09:00 AM", end_time: "11:00 AM" },
          saturday: { start_time: "10:00 AM", end_time: "12:00 PM" }
        }
      },
      {
        child_name: "Bilal",
        child_dob: "2016-11-05",
        evaluation_class_date: "2026-05-29",
        evaluation_class_time: "04:00 PM",
        lesson_schedule: {
          wednesday: { start_time: "04:00 PM", end_time: "06:00 PM" },
          friday: { start_time: "03:00 PM", end_time: "05:00 PM" }
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
    user: { id: 38, firstName: "Sophie", lastName: "Martin", email: "sophie.martin@mail.com" }
  },
  {
    id: 10,
    user_id: 39,
    profile_pic: null,
    dob: "1990-08-22",
    city: "Lyon, France",
    timezone: "Europe/Paris",
    about_me: "Passionate educator specialising in maths and sciences for ages 6–14. I use games and real-life examples to make abstract concepts click. 8 years of tutoring experience.",
    user: { id: 39, firstName: "Lucas", lastName: "Dubois", email: "lucas.dubois@mail.com" }
  },
  {
    id: 11,
    user_id: 40,
    profile_pic: null,
    dob: "1993-03-10",
    city: "Bordeaux, France",
    timezone: "Europe/Paris",
    about_me: "Native English speaker with a TEFL certificate and 6 years of experience teaching children from diverse backgrounds. My lessons are structured yet playful to keep kids engaged.",
    user: { id: 40, firstName: "Emma", lastName: "Clarke", email: "emma.clarke@mail.com" }
  },
  {
    id: 12,
    user_id: 41,
    profile_pic: null,
    dob: "1988-11-30",
    city: "Marseille, France",
    timezone: "Europe/Paris",
    about_me: "Bilingual French-Arabic teacher with 10 years of experience. I focus on building strong reading and comprehension foundations while keeping a positive and patient approach.",
    user: { id: 41, firstName: "Karim", lastName: "Benali", email: "karim.benali@mail.com" }
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
  const [recommendedTeachersResponse, setRecommendedTeachersResponse] = useState<any[]>([]);
  
  // Interactive choices
  const [selectedStyle, setSelectedStyle] = useState<'1to1' | 'group' | null>(null);
  const [vacationPreference, setVacationPreference] = useState<'included' | 'excluded' | null>(null);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Record<number, number>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeScheduleChildIdx, setActiveScheduleChildIdx] = useState(0);
  const [isLessonStyleOpen, setIsLessonStyleOpen] = useState(true);
  const [activeChildIdx, setActiveChildIdx] = useState(0);

  // Rejection & Request New Quote States
  const [showReject, setShowReject] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showRequestNewForm, setShowRequestNewForm] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showRequestSuccess, setShowRequestSuccess] = useState(false);
  const [requestNotes, setRequestNotes] = useState('');

  // Inline edit state variables
  const [editingChildIdx, setEditingChildIdx] = useState<number | null>(null);
  const [tempDate, setTempDate] = useState('');
  const [tempTime, setTempTime] = useState('');

  const handleStartEditEvaluation = (idx: number, currentDate: string, currentTime: string) => {
    setEditingChildIdx(idx);
    setTempDate(currentDate || '');
    setTempTime(currentTime || '');
  };

  const handleSaveEvaluation = (idx: number) => {
    setQuoteData((prev: any) => {
      if (!prev || !prev.children_data) return prev;
      const updatedChildren = [...prev.children_data];
      updatedChildren[idx] = {
        ...updatedChildren[idx],
        evaluation_class_date: tempDate,
        evaluation_class_time: tempTime,
      };
      return {
        ...prev,
        children_data: updatedChildren,
      };
    });
    setEditingChildIdx(null);
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await apiService.getPriceQuote(id);
        if (response.success && response.data) {
          const data = { ...response.data };
          setQuoteData(data);
          setRecommendedTeachersResponse(response.recommended_teachers || []);
        } else {
          // Fallback to mock data for local testing
          const mockData = getMockQuote(id);
          setQuoteData(mockData);
          setRecommendedTeachersResponse([
            { child_name: "Ali", recommended_teachers: [mockTeachers[0]] },
            { child_name: "Ahmad", recommended_teachers: [mockTeachers[1]] },
            { child_name: "Mubeen", recommended_teachers: [mockTeachers[2]] },
            { child_name: "Hassan", recommended_teachers: [mockTeachers[3]] },
            { child_name: "Bilal", recommended_teachers: [mockTeachers[0], mockTeachers[1]] }
          ]);
        }
      } catch (err) {
        console.warn("API fetch failed, falling back to mock data", err);
        const mockData = getMockQuote(id);
        setQuoteData(mockData);
        setRecommendedTeachersResponse([
          { child_name: "Ali", recommended_teachers: [mockTeachers[0]] },
          { child_name: "Ahmad", recommended_teachers: [mockTeachers[1]] },
          { child_name: "Mubeen", recommended_teachers: [mockTeachers[2]] },
          { child_name: "Hassan", recommended_teachers: [mockTeachers[3]] },
          { child_name: "Bilal", recommended_teachers: [mockTeachers[0], mockTeachers[1]] }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [id]);

  // Update the teachers list based on the active child tab
  useEffect(() => {
    const activeChildName = quoteData?.children_data?.[activeChildIdx]?.child_name;
    if (activeChildName && recommendedTeachersResponse.length > 0) {
      const match = recommendedTeachersResponse.find(
        (item: any) => item.child_name?.toLowerCase() === activeChildName.toLowerCase()
      );
      if (match && match.recommended_teachers && match.recommended_teachers.length > 0) {
        setTeachers(match.recommended_teachers);
        return;
      }
    }
    // Fallback to all mock teachers if no specific recommendations found
    setTeachers(mockTeachers);
  }, [activeChildIdx, recommendedTeachersResponse, quoteData]);



  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -360 : 360;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleApprove = () => {
    const hasUnselected = quoteData?.children_data?.some((_: any, idx: number) => !selectedTeacherIds[idx]);
    if (hasUnselected) {
      setValidationError(t('validationTeacher'));
      return;
    }
    setValidationError(null);
    setShowApproveConfirm(true);
  };

  const submitApprove = async () => {
    setShowApproveConfirm(false);
    setIsSubmitting(true);

    try {
      if (id) {
        const firstTeacherId = selectedTeacherIds[0];
        const firstSelectedTeacher = teachers.find(t => t.id === firstTeacherId);
        const payload = {
          status: 'Approved' as const,
          vacation_included: vacationPreference === 'included' ? 1 : 0,
          lesson_style: selectedStyle === '1to1' ? ('Private' as const) : ('Group' as const),
          preferred_teacher_user_id: firstSelectedTeacher?.user_id || null,
          children_data: quoteData?.children_data?.map((child: any, idx: number) => {
            const childTeacherId = selectedTeacherIds[idx];
            const childTeacher = teachers.find(t => t.id === childTeacherId);
            return {
              ...child,
              preferred_teacher_user_id: childTeacher?.user_id || null
            };
          }) || []
        };
        const res = await apiService.updatePriceQuoteStatus(id, payload);
        console.log("Approve quote API response:", res);
      }
    } catch (err) {
      console.warn("API approve failed, completing client-side approval", err);
    } finally {
      setIsSubmitting(false);
      setQuoteData((prev: any) => prev ? { ...prev, status: 'Approved' } : prev);
      setShowSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleReject = async () => {
    setShowRejectConfirm(false);
    setIsRejecting(true);
    try {
      if (id) {
        const firstTeacherId = selectedTeacherIds[0];
        const firstSelectedTeacher = teachers.find(t => t.id === firstTeacherId);
        const payload = {
          status: 'Refused' as const,
          vacation_included: vacationPreference === 'included' ? 1 : 0,
          lesson_style: selectedStyle === '1to1' ? ('Private' as const) : ('Group' as const),
          preferred_teacher_user_id: firstSelectedTeacher?.user_id || null,
          children_data: quoteData?.children_data?.map((child: any, idx: number) => {
            const childTeacherId = selectedTeacherIds[idx];
            const childTeacher = teachers.find(t => t.id === childTeacherId);
            return {
              ...child,
              preferred_teacher_user_id: childTeacher?.user_id || null
            };
          }) || []
        };
        const res = await apiService.updatePriceQuoteStatus(id, payload);
        console.log("Reject quote API response:", res);
      }
    } catch (err) {
      console.warn("Reject failed", err);
    } finally {
      setIsRejecting(false);
      setQuoteData((prev: any) => prev ? { ...prev, status: 'Refused' } : prev);
      setShowReject(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRequestNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRequesting(true);
    try {
      // Simulating API call to submit request notes for a new price quote
      await new Promise(resolve => setTimeout(resolve, 1200));
      console.log("Submitted request notes:", requestNotes);
    } catch (err) {
      console.warn("Request new failed", err);
    } finally {
      setIsRequesting(false);
      setShowRequestNewForm(false);
      setShowRequestSuccess(true);
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

  // Helpers
  const getQuoteRef = () => {
    if (!quoteData) return '';
    const dateStr = quoteData.created_at || quoteData.updated_at;
    if (!dateStr) return `D/2605-${id}`;
    try {
      const d = new Date(dateStr);
      const yy = String(d.getFullYear()).slice(-2);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `D/${yy}${mm}${dd}-${quoteData.id || id}`;
    } catch (e) {
      return `D/2605-${quoteData.id || id}`;
    }
  };

  const getFormattedDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      let d: Date;
      if (typeof dateStr === 'string' && dateStr.includes('-') && !dateStr.includes('T')) {
        const [year, month, day] = dateStr.split('-').map(Number);
        d = new Date(year, month - 1, day);
      } else {
        d = new Date(dateStr);
      }
      if (isNaN(d.getTime())) return dateStr;
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      return `${dd}/${mm}/${yy}`;
    } catch (e) {
      return dateStr;
    }
  };

  const convertTo12Hour = (time24: string) => {
    if (!time24) return '';
    const [hourStr, minStr] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const min = minStr;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    const hourFormatted = String(hour).padStart(2, '0');
    return `${hourFormatted}:${min} ${ampm}`;
  };

  const convertTo24Hour = (time12: string) => {
    if (!time12) return '';
    const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return '';
    let hour = parseInt(match[1], 10);
    const min = match[2];
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${min}`;
  };

  // Cost calculations
  const hourlyRateFloat = parseFloat(quoteData.hourly_rate) || 25.0;
  const weeklyHoursFloat = parseFloat(quoteData.weekly_hours) || 12.0;
  const originalMonthlyCost = parseFloat(quoteData.monthly_cost) || parseFloat((hourlyRateFloat * weeklyHoursFloat * 4.33).toFixed(2));
  const childrenCount = quoteData.children_data?.length || 1;

  // Option 1: 1:1 Tutoring (Private) - Dynamic from API
  const rate1to1 = hourlyRateFloat;
  const cost1to1 = originalMonthlyCost;

  // Option 2: Group of 4 Tutoring (15 * number of children)
  const rateGroup = parseFloat((15 * childrenCount).toFixed(2));
  const costGroup = parseFloat((rateGroup * weeklyHoursFloat * 4.33).toFixed(2));

  const currentMonthlyCost = selectedStyle === '1to1' ? cost1to1 : selectedStyle === 'group' ? costGroup : 0;
  const currentHourlyRate = selectedStyle === '1to1' ? rate1to1 : selectedStyle === 'group' ? rateGroup : 0;

  const isAllSelected = !!(
    selectedStyle &&
    vacationPreference &&
    quoteData?.children_data &&
    quoteData.children_data.length > 0 &&
    quoteData.children_data.every((_: any, idx: number) => selectedTeacherIds[idx] !== undefined)
  );





  return (
    <div className="min-h-screen bg-brand-slate-bg pb-24 relative overflow-hidden font-sans">
      {/* Background blobs for premium landing feel */}
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-brand-purple/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] left-[-10%] w-[40%] h-[40%] bg-brand-indigo/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 pt-6 md:pt-12 relative z-10">
        
        {/* Invoice / Devis Card Sheet Container */}
        <div className="bg-white rounded-[1.25rem] sm:rounded-[2.5rem] border border-slate-100/80 p-3.5 sm:p-6 md:p-10 soft-shadow">
          
          {/* Header Row: Logo, Language Switcher & Invoice Metadata */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-100 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
              <img src={logo} alt="Bloom Buddies Academy" className="w-48 sm:w-56 h-auto" />
              <div className="sm:ml-2">
                <LanguageSwitcher />
              </div>
            </div>
            <div className="text-left md:text-right">
              <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                {language === 'fr' ? 'DEVIS' : 'QUOTE'} N° {getQuoteRef()}
              </h1>
              <p className="text-xs text-slate-600 font-bold mt-1">
                {language === 'fr' ? 'Date de création' : 'Creation Date'}:{' '}
                {getFormattedDate(quoteData.created_at)}
              </p>
            </div>
          </div>

          {/* Status Banner */}
          {quoteData.status === 'Approved' && (
            <div className="mb-8 p-3 sm:p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 sm:gap-4 text-emerald-800">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                  {language === 'fr' ? 'Devis approuvé avec succès !' : 'Quote Approved Successfully!'}
                </h3>
                <p className="text-[11px] sm:text-xs text-emerald-600/90 font-medium mt-0.5">
                  {language === 'fr' 
                    ? 'Merci d\'avoir choisi Bloom Buddies Academy. Nous sommes ravis de commencer ce parcours d\'apprentissage !' 
                    : 'Thank you for choosing Bloom Buddies Academy. We are thrilled to start this learning journey!'}
                </p>
              </div>
            </div>
          )}

          {quoteData.status === 'Refused' && (
            <div className="mb-8 p-3 sm:p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 sm:gap-4 text-red-800">
              <div className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <X size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                  {language === 'fr' ? 'Proposition refusée' : 'Proposal Rejected'}
                </h3>
                <p className="text-[11px] sm:text-xs text-red-600/90 font-medium mt-0.5">
                  {language === 'fr'
                    ? 'Nous sommes désolés que cette proposition ne convienne pas. Notre équipe vous contactera rapidement.'
                    : 'We are sorry this proposal didn\'t fit. Our team will reach out to you shortly.'}
                </p>
              </div>
            </div>
          )}

          {/* Vendeur & Acheteur Information Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
            {/* VENDEUR Box (Static Leonard.fr details) */}
            <div className="border border-slate-100/60 rounded-2xl p-4 bg-slate-50/20">
              <h3 className="text-xs font-black uppercase text-slate-600 tracking-wider mb-2.5">
                {language === 'fr' ? 'VENDEUR:' : 'SELLER:'}
              </h3>
              <div className="text-xs space-y-0.5 text-slate-700 font-medium">
                <p className="font-extrabold text-slate-800 text-sm mb-1">Leonard.fr</p>
                <p>180 Rue Judaïque</p>
                <p>33000 Bordeaux, France</p>
                <p className="pt-1">SIREN 809015407</p>
                <p className="pt-1">Email: contact@leonard.fr</p>
              </div>
            </div>

            {/* ACHETEUR Box (Dynamic parent details from API) */}
            <div className="border border-slate-100/60 rounded-2xl p-4 bg-slate-50/20">
              <h3 className="text-xs font-black uppercase text-slate-600 tracking-wider mb-2.5">
                {language === 'fr' ? 'ACHETEUR:' : 'BUYER:'}
              </h3>
              <div className="text-xs space-y-0.5 text-slate-700 font-medium">
                <p className="font-extrabold text-slate-800 text-sm mb-1">
                  {quoteData.parent?.firstName || 'Admin'} {quoteData.parent?.lastName || 'User'}
                </p>
                <p>{quoteData.parent?.address || 'Paris, France'}</p>
                {quoteData.parent?.email && <p className="pt-1">Email: {quoteData.parent.email}</p>}
              </div>
            </div>
          </div>

          {/* Outer 12-col grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT 8-COLUMN GRID AREA */}
            <div className="lg:col-span-8 space-y-6">

              {/* PRICING DETAILS DISPLAY CARDS (Only show, not selectable) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option 1: 1:1 Private Lessons Card */}
                <div className="border border-slate-100 rounded-xl sm:rounded-3xl p-4 sm:p-5 md:p-6 bg-white shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 bg-indigo-50 text-brand-indigo font-bold text-xs rounded-full uppercase tracking-wide mb-2">
                      {t('lessonStyle1to1')}
                    </span>
                    <p className="text-slate-600 text-xs sm:text-sm font-medium leading-normal pr-2">
                      {t('formula1to1')}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-baseline justify-between gap-1.5 pt-3 border-t border-slate-100/60">
                    <div className="flex items-baseline">
                      <span className="text-2xl font-black text-slate-800">{cost1to1} €</span>
                      <span className="text-xs text-slate-500 font-bold ml-0.5">{t('perMonth')}</span>
                    </div>
                    <span className="text-xs text-slate-500 font-semibold bg-slate-50 px-2 py-1 rounded-md border border-slate-100/50">
                      {rate1to1} €/{t('hour')}
                    </span>
                  </div>
                </div>

                {/* Option 2: Group of 4 Lessons Card */}
                <div className="border border-slate-100 rounded-xl sm:rounded-3xl p-4 sm:p-5 md:p-6 bg-white shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 bg-purple-50 text-brand-purple font-bold text-xs rounded-full uppercase tracking-wide mb-2">
                      {t('lessonStyleGroup')}
                    </span>
                    <p className="text-slate-600 text-xs sm:text-sm font-medium leading-normal pr-2">
                      {t('formulaGroup')}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-baseline justify-between gap-1.5 pt-3 border-t border-slate-100/60">
                    <div className="flex items-baseline">
                      <span className="text-2xl font-black text-slate-800">{costGroup} €</span>
                      <span className="text-xs text-slate-500 font-bold ml-0.5">{t('perMonth')}</span>
                    </div>
                    <span className="text-xs text-slate-500 font-semibold bg-slate-50 px-2 py-1 rounded-md border border-slate-100/50">
                      {rateGroup} €/{t('hour')}
                    </span>
                  </div>
                </div>
              </div>

              {/* LESSON SCHEDULES */}
              <div className="border border-slate-100 rounded-xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 bg-white space-y-4">
                <h3 className="text-sm font-black uppercase text-slate-600 tracking-wider flex items-center gap-2 border-b border-slate-50 pb-2.5">
                  <CalendarIcon className="text-brand-purple shrink-0" size={16} />
                  {language === 'fr' ? 'PLANNINGS DES COURS' : 'LESSON SCHEDULES'}
                </h3>

                {quoteData.children_data && quoteData.children_data.length > 0 && (
                  <div className="pt-0 space-y-4">
                    {/* Student Tabs for Lesson Schedules */}
                    <div className="flex gap-2 flex-wrap border-b border-slate-100 pb-3">
                      {quoteData.children_data.map((child: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setActiveScheduleChildIdx(idx);
                            setEditingChildIdx(null); // Reset editing state on tab switch
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                            activeScheduleChildIdx === idx
                              ? 'bg-brand-indigo text-white shadow-sm'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {child.child_name || `Student ${idx + 1}`}
                        </button>
                      ))}
                    </div>

                    {/* Active Student Content */}
                    {(() => {
                      const child = quoteData.children_data[activeScheduleChildIdx];
                      if (!child) return null;
                      const scheduleEntries = Object.entries(child.lesson_schedule || {});

                      return (
                        <div className="border border-slate-100 rounded-xl overflow-hidden bg-white p-3.5 space-y-3.5 text-sm text-slate-600 font-medium">
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-2 text-xs">
                              <span className="font-extrabold text-slate-700">{t('evaluationSession')}</span>
                              {editingChildIdx !== activeScheduleChildIdx && (
                                <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                                  <span className="text-brand-purple font-black text-left sm:text-right">
                                    {getFormattedDate(child.evaluation_class_date) || 'N/A'} @ {child.evaluation_class_time || 'N/A'}
                                  </span>
                                  {quoteData.status === 'Pending' && (
                                    <button
                                      onClick={() => handleStartEditEvaluation(activeScheduleChildIdx, child.evaluation_class_date, child.evaluation_class_time)}
                                      className="text-slate-400 hover:text-brand-indigo transition-colors p-1 rounded hover:bg-slate-50 cursor-pointer"
                                    >
                                      <Edit3 size={12} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {editingChildIdx === activeScheduleChildIdx && (
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-1 bg-slate-50 p-2 rounded-xl border border-slate-100/80">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  <input
                                    type="date"
                                    value={tempDate}
                                    onChange={(e) => setTempDate(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] sm:text-xs outline-none font-sans flex-1 min-w-0"
                                  />
                                  <input
                                    type="time"
                                    value={convertTo24Hour(tempTime)}
                                    onChange={(e) => setTempTime(convertTo12Hour(e.target.value))}
                                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] sm:text-xs outline-none font-sans flex-1 min-w-0"
                                  />
                                </div>
                                <div className="flex items-center gap-1 justify-end shrink-0">
                                  <button
                                    onClick={() => handleSaveEvaluation(activeScheduleChildIdx)}
                                    className="text-white bg-emerald-500 hover:bg-emerald-600 p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center shadow-sm flex-1 sm:flex-none"
                                    title="Save"
                                  >
                                    <Check size={14} strokeWidth={3} className="mx-auto" />
                                  </button>
                                  <button
                                    onClick={() => setEditingChildIdx(null)}
                                    className="text-slate-500 bg-slate-200 hover:bg-slate-300 p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center flex-1 sm:flex-none"
                                    title="Cancel"
                                  >
                                    <X size={14} strokeWidth={3} className="mx-auto" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {scheduleEntries.length > 0 ? (
                            <div className="space-y-1.5 pt-2.5 border-t border-slate-50">
                              <p className="font-extrabold text-slate-600 uppercase tracking-wider text-xs mb-1">
                                {t('lessonSchedule')}
                              </p>
                              {scheduleEntries.map(([day, val]: [string, any]) => (
                                <div key={day} className="flex flex-wrap justify-between items-center gap-1.5 text-xs bg-slate-50/50 p-2 rounded-lg border border-slate-100/20">
                                  <span className="font-bold text-slate-700 capitalize">{day}</span>
                                  <span className="font-medium text-slate-600 font-mono shrink-0">
                                    {val.start_time} - {val.end_time}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic pt-1 text-center">
                              {language === 'fr' ? 'Aucun planning défini' : 'No schedule defined'}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* 3. CHOOSE YOUR PREFERRED TEACHER */}
              <div className="border border-slate-100 rounded-xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 text-brand-indigo flex items-center justify-center text-xs font-black">3</span>
                    {t('selectTeacherTitle')}
                  </h2>
                  {/* Scroll buttons */}
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleScroll('left')}
                      className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors active:scale-95"
                    >
                      <ChevronLeft size={16} className="text-slate-600" />
                    </button>
                    <button
                      onClick={() => handleScroll('right')}
                      className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors active:scale-95"
                    >
                      <ChevronRight size={16} className="text-slate-600" />
                    </button>
                  </div>
                </div>

                {/* Student Tabs */}
                {quoteData.children_data && quoteData.children_data.length > 0 && (
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {quoteData.children_data.map((child: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveChildIdx(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                          activeChildIdx === idx
                            ? 'bg-brand-indigo text-white shadow-sm'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {child.child_name || `Student ${idx + 1}`}
                      </button>
                    ))}
                  </div>
                )}

                {/* Carousel body */}
                <div
                  ref={scrollRef}
                  className="flex gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory custom-scrollbar"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {teachers.map((teacher) => {
                    const isSelected = selectedTeacherIds[activeChildIdx] === teacher.id;
                    const name = `${teacher.user?.firstName || 'Teacher'} ${teacher.user?.lastName || ''}`;
                    const firstInitial = teacher.user?.firstName?.[0] || '';
                    const lastInitial = teacher.user?.lastName?.[0] || '';
                    const initials = `${firstInitial}${lastInitial}`.toUpperCase() || 'TR';

                    return (
                      <div
                        key={teacher.id}
                        onClick={() => {
                          if (quoteData.status !== 'Pending') return;
                          setSelectedTeacherIds(prev => ({
                            ...prev,
                            [activeChildIdx]: teacher.id
                          }));
                        }}
                        className={`snap-start shrink-0 w-[16.5rem] sm:w-[19rem] border rounded-2xl transition-all flex flex-row items-stretch overflow-hidden relative ${
                          quoteData.status === 'Pending'
                            ? 'cursor-pointer hover:border-slate-200 hover:bg-slate-50/10'
                            : 'cursor-default'
                        } ${
                          isSelected
                            ? 'border-brand-indigo bg-indigo-50/10 shadow-sm'
                            : 'border-slate-100'
                        }`}
                      >
                        {/* Left Side: Portrait Image / Initials Fallback (Full Height) */}
                        <div className={`w-24 sm:w-28 border-r shrink-0 flex items-center justify-center ${
                          isSelected ? 'border-brand-indigo/30' : 'border-slate-100'
                        }`}>
                          {teacher.profile_pic ? (
                            <img
                              src={teacher.profile_pic}
                              alt={name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 text-slate-100 flex items-center justify-center font-extrabold text-2xl tracking-wider select-none">
                              {initials}
                            </div>
                          )}
                        </div>

                        {/* Right Side: Details & description next to image */}
                        <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between relative min-w-0">
                          <div className="space-y-2">
                            {/* Name and select indicator inline */}
                            <div className="flex justify-between items-start gap-1.5">
                              <div className="min-w-0">
                                <h4 className="font-extrabold text-slate-800 text-sm leading-tight break-words">{name}</h4>
                                <div className="flex items-center gap-1 text-slate-600 text-xs mt-1">
                                  <MapPin size={10} className="shrink-0" />
                                  <span className="truncate">{teacher.city || 'Europe'}</span>
                                </div>
                              </div>
                              
                              <div className={`px-1.5 py-0.5 rounded-full font-bold text-[11px] flex items-center gap-1 shrink-0 transition-all select-none ${
                                isSelected ? 'bg-brand-indigo text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                              }`}>
                                <Check size={8} strokeWidth={3} />
                                <span className="hidden min-[380px]:inline">{isSelected ? t('teacherSelected') : t('selectTeacherBtn')}</span>
                                <span className="inline min-[380px]:hidden">{isSelected ? t('teacherSelected') : t('selectTeacherBtnShort') || 'Select'}</span>
                              </div>
                            </div>

                            {/* About me description inside right block */}
                            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed line-clamp-4 font-medium pt-2 border-t border-slate-100/60">
                              "{teacher.about_me}"
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* RIGHT 4-COLUMN SIDEBAR AREA (Totals, banking details, and actions) */}
            <div className="lg:col-span-4 space-y-6">



              {/* 1. SELECT LESSON STYLE CARD */}
              <div className="border border-slate-100 rounded-xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 bg-white">
                <div
                  onClick={() => setIsLessonStyleOpen(prev => !prev)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 text-brand-indigo flex items-center justify-center text-xs font-black">1</span>
                    {t('selectStyleTitle')}
                  </h2>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-200 shrink-0 ${isLessonStyleOpen ? '' : '-rotate-90'}`}
                  />
                </div>

                <AnimatePresence initial={false}>
                  {isLessonStyleOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                <div className="grid grid-cols-1 gap-3 mt-4">

                  {/* Option 1: 1:1 Lessons */}
                  <div
                    onClick={() => {
                      if (quoteData.status !== 'Pending') return;
                      setSelectedStyle('1to1');
                    }}
                    className={`border rounded-xl p-3.5 sm:p-4 transition-all flex items-center justify-between relative ${
                      quoteData.status === 'Pending'
                        ? 'cursor-pointer hover:border-slate-200 hover:bg-slate-50/20'
                        : 'cursor-default opacity-90'
                    } ${
                      selectedStyle === '1to1'
                        ? 'border-brand-indigo bg-indigo-50/10'
                        : 'border-slate-100'
                    }`}
                  >
                    <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
                      {t('lessonStyle1to1')}
                    </span>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border shrink-0 ${
                      selectedStyle === '1to1' ? 'border-brand-indigo bg-brand-indigo text-white' : 'border-slate-300'
                    }`}>
                      {selectedStyle === '1to1' && <Check size={8} strokeWidth={3} />}
                    </div>
                  </div>

                  {/* Option 2: Group of 4 */}
                  <div
                    onClick={() => {
                      if (quoteData.status !== 'Pending') return;
                      setSelectedStyle('group');
                    }}
                    className={`border rounded-xl p-3.5 sm:p-4 transition-all flex items-center justify-between relative ${
                      quoteData.status === 'Pending'
                        ? 'cursor-pointer hover:border-slate-200 hover:bg-slate-50/20'
                        : 'cursor-default opacity-90'
                    } ${
                      selectedStyle === 'group'
                        ? 'border-brand-indigo bg-indigo-50/10'
                        : 'border-slate-100'
                    }`}
                  >
                    <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
                      {t('lessonStyleGroup')}
                    </span>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border shrink-0 ${
                      selectedStyle === 'group' ? 'border-brand-indigo bg-brand-indigo text-white' : 'border-slate-300'
                    }`}>
                      {selectedStyle === 'group' && <Check size={8} strokeWidth={3} />}
                    </div>
                  </div>

                </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 2. SELECT SCHOOL VACATION PREFERENCE */}
              <div className="border border-slate-100 rounded-xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 bg-white">
                <h2 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-brand-indigo flex items-center justify-center text-xs font-black">2</span>
                  {t('vacationTitle')}
                </h2>

                <div className="grid grid-cols-1 gap-4">

                  {/* Option 1: Included */}
                  <div
                    onClick={() => {
                      if (quoteData.status !== 'Pending') return;
                      setVacationPreference('included');
                    }}
                    className={`border rounded-xl p-3.5 sm:p-4 transition-all flex items-start gap-3 relative ${
                      quoteData.status === 'Pending'
                        ? 'cursor-pointer hover:border-slate-200 hover:bg-slate-50/20'
                        : 'cursor-default opacity-90'
                    } ${
                      vacationPreference === 'included'
                        ? 'border-brand-indigo bg-indigo-50/10'
                        : 'border-slate-100'
                    }`}
                  >
                    <div className="pr-6">
                      <p className="font-extrabold text-slate-800 text-xs">{t('vacationIncluded')}</p>
                      <p className="text-slate-600 text-xs leading-tight mt-0.5">{t('vacationIncludedDesc')}</p>
                    </div>
                    <div className="absolute top-4 right-4">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                        vacationPreference === 'included' ? 'border-brand-indigo bg-brand-indigo text-white' : 'border-slate-300'
                      }`}>
                        {vacationPreference === 'included' && <Check size={8} strokeWidth={3} />}
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Excluded */}
                  <div
                    onClick={() => {
                      if (quoteData.status !== 'Pending') return;
                      setVacationPreference('excluded');
                    }}
                    className={`border rounded-xl p-3.5 sm:p-4 transition-all flex items-start gap-3 relative ${
                      quoteData.status === 'Pending'
                        ? 'cursor-pointer hover:border-slate-200 hover:bg-slate-50/20'
                        : 'cursor-default opacity-90'
                    } ${
                      vacationPreference === 'excluded'
                        ? 'border-brand-indigo bg-indigo-50/10'
                        : 'border-slate-100'
                    }`}
                  >
                    <div className="pr-6">
                      <p className="font-extrabold text-slate-800 text-xs">{t('vacationExcluded')}</p>
                      <p className="text-slate-600 text-xs leading-tight mt-0.5">{t('vacationExcludedDesc')}</p>
                    </div>
                    <div className="absolute top-4 right-4">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                        vacationPreference === 'excluded' ? 'border-brand-indigo bg-brand-indigo text-white' : 'border-slate-300'
                      }`}>
                        {vacationPreference === 'excluded' && <Check size={8} strokeWidth={3} />}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Box: Validation Alert and Action Buttons (Accept, Reject, Request New) */}
              <div className="space-y-3">
                {quoteData.status === 'Pending' ? (
                  <>
                    {validationError && (
                      <div className="p-3 bg-red-50 text-red-500 rounded-xl text-[11px] font-semibold border border-red-100">
                        {validationError}
                      </div>
                    )}

                    {/* Primary Action: Accept */}
                    <button
                      onClick={handleApprove}
                      disabled={!isAllSelected || isSubmitting || isRejecting}
                      className="w-full bloom-gradient text-white font-extrabold text-sm py-4 px-6 rounded-2xl shadow-lg shadow-indigo-100/50 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin w-5 h-5" />
                      ) : (
                        <>
                          <CheckCircle2 size={18} />
                          <span>{t('acceptQuoteBtn')}</span>
                        </>
                      )}
                    </button>

                    {/* Secondary Actions: Request New and Reject (Side-by-side) */}
                    <div className="grid grid-cols-2 gap-3 text-[11px] sm:text-xs">
                      {/* Request New Price Quote */}
                      <button
                        onClick={() => {
                          const whatsappNumber = "33757820121"; // Replace with your support WhatsApp number
                          const message = language === 'fr'
                            ? `Bonjour, je souhaite demander une nouvelle proposition pour le devis N° ${getQuoteRef()}.`
                            : `Hello, I would like to request a new proposal for Quote N° ${getQuoteRef()}.`;
                          const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
                          window.open(url, '_blank');
                        }}
                        disabled={isSubmitting || isRejecting}
                        className="py-3.5 px-2.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 text-center flex items-center justify-center gap-1.5"
                      >
                        <span>{t('requestNewQuoteBtnShort')}</span>
                      </button>

                      {/* Reject Price Quote */}
                      <button
                        onClick={() => setShowRejectConfirm(true)}
                        disabled={isSubmitting || isRejecting}
                        className="py-3.5 px-2.5 border border-red-200 hover:border-red-300 hover:bg-red-50/50 text-red-500 font-extrabold rounded-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 text-center flex items-center justify-center gap-1.5"
                      >
                        {isRejecting ? (
                          <Loader2 className="animate-spin w-4 h-4" />
                        ) : (
                          <span>{t('rejectQuoteBtnShort')}</span>
                        )}
                      </button>
                    </div>
                  </>
                ) : quoteData.status === 'Approved' ? (
                  <div className="space-y-3">
                    <div className="w-full py-4 px-6 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl font-black text-center text-sm flex items-center justify-center gap-2 select-none">
                      <CheckCircle2 size={16} />
                      <span>{language === 'fr' ? 'APPROUVÉ' : 'APPROVED'}</span>
                    </div>
                    <button
                      onClick={() => {
                        const whatsappNumber = "33757820121"; // Replace with your support WhatsApp number
                        const message = language === 'fr'
                          ? `Bonjour, je souhaite demander une nouvelle proposition pour le devis N° ${getQuoteRef()}.`
                          : `Hello, I would like to request a new proposal for Quote N° ${getQuoteRef()}.`;
                        const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
                        window.open(url, '_blank');
                      }}
                      className="w-full py-3.5 px-2.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl transition-all active:scale-[0.98] cursor-pointer text-center flex items-center justify-center gap-1.5 text-xs animate-fadeIn"
                    >
                      <span>{t('requestNewQuoteBtnShort')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-full py-4 px-6 bg-red-50 border border-red-100 text-red-600 rounded-2xl font-black text-center text-sm flex items-center justify-center gap-2 select-none">
                      <X size={16} />
                      <span>{language === 'fr' ? 'REFUSÉ' : 'REFUSED'}</span>
                    </div>
                    <button
                      onClick={() => {
                        const whatsappNumber = "33757820121"; // Replace with your support WhatsApp number
                        const message = language === 'fr'
                          ? `Bonjour, je souhaite demander une nouvelle proposition pour le devis N° ${getQuoteRef()}.`
                          : `Hello, I would like to request a new proposal for Quote N° ${getQuoteRef()}.`;
                        const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
                        window.open(url, '_blank');
                      }}
                      className="w-full py-3.5 px-2.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl transition-all active:scale-[0.98] cursor-pointer text-center flex items-center justify-center gap-1.5 text-xs animate-fadeIn"
                    >
                      <span>{t('requestNewQuoteBtnShort')}</span>
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>



      {/* SUCCESS MODAL OVERLAY */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          >
            <Confetti />
            
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 md:p-7 max-w-md w-full shadow-2xl relative border border-slate-100/80 overflow-hidden my-auto mx-auto"
            >
              {/* Confetti details */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-50 text-green-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>

              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 text-center mb-1.5 leading-tight">
                {t('successTitle')}
              </h2>
              <p className="text-slate-400 text-center font-medium max-w-sm mx-auto mb-4 sm:mb-5 text-[11px] sm:text-xs">
                {t('successSubtitle')}
              </p>

              {/* Choices recap box */}
              <div className="bg-slate-50/50 p-3 sm:p-4 rounded-xl border border-slate-100/60 mb-4 sm:mb-5 space-y-2 sm:space-y-2.5 text-[11px] sm:text-xs">
                <h4 className="font-extrabold text-slate-700 border-b border-slate-200/60 pb-1.5 mb-2">
                  {t('successRecap')}
                </h4>
                
                <div className="flex justify-between items-center gap-4">
                  <span className="text-slate-400 font-bold">{t('selectStyleTitle')}</span>
                  <span className="text-slate-700 font-black text-right truncate">
                    {selectedStyle === '1to1' ? t('lessonStyle1to1') : t('lessonStyleGroup')}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-4">
                  <span className="text-slate-400 font-bold">{t('vacation')}</span>
                  <span className="text-slate-700 font-black text-right truncate">
                    {vacationPreference === 'included' ? t('vacationIncluded') : t('vacationExcluded')}
                  </span>
                </div>

                {quoteData.children_data?.map((child: any, idx: number) => {
                  const childTeacherId = selectedTeacherIds[idx];
                  const childTeacher = teachers.find(t => t.id === childTeacherId);
                  return childTeacher ? (
                    <div key={idx} className="flex justify-between items-center gap-4">
                      <span className="text-slate-400 font-bold">{t('class.teacher')} ({child.child_name || `Student ${idx + 1}`})</span>
                      <span className="text-brand-indigo font-black text-right truncate">
                        {childTeacher.user?.firstName} {childTeacher.user?.lastName}
                      </span>
                    </div>
                  ) : null;
                })}

                <div className="flex justify-between items-center gap-4 pt-2 border-t border-slate-200/60">
                  <span className="text-slate-400 font-bold">{t('monthlyCost')}</span>
                  <span className="text-brand-purple font-black text-xs sm:text-sm text-right">
                    {currentMonthlyCost} €
                  </span>
                </div>
              </div>

              {/* Next steps */}
              <div className="bg-indigo-50/20 p-3 sm:p-4 rounded-xl border border-indigo-100/10 mb-4 sm:mb-5 text-[11px] sm:text-xs">
                <h4 className="font-bold text-brand-indigo flex items-center gap-1.5 mb-1 text-[11px] sm:text-xs">
                  <Sparkles size={13} className="shrink-0" />
                  {t('successNextSteps')}
                </h4>
                <p className="text-slate-500 leading-normal text-[10px] sm:text-[11px]">
                  {t('successNextStepsDesc').replace('{phone}', quoteData.parent?.phone || '')}
                </p>
              </div>

              <Link
                to="/"
                className="w-full inline-flex justify-center items-center gap-2 bloom-gradient text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-extrabold text-xs sm:text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                <Home size={14} className="shrink-0" />
                <span>{t('successDoneBtn')}</span>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REJECT SUCCESS MODAL OVERLAY */}
      <AnimatePresence>
        {showReject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 max-w-md w-full shadow-2xl relative border border-slate-100/80 overflow-hidden text-center my-auto mx-auto"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-50 text-red-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <X className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>

              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 mb-1.5 leading-tight">
                {t('rejectTitle')}
              </h2>
              <p className="text-slate-400 font-medium max-w-sm mx-auto mb-4 sm:mb-5 text-[11px] sm:text-xs">
                {t('rejectSubtitle')}
              </p>

              <div className="bg-slate-50/50 p-3 sm:p-4 rounded-xl border border-slate-100/60 mb-4 sm:mb-5 text-[11px] sm:text-xs leading-relaxed text-slate-500 font-medium">
                <p>{t('rejectNextSteps')}</p>
              </div>

              <button
                onClick={() => setShowReject(false)}
                className="w-full inline-flex justify-center items-center gap-2 bloom-gradient text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-extrabold text-xs sm:text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>{t('successDoneBtn')}</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REQUEST NEW FORM MODAL OVERLAY */}
      <AnimatePresence>
        {showRequestNewForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 max-w-md w-full shadow-2xl relative border border-slate-100/80 overflow-hidden my-auto mx-auto"
            >
              <button
                onClick={() => setShowRequestNewForm(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              <h2 className="text-lg sm:text-xl font-black text-slate-800 mb-1.5 pr-6 leading-tight">
                {t('requestNewTitle')}
              </h2>
              <p className="text-slate-400 text-[10px] sm:text-[11px] font-semibold mb-4 sm:mb-5">
                {t('requestNewDesc')}
              </p>

              <form onSubmit={handleRequestNewSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1.5">
                    {language === 'fr' ? 'Vos commentaires / Besoins' : 'Your comments / Requirements'}
                  </label>
                  <textarea
                    required
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                    rows={3}
                    placeholder={language === 'fr' ? "Ex. Je préfère commencer à 16h au lieu de 17h, ou avoir 15 heures par semaine..." : "E.g. I prefer to start at 04:00 PM instead of 05:00 PM, or have 15 weekly hours..."}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-brand-indigo focus:bg-white focus:outline-none transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRequesting}
                  className="w-full inline-flex justify-center items-center gap-2 bloom-gradient text-white py-2.5 sm:py-3 px-6 rounded-lg sm:rounded-xl font-extrabold text-xs sm:text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isRequesting ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <span>{t('submitRequestBtn')}</span>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REQUEST SUCCESS MODAL OVERLAY */}
      <AnimatePresence>
        {showRequestSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 max-w-md w-full shadow-2xl relative border border-slate-100/80 overflow-hidden text-center my-auto mx-auto"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 text-brand-indigo rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>

              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 mb-1.5 leading-tight">
                {t('requestSuccessTitle')}
              </h2>
              <p className="text-slate-400 font-medium max-w-sm mx-auto mb-4 sm:mb-5 text-[11px] sm:text-xs">
                {t('requestSuccessSubtitle')}
              </p>

              <button
                onClick={() => setShowRequestSuccess(false)}
                className="w-full inline-flex justify-center items-center gap-2 bloom-gradient text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-extrabold text-xs sm:text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>{t('successDoneBtn')}</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* APPROVE CONFIRMATION MODAL OVERLAY */}
      <AnimatePresence>
        {showApproveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 max-w-md w-full shadow-2xl relative border border-slate-100/80 overflow-hidden text-center my-auto mx-auto"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 text-brand-indigo rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>

              <h2 className="text-lg sm:text-xl font-black text-slate-800 mb-1.5 leading-tight">
                {t('confirmApproveTitle')}
              </h2>
              <p className="text-slate-400 font-medium max-w-sm mx-auto mb-5 text-[11px] sm:text-xs">
                {t('confirmApproveDesc')}
              </p>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => setShowApproveConfirm(false)}
                  className="py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl text-xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  {t('cancelBtn')}
                </button>
                <button
                  onClick={submitApprove}
                  className="py-3 px-4 bloom-gradient text-white font-extrabold rounded-xl text-xs transition-all active:scale-[0.98] shadow-md hover:scale-[1.01] cursor-pointer"
                >
                  {t('confirmBtnYesApprove')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REJECT CONFIRMATION MODAL OVERLAY */}
      <AnimatePresence>
        {showRejectConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 max-w-md w-full shadow-2xl relative border border-slate-100/80 overflow-hidden text-center my-auto mx-auto"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-50 text-red-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <X className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>

              <h2 className="text-lg sm:text-xl font-black text-slate-800 mb-1.5 leading-tight">
                {t('confirmRejectTitle')}
              </h2>
              <p className="text-slate-400 font-medium max-w-sm mx-auto mb-5 text-[11px] sm:text-xs">
                {t('confirmRejectDesc')}
              </p>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => setShowRejectConfirm(false)}
                  className="py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl text-xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  {t('cancelBtn')}
                </button>
                <button
                  onClick={handleReject}
                  className="py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-extrabold rounded-xl text-xs transition-all active:scale-[0.98] shadow-md hover:scale-[1.01] cursor-pointer"
                >
                  {t('confirmBtnYesReject')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
