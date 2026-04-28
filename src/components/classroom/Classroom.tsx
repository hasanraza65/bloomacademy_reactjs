import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC, { 
  IAgoraRTCClient, 
  ILocalVideoTrack, 
  ILocalAudioTrack, 
  IAgoraRTCRemoteUser 
} from 'agora-rtc-sdk-ng';
import { Sparkles, Loader2, AlertCircle, Mic, MicOff, Video, VideoOff, Monitor, Pencil } from 'lucide-react';
import { ClassroomConnection, AgoraParticipant, User } from '@/src/types';
import { apiService } from '@/src/services/apiService';
import { VideoTile } from './VideoTile';
import { Whiteboard } from './Whiteboard';
import { MaterialManager } from './MaterialManager';
import { Controls } from './Controls';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ClassroomProps {
  user: User;
  onExit: () => void;
}

const BASE_URL = 'https://academy.bloom-buddies.fr/backend/public/api/';
const SITE_ROOT = 'https://academy.bloom-buddies.fr/backend/public';

export const Classroom: React.FC<ClassroomProps> = ({ user, onExit }) => {
  const [isInClass, setIsInClass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Agora State
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const [localTracks, setLocalTracks] = useState<{ video?: ILocalVideoTrack; audio?: ILocalAudioTrack }>({});
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [connectionData, setConnectionData] = useState<any>(null);

  // Use a ref to keep track of the most up-to-date remote users for the callback
  const remoteUsersRef = useRef<IAgoraRTCRemoteUser[]>([]);

  // UI State
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [whiteboardData, setWhiteboardData] = useState<{ roomUUID: string; roomToken: string } | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [streamId, setStreamId] = useState<number | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMaterialManager, setShowMaterialManager] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const screenTrackRef = useRef<any>(null);

  // Pre-meeting Track Initialization
  useEffect(() => {
    let audioInterval: any;
    
    if (!isInClass) {
      const initPreview = async () => {
        try {
          if (!localTracks.video || !localTracks.audio) {
            const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
              { encoderConfig: "high_quality" },
              { encoderConfig: "720p_1" }
            );
            setLocalTracks({ audio: audioTrack, video: videoTrack });
            
            if (isMuted) await audioTrack.setEnabled(false);
            if (isCamOff) await videoTrack.setEnabled(false);
          }
        } catch (err) {
          console.error("Failed to init preview tracks", err);
        }
      };
      initPreview();
    }

    // Monitor Audio Level
    if (localTracks.audio) {
      audioInterval = setInterval(() => {
        if (!isMuted && localTracks.audio) {
          const level = localTracks.audio.getVolumeLevel();
          setAudioLevel(level * 100);
        } else {
          setAudioLevel(0);
        }
      }, 100);
    }

    return () => {
      if (audioInterval) clearInterval(audioInterval);
    };
  }, [isInClass, localTracks.audio, isMuted, isCamOff]);

  // Handle Preview Playback
  useEffect(() => {
    if (!isInClass && localTracks.video && previewRef.current) {
      localTracks.video.play(previewRef.current);
    }
  }, [isInClass, localTracks.video, isCamOff]);

  const initAgora = async (data: any) => {
    try {
      const VERIFIED_APP_ID = '754aa406b558496dbb87044f1550de44';
      const payload = data.data || data; 
      const appId = (payload.app_id || payload.appId || VERIFIED_APP_ID).trim();
      const channelName = (payload.channel_name || payload.channelName || '').trim();
      const rawToken = payload.token || payload.token_name || '';
      const token = rawToken ? rawToken.replace(/\\\//g, '/') : null;
      const uid = Number(payload.uid) || 0;

      if (!clientRef.current) {
        clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      }
      const client = clientRef.current;
      console.log("Agora: Client keys", Object.keys(client));
      console.log("Agora: Client createDataStream type", typeof client.createDataStream);

      // Clear existing listeners to prevent duplicates
      client.off('user-joined');
      client.on('user-joined', (user) => {
        console.log("Agora: User joined", user.uid);
        if (!remoteUsersRef.current.find(u => u.uid === user.uid)) {
          remoteUsersRef.current = [...remoteUsersRef.current, user];
          setRemoteUsers([...remoteUsersRef.current]);
        }
      });

      client.off('user-published');
      client.on('user-published', async (user, mediaType) => {
        console.log("Agora: User published", user.uid, mediaType);
        await client.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
          // Trigger React update
          setRemoteUsers([...remoteUsersRef.current]);
        }
        if (mediaType === 'audio') {
          user.audioTrack?.play();
          setRemoteUsers([...remoteUsersRef.current]);
        }
      });

      client.off('user-unpublished');
      client.on('user-unpublished', (user, mediaType) => {
        console.log("Agora: User unpublished", user.uid, mediaType);
        setRemoteUsers([...remoteUsersRef.current]);
      });

      client.off('user-left');
      client.on('user-left', (user) => {
        console.log("Agora: User left", user.uid);
        remoteUsersRef.current = remoteUsersRef.current.filter(u => u.uid !== user.uid);
        setRemoteUsers([...remoteUsersRef.current]);
      });

      // Handle stream messages for whiteboard and PDF synchronization
      client.off('stream-message');
      client.on('stream-message', (uid, data) => {
        try {
          const decoder = new TextDecoder();
          const text = decoder.decode(data as Uint8Array);
          console.log(`Agora: Received stream message from ${uid}:`, text);
          const msg = JSON.parse(text);
          
          if (msg.type === 'whiteboard_sync' || msg.type === 'whiteboard_info') {
            console.log("Agora: Whiteboard sync data:", msg.roomUUID, "visible:", msg.visible);
            
            if (msg.roomUUID && msg.roomToken) {
              setWhiteboardData(prev => {
                if (prev?.roomUUID === msg.roomUUID && prev?.roomToken === msg.roomToken) {
                  return prev;
                }
                console.log("Agora: Updating whiteboard data for student");
                return {
                  roomUUID: msg.roomUUID,
                  roomToken: msg.roomToken,
                  appId: msg.appId
                };
              });
            }

            // Sync visibility for non-teachers
            if (msg.visible !== undefined && user.role !== 2) {
              console.log("Agora: Setting whiteboard visibility to", msg.visible);
              setShowWhiteboard(msg.visible);
            }
          }

          if (msg.type === 'pdf_sync' && user.role !== 2) {
            console.log("Agora: PDF sync data:", msg.activeMaterial?.id, "page:", msg.currentPage);
            if (msg.activeMaterial) {
              setActiveMaterial(msg.activeMaterial);
              setCurrentPage(msg.currentPage || 1);
              setShowWhiteboard(true);
            } else {
              setActiveMaterial(null);
            }
          }
        } catch (e) {
          console.error("Agora: Failed to parse stream message", e);
        }
      });

      await client.join(appId, channelName, token, uid);

      // Reuse or Publish local tracks
      try {
        let audioTrack = localTracks.audio;
        let videoTrack = localTracks.video;

        if (!audioTrack || !videoTrack) {
          [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
            { encoderConfig: "high_quality" },
            { encoderConfig: "720p_1" }
          );
          setLocalTracks({ audio: audioTrack, video: videoTrack });
        }
        
        // Publish tracks FIRST, then disable if needed
        await client.publish([audioTrack, videoTrack]);
        console.log("Agora: Local tracks published");

        // Sync with state AFTER publishing to avoid TRACK_IS_DISABLED error
        if (isMuted) await audioTrack.setEnabled(false);
        if (isCamOff) await videoTrack.setEnabled(false);
        
      } catch (mediaErr) {
        console.error("Agora: Failed to get local media", mediaErr);
      }

      setIsInClass(true);
      setConnectionData(payload);

      // Create data stream for broadcasting whiteboard info if teacher
      if (user.role === 2) {
        try {
          if (client && typeof (client as any).createDataStream === 'function') {
            const sId = await (client as any).createDataStream({ reliable: true, ordered: true });
            setStreamId(sId);
            console.log("Agora: Data stream created with ID", sId);
          } else {
            console.warn("Agora: createDataStream method not found on client", client);
          }
        } catch (e) {
          console.error("Agora: Failed to create data stream", e);
        }
      }

      // Check for whiteboard data in response
      if (payload.whiteboard_room_uuid && payload.whiteboard_room_token) {
        setWhiteboardData({
          roomUUID: payload.whiteboard_room_uuid,
          roomToken: payload.whiteboard_room_token
        });
      }
    } catch (err: any) {
      console.error("Agora Init Error:", err);
      setError("Video connection failed. Please check camera permissions.");
    }
  };

  // Teacher: Whiteboard Auto-Creation and Broadcasting
  useEffect(() => {
    let interval: any;
    
    const setupWhiteboard = async () => {
      // Trigger API only when teacher opens the whiteboard AND we don't have data yet
      if (isInClass && user.role === 2 && showWhiteboard && !whiteboardData) {
        try {
          console.log("Whiteboard: Requesting session from backend...");
          const res = await apiService.startWhiteboardSession();
          console.log("Whiteboard: Backend response:", res);
          
          const data = (res as any).data || res;
          // Use the specific keys provided by the user while keeping fallbacks
          const uuid = data.uuid || data.whiteboard_room_uuid;
          const roomToken = data.room_token || data.roomToken || data.whiteboard_room_token;

          if (uuid && roomToken) {
            console.log("Whiteboard: Received credentials from backend. UUID:", uuid);
            setWhiteboardData({ 
              roomUUID: uuid, 
              roomToken: roomToken 
            });
          } else {
            console.error("Whiteboard: Backend returned invalid room data. Raw response:", res);
          }
        } catch (err) {
          console.error("Failed to create whiteboard room via backend:", err);
        }
      }
    };

    if (isInClass && user.role === 2) {
      if (showWhiteboard) {
        setupWhiteboard();
      }

      // Periodic broadcast of whiteboard and PDF data to students
      interval = setInterval(() => {
        if (clientRef.current && streamId !== null) {
          const encoder = new TextEncoder();
          
          // Whiteboard Sync
          if (whiteboardData) {
            const wbMsg = JSON.stringify({ 
              type: 'whiteboard_sync', 
              appId: (import.meta as any).env.VITE_WHITEBOARD_APP_ID,
              roomUUID: whiteboardData.roomUUID,
              roomToken: whiteboardData.roomToken,
              visible: showWhiteboard
            });
            clientRef.current.sendStreamMessage(streamId, encoder.encode(wbMsg)).catch((e: any) => {
              console.warn("Agora: Failed to send wb broadcast", e);
            });
          }

          // PDF Sync
          const pdfMsg = JSON.stringify({
            type: 'pdf_sync',
            activeMaterial,
            currentPage
          });
          clientRef.current.sendStreamMessage(streamId, encoder.encode(pdfMsg)).catch((e: any) => {
            console.warn("Agora: Failed to send pdf broadcast", e);
          });
        }
      }, 2000); // Increased frequency to 2s
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInClass, user.role, whiteboardData, streamId, showWhiteboard, activeMaterial, currentPage]);

  // Teacher: Immediate broadcast when PDF, Page or Whiteboard visibility changes
  useEffect(() => {
    if (isInClass && user.role === 2 && clientRef.current && streamId !== null) {
      const encoder = new TextEncoder();
      
      // Sync Whiteboard State
      if (whiteboardData) {
        const wbMsg = JSON.stringify({ 
          type: 'whiteboard_sync', 
          appId: (import.meta as any).env.VITE_WHITEBOARD_APP_ID,
          roomUUID: whiteboardData.roomUUID,
          roomToken: whiteboardData.roomToken,
          visible: showWhiteboard
        });
        clientRef.current.sendStreamMessage(streamId, encoder.encode(wbMsg)).catch((e: any) => {
          console.warn("Agora: Failed to send immediate wb broadcast", e);
        });
      }

      // Sync PDF State
      const pdfMsg = JSON.stringify({
        type: 'pdf_sync',
        activeMaterial,
        currentPage
      });
      clientRef.current.sendStreamMessage(streamId, encoder.encode(pdfMsg)).catch((e: any) => {
        console.warn("Agora: Failed to send immediate pdf broadcast", e);
      });
    }
  }, [activeMaterial, currentPage, showWhiteboard, isInClass, user.role, streamId, whiteboardData]);

  const handleJoinClass = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Teachers start a class, students join an existing one
      const res = user.role === 2 
        ? await apiService.startClass()
        : await apiService.joinClass();
        
      console.log("Join/Start Class API call result:", res);
      
      const anyRes = res as any;
      const connectionData = anyRes.data || (anyRes.app_id ? anyRes : null);
      
      if (connectionData && (connectionData.app_id || connectionData.appId || connectionData.channel_name)) {
        await initAgora(connectionData);
      } else {
        const errorMsg = anyRes.message || anyRes.error || anyRes.data?.message;
        setError(errorMsg || "Classroom details not found. The class might not be active yet.");
      }
    } catch (err: any) {
      console.error("Join Class error:", err);
      setError("Failed to connect: " + (err.message || "Check your internet connection"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    try {
      localTracks.audio?.close();
      localTracks.video?.close();
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current.close();
        screenTrackRef.current = null;
      }
      await clientRef.current?.leave();
      setIsInClass(false);
      setIsSharingScreen(false);
      setWhiteboardData(null);
      setActiveMaterial(null);
      setShowWhiteboard(false);
      onExit();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndClass = async () => {
    if (!connectionData) return;
    try {
      await apiService.endClass(connectionData.classroom_id);
      await handleLeave();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMic = async () => {
    if (localTracks.audio) {
      const newState = !isMuted;
      await localTracks.audio.setEnabled(!newState);
      setIsMuted(newState);
    }
  };

  const toggleCam = async () => {
    if (localTracks.video) {
      const newState = !isCamOff;
      await localTracks.video.setEnabled(!newState);
      setIsCamOff(newState);
    }
  };

  const toggleScreenShare = async () => {
    if (!isInClass || !clientRef.current) return;
    const client = clientRef.current;

    if (isSharingScreen) {
      try {
        if (screenTrackRef.current) {
          await client.unpublish(screenTrackRef.current);
          screenTrackRef.current.stop();
          screenTrackRef.current.close();
          screenTrackRef.current = null;
        }
        if (localTracks.video) {
          await client.publish(localTracks.video);
        }
        setIsSharingScreen(false);
      } catch (err) {
        console.error("Stop screen share error", err);
      }
    } else {
      try {
        const screenResult = await AgoraRTC.createScreenVideoTrack({
          encoderConfig: "1080p_1",
          optimizationMode: "detail",
        });
        
        const screenTrack = Array.isArray(screenResult) ? screenResult[0] : screenResult;

        screenTrack.on("track-ended", () => {
          handleStopScreenShareInternal();
        });

        if (localTracks.video) {
          await client.unpublish(localTracks.video).catch(() => {});
        }

        await client.publish(screenTrack);
        screenTrackRef.current = screenTrack;
        setIsSharingScreen(true);
      } catch (err) {
        console.error("Start screen share error", err);
        if (localTracks.video) {
          await client.publish(localTracks.video).catch(() => {});
        }
      }
    }
  };

  const handleStopScreenShareInternal = async () => {
    if (!clientRef.current) return;
    const client = clientRef.current;
    
    if (screenTrackRef.current) {
      await client.unpublish(screenTrackRef.current).catch(() => {});
      screenTrackRef.current.stop();
      screenTrackRef.current.close();
      screenTrackRef.current = null;
    }
    
    if (localTracks.video) {
      await client.publish(localTracks.video).catch(() => {});
    }
    
    setIsSharingScreen(false);
  };

  if (!isInClass) {
    return (
      <div className="fixed inset-0 z-[100] w-screen h-screen bg-slate-950 flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-purple/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-indigo/20 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl w-full bg-slate-900/80 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 p-8 sm:p-12 flex flex-col items-center relative z-10 shadow-2xl"
        >
          {/* Preview Section */}
          <div className="w-full flex flex-col md:flex-row gap-10 items-center justify-center mb-10">
            {/* Camera Preview */}
            <div className="w-full md:w-1/2 aspect-video bg-slate-800 rounded-[2.5rem] overflow-hidden border-2 border-white/5 relative group shadow-2xl">
              <div ref={previewRef} className={cn("absolute inset-0 w-full h-full object-cover mirror-mode transition-opacity", isCamOff ? "opacity-0" : "opacity-100")} />
              
              <AnimatePresence>
                {isCamOff && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-800/80 backdrop-blur-sm"
                  >
                    <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-400">
                      <VideoOff size={40} />
                    </div>
                    <p className="text-slate-500 font-black text-xs uppercase tracking-[0.2em]">Camera is Off</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Audio Indicator Overlay */}
              <div className="absolute bottom-6 left-6 flex items-end gap-1 px-4 py-3 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 h-14">
                {isMuted ? (
                  <MicOff className="text-red-500 mb-0.5" size={16} />
                ) : (
                  <div className="flex items-end gap-1 h-full min-w-[24px]">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          height: audioLevel > (i * 15) ? `${Math.min(100, Math.max(20, audioLevel - (i * 5)))}%` : "20%" 
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="w-1 bg-brand-purple rounded-full origin-bottom"
                      />
                    ))}
                  </div>
                )}
                <span className="text-[10px] font-black text-white uppercase tracking-widest ml-2 mb-0.5">
                  {isMuted ? 'Muted' : 'Voice Active'}
                </span>
              </div>
            </div>

            {/* Info & CTA */}
            <div className="w-full md:w-1/2 text-center md:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple/10 rounded-full border border-brand-purple/20 mb-2">
                <Sparkles className="text-brand-purple" size={14} />
                <span className="text-[10px] font-black text-brand-purple uppercase tracking-widest">Pre-Meeting Check</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Ready to <span className="text-transparent bg-clip-text bloom-gradient">Bloom?</span>
              </h1>
              
              <p className="text-slate-400 text-lg font-medium leading-relaxed">
                Check your equipment before joining {user.role === 2 ? 'your classroom' : 'the magical adventure'}.
              </p>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-500 mb-6"
                  >
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-sm font-bold">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                <button
                  onClick={() => setIsMuted(prev => !prev)}
                  className={cn(
                    "w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all border-2",
                    isMuted 
                      ? "bg-red-500/10 border-red-500/50 text-red-500" 
                      : "bg-slate-800/50 border-white/10 text-white hover:bg-slate-800"
                  )}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
                </button>
                <button
                  onClick={() => setIsCamOff(prev => !prev)}
                  className={cn(
                    "w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all border-2",
                    isCamOff 
                      ? "bg-red-500/10 border-red-500/50 text-red-500" 
                      : "bg-slate-800/50 border-white/10 text-white hover:bg-slate-800"
                )}
                title={isCamOff ? "Turn Camera On" : "Turn Camera Off"}
              >
                {isCamOff ? <VideoOff size={28} /> : <Video size={28} />}
              </button>

              <button
                onClick={handleJoinClass}
                disabled={isLoading}
                className="flex-1 min-w-[200px] h-16 group relative flex items-center justify-center gap-4 bg-brand-purple rounded-[1.5rem] transition-all hover:scale-[1.02] active:scale-98 disabled:opacity-50 overflow-hidden shadow-2xl shadow-purple-500/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                {isLoading ? <Loader2 className="animate-spin text-white" size={24} /> : <Sparkles className="text-white" size={24} />}
                <span className="text-white font-black text-lg tracking-widest uppercase">Join Class</span>
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={onExit}
            className="text-slate-500 font-black text-xs uppercase tracking-[0.3em] hover:text-white transition-colors py-2 px-4 rounded-full border border-transparent hover:border-white/10 hover:bg-white/5"
          >
            Leave Terminal
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] w-screen h-screen bg-slate-950 flex flex-col overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <nav className="h-16 bg-slate-900 border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bloom-gradient rounded-lg flex items-center justify-center text-white font-bold border border-white/10 shadow-lg">M</div>
          <span className="text-white font-black text-sm tracking-[0.2em] uppercase">Meta Class</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 bg-white/5 rounded-full border border-white/5 mr-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Session</span>
          </div>
          
          {user.role === 2 && (
            <>
              <button 
                onClick={() => setShowMaterialManager(true)}
                className="px-6 py-2 bg-brand-indigo text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-full hover:bg-brand-indigo-dark transition-all shadow-lg active:scale-95 flex items-center gap-2"
              >
                <Monitor size={14} />
                Resources
              </button>
              <button 
                onClick={toggleScreenShare}
                className={cn(
                  "px-6 py-2 font-black text-[10px] uppercase tracking-[0.2em] rounded-full transition-all shadow-lg active:scale-95 flex items-center gap-2",
                  isSharingScreen 
                    ? "bg-amber-500 text-white" 
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                )}
              >
                <Monitor size={14} />
                {isSharingScreen ? 'Stop Sharing' : 'Share Screen'}
              </button>
              <button 
                onClick={() => setShowWhiteboard(prev => !prev)}
                className={cn(
                  "px-6 py-2 font-black text-[10px] uppercase tracking-[0.2em] rounded-full transition-all shadow-lg active:scale-95 flex items-center gap-2",
                  showWhiteboard 
                    ? "bg-brand-purple text-white" 
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                )}
              >
                <Pencil size={14} />
                {showWhiteboard ? 'Hide Board' : 'Whiteboard'}
              </button>
              <button 
                onClick={handleEndClass}
                className="px-6 py-2 bg-red-600/20 text-red-500 border border-red-500/30 font-black text-[10px] uppercase tracking-[0.2em] rounded-full hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95"
              >
                End Class
              </button>
            </>
          )}

          <button 
            onClick={handleLeave}
            className="px-6 py-2 bg-slate-800 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-full hover:bg-slate-700 transition-all shadow-lg active:scale-95"
          >
            Exit
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {showMaterialManager && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-slate-950 rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <MaterialManager 
                classroomId={connectionData?.classroom_id}
                onClose={() => setShowMaterialManager(false)}
                onActivate={(material) => {
                  setActiveMaterial(material);
                  setCurrentPage(1);
                  setShowWhiteboard(true);
                  // Message will be broadcast in next interval
                }}
                onDeactivate={() => {
                  setActiveMaterial(null);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Classroom Area */}
      <div className="flex-1 p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden">
        
        {/* Left Side: Big Screen (Whiteboard or PDF) */}
        <div className="flex-[3] relative min-h-[300px]">
          <AnimatePresence mode="wait">
            {showWhiteboard ? (
              <motion.div
                key="whiteboard-stage"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full h-full"
              >
                {whiteboardData ? (
                  <Whiteboard 
                    appId={whiteboardData.appId || (import.meta as any).env.VITE_WHITEBOARD_APP_ID}
                    roomUUID={whiteboardData.roomUUID}
                    roomToken={whiteboardData.roomToken}
                    uid={String(user.id)}
                    userName={user.firstName}
                    isTeacher={user.role === 2}
                    pdfUrl={activeMaterial ? (activeMaterial.file_path ? `/backend/public/classroom_materials/${activeMaterial.file_path}` : activeMaterial.file_url?.replace('https://academy.bloom-buddies.fr', '')) : undefined}
                    currentPage={currentPage}
                    onPageChange={(page) => {
                      if (user.role === 2) {
                        setCurrentPage(page);
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-[3rem] bg-slate-900 border-4 border-dashed border-white/5 flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple mb-6">
                      <Pencil size={40} />
                    </div>
                    <h4 className="text-xl font-black text-white uppercase tracking-widest mb-4">Whiteboard Not Ready</h4>
                    <p className="text-slate-500 text-sm max-w-sm">
                      {user.role === 2 
                        ? "The classroom service didn't provide whiteboard credentials. Please ensure Whiteboard is enabled in your Agora dashboard."
                        : "Waiting for the teacher to activate the whiteboard..."}
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="no-content-stage"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full rounded-[3rem] bg-slate-900/50 border-4 border-dashed border-white/5 flex flex-col items-center justify-center p-12 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-brand-indigo/10 flex items-center justify-center text-brand-indigo mb-6">
                  <Monitor size={40} />
                </div>
                <h4 className="text-xl font-black text-white uppercase tracking-widest mb-4">Classroom Content Area</h4>
                <p className="text-slate-500 text-sm max-w-sm font-medium">
                  {user.role === 2 
                    ? "Click 'Whiteboard' or 'Resources' to start sharing materials with your student."
                    : "Waiting for the teacher to share learning materials or activate the whiteboard..."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Cameras Stack */}
        <div className="flex-1 max-w-sm flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          {/* TEACHER CAMERA (ALWAYS TOP) */}
          {user.role === 2 ? (
            <VideoTile 
              key="local-teacher"
              uid={connectionData?.uid || 'host'}
              videoTrack={isSharingScreen ? screenTrackRef.current : localTracks.video}
              audioTrack={localTracks.audio}
              isLocal={true}
              name={user.firstName}
              hasVideo={!isCamOff || isSharingScreen}
              hasAudio={!isMuted}
              role="host"
              isScreen={isSharingScreen}
              onToggleMic={toggleMic}
              onToggleCam={toggleCam}
              isMuted={isMuted}
              isCamOff={isCamOff}
            />
          ) : (
            remoteUsers.length > 0 ? (
              <VideoTile 
                key={remoteUsers[0].uid}
                uid={remoteUsers[0].uid}
                videoTrack={remoteUsers[0].videoTrack}
                audioTrack={remoteUsers[0].audioTrack}
                name="Teacher"
                hasVideo={!!remoteUsers[0].videoTrack}
                hasAudio={!!remoteUsers[0].audioTrack}
                role="host"
              />
            ) : (
              <div className="aspect-video bg-slate-900 rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                  <VideoOff size={20} />
                </div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Waiting for Teacher</p>
              </div>
            )
          )}

          {/* STUDENT CAMERA(S) (BOTTOM) */}
          {user.role === 2 ? (
            remoteUsers.length > 0 ? (
              remoteUsers.map(remoteUser => (
                <VideoTile 
                  key={remoteUser.uid}
                  uid={remoteUser.uid}
                  videoTrack={remoteUser.videoTrack}
                  audioTrack={remoteUser.audioTrack}
                  hasVideo={!!remoteUser.videoTrack}
                  hasAudio={!!remoteUser.audioTrack}
                  role="audience"
                  name="Student"
                />
              ))
            ) : (
              <div className="aspect-video bg-slate-900 rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                  <VideoOff size={20} />
                </div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Waiting for Student</p>
              </div>
            )
          ) : (
            <VideoTile 
              key="local-student"
              uid={connectionData?.uid || 'me'}
              videoTrack={localTracks.video}
              audioTrack={localTracks.audio}
              isLocal={true}
              name={user.firstName}
              hasVideo={!isCamOff}
              hasAudio={!isMuted}
              role="audience"
              onToggleMic={toggleMic}
              onToggleCam={toggleCam}
              isMuted={isMuted}
              isCamOff={isCamOff}
            />
          )}
        </div>
      </div>
    </div>
  );
};
