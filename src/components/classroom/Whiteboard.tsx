import React, { useEffect, useRef, useState } from 'react';
import { WhiteWebSdk, Room, DeviceType, ViewMode, ApplianceNames } from 'white-web-sdk';
import { Loader2, Pencil, Eraser, Square, Circle, Type, MousePointer2, ChevronLeft, ChevronRight, Highlighter, MousePointerClick, BookOpen, X, Monitor, Plus, Minus } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const roomRef = useRef<Room | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const prevPdfUrlRef = useRef<string | null>(null);
  const pdfUrlRef = useRef(pdfUrl);
  pdfUrlRef.current = pdfUrl;
  
  // Create a stable ID for the PDF based on its URL
  const pdfStableId = React.useMemo(() => {
    if (!pdfUrl) return null;
    let hash = 0;
    for (let i = 0; i < pdfUrl.length; i++) {
      const char = pdfUrl.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).slice(0, 8);
  }, [pdfUrl]);

  // Track PDF changes
  useEffect(() => {
    if (pdfUrl) {
      setError(null);
      prevPdfUrlRef.current = pdfUrl;
    } else {
      prevPdfUrlRef.current = null;
    }
  }, [pdfUrl]);

  // Whiteboard scene:
  useEffect(() => {
    if (!room || !isTeacher || pdfUrl) return;

    const scenes = room.entireScenes();
    if (!scenes['/whiteboard/']) {
      room.putScenes('/whiteboard', [{ name: 'main' }]);
    }
    room.setScenePath('/whiteboard/main');

    room.setWritable(true).then(() => {
      room.disableDeviceInputs = false;
      (room as any).disableOperations = false;
      room.setMemberState({
        currentApplianceName: ApplianceNames.pencil,
        strokeColor: [139, 92, 246],
        strokeWidth: 4,
      });
      (room as any).refreshViewSize?.();
    }).catch(() => {});
  }, [room, isTeacher, pdfUrl]);

  // PDF scene:
  useEffect(() => {
    if (!room || !isTeacher || !pdfUrl || !pdfStableId) return;

    const sceneDir = `/pdf-${pdfStableId}`;
    const scenePath = `${sceneDir}/${currentPage}`;

    const scenes = room.entireScenes();
    const existing = scenes[`${sceneDir}/`] || [];
    if (!existing.find((s: any) => s.name === String(currentPage))) {
      room.putScenes(sceneDir, [{ name: String(currentPage) }]);
    }
    room.setScenePath(scenePath);

    room.setWritable(true).then(() => {
      // Small guard to ensure we are still on the same PDF
      if (pdfUrlRef.current !== pdfUrl) return;
      
      room.disableDeviceInputs = false;
      (room as any).disableOperations = false;
      room.setMemberState({
        currentApplianceName: ApplianceNames.pencil,
        strokeColor: [139, 92, 246],
        strokeWidth: 4,
      });
      (room as any).refreshViewSize?.();
    }).catch(() => {});
  }, [room, isTeacher, pdfUrl, pdfStableId, currentPage]);

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
        y: maxScrollY > 0 ? target.scrollTop / maxScrollY : 0 
      });
    }
  };

  useEffect(() => {
    if (!roomUUID || !roomToken) return;
    let isCancelled = false;
    const sdk = new WhiteWebSdk({ appIdentifier: appId, deviceType: DeviceType.Surface, region: 'us-sv' });

    const joinRoom = async () => {
      try {
        setLoading(true);
        const joinedRoom = await sdk.joinRoom({
          uuid: roomUUID,
          roomToken,
          uid,
          region: 'us-sv',
          cursorAdapter: undefined,
          disableNewPencil: true,
          isWritable: isTeacher,
          disableDeviceInputs: !isTeacher,
          userPayload: { cursorName: userName },
        } as any);

        if (isCancelled) { joinedRoom.disconnect(); return; }

        roomRef.current = joinedRoom;
        setRoom(joinedRoom);

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
        if (!isCancelled) { setError(err.message || 'Failed to join whiteboard'); setLoading(false); }
      }
    };

    joinRoom();
    return () => {
      isCancelled = true;
      if (roomRef.current) { roomRef.current.disconnect(); roomRef.current = null; }
    };
  }, [appId, roomUUID, roomToken, uid, userName]);

  // Bind whiteboard to DOM — only once when room connects (NO rebinding on PDF change)
  useEffect(() => {
    if (!room || !containerRef.current) return;

    const timer = setTimeout(async () => {
      if (!containerRef.current || !room) return;
      try {
        room.bindHtmlElement(containerRef.current);
        (room as any).refreshViewSize?.();

        if (isTeacher) {
          await room.setWritable(true);
          room.disableDeviceInputs = false;
          (room as any).disableOperations = false;
          room.setViewMode(ViewMode.Broadcaster);
          room.setMemberState({ currentApplianceName: ApplianceNames.pencil, strokeColor: [139, 92, 246], strokeWidth: 4, textSize: 24 });

          setTimeout(() => {
            if (room && containerRef.current) {
              (room as any).refreshViewSize?.();
              room.disableDeviceInputs = false;
              (room as any).disableOperations = false;
            }
          }, 300);
        } else {
          room.disableDeviceInputs = true;
          (room as any).disableOperations = true;
          room.setViewMode(ViewMode.Follower);
        }
      } catch (e) { console.error("Whiteboard binding error:", e); }
    }, 500);

    return () => { clearTimeout(timer); room.bindHtmlElement(null); };
  }, [room, isTeacher]);

