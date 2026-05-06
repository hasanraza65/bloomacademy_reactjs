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

  const playBadgeSound = (badgeType: string) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const t = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.18, t);
      master.connect(ctx.destination);

      const playNote = (freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 1) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t + start);
        g.gain.setValueAtTime(0, t + start);
        g.gain.linearRampToValueAtTime(vol, t + start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
        osc.connect(g); g.connect(master);
        osc.start(t + start); osc.stop(t + start + dur + 0.05);
      };

      switch (badgeType) {
        case 'star':
          // Sparkling ascending arpeggio C5-E5-G5-C6
          [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => playNote(f, i * 0.11, 0.45));
          playNote(1318.5, 0.44, 0.6, 'triangle', 0.4);
          break;
        case 'fire':
          // Energetic fast triplet + growl
          [698.46, 880, 1046.50, 1318.5].forEach((f, i) => playNote(f, i * 0.08, 0.3, 'sawtooth', 0.6));
          playNote(220, 0, 0.5, 'sawtooth', 0.3);
          break;
        case 'trophy':
          // Fanfare: 3-note triumphant blast
          [523.25, 523.25, 783.99, 1046.50].forEach((f, i) => playNote(f, i * 0.15, 0.55, 'square', 0.5));
          playNote(1318.5, 0.55, 0.7, 'sine', 0.5);
          break;
        case 'heart':
          // Gentle warm pulse: two soft chords
          [392, 523.25, 659.25].forEach((f, i) => playNote(f, i * 0.05, 0.8, 'sine', 0.6));
          [392, 523.25, 783.99].forEach((f, i) => playNote(f, 0.5 + i * 0.05, 0.9, 'sine', 0.5));
          break;
        case 'rocket':
          // Whoosh + launch: rising frequency sweep
          {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.exponentialRampToValueAtTime(1600, t + 0.7);
            g.gain.setValueAtTime(0.15, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
            osc.connect(g); g.connect(master);
            osc.start(t); osc.stop(t + 0.8);
            [1046.50, 1318.5].forEach((f, i) => playNote(f, 0.72 + i * 0.13, 0.4));
          }
          break;
        case 'crown':
          // Royal: dotted rhythm with bell-like tone
          [659.25, 783.99, 1046.50, 783.99, 1318.5].forEach((f, i) => playNote(f, i * 0.13, 0.5, 'triangle', 0.8));
          break;
        case 'diamond':
          // Crystal: high bright plucks
          [1046.50, 1318.5, 1567.98, 2093].forEach((f, i) => playNote(f, i * 0.1, 0.35, 'triangle', 0.7));
          playNote(2093, 0.42, 0.8, 'sine', 0.3);
          break;
        case 'thumbs_up':
          // Friendly two-tone ding-dong
          playNote(783.99, 0, 0.5, 'sine', 1);
          playNote(1046.50, 0.22, 0.6, 'sine', 0.9);
          playNote(1318.5, 0.5, 0.5, 'sine', 0.5);
          break;
        default:
          // Fallback: simple ascending arpeggio
          [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => playNote(f, i * 0.11, 0.45));
      }

      setTimeout(() => ctx.close(), 2500);
    } catch (e) {
      // Audio not supported — silent fail
    }
  };

  const triggerCelebration = (badge: Badge) => {
    playBadgeSound(badge.badge_type);
    setCurrentCelebration(badge);
    setEarnedBadges(prev => [...prev, badge]);
    setTimeout(() => {
      setCurrentCelebration(null);
    }, 4000);
  };

  // Student Polling (only when RTM is not available)
  useEffect(() => {
    if (isTeacher || !isInClass || isRTMReady) return;

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

    // Capture the channel instance so cleanup removes from the same object
    const channel = rtmChannelRef.current;

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

    channel.on('ChannelMessage', handleMessage);
    return () => {
      channel.off('ChannelMessage', handleMessage);
    };
  }, [isTeacher, isRTMReady]);

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
