import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import AgoraRTC, { 
  IAgoraRTCClient, 
  ILocalVideoTrack, 
  ILocalAudioTrack, 
  IAgoraRTCRemoteUser 
} from 'agora-rtc-sdk-ng';

// Disable Agora SDK logging
AgoraRTC.setLogLevel(4);

import { Sparkles, Loader2, AlertCircle, Mic, MicOff, Video, VideoOff, Monitor, MonitorPlay, Pencil, BookOpen, X, RefreshCw, Star } from 'lucide-react';
import { ClassroomConnection, AgoraParticipant, User } from '@/src/types';
import { apiService } from '@/src/services/apiService';
import { BASE_URL, SITE_ROOT, getFileUrl } from '@/src/lib/config';
import { VideoTile } from './VideoTile';
import { Whiteboard } from './Whiteboard';
import { VoiceTimeline } from './VoiceTimeline';
import { MaterialManager } from './MaterialManager';
import { Controls } from './Controls';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { BadgeReward, Badge } from '../BadgeReward';
import { ChatPanel, ChatMessage } from '../ChatPanel';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { MessageSquare } from 'lucide-react';
import { useLanguage } from '@/src/context/LanguageContext';

interface ClassroomProps {
  user: User;
  onExit: () => void;
}

export type ClassroomMode = 'whiteboard' | 'pdf' | 'none';

