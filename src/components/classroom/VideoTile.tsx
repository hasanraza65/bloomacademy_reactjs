import React, { useEffect, useRef } from 'react';
import { CameraOff, MicOff, User as UserIcon, Mic, Video, VideoOff } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface VideoTileProps {
  uid: string | number;
  videoTrack?: any;
  audioTrack?: any;
  isLocal?: boolean;
  name?: string;
  hasVideo?: boolean;
  hasAudio?: boolean;
  isLarge?: boolean;
  role?: 'host' | 'audience';
  isScreen?: boolean;
  // Props for embedded controls
  onToggleMic?: () => void;
  onToggleCam?: () => void;
  isMuted?: boolean;
  isCamOff?: boolean;
}

export const VideoTile: React.FC<VideoTileProps> = ({
  uid,
  videoTrack,
  isLocal,
  name,
  hasVideo = true,
  hasAudio = true,
  isLarge = false,
  role,
  isScreen = false,
  onToggleMic,
  onToggleCam,
  isMuted,
  isCamOff
}) => {
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoTrack && videoRef.current) {
      videoTrack.play(videoRef.current);
    }
    return () => {
      if (videoTrack) {
        videoTrack.stop();
      }
    };
  }, [videoTrack]);

  return (
    <div 
      className={cn(
        "relative rounded-3xl overflow-hidden bg-slate-900 border-2 transition-all duration-500",
        role === 'host' ? "border-brand-purple shadow-2xl shadow-purple-500/10" : "border-white/5",
        isLarge ? "w-full h-full" : "aspect-video"
      )}
    >
      {/* Video Container */}
      <div 
        ref={videoRef} 
        className={cn(
          "absolute inset-0 w-full h-full",
          isScreen ? "object-contain bg-black" : "object-cover",
          (!hasVideo || isCamOff) && !isScreen && "hidden"
        )} 
      />

      {/* Placeholder / Avatar */}
      {((!hasVideo || isCamOff) && !isScreen) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800">
          <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 mb-4 animate-pulse">
            <UserIcon size={40} />
          </div>
          <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">
            {role === 'host' ? 'TEACHER' : 'STUDENT'}
          </p>
        </div>
      )}

      {/* Top Overlay: Name & Role */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className={cn(
          "px-3 py-1.5 backdrop-blur-md rounded-full border flex items-center gap-2",
          isScreen ? "bg-brand-purple/20 border-brand-purple/30" : "bg-black/40 border-white/10"
        )}>
          <span className="text-xs font-bold text-white tracking-wide">
            {isScreen ? "Sharing Screen" : (name || (isLocal ? 'Me' : `User ${uid}`))}
          </span>
        </div>
      </div>

      {/* Bottom Overlay: Status Icons / Local Controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        {isLocal && onToggleMic && onToggleCam ? (
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMic();
              }}
              className={cn(
                "p-2 rounded-xl transition-all",
                isMuted ? "text-red-500 bg-red-500/10" : "text-white hover:bg-white/10"
              )}
            >
              {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCam();
              }}
              className={cn(
                "p-2 rounded-xl transition-all",
                isCamOff ? "text-red-500 bg-red-500/10" : "text-white hover:bg-white/10"
              )}
            >
              {isCamOff ? <VideoOff size={16} /> : <Video size={16} />}
            </button>
          </div>
        ) : (
          <>
            {!hasAudio && (
              <div className="p-1.5 bg-red-500/20 backdrop-blur-md rounded-lg border border-red-500/30 text-red-500 shrink-0">
                <MicOff size={14} />
              </div>
            )}
            {!hasVideo && (
              <div className="p-1.5 bg-red-500/20 backdrop-blur-md rounded-lg border border-red-500/30 text-red-500 shrink-0">
                <CameraOff size={14} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Local Video Mirroring Tag */}
      {isLocal && hasVideo && !isCamOff && (
        <div className="absolute bottom-4 left-4 text-[10px] font-bold text-white/40 uppercase tracking-widest pointer-events-none">
          Local Stream
        </div>
      )}
    </div>
  );
};
