import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BASE_URL } from '@/src/lib/config';

interface BadgeRewardProps {
  isTeacher: boolean;
  isInClass: boolean;
  studentName?: string;
  rtmChannelRef: React.MutableRefObject<any>;
  isRTMReady: boolean;
}

interface Badge {
  id?: number;
  badge_type: string;
  badge_label: string;
  created_at?: string;
}

const BADGE_CONFIG: Record<string, { icon: string, label: string, gradient: string, color: string }> = {
  star: { icon: '⭐', label: 'Superstar', gradient: 'from-yellow-400 to-orange-500', color: '#fbbf24' },
  fire: { icon: '🔥', label: 'On Fire!', gradient: 'from-orange-500 to-red-600', color: '#f87171' },
  trophy: { icon: '🏆', label: 'Champion', gradient: 'from-yellow-300 to-yellow-500', color: '#fbbf24' },
  heart: { icon: '❤️', label: 'Amazing Work', gradient: 'from-pink-500 to-red-500', color: '#f472b6' },
  rocket: { icon: '🚀', label: 'Rocketing Up', gradient: 'from-blue-400 to-indigo-600', color: '#60a5fa' },
  crown: { icon: '👑', label: 'Top Student', gradient: 'from-yellow-400 to-amber-600', color: '#fbbf24' },
  diamond: { icon: '💎', label: 'Brilliant', gradient: 'from-cyan-400 to-blue-500', color: '#22d3ee' },
  thumbs_up: { icon: '👍', label: 'Great Job!', gradient: 'from-green-400 to-emerald-600', color: '#34d399' },
};

