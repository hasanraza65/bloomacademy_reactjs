import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User as UserIcon, 
  Plus, 
  Check, 
  Filter,
  Search,
  Sparkles,
  Info
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '@/src/lib/utils';

interface TimeSlot {
  id: string;
  timeStart: string;
  timeEnd: string;
  title: string;
  teacher?: string;
  status: 'booked' | 'available';
  color: 'indigo' | 'emerald' | 'orange' | 'rose' | 'purple' | 'slate';
  students?: string;
}

const generateSlotsForDate = (date: Date): TimeSlot[] => {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  
  if (day === 0) {
    // Sunday - fewer slots
    return [
      {
        id: `slot-${date.getTime()}-1`,
        timeStart: '10:30',
        timeEnd: '11:15',
        title: 'Special Reading Session',
        teacher: 'Emma Robert',
        status: 'booked',
        color: 'purple',
        students: '4/5 Students'
      },
      {
        id: `slot-${date.getTime()}-2`,
        timeStart: '11:30',
        timeEnd: '12:00',
        title: 'Available Slot',
        status: 'available',
        color: 'slate'
      }
    ];
  }

  const baseSlots: TimeSlot[] = [
    {
      id: `slot-${date.getTime()}-1`,
      timeStart: '09:00',
      timeEnd: '09:30',
      title: 'Creative Writing Class',
      teacher: 'Sarah Connor',
      status: 'booked',
      color: 'indigo',
      students: '5/5 Students'
    },
    {
      id: `slot-${date.getTime()}-2`,
      timeStart: '09:40',
      timeEnd: '10:20',
      title: 'Available Slot',
      status: 'available',
      color: 'slate'
    },
    {
      id: `slot-${date.getTime()}-3`,
      timeStart: '10:30',
      timeEnd: '11:15',
      title: 'Interactive English',
      teacher: 'David Miller',
      status: 'booked',
      color: 'emerald',
      students: '3/5 Students'
    },
    {
      id: `slot-${date.getTime()}-4`,
      timeStart: '11:30',
      timeEnd: '12:00',
      title: 'Available Slot',
      status: 'available',
      color: 'slate'
    },
    {
      id: `slot-${date.getTime()}-5`,
      timeStart: '12:15',
      timeEnd: '13:00',
      title: 'Public Speaking',
      teacher: 'Sophia Loren',
      status: 'booked',
      color: 'orange',
      students: '2/5 Students'
    },
    {
      id: `slot-${date.getTime()}-6`,
      timeStart: '14:00',
      timeEnd: '14:45',
      title: 'Maths Wizards',
      teacher: 'James Bond',
      status: 'booked',
      color: 'rose',
      students: '5/5 Students'
    },
    {
      id: `slot-${date.getTime()}-7`,
      timeStart: '15:00',
      timeEnd: '15:30',
      title: 'Available Slot',
      status: 'available',
      color: 'slate'
    }
  ];

  // Vary items dynamically so every day doesn't look identical
  const dayOfMonth = date.getDate();
  if (dayOfMonth % 3 === 0) {
    return baseSlots.filter((_, i) => i !== 2 && i !== 5);
  } else if (dayOfMonth % 3 === 1) {
    return baseSlots.filter((_, i) => i !== 1 && i !== 4);
  }
  return baseSlots;
};