// Add a ref to track the last tool we explicitly set
const lastToolRef = useRef<string | null>(null);
const isApplyingToolRef = useRef(false);

const applyTool = (tool: string) => {
  if (!room || isApplyingToolRef.current) return;
  
  console.log(`Applying tool: ${tool}`);
  
  // Prevent recursive calls
  isApplyingToolRef.current = true;
  
  // Update ref and state
  lastToolRef.current = tool;
  setCurrentTool(tool);
  
  // Ensure teacher has write permissions
  if (isTeacher) {
    room.setWritable(true).catch(err => console.error("Failed to set writable:", err));
    room.disableDeviceInputs = false;
    (room as any).disableOperations = false;
  }
  
  // Small delay to ensure previous operations complete
  setTimeout(() => {
    if (!room) return;
    
    // Apply the tool based on selection
    switch(tool) {
      case 'selector':
        console.log("Setting selector tool");
        room.setMemberState({ currentApplianceName: 'selector' });
        break;
      case 'pencil':
        console.log("Setting pencil tool");
        room.setMemberState({ 
          currentApplianceName: 'pencil', 
          strokeColor: [139, 92, 246], 
          strokeWidth: 4 
        });
        break;
      case 'highlighter':
        console.log("Setting highlighter tool");
        room.setMemberState({ 
          currentApplianceName: 'pencil', 
          strokeColor: [251, 191, 36], 
          strokeWidth: 20 
        });
        break;
      case 'laser':
        console.log("Setting laser pointer");
        room.setMemberState({ currentApplianceName: 'laserPointer' });
        break;
      case 'eraser':
        console.log("Setting eraser tool");
        room.setMemberState({ currentApplianceName: 'eraser' });
        break;
      case 'rectangle':
        console.log("Setting rectangle tool");
        room.setMemberState({ currentApplianceName: 'rectangle' });
        break;
      case 'ellipse':
        console.log("Setting ellipse tool");
        room.setMemberState({ currentApplianceName: 'ellipse' });
        break;
      case 'text':
        console.log("Setting text tool");
        room.setMemberState({ currentApplianceName: 'text' });
        break;
      default:
        console.log("Defaulting to pencil");
        room.setMemberState({ currentApplianceName: 'pencil' });
    }
    
    // Reset flag after setting tool
    setTimeout(() => {
      isApplyingToolRef.current = false;
    }, 100);
  }, 50);
};

// Sync UI with whiteboard's actual tool state - IMPORTANT: This prevents SDK from overriding our selection
useEffect(() => {
  if (!room) return;
  
  const handleMemberStateChange = (memberState: any) => {
    if (memberState && memberState.currentApplianceName) {
      const applianceName = memberState.currentApplianceName;
      console.log("Whiteboard reported tool change to:", applianceName, "Last tool we set:", lastToolRef.current);
      
      // If we're in the middle of applying a tool, ignore the SDK's update
      if (isApplyingToolRef.current) {
        console.log("Ignoring SDK tool change because we're applying our own");
        return;
      }
      
      // Map whiteboard appliance names to your tool IDs
      let mappedTool: string | null = null;
      
      if (applianceName === 'selector') mappedTool = 'selector';
      else if (applianceName === 'pencil') mappedTool = 'pencil';
      else if (applianceName === 'eraser') mappedTool = 'eraser';
      else if (applianceName === 'rectangle') mappedTool = 'rectangle';
      else if (applianceName === 'ellipse') mappedTool = 'ellipse';
      else if (applianceName === 'text') mappedTool = 'text';
      else if (applianceName === 'laserPointer') mappedTool = 'laser';
      
      // Only update if it's different AND it's not our own update
      if (mappedTool && mappedTool !== currentTool && !isApplyingToolRef.current) {
        console.log(`Syncing UI from ${currentTool} to ${mappedTool}`);
        setCurrentTool(mappedTool);
        lastToolRef.current = mappedTool;
      }
    }
  };
  
  // Listen to member state changes
  room.addMagixEventListener('onMemberStateChanged', handleMemberStateChange);
  
  return () => {
    room.removeMagixEventListener('onMemberStateChanged');
  };
}, [room, currentTool]);

