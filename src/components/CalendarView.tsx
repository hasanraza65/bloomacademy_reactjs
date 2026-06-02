import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Info,
  Loader2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '@/src/lib/utils';
import { User } from '@/src/types';
import { apiService } from '../services/apiService';

interface TimeSlot {
  id: string;
  timeStart: string;
  timeEnd: string;
  title: string;
  teacher?: string;
  student?: string;
  status: 'booked' | 'available';
  color: 'indigo' | 'emerald' | 'orange' | 'rose' | 'purple' | 'slate' | 'amber';
  students?: string;
  channelName?: string;
}

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
    case 'amber':
      return {
        bg: 'bg-amber-50/70 border-amber-100/50 hover:bg-amber-50/90',
        text: 'text-amber-950',
        sub: 'text-amber-600',
        badge: 'bg-amber-100/70 text-amber-700'
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

interface CalendarViewProps {
  user?: User;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ user }) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  

  const timeRanges = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const startHour = i.toString().padStart(2, '0');
      const endHour = (i + 1).toString().padStart(2, '0');
      return `${startHour}:00 - ${endHour}:00`;
    });
  }, []);
  
  // State for search, filter and selected slots for simulated booking
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'booked' | 'available'>('all');
  const [bookingSlot, setBookingSlot] = useState<{ dateKey: string; slot: TimeSlot } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [hasSelected, setHasSelected] = useState<boolean>(false);

  // Generate days for the selected month of the selected year
  const dates = useMemo(() => {
    const list: Date[] = [];
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      list.push(new Date(selectedYear, selectedMonth - 1, i));
    }
    return list;
  }, [selectedMonth, selectedYear]);

  const getLocalDateString = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getDeterministicColor = (id: number | string): 'indigo' | 'amber' | 'emerald' | 'rose' | 'purple' | 'slate' => {
    const colors: ('indigo' | 'amber' | 'emerald' | 'rose' | 'purple' | 'slate')[] = [
      'indigo',
      'amber',
      'emerald',
      'rose',
      'purple',
      'slate'
    ];
    const numId = typeof id === 'number' ? id : parseInt(id, 10) || 0;
    return colors[numId % colors.length];
  };

  const getSlotTiming = (slot: TimeSlot) => {
    if (!slot.timeStart || !slot.timeEnd) return 'full';
    const startMin = parseInt(slot.timeStart.split(':')[1], 10) || 0;
    const endMin = parseInt(slot.timeEnd.split(':')[1], 10) || 0;
    const startHour = parseInt(slot.timeStart.split(':')[0], 10) || 0;
    const endHour = parseInt(slot.timeEnd.split(':')[0], 10) || 0;

    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    if (durationMinutes <= 30) {
      if (startMin < 15) {
        return 'first-half';
      } else {
        return 'second-half';
      }
    }
    return 'full';
  };

  // Initialize slots state and loading state
  const [slotsState, setSlotsState] = useState<{ [dateKey: string]: TimeSlot[] }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && scrollContainerRef.current) {
      let earliestDateIndex = -1;
      let earliestHour = 24;

      // Loop through dates chronologically to find the first booked class
      for (let i = 0; i < dates.length; i++) {
        const dateKey = getLocalDateString(dates[i]);
        const slots = slotsState[dateKey] || [];
        const bookedSlots = slots.filter(slot => slot.status === 'booked' && slot.timeStart);
        if (bookedSlots.length > 0) {
          earliestDateIndex = i;
          
          let minHour = 24;
          bookedSlots.forEach(slot => {
            const hour = parseInt(slot.timeStart.split(':')[0], 10);
            if (!isNaN(hour) && hour < minHour) {
              minHour = hour;
            }
          });
          earliestHour = minHour < 24 ? minHour : 9;
          break;
        }
      }

      // Scroll to earliest booked class if found, otherwise default to 09:00 (index 9)
      const targetHour = earliestHour < 24 ? earliestHour : 9;
      scrollContainerRef.current.scrollTop = targetHour * 155;

      // Scroll horizontally to the earliest class date
      if (earliestDateIndex !== -1) {
        scrollContainerRef.current.scrollLeft = earliestDateIndex * 280;
      } else {
        scrollContainerRef.current.scrollLeft = 0;
      }
    }
  }, [isLoading, slotsState, dates]);

  // Fetch calendar data for all months covered by `dates`
  useEffect(() => {
    let active = true;
    const fetchCalendarData = async () => {
      setIsLoading(true);
      try {
        let results;
        if (!hasSelected) {
          // Default load: fetch calendar without parameters
          results = [await apiService.getCalendar()];
        } else {
          // Custom select load: fetch calendar with month and year
          const uniqueMonths = new Map<string, { month: number; year: number }>();
          dates.forEach(d => {
            const m = d.getMonth() + 1;
            const y = d.getFullYear();
            const key = `${y}-${m}`;
            if (!uniqueMonths.has(key)) {
              uniqueMonths.set(key, { month: m, year: y });
            }
          });

          const fetchPromises = Array.from(uniqueMonths.values()).map(({ month, year }) =>
            apiService.getCalendar(month, year)
          );

          results = await Promise.all(fetchPromises);
        }
        
        if (!active) return;

        const mergedSlots: { [dateKey: string]: TimeSlot[] } = {};

        results.forEach(res => {
          if (res && res.status && res.data) {
            const dataObj = res.data;
            Object.keys(dataObj).forEach(dateStr => {
              const apiSlots = dataObj[dateStr];
              if (Array.isArray(apiSlots)) {
                mergedSlots[dateStr] = apiSlots.map((item: any, idx: number) => {
                  const studentId = item.child?.id || item.classroom_id || item.pair_id || idx;
                  const color = getDeterministicColor(studentId);
                  const teacherName = item.teacher
                    ? `${item.teacher.firstName || ''} ${item.teacher.lastName || ''}`.trim()
                    : '';
                  
                  return {
                    id: String(item.slot_id || `${item.pair_id || item.classroom_id}-${idx}`),
                    timeStart: (item.start_time || '').substring(0, 5),
                    timeEnd: (item.end_time || '').substring(0, 5),
                    title: language === 'fr' ? 'Cours en direct' : 'Live Class',
                    teacher: teacherName,
                    student: item.child?.child_name || '',
                    status: 'booked' as const,
                    color,
                    channelName: item.channel_name
                  };
                });
              }
            });
          }
        });

        setSlotsState(mergedSlots);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchCalendarData();
    return () => {
      active = false;
    };
  }, [dates, language, hasSelected]);

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
      const updatedSlots = (prev[dateKey] || []).map(s => {
        if (s.id === slot.id) {
          return {
            ...s,
            title: language === 'fr' ? 'Cours réservé (Simulé)' : 'Booked Class (Simulated)',
            teacher: 'Karwish',
            student: user ? `${user.firstName} ${user.lastName}` : 'You (Student)',
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

          {/* Month & Year Pickers */}
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(Number(e.target.value));
                setHasSelected(true);
              }}
              className="bg-slate-50 border border-slate-200 focus:border-brand-indigo focus:bg-white rounded-xl px-3 py-2 text-sm font-extrabold text-slate-700 outline-none transition-all cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const monthNum = i + 1;
                const tempDate = new Date(2000, i, 1);
                const locale = language === 'fr' ? 'fr-FR' : 'en-US';
                const monthName = tempDate.toLocaleDateString(locale, { month: 'long' });
                return (
                  <option key={monthNum} value={monthNum} className="font-semibold text-slate-700">
                    {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                  </option>
                );
              })}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setHasSelected(true);
              }}
              className="bg-slate-50 border border-slate-200 focus:border-brand-indigo focus:bg-white rounded-xl px-3 py-2 text-sm font-extrabold text-slate-700 outline-none transition-all cursor-pointer"
            >
              {Array.from({ length: 6 }, (_, i) => {
                const yearNum = 2025 + i;
                return (
                  <option key={yearNum} value={yearNum} className="font-semibold text-slate-700">
                    {yearNum}
                  </option>
                );
              })}
            </select>
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
        className="overflow-auto h-[calc(100vh-250px)] lg:h-[calc(100vh-230px)] min-h-[600px] border border-slate-100 rounded-[24px] bg-white soft-shadow custom-scrollbar relative w-full"
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center z-40 rounded-[24px]">
            <Loader2 size={40} className="text-brand-indigo animate-spin mb-2" />
            <p className="text-sm font-bold text-slate-500">
              {language === 'fr' ? 'Chargement du calendrier...' : 'Loading calendar...'}
            </p>
          </div>
        )}

        <div className="flex flex-col min-w-max">
          {/* Header Row (Top Axis) */}
          <div className="flex sticky top-0 z-20 bg-slate-50 border-b border-slate-100">
            {/* Corner Time Header */}
            <div className="sticky left-0 bg-slate-50 border-r border-slate-100 z-30 w-36 h-16 shrink-0 flex items-center justify-center font-black text-[10px] text-slate-400 uppercase tracking-widest">
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
                      "w-[280px] h-16 shrink-0 flex flex-col justify-center px-5 relative",
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
                  <div className="sticky left-0 bg-white border-r border-slate-100 z-10 w-36 h-[155px] shrink-0 flex flex-col justify-center items-center text-center">
                    <span className="text-xs font-black text-slate-700">{range.split(' - ')[0]}</span>
                    <span className="text-[10px] font-bold text-slate-400 my-0.5">{language === 'fr' ? 'à' : 'to'}</span>
                    <span className="text-xs font-black text-slate-700">{range.split(' - ')[1]}</span>
                  </div>

                  {/* Date Grid Cells */}
                  {dates.map((date) => {
                    const key = getLocalDateString(date);
                    const daySlots = slotsState[key] || [];
                    const startHour = range.split(' - ')[0].split(':')[0]; // e.g. "09"
                    
                    const matchingSlots = daySlots.filter(s => (s.timeStart || '').startsWith(startHour));
                    const displaySlots = matchingSlots.filter(slot => {
                      const isFiltered = (
                        (statusFilter !== 'all' && slot.status !== statusFilter) ||
                        (searchQuery && !slot.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
                         !(slot.teacher && slot.teacher.toLowerCase().includes(searchQuery.toLowerCase())) &&
                         !(slot.student && slot.student.toLowerCase().includes(searchQuery.toLowerCase())))
                      );
                      return !isFiltered && slot.status !== 'available';
                    });

                    const firstHalfSlots = displaySlots.filter(s => getSlotTiming(s) === 'first-half');
                    const secondHalfSlots = displaySlots.filter(s => getSlotTiming(s) === 'second-half');
                    const fullSlots = displaySlots.filter(s => getSlotTiming(s) === 'full');

                    const renderFullCard = (displaySlot: TimeSlot, isHalf: boolean) => {
                      const colorStyles = getColorClasses(displaySlot.color);
                      if (isHalf) {
                        return (
                          <div
                            key={displaySlot.id}
                            onClick={() => {
                              if (displaySlot.channelName) {
                                navigate(`/classroom/${displaySlot.channelName}`);
                              } else {
                                showToast(language === 'fr' ? `Erreur: Aucun canal de classe` : `Error: No classroom channel`);
                              }
                            }}
                            className={cn(
                              "flex-1 p-2 rounded-[12px] border transition-all flex items-center justify-between cursor-pointer overflow-hidden relative group/card",
                              colorStyles.bg
                            )}
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <h5 className={cn("text-[10px] font-black truncate leading-tight", colorStyles.text)} title={displaySlot.title}>
                                {displaySlot.title}
                              </h5>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[8px] opacity-80 font-bold">
                                {displaySlot.teacher && (
                                  <span className={cn("truncate max-w-[80px]", colorStyles.sub)} title={displaySlot.teacher}>
                                    T: {displaySlot.teacher.split(' ')[0]}
                                  </span>
                                )}
                                {displaySlot.student && (
                                  <span className={cn("truncate max-w-[80px]", colorStyles.sub)} title={displaySlot.student}>
                                    S: {displaySlot.student}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (displaySlot.channelName) {
                                  navigate(`/classroom/${displaySlot.channelName}`);
                                } else {
                                  showToast(language === 'fr' ? `Erreur: Aucun canal de classe` : `Error: No classroom channel`);
                                }
                              }}
                              className={cn("text-[8px] font-black hover:underline flex items-center gap-0.5 shrink-0 border border-slate-100/10 px-1.5 py-0.5 rounded bg-white/20", colorStyles.sub)}
                            >
                              {language === 'fr' ? 'Rejoindre' : 'Join'}
                              <ChevronRight size={8} />
                            </button>
                          </div>
                        );
                      }

                      // Full size card
                      return (
                        <div
                          key={displaySlot.id}
                          onClick={() => {
                            if (displaySlot.channelName) {
                              navigate(`/classroom/${displaySlot.channelName}`);
                            } else {
                              showToast(language === 'fr' ? `Erreur: Aucun canal de classe` : `Error: No classroom channel`);
                            }
                          }}
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
                                <span className="font-extrabold">{language === 'fr' ? 'Enseignant : ' : 'Teacher: '}</span>
                                {displaySlot.teacher}
                              </p>
                            )}
                            {displaySlot.student && (
                              <p className={cn("text-[10px] font-bold mt-0.5 opacity-80", colorStyles.sub)}>
                                <span className="font-extrabold">{language === 'fr' ? 'Élève : ' : 'Student: '}</span>
                                {displaySlot.student}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-end border-t border-slate-100/10 pt-2 mt-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (displaySlot.channelName) {
                                  navigate(`/classroom/${displaySlot.channelName}`);
                                } else {
                                  showToast(language === 'fr' ? `Erreur: Aucun canal de classe` : `Error: No classroom channel`);
                                }
                              }}
                              className={cn("text-[10px] font-bold hover:underline flex items-center gap-0.5 transition-all", colorStyles.sub)}
                            >
                              {language === 'fr' ? 'Rejoindre' : 'Join'}
                              <ChevronRight size={10} />
                            </button>
                          </div>
                        </div>
                      );
                    };

                    return (
                      <div key={`${key}-${range}`} className="w-[280px] h-[155px] p-2 shrink-0 flex items-stretch">
                        {displaySlots.length > 0 ? (
                          // If there are full-hour slots, render all matching slots as full height
                          fullSlots.length > 0 ? (
                            <div className="flex-1 flex gap-2">
                              {displaySlots.map(slot => renderFullCard(slot, false))}
                            </div>
                          ) : (
                            // Render split height: first-half vs second-half
                            <div className="flex-1 flex flex-col justify-between">
                              {/* Top Half */}
                              {firstHalfSlots.length > 0 ? (
                                <div className="h-[48%] flex gap-1.5 w-full items-stretch">
                                  {firstHalfSlots.map(slot => renderFullCard(slot, true))}
                                </div>
                              ) : (
                                <div className="h-[48%] w-full border border-dashed border-slate-100/10 rounded-[12px] flex items-center justify-center text-[8px] text-slate-300 bg-slate-50/5">
                                  -
                                </div>
                              )}

                              {/* Bottom Half */}
                              {secondHalfSlots.length > 0 ? (
                                <div className="h-[48%] flex gap-1.5 w-full items-stretch">
                                  {secondHalfSlots.map(slot => renderFullCard(slot, true))}
                                </div>
                              ) : (
                                <div className="h-[48%] w-full border border-dashed border-slate-100/10 rounded-[12px] flex items-center justify-center text-[8px] text-slate-300 bg-slate-50/5">
                                  -
                                </div>
                              )}
                            </div>
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