const getColorClasses = (color: string) => {
  switch (color) {
    case 'indigo':
      return {
        bg: 'bg-indigo-50/70 border-indigo-100/50 hover:bg-indigo-50/90',
        text: 'text-indigo-950',
        sub: 'text-indigo-600',
        badge: 'bg-indigo-100/70 text-indigo-700'
      };
    case 'emerald':
      return {
        bg: 'bg-emerald-50/70 border-emerald-100/50 hover:bg-emerald-50/90',
        text: 'text-emerald-950',
        sub: 'text-emerald-600',
        badge: 'bg-emerald-100/70 text-emerald-700'
      };
    case 'orange':
      return {
        bg: 'bg-orange-50/70 border-orange-100/50 hover:bg-orange-50/90',
        text: 'text-orange-950',
        sub: 'text-orange-600',
        badge: 'bg-orange-100/70 text-orange-700'
      };
    case 'rose':
      return {
        bg: 'bg-rose-50/70 border-rose-100/50 hover:bg-rose-50/90',
        text: 'text-rose-950',
        sub: 'text-rose-600',
        badge: 'bg-rose-100/70 text-rose-700'
      };
    case 'purple':
      return {
        bg: 'bg-purple-50/70 border-purple-100/50 hover:bg-purple-50/90',
        text: 'text-purple-950',
        sub: 'text-purple-600',
        badge: 'bg-purple-100/70 text-purple-700'
      };
    default:
      return {
        bg: 'bg-slate-50/70 border-slate-100/50 hover:bg-slate-50/90',
        text: 'text-slate-950',
        sub: 'text-slate-600',
        badge: 'bg-slate-100/70 text-slate-700'
      };
  }
};