// Also add this to force sync the tool when room connects or mode changes
useEffect(() => {
  if (room && isTeacher && currentTool) {
    // Small delay to ensure room is ready
    const timer = setTimeout(() => {
      if (room && !isApplyingToolRef.current) {
        console.log("Force syncing tool on room ready:", currentTool);
        applyTool(currentTool);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }
}, [room, isTeacher]);

  const pdfOptions = React.useMemo(() => ({
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    disableRange: true,
    disableStream: true,
  }), []);

  const computedPdfWidth = (() => {
    if (!pageSize || !containerSize.width || !containerSize.height) return (containerSize.width || 800) - (pdfUrl ? 48 : 0);
    const scaleByWidth = (containerSize.width - 48) / pageSize.width;
    const scaleByHeight = (containerSize.height - 48) / pageSize.height;
    return pageSize.width * Math.min(scaleByWidth, scaleByHeight) * zoom;
  })();

  const computedPdfHeight = (() => {
    if (!pageSize || !pdfUrl) return '100%';
    return computedPdfWidth * (pageSize.height / pageSize.width);
  })();

  // Tool definitions — order here is the ONLY thing that controls render order
  const tools = [
    { id: 'selector',    icon: <MousePointer2 size={20} />,   title: 'Select' },
    { id: 'pencil',      icon: <Pencil size={20} />,          title: 'Pencil' },
    { id: 'highlighter', icon: <Highlighter size={20} />,     title: 'Highlight' },
    { id: 'laser',       icon: <MousePointerClick size={20} />, title: 'Laser Pointer' },
    { id: 'eraser',      icon: <Eraser size={20} />,          title: 'Eraser' },
    { id: 'rectangle',   icon: <Square size={20} />,          title: 'Rectangle' },
    { id: 'ellipse',     icon: <Circle size={20} />,          title: 'Ellipse' },
    { id: 'text',        icon: <Type size={20} />,            title: 'Text' },
  ];

  const showTools = currentMode === 'whiteboard' || currentMode === 'pdf';

  return (
    <div className="relative w-full h-full bg-slate-100 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm z-50">
          <Loader2 className="animate-spin text-white mb-4" size={48} />
          <p className="text-white font-black text-sm tracking-widest uppercase">Connecting to Whiteboard</p>
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-6 py-3 rounded-xl z-50 font-bold shadow-xl border border-red-400 backdrop-blur-md max-w-lg text-center">
          {error}
        </div>
      )}

      {/* 
        The main content area — Handles scrolling and containment of PDF/Whiteboard.
        Placing Whiteboard INSIDE the content div ensures it doesn't block parent scrollbars.
      */}
      <div
        ref={pdfContainerRef}
        onScroll={handleScroll}
        className="absolute inset-0 bg-slate-200 z-0 overflow-auto flex items-start p-12"
      >
        <div 
          className="relative flex-shrink-0 bg-white shadow-2xl mx-auto"
          style={{ 
            width: pdfUrl ? computedPdfWidth : '100%', 
            height: pdfUrl ? computedPdfHeight : '100%',
            minHeight: !pdfUrl ? '100%' : 'auto'
          }}
        >
          {/* PDF Page Layer (Z-0) */}
          {pdfUrl && containerSize.width > 0 && (
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
              <Document
                file={pdfUrl}
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
                  width={computedPdfWidth}
                  onLoadSuccess={(page) => setPageSize({ width: page.originalWidth, height: page.originalHeight })}
                />
              </Document>
            </div>
          )}

          {/* Whiteboard Overlay Layer (Z-10) */}
          <div
            ref={containerRef}
            className="netless-container absolute inset-0 z-10 touch-none"
            style={{
              pointerEvents: isTeacher ? 'all' : 'none',
              cursor: isTeacher ? (currentTool === 'pencil' ? 'crosshair' : 'default') : 'default',
              background: pdfUrl ? 'transparent' : 'white',
            }}
          />
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
            Page {currentPage} / {numPages}
          </span>
          <button disabled={currentPage >= numPages} onClick={() => onPageChange?.(currentPage + 1)} className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      {isTeacher && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 p-2 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 z-20">

          {/* Screen Share button */}
          <button
            onClick={() => onScreenShare?.()}
            title={isSharingScreen ? 'Stop Sharing' : 'Share Screen'}
            className={cn("p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95",
              isSharingScreen ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30" : "text-slate-400 hover:text-white hover:bg-white/10"
            )}
          >
            <Monitor size={20} />
          </button>

          {/* PDF / Resources button */}
          <button
            onClick={() => onOpenMaterials?.()}
            title="PDF Resources"
            className={cn("p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95",
              currentMode === 'pdf' ? "bg-brand-purple text-white shadow-lg shadow-purple-500/30" : "text-slate-400 hover:text-white hover:bg-white/10"
            )}
          >
            <BookOpen size={20} />
          </button>

          <div className="h-px bg-white/10 my-1" />

          {/* Drawing tools — rendered from array, never conditionally inside JSX */}
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

          <div className="h-px bg-white/10 my-1" />

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
