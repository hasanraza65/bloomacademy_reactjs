import React, { useEffect, useRef, useState } from 'react';
import { ILocalAudioTrack, IRemoteAudioTrack } from 'agora-rtc-sdk-ng';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, User, GraduationCap } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface VoiceTimelineProps {
  teacherTrack?: ILocalAudioTrack | IRemoteAudioTrack;
  studentTrack?: ILocalAudioTrack | IRemoteAudioTrack;
  isTeacherView: boolean;
  teacherName?: string;
  studentName?: string;
}

interface AudioPoint {
  teacher: number;
  student: number;
  timestamp: number;
}

export const VoiceTimeline: React.FC<VoiceTimelineProps> = ({
  teacherTrack,
  studentTrack,
  isTeacherView,
  teacherName = "Teacher",
  studentName = "Student"
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [history, setHistory] = useState<AudioPoint[]>([]);
  const historyRef = useRef<AudioPoint[]>([]);
  const maxHistory = 300; // ~15 seconds at 50ms intervals
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const teacherLevel = teacherTrack ? teacherTrack.getVolumeLevel() : 0;
      const studentLevel = studentTrack ? studentTrack.getVolumeLevel() : 0;

      const newPoint: AudioPoint = {
        teacher: teacherLevel,
        student: studentLevel,
        timestamp: Date.now()
      };

      historyRef.current = [...historyRef.current, newPoint].slice(-maxHistory);
      draw();
    }, 50);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [teacherTrack, studentTrack]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const points = historyRef.current;

    ctx.clearRect(0, 0, width, height);

    if (points.length === 0) return;

    const barWidth = width / maxHistory;
    const centerY = height / 2;

    // Draw background layers for "who spoke when"
    points.forEach((point, i) => {
      const x = (maxHistory - points.length + i) * barWidth;
      
      // If teacher is speaking significantly
      if (point.teacher > 0.05) {
        ctx.fillStyle = 'rgba(139, 92, 246, 0.15)'; // brand-purple with low opacity
        ctx.fillRect(x, 0, barWidth + 1, centerY);
      }
      
      // If student is speaking significantly
      if (point.student > 0.05) {
        ctx.fillStyle = 'rgba(99, 102, 241, 0.15)'; // brand-indigo with low opacity
        ctx.fillRect(x, centerY, barWidth + 1, centerY);
      }
    });

    // Draw Waves
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Teacher Wave (Top)
    ctx.beginPath();
    ctx.strokeStyle = '#a78bfa'; // brand-purple-400
    points.forEach((point, i) => {
      const x = (maxHistory - points.length + i) * barWidth;
      const waveHeight = point.teacher * (height / 2.5);
      const y = centerY - waveHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Student Wave (Bottom)
    ctx.beginPath();
    ctx.strokeStyle = '#818cf8'; // brand-indigo-400
    points.forEach((point, i) => {
      const x = (maxHistory - points.length + i) * barWidth;
      const waveHeight = point.student * (height / 2.5);
      const y = centerY + waveHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Middle Divider
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
  };

  // Observe resize to keep canvas sharp
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-full flex items-center gap-4 px-6 overflow-hidden">
      {/* Legend / Status */}
      <div className="flex flex-col justify-center gap-2 pr-4 border-r border-white/5 h-full">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-purple shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{teacherName}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-indigo shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{studentName}</span>
        </div>
      </div>

      {/* Timeline Graphic */}
      <div className="flex-1 h-[60%] relative group">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        />
        
        {/* Playhead Indicator */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-white/20 shadow-[0_0_10px_rgba(255,255,255,0.3)] z-10" />
        
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Live Indicators */}
      <div className="flex items-center gap-4 pl-4 border-l border-white/5 h-full">
        <div className="flex flex-col items-center gap-1">
          <div className={cn(
             "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
             (teacherTrack?.getVolumeLevel() || 0) > 0.05 ? "bg-brand-purple/20 text-brand-purple shadow-[0_0_15px_rgba(139,92,246,0.3)]" : "bg-white/5 text-white/20"
          )}>
            <GraduationCap size={14} />
          </div>
          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Host</span>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <div className={cn(
             "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
             (studentTrack?.getVolumeLevel() || 0) > 0.05 ? "bg-brand-indigo/20 text-brand-indigo shadow-[0_0_15px_rgba(99,102,241,0.3)]" : "bg-white/5 text-white/20"
          )}>
            <User size={14} />
          </div>
          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Student</span>
        </div>
      </div>
    </div>
  );
};