export const CalendarView: React.FC = () => {
  const { t, language } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const timeRanges = useMemo(() => [
    '09:00 - 09:30',
    '09:40 - 10:20',
    '10:30 - 11:15',
    '11:30 - 12:00',
    '12:15 - 13:00',
    '14:00 - 14:45',
    '15:00 - 15:30'
  ], []);
  
  // State for search, filter and selected slots for simulated booking
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'booked' | 'available'>('all');
  const [bookingSlot, setBookingSlot] = useState<{ dateKey: string; slot: TimeSlot } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Generate 30 days starting from today
  const dates = useMemo(() => {
    const list: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      list.push(d);
    }
    return list;
  }, []);

  // Initialize slots
  const [slotsState, setSlotsState] = useState<{ [dateKey: string]: TimeSlot[] }>(() => {
    const initial: { [dateKey: string]: TimeSlot[] } = {};
    dates.forEach(d => {
      initial[d.toDateString()] = generateSlotsForDate(d);
    });
    return initial;
  });

  // Handle horizontal scrolling
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Helper to format date label
  const formatDateLabel = (date: Date) => {
    const isToday = new Date().toDateString() === date.toDateString();
    
    // Day Name
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dayName = t(`days.${dayOfWeek}` as any) || dayOfWeek;
    
    // Month Name & Day
    const locale = language === 'fr' ? 'fr-FR' : 'en-US';
    const month = date.toLocaleDateString(locale, { month: 'short' });
    const dayNum = date.getDate();
    
    return {
      isToday,
      dayName,
      dateString: `${dayNum} ${month}`,
      key: date.toDateString()
    };
  };

  // Simulate booking a slot
  const handleBookSlot = () => {
    if (!bookingSlot) return;
    
    const { dateKey, slot } = bookingSlot;
    
    setSlotsState(prev => {
      const updatedSlots = prev[dateKey].map(s => {
        if (s.id === slot.id) {
          return {
            ...s,
            title: language === 'fr' ? 'Cours réservé (Simulé)' : 'Booked Class (Simulated)',
            teacher: 'Karwish',
            status: 'booked' as const,
            color: 'indigo' as const,
            students: '1/5 Students'
          };
        }
        return s;
      });
      return {
        ...prev,
        [dateKey]: updatedSlots
      };
    });

    showToast(language === 'fr' 
      ? `Créneau de ${slot.timeStart} à ${slot.timeEnd} réservé avec succès !`
      : `Slot from ${slot.timeStart} to ${slot.timeEnd} successfully booked!`
    );
    setBookingSlot(null);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  return (
    <div className="space-y-6 w-full relative">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-50 font-bold border border-emerald-500/20"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Check size={14} className="text-white" />
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Confirmation Dialog */}
      <AnimatePresence>
        {bookingSlot && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[24px] max-w-md w-full p-6 soft-shadow border border-slate-100"
            >
              <div className="flex items-center gap-3 text-brand-indigo mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <CalendarIcon size={24} />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-800">
                    {language === 'fr' ? 'Réserver ce créneau ?' : 'Book this slot?'}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold">
                    {bookingSlot.dateKey}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-3 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold">{language === 'fr' ? 'Heure' : 'Time'}</span>
                  <span className="text-slate-700 font-extrabold flex items-center gap-1">
                    <Clock size={14} className="text-brand-indigo" />
                    {bookingSlot.slot.timeStart} - {bookingSlot.slot.timeEnd}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold">{language === 'fr' ? 'Statut' : 'Status'}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-600 uppercase tracking-wide">
                    {language === 'fr' ? 'Disponible' : 'Available'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setBookingSlot(null)}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all text-sm"
                >
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button 
                  onClick={handleBookSlot}
                  className="flex-1 py-3 px-4 bg-brand-indigo hover:bg-indigo-600 text-white rounded-xl font-bold transition-all text-sm shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
                >
                  {language === 'fr' ? 'Confirmer' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Filters and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-[24px] border border-slate-100 soft-shadow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-brand-indigo shrink-0">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {language === 'fr' ? 'Calendrier interactif' : 'Interactive Calendar'}
            </h2>
            <p className="text-xs text-slate-400 font-bold">
              {language === 'fr' ? 'Planifiez et gérez vos créneaux de cours' : 'Schedule and manage your class slots'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 md:flex-initial">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder={language === 'fr' ? 'Rechercher un cours/prof...' : 'Search class/teacher...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-brand-indigo focus:bg-white rounded-xl text-sm font-bold text-slate-700 placeholder-slate-400 outline-none transition-all w-full md:w-64"
            />
          </div>

          {/* Filter Pill Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['all', 'booked', 'available'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-black transition-all capitalize",
                  statusFilter === filter
                    ? "bg-white text-brand-indigo shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {filter === 'all' 
                  ? (language === 'fr' ? 'Tout' : 'All')
                  : filter === 'booked'
                    ? (language === 'fr' ? 'Réservé' : 'Booked')
                    : (language === 'fr' ? 'Disponible' : 'Available')
                }
              </button>
            ))}
          </div>

          {/* Scroll Nav buttons */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => scroll('left')}
              className="p-2 hover:bg-slate-50 text-slate-500 hover:text-brand-indigo border border-slate-100 rounded-xl transition-all"
              title={language === 'fr' ? 'Précédent' : 'Previous'}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="p-2 hover:bg-slate-50 text-slate-500 hover:text-brand-indigo border border-slate-100 rounded-xl transition-all"
              title={language === 'fr' ? 'Suivant' : 'Next'}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div 
        ref={scrollContainerRef}
        className="overflow-auto max-h-[580px] border border-slate-100 rounded-[24px] bg-white soft-shadow custom-scrollbar relative"
      >
        <div className="flex flex-col min-w-max">
          {/* Header Row (Top Axis) */}
          <div className="flex sticky top-0 z-20 bg-slate-50 border-b border-slate-100">
            {/* Corner Time Header */}
            <div className="sticky left-0 bg-slate-50 border-r border-slate-100 z-30 w-32 h-16 shrink-0 flex items-center justify-center font-black text-[10px] text-slate-400 uppercase tracking-widest">
              {language === 'fr' ? 'Heure' : 'Time'}
            </div>
            
            {/* Date Headers */}
            <div className="flex divide-x divide-slate-100 flex-1">
              {dates.map((date) => {
                const { isToday, dayName, dateString, key } = formatDateLabel(date);
                return (
                  <div 
                    key={key}
                    className={cn(
                      "w-[240px] h-16 shrink-0 flex flex-col justify-center px-5 relative",
                      isToday ? "bg-indigo-50/20" : ""
                    )}
                  >
                    <h4 className={cn("text-xs font-black uppercase tracking-wider leading-none mb-1", isToday ? "text-brand-indigo" : "text-slate-400")}>
                      {dayName}
                    </h4>
                    <p className="text-sm font-extrabold text-slate-800 leading-tight">
                      {dateString}
                    </p>
                    {isToday && (
                      <span className="absolute top-1.5 right-2 bg-brand-indigo text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                        {language === 'fr' ? 'Auj' : 'Today'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Rows */}
          <div className="flex flex-col divide-y divide-slate-100">
            {timeRanges.map((range) => {
              return (
                <div key={range} className="flex divide-x divide-slate-100">
                  {/* Time Axis Cell (Sticky Left) */}
                  <div className="sticky left-0 bg-white border-r border-slate-100 z-10 w-32 h-[155px] shrink-0 flex flex-col justify-center items-center text-center">
                    <span className="text-xs font-black text-slate-700">{range.split(' - ')[0]}</span>
                    <span className="text-[10px] font-bold text-slate-400 my-0.5">{language === 'fr' ? 'à' : 'to'}</span>
                    <span className="text-xs font-black text-slate-700">{range.split(' - ')[1]}</span>
                  </div>

                  {/* Date Grid Cells */}
                  {dates.map((date) => {
                    const key = date.toDateString();
                    const daySlots = slotsState[key] || [];
                    const slot = daySlots.find(s => `${s.timeStart} - ${s.timeEnd}` === range);
                    
                    // Apply filters locally per cell to hide if filtered
                    const isFiltered = slot && (
                      (statusFilter !== 'all' && slot.status !== statusFilter) ||
                      (searchQuery && !slot.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
                       !(slot.teacher && slot.teacher.toLowerCase().includes(searchQuery.toLowerCase())))
                    );

                    const displaySlot = isFiltered ? null : slot;
                    const isAvailable = displaySlot && displaySlot.status === 'available';

                    return (
                      <div key={`${key}-${range}`} className="w-[240px] h-[155px] p-2 shrink-0 flex items-stretch">
                        {displaySlot ? (
                          isAvailable ? (
                            <div
                              className="flex-1 p-3 rounded-[16px] border border-dashed border-slate-200 bg-slate-50/20 hover:bg-slate-50/70 hover:border-brand-indigo/40 transition-all flex items-center justify-center cursor-pointer group"
                              onClick={() => setBookingSlot({ dateKey: key, slot: displaySlot })}
                            >
                              <span className="text-[10px] font-black text-slate-400 group-hover:text-brand-indigo transition-colors flex items-center gap-1">
                                <Plus size={12} />
                                {language === 'fr' ? 'Réserver' : 'Book'}
                              </span>
                            </div>
                          ) : (
                            (() => {
                              const colorStyles = getColorClasses(displaySlot.color);
                              return (
                                <div
                                  className={cn(
                                    "flex-1 p-3.5 rounded-[16px] border transition-all flex flex-col justify-between cursor-pointer",
                                    colorStyles.bg
                                  )}
                                >
                                  <div>
                                    <h5 className={cn("text-xs font-extrabold leading-snug tracking-tight", colorStyles.text)}>
                                      {displaySlot.title}
                                    </h5>
                                    {displaySlot.teacher && (
                                      <p className={cn("text-[10px] font-bold mt-0.5 opacity-80", colorStyles.sub)}>
                                        {displaySlot.teacher}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between border-t border-slate-100/10 pt-2 mt-1">
                                    <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md", colorStyles.badge)}>
                                      {displaySlot.students}
                                    </span>
                                    
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        showToast(language === 'fr' 
                                          ? `Connexion...`
                                          : `Joining...`
                                        );
                                      }}
                                      className={cn("text-[10px] font-bold hover:underline flex items-center gap-0.5 transition-all", colorStyles.sub)}
                                    >
                                      {language === 'fr' ? 'Rejoindre' : 'Join'}
                                      <ChevronRight size={10} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })()
                          )
                        ) : (
                          <div className="flex-1 rounded-[16px] bg-slate-50/10 border border-dashed border-slate-100/30 flex items-center justify-center text-slate-200 text-[10px] font-bold">
                            -
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
