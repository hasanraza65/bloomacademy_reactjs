import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WhiteWebSdk, Room, DeviceType, ViewMode, ApplianceNames } from 'white-web-sdk';
import { Loader2, Pencil, Eraser, Square, Circle, Type, MousePointer2, ChevronLeft, ChevronRight, Highlighter, MousePointerClick, BookOpen, X, Monitor, Plus, Minus, Trash2, Lock, Unlock, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useLanguage } from '../../context/LanguageContext';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import { getCachedPdfUrl, savePdfToCache, revokeCachedUrl } from '@/src/lib/pdfCache';

interface WhiteboardProps {
  appId: string;
  roomUUID: string;
  roomToken: string;
  uid: string;
  userName: string;
  isTeacher?: boolean;
  pdfUrl?: string | null;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onModeChange?: (mode: 'whiteboard' | 'pdf' | 'none') => void;
  currentMode?: 'whiteboard' | 'pdf' | 'none';
  onOpenMaterials?: () => void;
  onScreenShare?: () => void;
  isSharingScreen?: boolean;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  scrollPosition?: { x: number; y: number };
  onScrollChange?: (pos: { x: number; y: number }) => void;
  materialId?: number | string;
  /** Called with the clearAllAnnotations function so the parent can trigger a clear */
  onCloseBook?: (clearFn: (mId: number | string) => void) => void;
  isLocked?: boolean;
  onLockToggle?: () => void;
  onConnectionError?: (error: string) => void;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({
  appId,
  roomUUID,
  roomToken,
  uid,
  userName,
  isTeacher = false,
  pdfUrl,
  currentPage = 1,
  onPageChange,
  onModeChange,
  currentMode = 'whiteboard',
  onOpenMaterials,
  onScreenShare,
  isSharingScreen = false,
  zoom = 1,
  onZoomChange,
  scrollPosition = { x: 0, y: 0 },
  onScrollChange,
  materialId,
  onCloseBook,
  isLocked = false,
  onLockToggle,
  onConnectionError,
}) => {
  // TODO: make dynamic in future — currently hardcoded until pair/session system is implemented
  const PAIR_ID = 1;
  const containerRef = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const roomRef = useRef<Room | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [localPdfUrl, setLocalPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // True once bindHtmlElement has been called — scene effects wait for this
  // so setScenePath is never called before the canvas is attached.
  const [isBound, setIsBound] = useState(false);
  const [wbRetryCount, setWbRetryCount] = useState(0);
  const [currentTool, setCurrentTool] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('whiteboard_tool');
      return saved || 'pencil';
    }
    return 'pencil';
  });

  useEffect(() => {
    if (isTeacher && currentTool) {
      localStorage.setItem('whiteboard_tool', currentTool);
    }
  }, [currentTool, isTeacher]);

  const [numPages, setNumPages] = useState<number>(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const prevPdfUrlRef = useRef<string | null>(null);
  const pdfUrlRef = useRef(pdfUrl);
  pdfUrlRef.current = pdfUrl;

  // Tracks which scene paths have already been created in this room session.
  // This prevents putScenes() from overwriting an existing annotated scene.
  const initializedScenesRef = useRef<Set<string>>(new Set());

  // ─── localStorage persistence (ported from File 1) ───────────────────────
  // Debounce timer for saving annotations
  const saveTimeoutRef = useRef<any>(null);
  // ─────────────────────────────────────────────────────────────────────────

  // Keep a ref to pdfStableId so closures always see the latest value.
  const pdfStableIdRef = useRef<string | null>(null);

  // Create a stable ID for the PDF based on its URL.
  // Uses the same base-16 approach as File 1 so localStorage keys stay compatible.
  const pdfStableId = React.useMemo(() => {
    if (!pdfUrl) return null;
    try {
      let hash = 0;
      for (let i = 0; i < pdfUrl.length; i++) {
        const char = pdfUrl.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16);
    } catch (e) {
      return null;
    }
  }, [pdfUrl]);

  // Keep pdfStableIdRef in sync
  useEffect(() => {
    pdfStableIdRef.current = pdfStableId;
  }, [pdfStableId]);

  // ─── Save annotations to localStorage (debounced) ────────────────────────
  useEffect(() => {
    if (!room || !isTeacher) return;

    const onRoomStateChanged = (modifyState: any) => {
      if (modifyState.sceneState || modifyState.cameraState) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          try {
            // Guard: room must still be connected before calling exportScene
            const phase = (room as any).phase;
            if (phase !== 'connected') {
              console.log('[WB] Save skipped — room phase:', phase);
              return;
            }
            const scenePath = (room as any).sceneState?.scenePath;
            if (!scenePath) return;
            const data = (room as any).exportScene?.(scenePath);
            if (!data) return;

            if (pdfUrl && pdfStableId) {
              const key = `pdf_annotations__${pdfStableId}__page_${currentPage}`;
              localStorage.setItem(key, JSON.stringify(data));
            } else {
              localStorage.setItem('whiteboard_annotations_global', JSON.stringify(data));
            }
          } catch (e) {
            console.warn('[WB] Failed to save annotations:', e);
          }
        }, 1500);
      }
    };

    room.callbacks.on('onRoomStateChanged', onRoomStateChanged);
    return () => {
      room.callbacks.off('onRoomStateChanged', onRoomStateChanged);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [room, isTeacher, pdfUrl, pdfStableId, currentPage]);

  // ─── Auto-save when navigating away (page change / unmount) ──────────────
  useEffect(() => {
    return () => {
      if (room && isTeacher) {
        try {
          const scenePath = (room as any).sceneState?.scenePath;
          const data = (room as any).exportScene?.(scenePath);
          if (data) {
            if (pdfUrl && pdfStableId) {
              const key = `pdf_annotations__${pdfStableId}__page_${currentPage}`;
              localStorage.setItem(key, JSON.stringify(data));
            } else {
              localStorage.setItem('whiteboard_annotations_global', JSON.stringify(data));
            }
          }
        } catch (_) {}
      }
    };
  }, [currentPage, room, isTeacher, pdfStableId, pdfUrl]);
  // ─────────────────────────────────────────────────────────────────────────

  // Removes all Netless scenes for this material's PDF AND clears localStorage (called on Close Book).
  const clearAllAnnotationsForMaterial = (_mId: number | string) => {
    const stableId = pdfStableIdRef.current;

    // Clear Netless scenes
    if (roomRef.current && stableId) {
      const sceneDir = `/pair-${PAIR_ID}/pdf-${stableId}`;
      try {
        roomRef.current.removeScenes(sceneDir);
      } catch (_) {}
      // Allow scenes to be recreated fresh after clearing
      initializedScenesRef.current.forEach(k => {
        if (k.startsWith(sceneDir)) initializedScenesRef.current.delete(k);
      });
    }

    // Clear localStorage entries for this PDF
    if (stableId) {
      try {
        const prefix = `pdf_annotations__${stableId}`;
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(prefix)) localStorage.removeItem(key);
        });
      } catch (e) {
        console.warn('[Whiteboard] Failed to clear localStorage annotations:', e);
      }
    }

    // Reset restored-pages tracking so they can be re-loaded if a new PDF is opened
    // (restoredPagesRef removed — restore logic no longer used)
  };

  // Clears only the current page's strokes (Trash2 button).
  const clearCurrentScene = () => {
    if (!roomRef.current) return;
    console.log('[WB] clearCurrentScene — currentScene:', (roomRef.current as any).state?.sceneState?.scenePath,
      '| disableDeviceInputs:', roomRef.current.disableDeviceInputs,
      '| isWritable:', (roomRef.current as any).isWritable
    );
    try {
      roomRef.current.cleanCurrentScene();
      console.log('[WB] cleanCurrentScene called OK');
      // Also clear stale localStorage entries so they are not saved back
      if (isTeacher) {
        if (pdfUrl && pdfStableId) {
          const key = `pdf_annotations__${pdfStableId}__page_${currentPage}`;
          localStorage.removeItem(key);
        } else {
          localStorage.removeItem('whiteboard_annotations_global');
        }
        // Cancel any pending debounced save so it does not re-save after the clear
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
          console.log('[WB] Debounced save cancelled after clear');
        }
      }
    } catch (e) {
      console.error('[WB] cleanCurrentScene ERROR:', e);
    }
  };

  // Register the clear function with the parent as soon as it's available
  useEffect(() => {
    onCloseBook?.(clearAllAnnotationsForMaterial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onCloseBook]);

  // Track PDF changes and handle caching/downloading
  useEffect(() => {
    let isCancelled = false;
    let xhr: XMLHttpRequest | null = null;
    
    const resolvePdf = async () => {
      if (!pdfUrl) {
        setLocalPdfUrl(null);
        setDownloadProgress(0);
        return;
      }

      setError(null);
      setDownloadProgress(0);

      // 1. Check Cache
      const cached = await getCachedPdfUrl(pdfUrl);
      if (cached && !isCancelled) {
        console.log('[Cache] Loaded from local storage:', pdfUrl);
        setLocalPdfUrl(cached);
        setDownloadProgress(100);
        return;
      }

      // 2. Download with progress if not in cache
      if (!isCancelled) {
        xhr = new XMLHttpRequest();
        xhr.open('GET', pdfUrl, true);
        xhr.responseType = 'blob';

        xhr.onprogress = (event) => {
          if (event.lengthComputable && !isCancelled) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setDownloadProgress(percent);
          }
        };

        xhr.onload = async () => {
          if (xhr?.status === 200 && !isCancelled) {
            const blob = xhr.response;
            // Store in cache for next time
            await savePdfToCache(pdfUrl, blob);
            
            if (!isCancelled) {
              const url = URL.createObjectURL(blob);
              setLocalPdfUrl(url);
              setDownloadProgress(100);
            }
          } else if (!isCancelled) {
            setError(t('whiteboard.failedDownload'));
          }
        };

        xhr.onerror = () => {
          if (!isCancelled) setError(t('whiteboard.networkError'));
        };

        xhr.send();
      }
    };

    resolvePdf();
    prevPdfUrlRef.current = pdfUrl;

    return () => {
      isCancelled = true;
      if (xhr) xhr.abort();
      if (localPdfUrl) revokeCachedUrl(localPdfUrl);
    };
  }, [pdfUrl]);

  // ─── Whiteboard scene (no PDF active) ────────────────────────────────────
  useEffect(() => {
    if (!room || pdfUrl || !isBound) return;

    const sceneDir = `/pair-${PAIR_ID}/whiteboard`;
    const scenePath = `${sceneDir}/main`;

    console.log('[WB] Whiteboard scene effect — pdfUrl:', pdfUrl, '| isBound:', isBound, '| isTeacher:', isTeacher);

    // Teacher manages scenes. Students follow in Follower mode.
    if (isTeacher) {
      if (!initializedScenesRef.current.has(scenePath)) {
        initializedScenesRef.current.add(scenePath);
        const scenes = room.entireScenes();
        const dirExists = scenes[sceneDir] || scenes[`${sceneDir}/`];
        if (!dirExists) {
          room.putScenes(sceneDir, [{ name: 'main' }]);
        }
      }
      try {
        room.setScenePath(scenePath);
      } catch (e) {
        console.error('[WB] setScenePath FAILED for', scenePath, '—', e);
      }
    }

    room.setWritable(true).then(() => {
      room.disableDeviceInputs = false;
      (room as any).disableOperations = false;
      room.setMemberState({
        currentApplianceName: ApplianceNames.pencil,
        strokeColor: [139, 92, 246],
        strokeWidth: 4,
      });
      (room as any).refreshViewSize?.();
    }).catch((e) => {
      console.error('[WB] setWritable(true) FAILED:', e);
    });
  }, [room, isTeacher, pdfUrl, isBound]);

  // ─── PDF scene (PDF is active) ────────────────────────────────────────────
  useEffect(() => {
    if (!room || !pdfUrl || !pdfStableId || !isBound) return;

    console.log('[WB] PDF scene effect — pdfUrl:', pdfUrl, '| page:', currentPage,
      '| pdfStableId:', pdfStableId, '| isBound:', isBound
    );

    const sceneDir = `/pair-${PAIR_ID}/pdf-${pdfStableId}`;
    const scenePath = `${sceneDir}/${currentPage}`;

    // Teacher manages scenes. Students follow in Follower mode.
    if (isTeacher) {
      if (!initializedScenesRef.current.has(scenePath)) {
        initializedScenesRef.current.add(scenePath);
        console.log('[WB] First time PDF scene — trying setScenePath:', scenePath);
        try {
          room.setScenePath(scenePath);
          const landed = (room as any).state?.sceneState?.scenePath;
          if (landed !== scenePath) {
            console.log('[WB] Landed on wrong scene, putScenes then retry');
            room.putScenes(sceneDir, [{ name: String(currentPage) }]);
            room.setScenePath(scenePath);
          }
        } catch (e) {
          console.warn('[WB] setScenePath threw, doing putScenes fallback.', e);
          room.putScenes(sceneDir, [{ name: String(currentPage) }]);
          room.setScenePath(scenePath);
        }
      } else {
        console.log('[WB] PDF scene already initialized — setScenePath:', scenePath);
        try {
          room.setScenePath(scenePath);
        } catch (e) {
          console.error('[WB] setScenePath FAILED (revisit):', e);
        }
      }
    }

    room.setWritable(true).then(() => {
      if (pdfUrlRef.current !== pdfUrl) return;
      room.disableDeviceInputs = false;
      (room as any).disableOperations = false;
      room.setMemberState({
        currentApplianceName: ApplianceNames.pencil,
        strokeColor: [139, 92, 246],
        strokeWidth: 4,
      });
      (room as any).refreshViewSize?.();
    }).catch((e) => {
      console.error('[WB] PDF setWritable FAILED:', e);
    });
  }, [room, isTeacher, pdfUrl, pdfStableId, currentPage, isBound]);

  useEffect(() => {
    if (!pdfContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(pdfContainerRef.current);
    return () => observer.disconnect();
  }, [pdfUrl]);

  // Whenever the whiteboard canvas div resizes (PDF load, zoom change, window resize),
  // notify the Netless SDK so it recalculates coordinate mapping.
  useEffect(() => {
    if (!containerRef.current || !room) return;
    const observer = new ResizeObserver(() => {
      try {
        (room as any)?.refreshViewSize?.();
      } catch (_) {}
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [room]);

  // Force a view-size refresh after zoom/layout updates so strokes stay aligned to PDF.
  useEffect(() => {
    if (!roomRef.current) return;

    const raf1 = requestAnimationFrame(() => {
      try { (roomRef.current as any)?.refreshViewSize?.(); } catch (_) {}
    });
    const raf2 = requestAnimationFrame(() => {
      try { (roomRef.current as any)?.refreshViewSize?.(); } catch (_) {}
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [currentPage, pdfUrl, zoom]);

  useEffect(() => { setPageSize(null); }, [pdfUrl, currentPage]);

  // Sync scroll position from props (for student)
  useEffect(() => {
    if (!isTeacher && pdfContainerRef.current && scrollPosition) {
      const target = pdfContainerRef.current;
      const maxScrollX = target.scrollWidth - target.clientWidth;
      const maxScrollY = target.scrollHeight - target.clientHeight;
      target.scrollLeft = scrollPosition.x * maxScrollX;
      target.scrollTop = scrollPosition.y * maxScrollY;
    }
  }, [scrollPosition, isTeacher]);

  // Handle scroll events (for teacher)
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isTeacher) {
      const target = e.currentTarget;
      const maxScrollX = target.scrollWidth - target.clientWidth;
      const maxScrollY = target.scrollHeight - target.clientHeight;
      onScrollChange?.({
        x: maxScrollX > 0 ? target.scrollLeft / maxScrollX : 0,
        y: maxScrollY > 0 ? target.scrollTop / maxScrollY : 0,
      });
    }
  };

  const joinRoom = React.useCallback(async (retries = 0) => {
    if (!roomUUID || !roomToken) return;
    
    const sdk = new WhiteWebSdk({
      appIdentifier: appId,
      region: (import.meta as any).env.VITE_WHITEBOARD_REGION || 'us-sv',
      // @ts-ignore
      logger: { report: false, level: 'error' }
    });

    try {
      setLoading(true);
      setError(null);
      console.log(`[WB] joinRoom start (attempt ${retries + 1}) — UUID:`, roomUUID, '| appId:', appId, '| isTeacher:', isTeacher);

      const region = (import.meta as any).env.VITE_WHITEBOARD_REGION || 'us-sv';

      // Race joinRoom against a 45s timeout so it never hangs forever
      const joinPromise = sdk.joinRoom({
        uuid: roomUUID,
        roomToken,
        uid,
        region,
        cursorAdapter: undefined,
        disableNewPencil: false,
        isWritable: true,
        disableDeviceInputs: !isTeacher,
        userPayload: { cursorName: userName },
      } as any);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Whiteboard connection timed out — please check your network or try again.')), 45000)
      );

      const joinedRoom = await Promise.race([joinPromise, timeoutPromise]) as Room;

      roomRef.current = joinedRoom;
      setRoom(joinedRoom);

      // ADD THESE:
      console.log('=== DIAGNOSTIC ===');
      console.log('Role:', isTeacher ? 'TEACHER' : 'STUDENT');
      console.log('UUID:', roomUUID);
      console.log('Token:', roomToken);
      console.log('Region:', region);
      console.log('Scene:', (joinedRoom as any).state?.sceneState?.scenePath);
      console.log('All Scenes:', JSON.stringify(Object.keys((joinedRoom as any).entireScenes())));
      console.log('==================');

      /*
      console.log('[WB] Room joined OK — UUID:', roomUUID,
        '| isWritable:', (joinedRoom as any).isWritable,
        '| disableDeviceInputs:', joinedRoom.disableDeviceInputs,
        '| currentScene:', (joinedRoom as any).state?.sceneState?.scenePath
      ); */

      if (isTeacher) {
        joinedRoom.setViewMode(ViewMode.Broadcaster);
        (joinedRoom as any).disableOperations = false;
        joinedRoom.setMemberState({ currentApplianceName: ApplianceNames.pencil, strokeColor: [139, 92, 246], strokeWidth: 4, textSize: 24 });
      } else {
        joinedRoom.setViewMode(ViewMode.Follower);
        (joinedRoom as any).disableOperations = true;
      }
      setLoading(false);
    } catch (err: any) {
      console.error('[WB] joinRoom FAILED:', err?.message, err?.stack || '');
      const msg = err?.message || t('whiteboard.failedJoin');
      setError(msg);
      setLoading(false);
      onConnectionError?.(msg);
    }
  }, [appId, roomUUID, roomToken, uid, userName, isTeacher]);

  useEffect(() => {
    let isCancelled = false;
    joinRoom();
    return () => {
      isCancelled = true;
      if (roomRef.current) { roomRef.current.disconnect(); roomRef.current = null; }
    };
  }, [joinRoom, wbRetryCount]);

  // Bind whiteboard to DOM — only once when room connects (NO rebinding on PDF change)
  useEffect(() => {
    if (!room || !containerRef.current) return;

    let timer: any;

    const bind = async () => {
      if (!containerRef.current || !room) return;
      try {
        console.log('[WB] bindHtmlElement — container ready:',
          containerRef.current.offsetWidth, 'x', containerRef.current.offsetHeight,
          '| isTeacher:', isTeacher
        );
        
        // Netless requires the element to be in the DOM and visible.
        // If it's too small (0x0), it might fail to bind correctly.
        if (containerRef.current.offsetWidth === 0 || containerRef.current.offsetHeight === 0) {
          timer = setTimeout(bind, 100);
          return;
        }

        room.bindHtmlElement(containerRef.current);
        setIsBound(true);
        console.log('[WB] Bind OK — currentScene:', (room as any).state?.sceneState?.scenePath);
        (room as any).refreshViewSize?.();

        // Disable internal whiteboard zoom/pan to allow browser scrolling
        room.disableCameraTransform = true;

        if (isTeacher) {
          await room.setWritable(true);
          room.disableDeviceInputs = false;
          (room as any).disableOperations = false;
          room.setViewMode(ViewMode.Broadcaster);
          room.setMemberState({ currentApplianceName: ApplianceNames.pencil, strokeColor: [139, 92, 246], strokeWidth: 4, textSize: 24 });
        } else {
          await room.setWritable(!isLocked);
          room.disableDeviceInputs = isLocked;
          (room as any).disableOperations = isLocked;
          room.setViewMode(ViewMode.Follower);
          room.setMemberState({ currentApplianceName: ApplianceNames.pencil, strokeColor: [139, 92, 246], strokeWidth: 4, textSize: 24 });
        }
      } catch (e) {
        console.error('[WB] bindHtmlElement ERROR:', e);
      }
    };

    bind();

    return () => { 
      if (timer) clearTimeout(timer);
      try {
        if (room) room.bindHtmlElement(null); 
      } catch (_) {}
      setIsBound(false); 
    };
  }, [room, isTeacher]);

  // Update writable state when lock toggles (for students)
  useEffect(() => {
    if (!room || isTeacher) return;
    room.setWritable(!isLocked);
    room.disableDeviceInputs = isLocked;
    (room as any).disableOperations = isLocked;
  }, [isLocked, room, isTeacher]);

    // When a PDF is active, keep the whiteboard camera locked at scale:zoom.
    useEffect(() => {
    if (!room || !pdfUrl) return;

    const snap = () => {
      try {
        (room as any).moveCamera?.({ scale: zoom, centerX: 0, centerY: 0, animationMode: 'immediately' });
      } catch (_) {}
    };

    snap();

    const onStateChanged = (modifyState: any) => {
      if (modifyState?.cameraState) {
        const cam = (room as any).state?.cameraState;
        const hasDrifted =
          cam &&
          (Math.abs((cam.scale ?? zoom) - zoom) > 0.02 ||
            Math.abs(cam.centerX ?? 0) > 2 ||
            Math.abs(cam.centerY ?? 0) > 2);
        if (hasDrifted) snap();
      }
    };

    try { (room as any).callbacks?.on('onRoomStateChanged', onStateChanged); } catch (_) {}
    return () => {
      try { (room as any).callbacks?.off('onRoomStateChanged', onStateChanged); } catch (_) {}
    };
  }, [room, pdfUrl]);

  // ─── Tool management ──────────────────────────────────────────────────────
  const lastToolRef = useRef<string | null>(null);
  const isApplyingToolRef = useRef(false);

  const getScaledStrokeWidth = (baseWidth: number) => baseWidth;

  // Reset camera to 1 when switching out of PDF mode (Whiteboard mode)
  useEffect(() => {
    if (!room) return;
    if (!pdfUrl) {
      try {
        (room as any).moveCamera?.({ scale: 1, centerX: 0, centerY: 0, animationMode: 'immediately' });
      } catch (_) {}
    }
  }, [room, pdfUrl]);

  const applyTool = (tool: string) => {
    if (!room || isApplyingToolRef.current || !isBound) {
      console.log('[WB] applyTool skipped — room:', !!room, '| isBound:', isBound, '| isApplyingTool:', isApplyingToolRef.current);
      return;
    }

    console.log('[WB] applyTool (EXEC):', tool,
      '| scene:', (room as any).state?.sceneState?.scenePath,
      '| disableInputs:', room.disableDeviceInputs
    );

    isApplyingToolRef.current = true;
    lastToolRef.current = tool;
    setCurrentTool(tool);

    // Allow everyone to set writable when applying a tool
    room.setWritable(true).catch(() => {});
    room.disableDeviceInputs = false;
    (room as any).disableOperations = false;

    setTimeout(() => {
      if (!room) return;

      switch (tool) {
        case 'selector':
          room.setMemberState({ currentApplianceName: ApplianceNames.selector });
          break;
        case 'pencil':
          room.setMemberState({ currentApplianceName: ApplianceNames.pencil, strokeColor: [139, 92, 246], strokeWidth: getScaledStrokeWidth(4) });
          break;
        case 'highlighter':
          room.setMemberState({ currentApplianceName: ApplianceNames.pencil, strokeColor: [251, 191, 36], strokeWidth: getScaledStrokeWidth(20) });
          break;
        case 'laser':
          room.setMemberState({ currentApplianceName: ApplianceNames.laserPointer });
          break;
        case 'eraser':
          room.setMemberState({ currentApplianceName: ApplianceNames.eraser });
          break;
        case 'rectangle':
          room.setMemberState({ currentApplianceName: ApplianceNames.rectangle });
          break;
        case 'ellipse':
          room.setMemberState({ currentApplianceName: ApplianceNames.ellipse });
          break;
        case 'text':
          room.setMemberState({ currentApplianceName: ApplianceNames.text });
          break;
        default:
          room.setMemberState({ currentApplianceName: ApplianceNames.pencil });
      }

      room.disableDeviceInputs = false;
      (room as any).disableOperations = false;

      console.log('[WB] applyTool done — disableDeviceInputs:', room.disableDeviceInputs,
        '| appliance:', (room as any).state?.memberState?.currentApplianceName
      );
      setTimeout(() => { isApplyingToolRef.current = false; }, 100);
    }, 50);
  };

  // Sync UI with whiteboard's actual tool state
  useEffect(() => {
    if (!room) return;

    const handleMemberStateChange = (memberState: any) => {
      if (memberState && memberState.currentApplianceName) {
        if (isApplyingToolRef.current) return;

        const applianceName = memberState.currentApplianceName;
        let mappedTool: string | null = null;

        if (applianceName === 'selector') mappedTool = 'selector';
        else if (applianceName === 'pencil') mappedTool = 'pencil';
        else if (applianceName === 'eraser') mappedTool = 'eraser';
        else if (applianceName === 'rectangle') mappedTool = 'rectangle';
        else if (applianceName === 'ellipse') mappedTool = 'ellipse';
        else if (applianceName === 'text') mappedTool = 'text';
        else if (applianceName === 'laserPointer') mappedTool = 'laser';

        if (mappedTool && mappedTool !== currentTool && !isApplyingToolRef.current) {
          setCurrentTool(mappedTool);
          lastToolRef.current = mappedTool;
        }
      }
    };

    room.addMagixEventListener('onMemberStateChanged', handleMemberStateChange);
    return () => { room.removeMagixEventListener('onMemberStateChanged'); };
  }, [room, currentTool]);

  // Force sync the tool when room connects, is bound, or mode changes
  useEffect(() => {
    if (room && currentTool && isBound) {
      console.log('[WB] Tool sync effect — currentTool:', currentTool, '| isBound:', isBound);
      const timer = setTimeout(() => {
        if (room && !isApplyingToolRef.current && isBound) applyTool(currentTool);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [room, currentTool, isBound]);

  // Keep drawing thickness visually consistent while PDF zoom changes.
  useEffect(() => {
    if (!room || !isTeacher || !pdfUrl) return;
    if (currentTool !== 'pencil' && currentTool !== 'highlighter') return;
    if (isApplyingToolRef.current) return;
    applyTool(currentTool);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, room, isTeacher, pdfUrl]);

  // ─── PDF rendering helpers ────────────────────────────────────────────────
  const pdfOptions = React.useMemo(() => ({
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    disableRange: true,
    disableStream: true,
  }), []);

  const fitPdfWidth = (() => {
    if (!pdfUrl) return containerSize.width || 800;
    if (!pageSize || !containerSize.width || !containerSize.height) return Math.max((containerSize.width || 800) - 48, 240);
    const scaleByWidth = (containerSize.width - 48) / pageSize.width;
    const scaleByHeight = (containerSize.height - 48) / pageSize.height;
    return pageSize.width * Math.min(scaleByWidth, scaleByHeight);
  })();

  const fitPdfHeight = (() => {
    if (!pdfUrl) return containerSize.height || 600;
    if (!pageSize) return Math.max((containerSize.height || 600) - 48, 320);
    return fitPdfWidth * (pageSize.height / pageSize.width);
  })();

  const scaledPdfWidth = pdfUrl ? fitPdfWidth * zoom : '100%';
  const scaledPdfHeight = pdfUrl ? fitPdfHeight * zoom : '100%';

  // Tool definitions — order here is the ONLY thing that controls render order
  const tools = [
    { id: 'selector',    icon: <MousePointer2 size={20} />,    title: 'Select' },
    { id: 'pencil',      icon: <Pencil size={20} />,           title: 'Pencil' },
    { id: 'highlighter', icon: <Highlighter size={20} />,      title: 'Highlight' },
    { id: 'laser',       icon: <MousePointerClick size={20} />, title: 'Laser Pointer' },
    { id: 'eraser',      icon: <Eraser size={20} />,           title: 'Eraser' },
    { id: 'rectangle',   icon: <Square size={20} />,           title: 'Rectangle' },
    { id: 'ellipse',     icon: <Circle size={20} />,           title: 'Ellipse' },
    { id: 'text',        icon: <Type size={20} />,             title: 'Text' },
  ];

  const showTools = (currentMode === 'whiteboard' || currentMode === 'pdf') && (isTeacher || !isLocked);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full bg-slate-100 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">

      {(loading || (pdfUrl && !localPdfUrl)) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md z-50 p-12 text-center overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-purple/20 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 w-full max-w-sm">
            <div className="w-24 h-24 rounded-3xl bg-slate-800/50 flex items-center justify-center mb-8 mx-auto border border-white/10 shadow-2xl relative group overflow-hidden">
              <div className="absolute inset-0 bg-brand-purple/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {downloadProgress > 0 && downloadProgress < 100 ? (
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      className="text-white/5"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={175.9}
                      strokeDashoffset={175.9 - (175.9 * downloadProgress) / 100}
                      className="text-brand-purple transition-all duration-300"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-black text-white">{downloadProgress}%</span>
                </div>
              ) : (
                <Loader2 className="animate-spin text-brand-purple relative z-10" size={48} />
              )}
            </div>

            <h4 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-4">
              {loading ? t('whiteboard.initializing') : (downloadProgress < 100 ? t('whiteboard.downloadingMaterial') : t('whiteboard.loadingMaterial'))}
            </h4>
            
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.15em] mb-8 leading-relaxed">
              {loading 
                ? t('whiteboard.preparingCanvas')
                : (downloadProgress < 100 
                  ? t('whiteboard.retrievingBook')
                  : t('whiteboard.renderingMaterial'))}
            </p>

            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4 shadow-inner">
              <motion.div 
                initial={false}
                animate={{ width: `${loading ? 100 : downloadProgress}%` }}
                className={cn(
                  "h-full bg-gradient-to-r from-transparent via-brand-purple to-transparent shadow-[0_0_15px_rgba(139,92,246,0.6)]",
                  loading && "animate-pulse"
                )}
                style={loading ? { width: '100%' } : {}}
              />
            </div>
            
            <div className="flex items-center justify-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-pulse" />
               <span className="text-[10px] font-black text-brand-purple uppercase tracking-[0.3em]">
                 {loading ? t('whiteboard.connecting') : (downloadProgress < 100 ? `${t('whiteboard.downloading')} ${downloadProgress}%` : t('whiteboard.rendering'))}
               </span>
            </div>

            {error && (
              <div className="mt-10 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
                <p className="text-red-400 font-black text-[10px] max-w-xs text-center uppercase tracking-widest bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20">{error}</p>
                <button 
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    setWbRetryCount(prev => prev + 1);
                  }}
                  className="px-8 py-3 bg-brand-purple text-white font-black text-xs uppercase tracking-[0.2em] rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-purple-500/30 flex items-center gap-2"
                >
                  <RefreshCw size={14} />
                  {t('whiteboard.retryConnection')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/95 text-white px-6 py-4 rounded-2xl z-[60] font-bold shadow-2xl border border-red-400 backdrop-blur-md max-w-lg flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
             <AlertCircle size={20} />
             <p className="text-sm">{error}</p>
          </div>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              setWbRetryCount(prev => prev + 1);
            }}
            className="bg-white text-red-500 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
          >
            {t('whiteboard.retryConnection')}
          </button>
        </div>
      )}

      {/*
        The main content area — handles scrolling and containment of PDF/Whiteboard.
      */}
      <div
        ref={pdfContainerRef}
        onScroll={handleScroll}
        className="absolute inset-0 bg-slate-200 z-0 overflow-auto flex items-start p-12 custom-scrollbar"
      >
        <div
          className="relative flex-shrink-0 bg-white shadow-2xl mx-auto"
          style={{
            width: pdfUrl ? scaledPdfWidth : '100%',
            height: pdfUrl ? scaledPdfHeight : '100%',
            minHeight: !pdfUrl ? '100%' : 'auto',
            pointerEvents: 'auto'
          }}
        >
          <div
            className="absolute left-0 top-0"
            style={pdfUrl ? {
              width: fitPdfWidth * zoom,
              height: fitPdfHeight * zoom,
            } : {
              width: '100%',
              height: '100%',
            }}
          >
            {/* PDF Page Layer (Z-0) */}
            {localPdfUrl && containerSize.width > 0 && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <Document
                  file={localPdfUrl}
                  options={pdfOptions}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  onLoadError={(err) => {
                    const isCors = err.message.includes("Failed to fetch") || err.name === "SecurityError";
                    setError(`Failed to load PDF: ${err.message}${isCors ? ' (CORS issue — ensure backend allows this domain)' : ''}`);
                  }}
                  loading={<Loader2 className="animate-spin text-brand-purple" />}
                >
                  <Page
                    pageNumber={currentPage}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    width={fitPdfWidth * zoom}
                    onLoadSuccess={(page) => setPageSize({ width: page.originalWidth, height: page.originalHeight })}
                  />
                </Document>
              </div>
            )}

            {/* Whiteboard Overlay Layer (Z-10) */}
            <div
              ref={containerRef}
              onWheel={(e) => {
                // If in PDF mode, manually propagate scroll to parent
                if (pdfUrl && pdfContainerRef.current) {
                  pdfContainerRef.current.scrollTop += e.deltaY;
                  pdfContainerRef.current.scrollLeft += e.deltaX;
                }
              }}
              className="netless-container absolute inset-0 z-10"
              style={{
                pointerEvents: 'all',
                touchAction: pdfUrl ? 'pan-y pinch-zoom' : 'none',
                cursor: currentTool === 'pencil' ? 'crosshair' : 'default',
                background: pdfUrl ? 'transparent' : 'white',
              }}
            />
          </div>
        </div>
      </div>

      {/* Zoom controls for PDF */}
      {pdfUrl && isTeacher && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2 p-2 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 z-30 shadow-2xl">
          <button
            onClick={() => onZoomChange?.(Math.min(zoom + 0.25, 3))}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            title="Zoom In"
          >
            <Plus size={20} />
          </button>
          <div className="px-2 py-1 flex items-center justify-center">
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">{Math.round(zoom * 100)}%</span>
          </div>
          <button
            onClick={() => onZoomChange?.(Math.max(zoom - 0.25, 0.5))}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            title="Zoom Out"
          >
            <Minus size={20} />
          </button>
        </div>
      )}

      {/* Page controls */}
      {pdfUrl && isTeacher && numPages > 0 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 z-30 shadow-2xl">
          <button disabled={currentPage <= 1} onClick={() => onPageChange?.(currentPage - 1)} className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="text-white font-black text-[10px] uppercase tracking-widest min-w-[100px] text-center">
            {t('whiteboard.page')} {currentPage} / {numPages}
          </span>
          <button disabled={currentPage >= numPages} onClick={() => onPageChange?.(currentPage + 1)} className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      {(isTeacher || showTools) && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 p-2 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 z-20">

          {/* Screen Share button */}
          {isTeacher && (
            <button
              onClick={() => onScreenShare?.()}
              title={isSharingScreen ? 'Stop Sharing' : 'Share Screen'}
              className={cn("p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95",
                isSharingScreen ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30" : "text-slate-400 hover:text-white hover:bg-white/10"
              )}
            >
              <Monitor size={20} />
            </button>
          )}

          {/* PDF / Resources button */}
          {isTeacher && (
            <button
              onClick={() => onOpenMaterials?.()}
              title="PDF Resources"
              className={cn("p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95",
                currentMode === 'pdf' ? "bg-brand-purple text-white shadow-lg shadow-purple-500/30" : "text-slate-400 hover:text-white hover:bg-white/10"
              )}
            >
              <BookOpen size={20} />
            </button>
          )}

          {isTeacher && <div className="h-px bg-white/10 my-1" />}

          {/* Drawing tools */}
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => applyTool(tool.id)}
              title={tool.title}
              style={{ display: showTools ? 'flex' : 'none' }}
              className={cn("p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95 items-center justify-center",
                currentTool === tool.id ? "bg-brand-purple text-white shadow-lg shadow-purple-500/30" : "text-slate-400 hover:text-white hover:bg-white/10"
              )}
            >
              {tool.icon}
            </button>
          ))}

          {isTeacher && <div className="h-px bg-white/10 my-1" />}

          {/* Clear current page's annotation strokes */}
          {isTeacher && (currentMode === 'pdf' || currentMode === 'whiteboard') && (
            <div className="relative">
              <AnimatePresence>
                {showClearConfirm && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                    className="absolute left-full ml-3 top-0 flex items-center gap-2 bg-slate-900 border border-white/10 p-1.5 rounded-xl shadow-2xl z-50 whitespace-nowrap"
                  >
                    <span className="text-[10px] font-bold text-white/50 uppercase px-2">{t('whiteboard.clearQuestion')}</span>
                    <button
                      onClick={() => {
                        clearCurrentScene();
                        setShowClearConfirm(false);
                      }}
                      className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-red-600 transition-colors"
                    >
                      {t('common.yes')}
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-3 py-1.5 bg-white/5 text-white/70 text-[10px] font-black uppercase rounded-lg hover:bg-white/10 transition-colors"
                    >
                      {t('common.no')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={() => setShowClearConfirm(!showClearConfirm)}
                title="Clear annotations on this page"
                className={cn(
                  "p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95",
                  showClearConfirm ? "bg-red-500 text-white shadow-lg shadow-red-500/30" : "text-red-400 hover:text-red-300 hover:bg-white/10"
                )}
              >
                <Trash2 size={20} />
              </button>
            </div>
          )}

          {/* Lock annotations button */}
          {isTeacher && (
            <button
              onClick={onLockToggle}
              title={isLocked ? "Unlock student annotations" : "Lock student annotations"}
              className={cn(
                "p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95",
                isLocked ? "bg-red-500 text-white shadow-lg shadow-red-500/30" : "text-slate-400 hover:text-white hover:bg-white/10"
              )}
            >
              {isLocked ? <Lock size={20} /> : <Unlock size={20} />}
            </button>
          )}

          {isTeacher && <div className="h-px bg-white/10 my-1" />}

          {/* Close button */}
          <button
            onClick={() => onModeChange?.('none')}
            title="Hide Board"
            className="p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95 text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X size={20} />
          </button>

        </div>
      )}
    </div>
  );
};