export const Classroom: React.FC<ClassroomProps> = ({ user, onExit }) => {
  const { t, language, setLanguage } = useLanguage();
  const location = useLocation();
  const { channelName } = useParams<{ channelName: string }>();
  const [isInClass, setIsInClass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Classroom Mode
  const [classroomMode, setClassroomMode] = useState<ClassroomMode>('whiteboard');

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
  const [isWhiteboardLoading, setIsWhiteboardLoading] = useState(false);
  const [whiteboardSetupError, setWhiteboardSetupError] = useState<string | null>(null);
  const [whiteboardData, setWhiteboardData] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('whiteboard_data');
      if (!saved || saved === 'undefined') return null;
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [audioLevel, setAudioLevel] = useState(0);

  const whiteboardDataRef = useRef<any>(whiteboardData);
  const showWhiteboardRef = useRef(false);
  const lastBackendModeRef = useRef<ClassroomMode | null>(null);

  const updateWhiteboardData = (data: any) => {
    // console.log('[Classroom] updateWhiteboardData called with:', data ? { uuid: data.roomUUID } : 'null');
    whiteboardDataRef.current = data;
    setWhiteboardData(data);
    if (typeof window !== 'undefined') {
      if (data) {
        localStorage.setItem('whiteboard_data', JSON.stringify(data));
      } else {
        localStorage.removeItem('whiteboard_data');
      }
    }
  };

  const updateShowWhiteboard = (val: boolean) => {
    showWhiteboardRef.current = val;
    setShowWhiteboard(val);
  };

  const [activeMaterial, setActiveMaterial] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('active_material');
      if (!saved || saved === 'undefined') return null;
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Sync activeMaterial to localStorage for teacher
  useEffect(() => {
    if (user.role === 2) {
      if (activeMaterial) {
        localStorage.setItem('active_material', JSON.stringify(activeMaterial));
      } else {
        localStorage.removeItem('active_material');
      }
    }
  }, [activeMaterial, user.role]);
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('current_page');
      return saved ? parseInt(saved, 10) : 1;
    }
    return 1;
  });

  useEffect(() => {
    if (user.role === 2) {
      localStorage.setItem('current_page', String(currentPage));
    }
  }, [currentPage, user.role]);

  const [zoom, setZoom] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zoom_level');
      return saved ? parseFloat(saved) : 1;
    }
    return 1;
  });

  useEffect(() => {
    if (user.role === 2) {
      localStorage.setItem('zoom_level', String(zoom));
    }
  }, [zoom, user.role]);

  const [scrollPosition, setScrollPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scroll_position');
      if (!saved || saved === 'undefined') return { x: 0, y: 0 };
      try {
        return JSON.parse(saved);
      } catch (e) {
        return { x: 0, y: 0 };
      }
    }
    return { x: 0, y: 0 };
  });

  useEffect(() => {
    if (user.role === 2) {
      if (scrollPosition) {
        localStorage.setItem('scroll_position', JSON.stringify(scrollPosition));
      } else {
        localStorage.removeItem('scroll_position');
      }
    }
  }, [scrollPosition, user.role]);
  const [isAnnotationsLocked, setIsAnnotationsLocked] = useState(false);
  const [showMaterialManager, setShowMaterialManager] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [isChatUploading, setIsChatUploading] = useState(false);
  const [chatUploadProgress, setChatUploadProgress] = useState(0);

  const toggleChat = () => {
    const newState = !showChat;
    setShowChat(newState);
    
    // Sync to student if teacher
    if (user.role === 2 && isRTMReady && rtmChannelRef.current) {
      rtmChannelRef.current.sendMessage({
        text: JSON.stringify({ type: 'chat-toggle', show: newState })
      }).catch((e: any) => console.warn("RTM chat toggle sync failed", e));
    }
  };

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showBadgePicker, setShowBadgePicker] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('earned_badges');
      if (!saved || saved === 'undefined') return [];
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Sync earnedBadges to localStorage
  useEffect(() => {
    if (earnedBadges.length > 0) {
      localStorage.setItem('earned_badges', JSON.stringify(earnedBadges));
    } else {
      localStorage.removeItem('earned_badges');
    }
  }, [earnedBadges]);

  // Sync showChat to unread count
  useEffect(() => {
    if (showChat) setUnreadCount(0);
  }, [showChat]);
  // Holds the clearAllAnnotationsForMaterial callback registered by <Whiteboard>
  const clearAnnotationsRef = useRef<((mId: number | string) => void) | null>(null);
  const screenTrackRef = useRef<any>(null);
  const [isRTMReady, setIsRTMReady] = useState(false);
  const rtmClientRef = useRef<any>(null);
  const rtmChannelRef = useRef<any>(null);

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
          // 

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
      const rawTokenStr = String(rawToken);
      const token = rawTokenStr ? rawTokenStr.replace(/\\\//g, '/') : null;
      const uid = Number(payload.uid) || 0;

      if (!clientRef.current) {
        clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      }
      const client = clientRef.current;
      // 


      // Clear existing listeners to prevent duplicates
      client.removeAllListeners('user-joined');
      client.on('user-joined', (user) => {
        // 

        if (!remoteUsersRef.current.find(u => u.uid === user.uid)) {
          remoteUsersRef.current = [...remoteUsersRef.current, user];
          setRemoteUsers([...remoteUsersRef.current]);
        }
      });

      client.removeAllListeners('user-published');
      client.on('user-published', async (user, mediaType) => {
        // 

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

      client.removeAllListeners('user-unpublished');
      client.on('user-unpublished', (user, mediaType) => {
        // 

        setRemoteUsers([...remoteUsersRef.current]);
      });

      client.removeAllListeners('user-left');
      client.on('user-left', (user) => {
        // 

        remoteUsersRef.current = remoteUsersRef.current.filter(u => u.uid !== user.uid);
        setRemoteUsers([...remoteUsersRef.current]);
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
        // 


        // Sync with state AFTER publishing to avoid TRACK_IS_DISABLED error
        if (isMuted) await audioTrack.setEnabled(false);
        if (isCamOff) await videoTrack.setEnabled(false);
        
      } catch (mediaErr) {
        // 

      }

      await initRTM(channelName);
      setIsInClass(true);
      setConnectionData(payload);

      // Startup once: Notify backend that whiteboard/class session is active
      fetch(`${BASE_URL}classrooms/start-whiteboard`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          channel_name: channelName,
        })
      }).catch(() => {});

      // Change 2 — Load chat history on join
      try {
        let classroomId = payload.classroom_id;
        const historyRes = await fetch(`${BASE_URL}chat/messages?classroom_id=${classroomId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Accept': 'application/json',
          }
        });
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          if (historyData.data && historyData.data.length > 0) {
            const mapped = historyData.data.map((m: any) => ({
              type: 'chat',
              id: m.client_id,
              senderId: m.sender_id,
              senderName: m.sender_name,
              senderRole: m.sender_role,
              text: m.text || '',
              attachmentUrl: m.attachment_url,
              attachmentName: m.attachment_name,
              emoji: null,
              timestamp: m.created_at,
            }));
            setChatMessages(mapped);
          }
        }
      } catch (e) {}

      const wbAppId = (import.meta as any).env.VITE_WHITEBOARD_APP_ID;
      const uuid = payload.whiteboard_room_uuid || payload.whiteboard_uuid || payload.uuid || payload.room_uuid;
      const roomToken = payload.whiteboard_room_token || payload.whiteboard_token || payload.room_token || payload.roomToken || payload.token;

      if (uuid && roomToken) {
        // console.log('[Classroom] initAgora — found whiteboard data in payload, updating...');
        updateWhiteboardData({
          appId: wbAppId,
          roomUUID: uuid,
          roomToken: roomToken,
        });
        // console.log('[Classroom] whiteboard from startClass — appId:', wbAppId, '| uuid:', uuid);
      } else if (user.role === 2) {
        // Teacher handles their own whiteboard initialization via setupWhiteboard()
        // We only clear if we specifically want to reset, but not every time initAgora runs.
        // console.log('[Classroom] initAgora — teacher role, skipping auto-clear of whiteboard');
      } else {
        // console.log('[Classroom] initAgora — no whiteboard data in payload, clearing for student...');
        updateWhiteboardData(null);
      }
    } catch (err: any) {
      // 

      setError("Video connection failed. Please check camera permissions.");
    }
  };

  const initRTM = async (channelName: string) => {
    try {
      setIsRTMReady(false);
      const AgoraRTM = (await import('agora-rtm-sdk')).default;
      const appId = '754aa406b558496dbb87044f1550de44';
      
      const res = await fetch(`${BASE_URL}classroom/rtm-token`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Accept': 'application/json'
        }
      });
      const { token, uid: rtmUid } = await res.json();

      // @ts-ignore
      const rtmClient = AgoraRTM.createInstance(appId, { logFilter: (AgoraRTM as any).LOG_FILTER_OFF || 0 });

      await rtmClient.login({ uid: String(rtmUid), token });

      const channel = rtmClient.createChannel(channelName + '_sync');
      await channel.join();

      rtmClientRef.current = rtmClient;
      rtmChannelRef.current = channel;
      setIsRTMReady(true);

      // Listen for incoming sync messages
      channel.on('ChannelMessage', (message) => {
        try {
          if (message.messageType !== 'TEXT' || !message.text || message.text === 'undefined') return;
          const msg = JSON.parse(message.text);
          if (msg.type === 'sync' && user.role !== 2) {
            if (msg.page !== undefined) setCurrentPage(msg.page);
            if (msg.zoom !== undefined) setZoom(msg.zoom);
            if (msg.scrollPosition !== undefined) setScrollPosition(msg.scrollPosition);
            if (msg.mode !== undefined) {
              setClassroomMode(msg.mode);
              lastBackendModeRef.current = msg.mode;
            }
            if (msg.material !== undefined) {
              setActiveMaterial(msg.material);
              if (msg.material) updateShowWhiteboard(true);
            }
            if (msg.isLocked !== undefined) setIsAnnotationsLocked(msg.isLocked);
          } else if (msg.type === 'class-ended') {
            // 

            handleLeave();
          } else if (msg.type === 'badge' && user.role !== 2) {
            // This is handled inside BadgeReward via the rtmChannelRef directly
            // No changes needed here — BadgeReward attaches its own listener
          } else if (msg.type === 'chat') {
            setChatMessages(prev => {
              if (prev.find(m => m.id === msg.id)) return prev;
              const newMsgs = [...prev, msg];
              return newMsgs;
            });
            // Update unread count if chat is hidden
            setUnreadCount(prev => {
              return document.getElementById('chat-panel-container') ? prev : prev + 1;
            });
          } else if (msg.type === 'chat-toggle' && user.role !== 2) {
            setShowChat(msg.show);
          }
        } catch(e) {}
      });
    } catch (e) {
      // 

    }
  };



  // Student polling: auto-detect when teacher starts whiteboard
  useEffect(() => {
    if (user.role === 2 || !isInClass) return;

    const poll = async () => {
      try {
        const token = localStorage.getItem('auth_token') || '';
        
        const res = await fetch(`${BASE_URL}classroom/whiteboard-status?channel_name=${channelName}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });

        if (!res.ok) return;
        const data = await res.json();
        // 


        const extractCreds = (d: any) => {
          const uuid = d.uuid || d.whiteboard_uuid || d.whiteboard_room_uuid || d.room_uuid || d.roomUuid || d.room_id;
          const token = d.room_token || d.whiteboard_token || d.whiteboard_room_token || d.token || d.roomToken || d.whiteboard_room_token;
          return { uuid, token };
        };

        const creds = extractCreds(data);

        if (data.active && creds.uuid && creds.token) {
          const { uuid, token: roomToken } = creds;

          // Only update whiteboard credentials if uuid actually changed
          // This prevents the Whiteboard component from unmounting and remounting
          setWhiteboardData((prev: any) => {
            if (prev?.roomUUID === uuid) return prev;
            return {
              roomUUID: uuid,
              roomToken: roomToken,
              appId: (import.meta as any).env.VITE_WHITEBOARD_APP_ID,
            };
          });

          // Sync mode and material
          if (data.active_material) {
            setActiveMaterial((prev: any) => {
              if (prev?.id === data.active_material.id) return prev;
              return data.active_material;
            });
            const backendMode = 'pdf';
            if (lastBackendModeRef.current !== backendMode) {
              setClassroomMode(backendMode);
              lastBackendModeRef.current = backendMode;
            }
          } else {
            setActiveMaterial(null);
            const backendMode = 'whiteboard';
            if (lastBackendModeRef.current !== backendMode) {
              setClassroomMode(backendMode);
              lastBackendModeRef.current = backendMode;
            }
          }

          setShowWhiteboard(true);

          // Sync the current page teacher is on
          if (data.current_page) {
            setCurrentPage((prev: any) => {
              if (prev === data.current_page) return prev;
              return data.current_page;
            });
          }
          
          if (!isRTMReady && data.is_annotations_locked !== undefined) {
            setIsAnnotationsLocked(!!data.is_annotations_locked);
          }

        } else {
          // Whiteboard not active
          setShowWhiteboard(false);
          setActiveMaterial(null);
          const backendMode = 'none';
          if (lastBackendModeRef.current !== backendMode) {
            setClassroomMode(backendMode);
            lastBackendModeRef.current = backendMode;
          }
        }

      } catch(e) {
        // 

      }
    };

    poll(); // run immediately when student joins
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);

  }, [isInClass, user.role]);

  // Teacher side: sync active material and page to backend for student polling
  useEffect(() => {
    if (user.role !== 2 || !isInClass || !connectionData?.channel_name) return;

    const token = localStorage.getItem('auth_token') || '';

    fetch(`${BASE_URL}classroom/sync-material`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        channel_name: connectionData.channel_name,
        material_id: classroomMode === 'pdf' ? (activeMaterial?.id ?? null) : null,
        current_page: currentPage,
        is_whiteboard_active: classroomMode !== 'none',
        is_annotations_locked: isAnnotationsLocked
      })
    }).catch(e => {});

    if (isRTMReady && rtmChannelRef.current) {
      rtmChannelRef.current.sendMessage({
        text: JSON.stringify({ 
          type: 'sync', 
          mode: classroomMode, 
          material: classroomMode === 'pdf' ? activeMaterial : null, 
          page: currentPage,
          zoom: zoom,
          scrollPosition: scrollPosition,
          isLocked: isAnnotationsLocked
        })
      }).catch((e: any) => {});
    }

  }, [activeMaterial, currentPage, zoom, scrollPosition, classroomMode, isInClass, user.role, connectionData?.channel_name, isRTMReady, isAnnotationsLocked]);

  // Handle classroom mode changes
  useEffect(() => {
    if (classroomMode === 'whiteboard') {
      updateShowWhiteboard(true);
      setZoom(1);
      // We keep activeMaterial in state so it persists when switching back to PDF
    } else if (classroomMode === 'pdf') {
      updateShowWhiteboard(true);
      // Only open manager if no material is active
      if (!activeMaterial && user.role === 2) {
        setShowMaterialManager(true);
      }
    } else {
      updateShowWhiteboard(false);
      // When mode is set to 'none', we might want to keep the material as well 
      // so it's there when they re-open boards.
    }
  }, [classroomMode]);

  const setupWhiteboard = React.useCallback(async (forceRefresh = false) => {
    if (!isInClass || user.role !== 2 || !showWhiteboardRef.current) return;
    
    // If we already have data and it's valid, don't re-initialize unless forced
    if (whiteboardDataRef.current && !forceRefresh) {
      //  console.log('[WB] setupWhiteboard — already initialized, skipping.');
       return;
    }

    if (!forceRefresh) {
      const savedData = localStorage.getItem('whiteboard_data');
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          if (data.roomUUID && data.roomToken) {
            updateWhiteboardData(data);
            // console.log('[WB] setupWhiteboard — restored from localStorage');
            return;
          }
        } catch (e) {
          localStorage.removeItem('whiteboard_data');
        }
      }
    }

    // No saved room — request one from backend
    setIsWhiteboardLoading(true);
    setWhiteboardSetupError(null);
    try {
      // console.log('[WB] setupWhiteboard — calling start-whiteboard API...');
      const res = await apiService.startWhiteboardSession(channelName || '');
      // console.log('[WB] setupWhiteboard — API Response:', res);
      
      const data = (res as any).data || res;
      const wbAppId = (import.meta as any).env.VITE_WHITEBOARD_APP_ID;
      const uuid = data.uuid || data.whiteboard_room_uuid || data.whiteboard_uuid || data.room_uuid;
      const roomToken = data.room_token || data.roomToken || data.whiteboard_room_token || data.whiteboard_token || data.token;
      
      if (uuid && roomToken) {
        updateWhiteboardData({ appId: wbAppId, roomUUID: uuid, roomToken });
        // console.log('[WB] setupWhiteboard — SUCCESS:', { uuid, roomToken: '***' });
      } else {
        const errorMsg = (res as any).message || 'Invalid response from server (missing UUID/Token)';
        // console.warn('[WB] setupWhiteboard — FAILED:', errorMsg, data);
        setWhiteboardSetupError(errorMsg);
      }
    } catch (err: any) {
      // console.error('[WB] setupWhiteboard — EXCEPTION:', err);
      setWhiteboardSetupError(err?.message || 'Connection failed');
    } finally {
      setIsWhiteboardLoading(false);
    }
  }, [isInClass, user.role, channelName]);

  // Teacher: create a fresh whiteboard room when board is opened and none exists.
  useEffect(() => {
    if (isInClass && user.role === 2) {
      if (showWhiteboard) {
        setupWhiteboard();
      }
    }
  }, [isInClass, user.role, showWhiteboard, setupWhiteboard]);

  const handleJoinClass = async () => {
    setIsLoading(true);
    setError(null);



    try {
      // Teachers start a class, students join an existing one
      const res = user.role === 2 
        ? await apiService.startClass(channelName)
        : await apiService.joinClass(channelName);
        
      // 

      
      const anyRes = res as any;
      const connectionData = anyRes.data || (anyRes.app_id ? anyRes : null);
      
      if (connectionData && (connectionData.app_id || connectionData.appId || connectionData.channel_name)) {
        await initAgora(connectionData);
      } else {
        const errorMsg = anyRes.message || anyRes.error || anyRes.data?.message;
        setError(errorMsg || "Classroom details not found. The class might not be active yet.");
      }
      if(language === 'fr') {
        setLanguage('en');
        window.localStorage.setItem('language', 'en');
      } 
    } catch (err: any) {
      // 

      setError("Failed to connect: " + (err.message || "Check your internet connection"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    try {
      setIsRTMReady(false);
      if (rtmChannelRef.current) {
        await rtmChannelRef.current.leave().catch(() => {});
      }
      if (rtmClientRef.current) {
        await rtmClientRef.current.logout().catch(() => {});
      }
      rtmChannelRef.current = null;
      rtmClientRef.current = null;
      
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
      setChatMessages([]); // Change 4 — Clear messages on leave
      // Clear state only — localStorage.whiteboard_data is intentionally kept
      // so the same Netless room is reused next class and annotations persist.
      whiteboardDataRef.current = null;
      setWhiteboardData(null);
      setActiveMaterial(null);
      updateShowWhiteboard(false);
      onExit();
    } catch (err) {
      // 

    }
  };

  const handleEndClass = async () => {
    try {
      // Send signal to others
      if (isRTMReady && rtmChannelRef.current) {
        await rtmChannelRef.current.sendMessage({
          text: JSON.stringify({ type: 'class-ended' })
        }).catch(() => {});
      }

      if (connectionData) {
        await apiService.endClass(connectionData.classroom_id);
      }
      await handleLeave();
    } catch (err) {
      // 

      // Fallback: leave anyway
      await handleLeave();
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

  const handleSendMessage = async (text: string, file?: File | null) => {
    let attachmentUrl = null;
    let attachmentName = null;

    if (file) {
      try {
        setIsChatUploading(true);
        setChatUploadProgress(0);
        
        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        const token = localStorage.getItem('auth_token');

        const uploadPromise = new Promise((resolve, reject) => {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setChatUploadProgress(percent);
            }
          });

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error('Upload failed'));
            }
          };

          xhr.onerror = () => reject(new Error('Network error'));
          
          xhr.open('POST', `${BASE_URL}chat/upload`);
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          xhr.send(formData);
        });

        const data: any = await uploadPromise;
        attachmentUrl = data.url;
        attachmentName = data.name;
      } catch (e) {
        console.error("File upload error", e);
      } finally {
        setIsChatUploading(false);
        setChatUploadProgress(0);
      }
    }

    const newMessage: ChatMessage = {
      type: 'chat',
      id: crypto.randomUUID(),
      senderId: user.id,
      senderName: user.firstName,
      senderRole: user.role,
      text,
      attachmentUrl,
      attachmentName,
      emoji: null,
      timestamp: new Date().toISOString()
    };

    // Optimistic UI update
    setChatMessages(prev => [...prev, newMessage]);

    // Send via RTM
    if (isRTMReady && rtmChannelRef.current) {
      rtmChannelRef.current.sendMessage({
        text: JSON.stringify(newMessage)
      }).catch((e: any) => console.warn("RTM chat send failed", e));
    }

    // Change 1 — Save sent message to DB (Only sender saves)
    fetch(`${BASE_URL}chat/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id:       newMessage.id,
        text:            newMessage.text,
        attachment_url:  newMessage.attachmentUrl,
        attachment_name: newMessage.attachmentName,
        classroom_id:    connectionData.classroom_id,
      })
    }).catch(() => {});
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
        // 

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
        // 

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
          className="max-w-6xl w-full bg-slate-900/80 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 p-8 sm:p-12 flex flex-col items-center relative z-10 shadow-2xl"
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
                    <p className="text-slate-500 font-black text-xs uppercase tracking-[0.2em]">{t("class.cameraOff")}</p>
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
                  {isMuted ? t("class.muted") : t("class.voiceActive")}
                </span>
              </div>
            </div>

            {/* Info & CTA */}
            <div className="w-full md:w-1/2 text-center md:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple/10 rounded-full border border-brand-purple/20 mb-2">
                <Star className="text-brand-purple" size={14} />
                <span className="text-[10px] font-black text-brand-purple uppercase tracking-widest">
                  {
                    user.role === 2 ?
                    t("class.readytoteach") :
                    t("class.readytolearn")
                  }
                </span>
              </div>
              
              {/* <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {t("class.readyToBloom")} <span className="text-transparent bg-clip-text bloom-gradient">Bloom?</span>
              </h1> */}
              
              <p className="text-slate-400 text-lg font-medium leading-relaxed md:w-2/3">
                {user.role === 2 ? t("class.teachingequipmentverification") : t("class.learningequipmentverification")}
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
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {isLoading ? <Loader2 className="animate-spin text-white" size={24} /> : ""}
                <span className="text-white font-black text-lg tracking-widest">
                  {
                    language === 'en' ?
                    <span className="capitalize">{t("class.enterclass")}</span> :  
                    <span className="">{t("class.enterclass")}</span>  
                  }
                </span>
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={onExit}
            className="font-bold text-xs bg-red-500/5 tracking-[0.2em] text-red-400 opacity-80 transition-colors py-2 px-4 rounded-full border border-red-400 hover:bg-red-400 hover:text-white hover:border-red-400"
          >
            {
              language === 'en' ? <span className="uppercase">{t("class.exitclass")}</span> : <span className="uppercase">{t("class.exitclass")}</span>
            }
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
          <span className="text-white font-black text-sm tracking-[0.2em] uppercase mr-4">{t("class.metaClass")}</span>
          {/* <LanguageSwitcher darkMode /> */}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Live Session badge removed per request */}

          <button
            onClick={toggleChat}
            className={cn(
              "px-5 py-2 font-black text-[10px] uppercase tracking-[0.2em] rounded-full transition-all shadow-lg active:scale-95 flex items-center gap-2 mr-2",
              showChat 
                ? "bg-brand-purple text-white" 
                : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
            )}
          >
            <MessageSquare size={14} />
            {t("class.chat")}
          </button>
          
          {user.role === 2 ? (
            <>
              <button
                onClick={() => setClassroomMode('whiteboard')}
                className={cn(
                  "px-6 py-2 font-black text-[10px] uppercase tracking-[0.2em] rounded-full transition-all shadow-lg active:scale-95 flex items-center gap-2",
                  classroomMode === 'whiteboard'
                    ? "bg-brand-purple text-white"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                )}
              >
                <MonitorPlay size={14} />
                {t("class.whiteboard")}
              </button>

              <button
                onClick={() => {
                  if ( classroomMode === 'pdf') {
                    setShowMaterialManager(true);
                    return;
                  }
                  if (!activeMaterial) {
                    setShowMaterialManager(true);
                    return;
                  }
                  setClassroomMode('pdf');

                  

                  // if (classroomMode === 'pdf' && activeMaterial) {
                  //   // Already in PDF mode with a book — do nothing, already showing
                  //   return;
                  // }
                  // setClassroomMode('pdf');
                  // if (!activeMaterial) {
                  //   // No book selected yet — open picker
                  //   setShowMaterialManager(true);
                  // }
                  // If activeMaterial exists, just switch to pdf mode — book loads automatically
                }}
                className={cn(
                  "px-6 py-2 font-black text-[10px] uppercase tracking-[0.2em] rounded-full transition-all shadow-lg active:scale-95 flex items-center gap-2",
                  classroomMode === 'pdf'
                    ? "bg-brand-indigo text-white"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                )}
              >
                < BookOpen size={14} />
                {t("class.book")}
              </button>

{/* 
              {classroomMode === 'pdf' && activeMaterial && (
                <>
                  <button
                    onClick={() => setShowMaterialManager(true)}
                    className="px-4 py-2 bg-white/10 text-slate-300 border border-white/10 font-black text-[10px] uppercase tracking-[0.2em] rounded-full hover:bg-white/20 hover:text-white transition-all shadow-lg active:scale-95 flex items-center gap-2"
                    title="Change Book"
                  >
                    <RefreshCw size={12} />
                    Change
                  </button>
                </>
              )}
              */}

              {classroomMode !== 'none' && (
                  <button
                    onClick={() => {
                      setClassroomMode('none');
                      if (isRTMReady && rtmChannelRef.current) {
                        rtmChannelRef.current.sendMessage({
                          text: JSON.stringify({ type: 'sync', mode: 'none', material: null })
                        }).catch(() => {});
                      }
                    }}
                    className="px-6 py-2 bg-slate-700/50 text-slate-300 border border-white/10 font-black text-[10px] uppercase tracking-[0.2em] rounded-full hover:bg-slate-600 hover:text-white transition-all shadow-lg active:scale-95 flex items-center gap-2"
                  >
                  <X size={14} />
                  {t("class.hideResource")}
                </button>
              )}

              <button
                onClick={handleEndClass}
                className="px-6 py-2 bg-red-600/20 text-red-500 border border-red-500/30 font-black text-[10px] uppercase tracking-[0.2em] rounded-full hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95"
              >
                {t("class.exitclass")}
              </button>
            </>
          ) : (
            <>
              {!isAnnotationsLocked && (
                <button
                  onClick={() => setClassroomMode('whiteboard')}
                  className={cn(
                    "px-6 py-2 font-black text-[10px] uppercase tracking-[0.2em] rounded-full transition-all shadow-lg active:scale-95 flex items-center gap-2",
                    classroomMode === 'whiteboard'
                      ? "bg-brand-purple text-white"
                      : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                  )}
                >
                  <MonitorPlay size={14} />
                  {t("class.whiteboard")}
                </button>
              )}

              {!isAnnotationsLocked && classroomMode !== 'none' && (
                  <button
                    onClick={() => {
                      setClassroomMode('none');
                    }}
                    className="px-6 py-2 bg-slate-700/50 text-slate-300 border border-white/10 font-black text-[10px] uppercase tracking-[0.2em] rounded-full hover:bg-slate-600 hover:text-white transition-all shadow-lg active:scale-95 flex items-center gap-2"
                  >
                  <X size={14} />
                  {t("class.hideResource")}
                </button>
              )}

              <button
                onClick={handleEndClass}
                className="px-6 py-2 bg-red-600/20 text-red-500 border border-red-500/30 font-black text-[10px] uppercase tracking-[0.2em] rounded-full hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95"
              >
                {t("class.exitclass")}
              </button>
            </>
          )}

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
                  setClassroomMode('pdf');
                  setShowMaterialManager(false);
                  if (isRTMReady && rtmChannelRef.current) {
                    rtmChannelRef.current.sendMessage({
                      text: JSON.stringify({ type: 'sync', page: 1, material, mode: 'pdf' })
                    }).catch((e: any) => {});
                  }
                }}
                onDeactivate={() => {
                  setActiveMaterial(null);
                  setClassroomMode('whiteboard');
                  if (isRTMReady && rtmChannelRef.current) {
                    rtmChannelRef.current.sendMessage({
                      text: JSON.stringify({ type: 'sync', material: null, mode: 'whiteboard' })
                    }).catch((e: any) => {});
                  }
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Classroom Area */}
      {classroomMode === 'none' ? (
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 p-12 overflow-hidden">
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 h-full">
            <div className="w-full max-w-xl aspect-video rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 relative">
              {user.role === 2 ? (
                <VideoTile 
                  key="local-teacher-centered"
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
                  isLarge={true}
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
                    isLarge={true}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-500/30">
                      <VideoOff size={24} />
                    </div>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest">{t("class.waitingForTeacher")}</p>
                  </div>
                )
              )}
            </div>

            <AnimatePresence>
              {showChat && (
                <div id="chat-panel-container" className="h-full shrink-0 z-20">
                  <ChatPanel 
                    messages={chatMessages}
                    currentUserId={user.id}
                    currentUserName={user.firstName}
                    currentUserRole={user.role}
                    isRTMReady={isRTMReady}
                    onSendMessage={handleSendMessage}
                    onClose={toggleChat}
                    isUploading={isChatUploading}
                    uploadProgress={chatUploadProgress}
                  />
                </div>
              )}
            </AnimatePresence>

            <div className="w-full max-w-xl aspect-video rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 relative">
              {user.role === 2 ? (
                remoteUsers.length > 0 ? (
                  <VideoTile 
                    key={remoteUsers[0].uid}
                    uid={remoteUsers[0].uid}
                    videoTrack={remoteUsers[0].videoTrack}
                    audioTrack={remoteUsers[0].audioTrack}
                    hasVideo={!!remoteUsers[0].videoTrack}
                    hasAudio={!!remoteUsers[0].audioTrack}
                    role="audience"
                    name={t("class.student")}
                    isLarge={true}
                    showRewardButton={true}
                    onReward={() => setShowBadgePicker(true)}
                    earnedBadges={earnedBadges}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                      <VideoOff size={24} />
                    </div>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest">{t("class.waitingForStudent")}</p>
                  </div>
                )
              ) : (
                <VideoTile 
                  key="local-student-centered"
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
                  isLarge={true}
                  earnedBadges={earnedBadges}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden">
          
          {/* Left Side: Big Screen (Whiteboard or PDF) */}
          <div className={cn("relative min-h-[300px] transition-all duration-300", showChat ? "flex-[2]" : "flex-[3]")}>
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
                      pdfUrl={classroomMode === 'pdf' ? getFileUrl(activeMaterial) : null}
                      materialId={classroomMode === 'pdf' ? activeMaterial?.id : undefined}
                      onCloseBook={(clearFn) => { 
                        clearAnnotationsRef.current = clearFn; }}
                      currentPage={currentPage}
                      onPageChange={(page) => {
                        if (user.role === 2) {
                          setCurrentPage(page);
                        }
                      }}
                      currentMode={classroomMode}
                      onModeChange={(mode) => setClassroomMode(mode)}
                      onOpenMaterials={() => {
                        setClassroomMode('pdf');
                        setShowMaterialManager(true);
                      }}
                      zoom={zoom}
                      onZoomChange={(newZoom) => {
                        if (user.role === 2) {
                          setZoom(newZoom);
                        }
                      }}
                      scrollPosition={scrollPosition}
                      onScrollChange={(pos) => {
                        if (user.role === 2) {
                          setScrollPosition(pos);
                        }
                      }}
                      onScreenShare={toggleScreenShare}
                      isSharingScreen={isSharingScreen}
                      isLocked={isAnnotationsLocked}
                      onLockToggle={() => setIsAnnotationsLocked(!isAnnotationsLocked)}
                      onConnectionError={(err) => setWhiteboardSetupError(err)}
                    />
                  ) : (
                    <div className="w-full h-full rounded-[3rem] bg-slate-900 border-4 border-dashed border-white/5 flex flex-col items-center justify-center p-12 text-center">
                      {isWhiteboardLoading ? (
                        <>
                          <div className="w-16 h-16 rounded-full border-4 border-brand-purple/30 border-t-brand-purple animate-spin mb-6" />
                          <h4 className="text-lg font-black text-white uppercase tracking-widest mb-2">Setting Up Whiteboard</h4>
                          <p className="text-slate-500 text-sm max-w-sm">Please wait a moment...</p>
                        </>
                      ) : user.role === 2 ? (
                        <>
                          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
                            <AlertCircle size={40} />
                          </div>
                          <h4 className="text-xl font-black text-white uppercase tracking-widest mb-4">Setup Failed</h4>
                          <p className="text-slate-500 text-sm max-w-sm mb-2">
                            We couldn't initialize the whiteboard.
                          </p>
                          {whiteboardSetupError && (
                            <p className="text-red-400/80 text-[10px] font-mono mb-8 bg-red-500/5 px-4 py-2 rounded-lg border border-red-500/10">
                              Error: {whiteboardSetupError}
                            </p>
                          )}
                          {!whiteboardSetupError && (
                             <p className="text-slate-500 text-sm max-w-sm mb-8">
                               Please check your connection and try again.
                             </p>
                          )}
                          <button 
                            onClick={() => {
                              // Clear everything and force a fresh backend request
                              whiteboardDataRef.current = null;
                              localStorage.removeItem('whiteboard_data');
                              setWhiteboardData(null);
                              setWhiteboardSetupError(null);
                              setupWhiteboard(true);
                            }}
                            className="px-8 py-3 bg-brand-purple text-white font-black text-xs uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
                          >
                            <RefreshCw size={14} />
                            Retry Setup
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-20 h-20 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple mb-6">
                            <Pencil size={40} />
                          </div>
                          <h4 className="text-xl font-black text-white uppercase tracking-widest mb-4">Whiteboard Not Ready</h4>
                          <p className="text-slate-500 text-sm max-w-sm">
                            Waiting for the teacher to activate the whiteboard...
                          </p>
                        </>
                      )}
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
                  <h4 className="text-xl font-black text-white uppercase tracking-widest mb-4">{t("class.contentArea")}</h4>
                  <p className="text-slate-500 text-sm max-w-sm font-medium">
                    {user.role === 2 
                      ? t("class.contentAreaTeacher")
                      : t("class.contentAreaStudent")}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chat Panel Side - Moved to Center */}
          <AnimatePresence>
            {showChat && (
              <div id="chat-panel-container" className="h-full shrink-0">
                <ChatPanel 
                  messages={chatMessages}
                  currentUserId={user.id}
                  currentUserName={user.firstName}
                  currentUserRole={user.role}
                  isRTMReady={isRTMReady}
                  onSendMessage={handleSendMessage}
                  onClose={toggleChat}
                  isUploading={isChatUploading}
                  uploadProgress={chatUploadProgress}
                />
              </div>
            )}
          </AnimatePresence>

          {/* Right Side: Cameras Stack */}
          <div className={cn("w-full flex flex-col gap-4 overflow-hidden pr-2 transition-all duration-300", showChat ? "max-w-xs" : "max-w-sm")}>
            {/* TEACHER CAMERA (ALWAYS TOP) */}
            <div className="flex-1 min-h-0">
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
                  isLarge={true}
                />
              ) : (
                remoteUsers.length > 0 ? (
                  <VideoTile 
                    key={remoteUsers[0].uid}
                    uid={remoteUsers[0].uid}
                    videoTrack={remoteUsers[0].videoTrack}
                    audioTrack={remoteUsers[0].audioTrack}
                    name={t("class.teacher")}
                    hasVideo={!!remoteUsers[0].videoTrack}
                    hasAudio={!!remoteUsers[0].audioTrack}
                    role="host"
                    isLarge={true}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                      <VideoOff size={20} />
                    </div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{t("class.waitingForTeacher")}</p>
                  </div>
                )
              )}
            </div>

            {/* STUDENT CAMERA(S) (BOTTOM) */}
            <div className="flex-1 min-h-0">
              {user.role === 2 ? (
                remoteUsers.length > 0 ? (
                  <VideoTile 
                    key={remoteUsers[0].uid}
                    uid={remoteUsers[0].uid}
                    videoTrack={remoteUsers[0].videoTrack}
                    audioTrack={remoteUsers[0].audioTrack}
                    hasVideo={!!remoteUsers[0].videoTrack}
                    hasAudio={!!remoteUsers[0].audioTrack}
                    role="audience"
                    name={t("class.student")}
                    isLarge={true}
                    showRewardButton={user.role === 2}
                    onReward={() => setShowBadgePicker(true)}
                    earnedBadges={earnedBadges}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                      <VideoOff size={20} />
                    </div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{t("class.waitingForStudent")}</p>
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
                  isLarge={true}
                  earnedBadges={earnedBadges}
                />
              )}
            </div>
          </div>

        </div>
      )}

      {/* Footer Voice Tracking Timeline - Commented out as requested */}
      {/* 
      <footer className="h-20 bg-slate-900 border-t border-white/5 flex items-center justify-center shrink-0 z-50">
        <div className="w-full max-w-7xl h-full">
          <VoiceTimeline 
            teacherTrack={user.role === 2 ? localTracks.audio : remoteUsers[0]?.audioTrack}
            studentTrack={user.role === 2 ? remoteUsers[0]?.audioTrack : localTracks.audio}
            isTeacherView={user.role === 2}
            teacherName={user.role === 2 ? user.firstName : 'Teacher'}
            studentName={user.role === 2 ? (remoteUsers[0] ? 'Student' : 'Waiting...') : user.firstName}
          />
        </div>
      </footer>
      */}
      
      {isInClass && (
        <BadgeReward
          isTeacher={user.role === 2}
          isInClass={isInClass}
          studentName={
            remoteUsers.length > 0
              ? 'Student'
              : 'Student'
          }
          rtmChannelRef={rtmChannelRef}
          isRTMReady={isRTMReady}
          showPicker={showBadgePicker}
          setShowPicker={setShowBadgePicker}
          onBadgesUpdate={setEarnedBadges}
        />
      )}
    </div>
  );
};
