import React from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Power,
  Users,
  Settings,
  ShieldOff
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface ControlsProps {
  isMuted: boolean;
  isCamOff: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onLeave: () => void;
  onEndClass?: () => void;
  role: 'host' | 'audience';
  participantCount: number;
}

export const Controls: React.FC<ControlsProps> = ({
  isMuted,
  isCamOff,
  onToggleMic,
  onToggleCam,
  onLeave,
  onEndClass,
  role,
  participantCount
}) => {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
      <div className="px-6 py-3 bg-slate-900 border border-white/5 rounded-[2.5rem] shadow-2xl flex items-center gap-3 backdrop-blur-xl">
        
        {/* Participants Info */}
        <div className="flex items-center gap-2 pr-4 mr-2 border-r border-white/10 text-slate-400">
          <Users size={18} />
          <span className="text-xs font-bold font-mono">{participantCount}</span>
        </div>

        {/* Media Toggles */}
        <button
          onClick={onToggleMic}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
            isMuted 
              ? "bg-red-500/10 text-red-500 border border-red-500/20" 
              : "bg-white/5 text-white hover:bg-white/10"
          )}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button
          onClick={onToggleCam}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
            isCamOff 
              ? "bg-red-500/10 text-red-500 border border-red-500/20" 
              : "bg-white/5 text-white hover:bg-white/10"
          )}
        >
          {isCamOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>

        {/* Leave Class */}
        <button
          onClick={onLeave}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all duration-300"
          title="Leave Class"
        >
          <PhoneOff size={20} />
        </button>

        {/* End Class (Teacher Only) */}
        {role === 'host' && onEndClass && (
          <button
            onClick={onEndClass}
            className="ml-2 pl-4 border-l border-white/10 flex items-center gap-2 group"
            title="End Class for Everyone"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500 text-white shadow-lg shadow-red-500/20 group-hover:scale-110 transition-all duration-300">
              <Power size={20} />
            </div>
            <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
              End Class
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