export const BadgeReward: React.FC<BadgeRewardProps> = ({ 
  isTeacher, 
  isInClass, 
  studentName = 'Student', 
  rtmChannelRef, 
  isRTMReady 
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [currentCelebration, setCurrentCelebration] = useState<Badge | null>(null);
  const lastBadgeIdRef = useRef<number | null>(null);
  const isPollingRef = useRef(false);

  const triggerCelebration = (badge: Badge) => {
    setCurrentCelebration(badge);
    setEarnedBadges(prev => [...prev, badge]);
    setTimeout(() => {
      setCurrentCelebration(null);
    }, 4000);
  };

  // Student Polling
  useEffect(() => {
    if (isTeacher || !isInClass) return;

    const pollBadges = async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;

      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${BASE_URL}badges/latest`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.badge && data.badge.id !== lastBadgeIdRef.current) {
            lastBadgeIdRef.current = data.badge.id;
            triggerCelebration(data.badge);
          }
        }
      } catch (err) {
        console.warn('Badge polling failed:', err);
      } finally {
        isPollingRef.current = false;
      }
    };

    const interval = setInterval(pollBadges, 3000);
    return () => clearInterval(interval);
  }, [isTeacher, isInClass]);

  // RTM Listener
  useEffect(() => {
    if (isTeacher || !isRTMReady || !rtmChannelRef.current) return;

    const handleMessage = (message: any) => {
      try {
        if (message.messageType !== 'TEXT' || !message.text) return;
        const msg = JSON.parse(message.text);
        if (msg.type === 'badge') {
          triggerCelebration({
            badge_type: msg.badge_type,
            badge_label: msg.badge_label
          });
        }
      } catch (e) {
        console.warn('Failed to parse badge RTM message', e);
      }
    };

    rtmChannelRef.current.on('ChannelMessage', handleMessage);
    return () => {
      rtmChannelRef.current?.off('ChannelMessage', handleMessage);
    };
  }, [isTeacher, isRTMReady, rtmChannelRef.current]);

  const handleSendBadge = async (type: string, label: string) => {
    setShowPicker(false);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${BASE_URL}badges/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          badge_type: type,
          badge_label: label
        })
      });

      if (res.ok) {
        // Send via RTM
        if (isRTMReady && rtmChannelRef.current) {
          rtmChannelRef.current.sendMessage({
            text: JSON.stringify({
              type: 'badge',
              badge_type: type,
              badge_label: label
            })
          }).catch((e: any) => console.warn('RTM badge send failed', e));
        }

        // Trigger local celebration for teacher
        triggerCelebration({ badge_type: type, badge_label: label });
      }
    } catch (err) {
      console.error('Failed to send badge:', err);
    }
  };

  return (
    <>
      {/* Earned Badges Strip (Bottom Left) */}
      <div className="fixed bottom-6 left-6 z-[160] flex flex-col gap-2">
        {earnedBadges.length > 0 && (
          <>
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Badges Earned</span>
            <div className="flex flex-wrap gap-2 max-w-[200px]">
              <AnimatePresence>
                {earnedBadges.map((badge, idx) => {
                  const config = BADGE_CONFIG[badge.badge_type] || BADGE_CONFIG.star;
                  return (
                    <motion.div
                      key={`${badge.badge_type}-${idx}`}
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg border border-white/20 bg-gradient-to-br",
                        config.gradient
                      )}
                      title={badge.badge_label}
                    >
                      {config.icon}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Teacher Action Button (Bottom Right) */}
      {isTeacher && (
        <div className="fixed bottom-6 right-6 z-[160]">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="w-16 h-16 rounded-full bg-brand-purple text-3xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform border-4 border-white/20"
          >
            🏅
          </button>

          <AnimatePresence>
            {showPicker && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowPicker(false)}
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[-1]"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="absolute bottom-20 right-0 w-80 bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/10 to-transparent pointer-events-none" />
                  <h3 className="text-white font-black text-xs uppercase tracking-widest mb-4 relative z-10">Reward {studentName}</h3>
                  <div className="grid grid-cols-2 gap-3 relative z-10">
                    {Object.entries(BADGE_CONFIG).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => handleSendBadge(key, config.label)}
                        className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
                      >
                        <span className="text-2xl group-hover:scale-125 transition-transform">{config.icon}</span>
                        <span className="text-[10px] font-bold text-slate-300 leading-tight">{config.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Celebration Overlay */}
      <AnimatePresence>
        {currentCelebration && (
          <Celebration 
            badge={currentCelebration} 
            isTeacher={isTeacher} 
            studentName={studentName} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

const Celebration: React.FC<{ badge: Badge, isTeacher: boolean, studentName: string }> = ({ badge, isTeacher, studentName }) => {
  const config = BADGE_CONFIG[badge.badge_type] || BADGE_CONFIG.star;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none overflow-hidden"
    >
      {/* Background Flash */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className={cn("absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent", config.gradient.replace('from-', 'bg-'))}
        style={{ backgroundColor: config.color }}
      />

      {/* Confetti */}
      {[...Array(24)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            top: -20, 
            left: `${Math.random() * 100}%`,
            rotate: 0,
            scale: 0
          }}
          animate={{ 
            top: '120%', 
            rotate: Math.random() * 360 * 3,
            scale: [0, 1, 1, 0.5]
          }}
          transition={{ 
            duration: 2 + Math.random() * 2,
            ease: "linear",
            delay: Math.random() * 0.5
          }}
          className="absolute w-3 h-3 rounded-full"
          style={{ backgroundColor: config.color }}
        />
      ))}

      {/* Central Burst */}
      <div className="flex flex-col items-center relative z-10">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1.2, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className={cn(
            "w-48 h-48 rounded-full flex items-center justify-center text-8xl shadow-[0_0_80px_rgba(0,0,0,0.5)] border-8 border-white/30 bg-gradient-to-br",
            config.gradient
          )}
        >
          {config.icon}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <h2 className="text-4xl font-black text-white uppercase tracking-widest drop-shadow-lg mb-2">
            {badge.badge_label}
          </h2>
          <p className="text-xl font-bold text-white/80 tracking-wide bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
            {isTeacher 
              ? `You gave ${studentName} a badge! 🎉` 
              : `Your teacher gave you a badge! 🎉`}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
